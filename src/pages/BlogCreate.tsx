import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Eye,
  Image as ImageIcon,
  Loader2,
  PenLine,
  Save,
  Send,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { GhostButton, GlowButton, PageHeader, Panel, Tag, fieldClasses } from '@/components/ui-kit';
import { useAuth } from '@/hooks/useAuth';
import { api, db, uploadMedia } from '@/lib/api/client';
import { excerptFrom, readingTime, renderMarkdown, slugify } from '@/lib/markdown';

const empty = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: '',
  series: '',
  tags: '',
  cover_image_url: '',
  published: false,
  is_public: true,
};

export default function BlogCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editingId = params.get('edit');

  const [form, setForm] = useState({ ...empty });
  const [loading, setLoading] = useState(Boolean(editingId));
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null);
  const [preview, setPreview] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!editingId) return;
    void api.get<any[]>(`/api/db/blog_posts?f.id=eq.${editingId}&limit=1`).then(({ data }) => {
      const row = Array.isArray(data) ? data[0] : null;
      if (row) {
        setForm({
          title: row.title ?? '',
          slug: row.slug ?? '',
          excerpt: row.excerpt ?? '',
          content: row.content ?? '',
          category: row.category ?? '',
          series: row.series ?? '',
          tags: (row.tags ?? []).join(', '),
          cover_image_url: row.cover_image_url ?? '',
          published: Boolean(row.published),
          is_public: Boolean(row.is_public ?? true),
        });
        setSlugTouched(true);
      }
      setLoading(false);
    });
  }, [editingId]);

  const previewHtml = useMemo(() => renderMarkdown(form.content), [form.content]);
  const minutes = readingTime(form.content);
  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;

  const persist = async (publish: boolean) => {
    if (!form.title.trim()) {
      toast.error('Give your article a title');
      return;
    }
    if (form.content.trim().length < 40) {
      toast.error('Write at least a paragraph before saving');
      return;
    }
    setSaving(publish ? 'publish' : 'draft');

    const slug = slugify(form.slug || form.title) || `post-${Date.now()}`;
    const payload = {
      title: form.title.trim(),
      slug,
      excerpt: form.excerpt.trim() || excerptFrom(form.content),
      content: form.content,
      category: form.category.trim() || null,
      series: form.series.trim() || null,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim().replace(/^#/, ''))
        .filter(Boolean),
      cover_image_url: form.cover_image_url || null,
      reading_time: minutes,
      published: publish ? 1 : 0,
      is_public: form.is_public ? 1 : 0,
      publish_date: publish ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = editingId
      ? await db.from('blog_posts').update(payload).eq('id', editingId)
      : await db.from('blog_posts').insert({ ...payload, user_id: user!.id });

    setSaving(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(publish ? 'Article published' : 'Draft saved');
    navigate(publish ? `/blog/${slug}` : '/blog');
  };

  if (!user) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-6 py-24">
          <PageHeader
            eyebrow="Writing"
            title="Sign in to write"
            description="Your drafts stay private until you publish them."
            actions={
              <Link to="/auth">
                <GlowButton>Sign in</GlowButton>
              </Link>
            }
          />
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="mx-auto max-w-4xl px-6 py-20">
          <div className="h-96 animate-pulse rounded-3xl border border-white/[0.06] bg-white/[0.02]" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <Link
          to="/blog"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to writing
        </Link>

        <PageHeader
          eyebrow={editingId ? 'Editing article' : 'New article'}
          title={form.title || 'Untitled draft'}
          description={`${wordCount} words · about ${minutes} min read`}
          actions={
            <>
              <GhostButton onClick={() => setPreview((value) => !value)}>
                <Eye className="h-4 w-4" /> {preview ? 'Edit' : 'Preview'}
              </GhostButton>
              <GhostButton onClick={() => void persist(false)} disabled={saving !== null}>
                {saving === 'draft' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save draft
              </GhostButton>
              <GlowButton onClick={() => void persist(true)} disabled={saving !== null}>
                {saving === 'publish' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Publish
              </GlowButton>
            </>
          }
        />

        <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr]">
          <div className="space-y-6">
            <Panel className="p-6">
              <label className="block">
                <span className="mb-2 block text-xs text-muted-foreground">Title</span>
                <input
                  className={fieldClasses('h-auto py-3 font-display text-xl')}
                  placeholder="How we cut cold starts by 70%"
                  value={form.title}
                  onChange={(event) => {
                    const title = event.target.value;
                    setForm((current) => ({
                      ...current,
                      title,
                      slug: slugTouched ? current.slug : slugify(title),
                    }));
                  }}
                />
              </label>
              <label className="mt-4 block">
                <span className="mb-2 block text-xs text-muted-foreground">Slug</span>
                <div className="flex items-center gap-2">
                  <span className="mono text-xs text-muted-foreground">/blog/</span>
                  <input
                    className={fieldClasses()}
                    value={form.slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setForm({ ...form, slug: slugify(event.target.value) });
                    }}
                  />
                </div>
              </label>
              <label className="mt-4 block">
                <span className="mb-2 block text-xs text-muted-foreground">
                  Excerpt <span className="opacity-60">(auto-generated if left blank)</span>
                </span>
                <textarea
                  rows={2}
                  className={fieldClasses('h-auto py-3')}
                  placeholder="One or two sentences that make someone want to read on."
                  value={form.excerpt}
                  onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
                />
              </label>
            </Panel>

            <Panel className="p-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Content · markdown supported (# headings, **bold**, `code`, lists, quotes)
                </span>
              </div>
              {preview ? (
                <div
                  className="prose-cinematic min-h-[420px] rounded-2xl border border-white/10 bg-white/[0.02] p-6"
                  dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="text-muted-foreground">Nothing to preview yet.</p>' }}
                />
              ) : (
                <textarea
                  rows={20}
                  className="w-full resize-y rounded-2xl border border-white/12 bg-white/[0.03] p-5 font-mono text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60"
                  placeholder={'## The problem\n\nWe were paying for idle containers…'}
                  value={form.content}
                  onChange={(event) => setForm({ ...form, content: event.target.value })}
                />
              )}
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel className="p-6">
              <p className="eyebrow mb-4">Metadata</p>
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs text-muted-foreground">Category</span>
                  <input
                    className={fieldClasses()}
                    placeholder="Engineering"
                    value={form.category}
                    onChange={(event) => setForm({ ...form, category: event.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs text-muted-foreground">Series (optional)</span>
                  <input
                    className={fieldClasses()}
                    placeholder="Edge computing diary"
                    value={form.series}
                    onChange={(event) => setForm({ ...form, series: event.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs text-muted-foreground">Tags (comma separated)</span>
                  <input
                    className={fieldClasses()}
                    placeholder="cloudflare, performance"
                    value={form.tags}
                    onChange={(event) => setForm({ ...form, tags: event.target.value })}
                  />
                </label>
              </div>

              {form.tags.trim() && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {form.tags
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <Tag key={tag}>#{tag.replace(/^#/, '')}</Tag>
                    ))}
                </div>
              )}
            </Panel>

            <Panel className="p-6">
              <p className="eyebrow mb-4">Cover image</p>
              {form.cover_image_url ? (
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <img src={form.cover_image_url} alt="Cover" className="h-40 w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-white/15 text-xs text-muted-foreground">
                  <ImageIcon className="mr-2 h-4 w-4" /> No cover yet
                </div>
              )}
              <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-full border border-white/12 px-4 py-2.5 text-xs transition-colors hover:border-primary/50">
                {form.cover_image_url ? 'Replace image' : 'Upload image'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const { url, error } = await uploadMedia(file, 'blog');
                    if (error || !url) {
                      toast.error(error?.message || 'Upload failed');
                      return;
                    }
                    setForm((current) => ({ ...current, cover_image_url: url }));
                    toast.success('Cover uploaded');
                  }}
                />
              </label>
            </Panel>

            <Panel className="p-6">
              <p className="eyebrow mb-4">Visibility</p>
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-sm">Public in feeds</span>
                <input
                  type="checkbox"
                  checked={form.is_public}
                  onChange={(event) => setForm({ ...form, is_public: event.target.checked })}
                  className="h-4 w-4 accent-[hsl(var(--violet))]"
                />
              </label>
              <p className="mt-3 text-xs text-muted-foreground">
                Drafts are only visible to you. Publishing adds the article to the community feed, your profile and the
                RSS feed.
              </p>
            </Panel>

            <Panel className="p-6">
              <p className="eyebrow mb-3">Writing tips</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {[
                  'Lead with the outcome, not the backstory.',
                  'Use code fences for anything longer than a line.',
                  'Break walls of text with h2 subheadings.',
                  'End with what you would do differently next time.',
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    {tip}
                  </li>
                ))}
              </ul>
            </Panel>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-[11px] text-muted-foreground"
            >
              <PenLine className="h-3.5 w-3.5" />
              Autosave is manual — hit “Save draft” often.
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
