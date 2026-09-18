/**
 * Generic collection REST layer — `/api/db/:table`.
 * Policies live in lib/tables.ts and are enforced on every operation.
 */
import type { Env } from '../env';
import type { Router } from '../lib/router';
import { HttpError, json } from '../lib/http';
import { db, primeContext } from '../lib/context';
import { deleteRows, insertRows, listRows, updateRows, upsertRows } from '../lib/dbcrud';
import { getTable } from '../lib/tables';

export function registerDBRoutes(router: Router<Env>) {
  router.get('/api/db/:table', async (c) => {
    await primeContext(c);
    const { data, count } = await listRows(db(c), c.params.table, c.url.searchParams);
    return json({ data, count, error: null });
  });

  router.post('/api/db/:table', async (c) => {
    await primeContext(c);
    const table = getTable(c.params.table);
    const prefer = c.req.headers.get('Prefer') || '';
    const onConflict = c.query.get('on_conflict') || c.query.get('onConflict') || '';
    const body: any = await c.body();
    const rows = Array.isArray(body) ? body : (body?.rows ?? body);

    const created =
      prefer.includes('resolution=merge-duplicates') || c.query.get('upsert') === 'true'
        ? await upsertRows(db(c), table.name, Array.isArray(rows) ? rows : [rows], onConflict || 'id')
        : await insertRows(db(c), table.name, rows);

    return json({ data: created, count: created.length, error: null }, { status: 201 });
  });

  router.patch('/api/db/:table', async (c) => {
    await primeContext(c);
    const table = getTable(c.params.table);
    ensureFiltered(c.url.searchParams);
    const patch: any = await c.body();
    const updated = await updateRows(db(c), table.name, c.url.searchParams, patch?.patch ?? patch);
    return json({ data: updated, count: updated.length, error: null });
  });

  // PUT behaves as an upsert keyed on the filters/body primary key.
  router.put('/api/db/:table', async (c) => {
    await primeContext(c);
    const table = getTable(c.params.table);
    const body: any = await c.body();
    const rows = Array.isArray(body) ? body : (body?.rows ?? body);
    const onConflict = c.query.get('on_conflict') || 'id';
    const upserted = await upsertRows(db(c), table.name, Array.isArray(rows) ? rows : [rows], onConflict);
    return json({ data: upserted, count: upserted.length, error: null });
  });

  router.delete('/api/db/:table', async (c) => {
    await primeContext(c);
    const table = getTable(c.params.table);
    ensureFiltered(c.url.searchParams);
    const removed = await deleteRows(db(c), table.name, c.url.searchParams);
    return json({ data: removed, count: removed.length, error: null });
  });
}

/** Guards against accidental table-wiping mutations. */
function ensureFiltered(query: URLSearchParams) {
  const hasFilter = [...query.keys()].some((k) => k.startsWith('f.'));
  if (!hasFilter) {
    throw HttpError.badRequest('Refusing to modify every row — add at least one filter (e.g. f.id=eq.<uuid>)');
  }
}
