import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Eye, EyeOff, Heart, Pencil, PenLine, Search, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { EmptyState, GhostButton, GlowButton, PageHeader, Panel, Tag, fieldClasses } from '@/components/ui-kit';
import { RevealGroup, RevealItem } from '@/components/experience/Reveal';
import { useAuth } from '@/hooks/useAuth';
import { api, db } from '@/lib/api/client';
import usePageMeta from '@/hooks/usePageMeta';

interface PostRow {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  tags?: string[] | null;
  cover_image_url?: string | null;
  category?: string | null;
  reading_time?: number | null;
  views?: number | null;
  likes?: number | null;
  published: boolean | number;
  is_public: boolean | number;
  publish_date?: string | null;
  created_at: string;
  author?: { id: string; full_name?: string | null; username?: string | null; avatar_url?: string | null } | null;
}

export default function Blog() {
  usePageMeta({ title: 'Writing · Portify', description: 'Case studies and engineering notes from developers building in public.', path: '/blog' });

  const { user } = useAuth();
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [mine, setMine] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'mine'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    const [feed, own] = await Promise.all([
      api.get<PostRow[]>(
        '/api/db/blog_posts?f.published=eq.1&f.is_public=eq.1&order=publish_date.desc&limit=60&embed=author:profiles(id,full_name,username,avatar_url)'
      ),
      user
        ? api.get<PostRow[]>(
            `/api/db/blog_posts?f.user_id=eq.${user.id}&order=created_at.desc&limit=60`
          )
        : Promise.resolve({ data: [] as PostRow[] }),
    ]);
    setPosts(Array.isArray(feed.data) ? feed.data : []);
    setMine(Array.isArray(own.data) ? own.data : []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (post: PostRow) => {
    const { error } = await db.from('blog_posts').delete().eq('id', post.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMine((current) => current.filter((item) => item.id !== post.id));
    setPosts((current) => current.filter((item) => item.id !== post.id));
    toast.success('Article deleted');
  };

  const togglePublish = async (post: PostRow) => {
    const next = !post.published;
    const { error } = await db
      .from('blog_posts')
      .update({ published: next ? 1 : 0, publish_date: next ? new Date().toISOString() : post.publish_date })
      .eq('id', post.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next ? 'Article published' : 'Moved back to drafts');
    void load();
  };

  const source = tab === 'all' ? posts : mine;
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return source;
    return source.filter((post) =>
      `${post.title} ${post.excerpt ?? ''} ${(post.tags ?? []).join(' ')}`.toLowerCase().includes(needle)
    );
  }, [source, query]);

  const [featured, ...rest] = filtered;

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 pb-24">
        <PageHeader
          eyebrow="Writing"
          title={
            <>
              Notes from the <span className="text-gradient">build.</span>
            </>
          }
          description="Case studies, engineering notes and lessons learned — published straight from your studio."
          actions={
            user ? (
              <Link to="/blog/create">
                <GlowButton>
                  <PenLine className="h-4 w-4" /> Write an article
                </GlowButton>
              </Link>
            ) : (
              <Link to="/auth">
                <GlowButton>Sign in to write</GlowButton>
              </Link>
            )
          }
        />

        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-80">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search articles…"
              className={fieldClasses('pl-11')}
            />
          </div>
          {user && (
            <div className="flex items-center gap-2">
              {(['all', 'mine'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setTab(option)}
                  className={`rounded-full border px-4 py-2 text-xs transition-colors ${
                    tab === option
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-white/10 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {option === 'all' ? 'Community' : 'My drafts & posts'}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-64 animate-pulse rounded-3xl border border-white/[0.06] bg-white/[0.02]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={tab === 'mine' ? 'No articles yet' : 'Nothing published yet'}
            description={
              tab === 'mine'
                ? 'Your drafts and published articles will appear here.'
                : 'Be the first to publish — the community feed is waiting.'
            }
            action={
              user ? (
                <Link to="/blog/create">
                  <GlowButton>
                    <PenLine className="h-4 w-4" /> Start writing
                  </GlowButton>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            {featured && (
              <RevealItem>
                <Link to={`/blog/${featured.slug}`} className="group mb-6 block">
                  <Panel interactive className="grid overflow-hidden md:grid-cols-[1.1fr_1fr]">
                    <div className="flex flex-col justify-between p-8">
                      <div>
                        <div className="flex items-center gap-2">
                          <Tag tone="primary">latest</Tag>
                          {featured.category && <Tag>{featured.category}</Tag>}
                          {!featured.published && <Tag tone="warm">draft</Tag>}
                        </div>
                        <h2 className="mt-5 font-display text-2xl font-semibold leading-tight tracking-tight transition-colors group-hover:text-primary md:text-3xl">
                          {featured.title}
                        </h2>
                        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                          {featured.excerpt}
                        </p>
                      </div>
                      <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {new Date(featured.publish_date || featured.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" /> {featured.reading_time ?? 5} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" /> {featured.views ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" /> {featured.likes ?? 0}
                        </span>
                      </div>
                    </div>
                    <div className="relative min-h-[220px] overflow-hidden">
                      {featured.cover_image_url ? (
                        <img
                          src={featured.cover_image_url}
                          alt={featured.title}
                          className="h-full w-full object-cover transition-transform duration-1000 ease-cinematic group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-[radial-gradient(80%_100%_at_20%_10%,hsl(var(--violet)/.4),transparent_60%),radial-gradient(60%_80%_at_90%_80%,hsl(var(--cyan)/.3),transparent_60%)]" />
                      )}
                    </div>
                  </Panel>
                </Link>
              </RevealItem>
            )}

            <RevealGroup className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
              <AnimatePresence>
                {rest.map((post) => (
                  <RevealItem key={post.id}>
                    <motion.article layout className="panel group h-full overflow-hidden">
                      <Link to={`/blog/${post.slug}`} className="block">
                        {post.cover_image_url ? (
                          <div className="h-40 overflow-hidden">
                            <img
                              src={post.cover_image_url}
                              alt={post.title}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-700 ease-cinematic group-hover:scale-105"
                            />
                          </div>
                        ) : (
                          <div className="h-24 bg-[radial-gradient(80%_120%_at_20%_0%,hsl(var(--cyan)/.22),transparent_60%)]" />
                        )}
                      </Link>
                      <div className="p-5">
                        <div className="flex items-center gap-2">
                          {post.category && <Tag>{post.category}</Tag>}
                          {!post.published && <Tag tone="warm">draft</Tag>}
                        </div>
                        <Link to={`/blog/${post.slug}`}>
                          <h3 className="mt-3 font-display text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
                            {post.title}
                          </h3>
                        </Link>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                        <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-4 text-[11px] text-muted-foreground">
                          <span>
                            {new Date(post.publish_date || post.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            · {post.reading_time ?? 5} min
                          </span>
                          {tab === 'mine' ? (
                            <span className="flex items-center gap-1">
                              <button
                                onClick={() => void togglePublish(post)}
                                title={post.published ? 'Unpublish' : 'Publish'}
                                className="rounded-lg p-1.5 hover:bg-white/[0.06] hover:text-foreground"
                              >
                                {post.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                              </button>
                              <Link
                                to={`/blog/create?edit=${post.id}`}
                                className="rounded-lg p-1.5 hover:bg-white/[0.06] hover:text-foreground"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Link>
                              <button
                                onClick={() => void remove(post)}
                                className="rounded-lg p-1.5 hover:bg-rose-500/10 hover:text-rose-300"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ) : (
                            <span>by {post.author?.full_name || post.author?.username || 'a member'}</span>
                          )}
                        </div>
                      </div>
                    </motion.article>
                  </RevealItem>
                ))}
              </AnimatePresence>
            </RevealGroup>
          </>
        )}

        {!user && filtered.length > 0 && (
          <div className="mt-16 flex flex-col items-center gap-4 rounded-3xl border border-white/[0.07] bg-white/[0.02] px-8 py-12 text-center">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="font-display text-xl font-semibold">Have something worth writing down?</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Create a free studio, publish your first article, and it appears here for the whole community.
            </p>
            <Link to="/auth?mode=register">
              <GlowButton>Start writing free</GlowButton>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
