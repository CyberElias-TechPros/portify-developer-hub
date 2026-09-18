/**
 * Media uploads — R2 when bound, graceful D1 data-URL fallback for small files.
 */
import type { Env } from '../env';
import type { Router } from '../lib/router';
import { HttpError, ok } from '../lib/http';
import { db, primeContext, requireUser } from '../lib/context';
import { uuid } from '../lib/crypto';
import { LIMITS, rateLimit } from '../lib/ratelimit';

const ALLOWED = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
  'application/pdf',
]);
const MAX_BYTES = 6 * 1024 * 1024; // 6 MB
const INLINE_LIMIT = 400 * 1024; // D1 fallback ceiling

export function registerMediaRoutes(router: Router<Env>) {
  router.post('/api/media/upload', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    await rateLimit(c.env, { ...LIMITS.upload, identity: user.id });

    const contentType = c.req.headers.get('Content-Type') || '';
    let file: File | null = null;
    let purpose = 'general';

    if (contentType.includes('multipart/form-data')) {
      const form = await c.req.formData();
      const candidate = form.get('file');
      if (candidate && typeof candidate === 'object' && 'arrayBuffer' in candidate && 'name' in candidate) {
        file = candidate as unknown as File;
      }
      purpose = String(form.get('purpose') ?? 'general');
    } else {
      const body = await c.body<{ filename?: string; content_type?: string; data?: string; purpose?: string }>();
      if (body?.data) {
        const binary = Uint8Array.from(atob(body.data.replace(/^data:[^;]+;base64,/, '')), (ch) => ch.charCodeAt(0));
        file = new File([binary], body.filename ?? 'upload', { type: body.content_type ?? 'image/png' });
        purpose = body.purpose ?? 'general';
      }
    }

    if (!file) throw HttpError.badRequest('Attach a file using multipart/form-data');
    if (!ALLOWED.has(file.type)) throw HttpError.badRequest(`Unsupported file type: ${file.type || 'unknown'}`);
    if (file.size > MAX_BYTES) throw HttpError.badRequest('Files must be 6 MB or smaller');

    const extension = (file.name.split('.').pop() || guessExtension(file.type)).toLowerCase().slice(0, 8);
    const key = `${user.id}/${purpose}/${uuid()}.${extension}`;
    const id = uuid();
    const now = new Date().toISOString();
    let url: string;

    if (c.env.MEDIA) {
      const buffer = await file.arrayBuffer();
      await c.env.MEDIA.put(key, buffer, {
        httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
      });
      url = `/api/media/file/${key}`;
    } else {
      if (file.size > INLINE_LIMIT) {
        throw new HttpError(
          501,
          'Large uploads need the MEDIA R2 bucket — bind it in wrangler.toml or upload a smaller file.',
          'storage_unavailable'
        );
      }
      const buffer = new Uint8Array(await file.arrayBuffer());
      let binary = '';
      for (const byte of buffer) binary += String.fromCharCode(byte);
      url = `data:${file.type};base64,${btoa(binary)}`;
    }

    await c.env.DB.prepare(
      `INSERT INTO media_uploads (id, user_id, key, url, filename, content_type, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(id, user.id, key, url, file.name, file.type, file.size, now)
      .run();

    return ok({ id, key, url, filename: file.name, content_type: file.type, size: file.size }, { status: 201 });
  });

  router.get('/api/media/file/*', async (c) => {
    const key = (c.params as any)['*'] ?? c.url.pathname.replace('/api/media/file/', '');
    if (!c.env.MEDIA) throw HttpError.notFound('Media storage is not configured on this deployment');
    const object = await c.env.MEDIA.get(key);
    if (!object) throw HttpError.notFound('File not found');
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    return new Response(object.body, { headers });
  });

  router.get('/api/media', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const rows = await c.env.DB.prepare(
      `SELECT * FROM media_uploads WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`
    )
      .bind(user.id)
      .all();
    return ok({ media: rows.results ?? [] });
  });

  router.delete('/api/media/:id', async (c) => {
    await primeContext(c);
    const user = requireUser(c);
    const row = await c.env.DB.prepare(`SELECT * FROM media_uploads WHERE id = ? AND user_id = ?`)
      .bind(c.params.id, user.id)
      .first<any>();
    if (!row) throw HttpError.notFound('Upload not found');
    if (c.env.MEDIA && row.key) {
      try {
        await c.env.MEDIA.delete(row.key);
      } catch (error) {
        console.warn('[media] R2 delete failed', error);
      }
    }
    await c.env.DB.prepare(`DELETE FROM media_uploads WHERE id = ?`).bind(row.id).run();
    return ok({ deleted: true });
  });
}

function guessExtension(mime: string) {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'image/svg+xml': 'svg',
    'application/pdf': 'pdf',
  };
  return map[mime] ?? 'bin';
}
