import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowLeft, BookOpen, Clock, Eye, Link2, Pencil, Share2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { EmptyState, GhostButton, GlowButton, Panel, Tag } from '@/components/ui-kit';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Reveal } from '@/components/experience/Reveal';
import Reactions from '@/components/community/Reactions';
import Comments from '@/components/community/Comments';
import FollowButton from '@/components/community/FollowButton';
import { useAuth } from '@/hooks/useAuth';
import { api, db } from '@/lib/api/client';
import { renderMarkdown } from '@/lib/markdown';

interface Post {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  tags?: string[] | null;
  cover_image_url?: string | null;
  category?: string | null;
  series?: string | null;
  reading_time?: number | null;
  views?: number | null;
  likes?: number | null;
  published: boolean | number;
  is_public: boolean | number;
  publish_date?: string | null;
  created_at: string;
  updated_at?: string | null;
  author?: {
    id: string;
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
    title?: string | null;
    bio?: string | null;
  } | null;
}

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 26 });

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    const { data } = await api.get<Post[]>(
      `/api/db/blog_posts?f.slug=eq.${encodeURIComponent(slug)}&limit=1&embed=author:profiles(id,full_name,username,avatar_url,title,bio)`
    );
    const found = Array.isArray(data) ? data[0] : null;
    if (!found) {
      setMissing(true);
      setLoading(false);
      return;
    }
    setPost(found);
    setMissing(false);
    setLoading(false);

    void api
      .get<Post[]>(
        `/api/db/blog_posts?f.published=eq.1&f.is_public=eq.1&f.slug=neq.${encodeURIComponent(slug)}&order=publish_date.desc&limit=3`
      )
      .then(({ data: rows }) => setRelated(Array.isArray(rows) ? rows : []));
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const html = useMemo(() => (post ? renderMarkdown(post.content) : ''), [post]);
  const isOwner = Boolean(user && post && user.id === post.user_id);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: post?.title, url });
        return;
      } catch {
        /* fall through to clipboard */
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  const remove = async () => {
    if (!post) return;
    const { error } = await db.from('blog_posts').delete().eq('id', post.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Article deleted');
    navigate('/blog');
  };

  if (loading) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl space-y-6 px-6 py-20">
          <div className="h-8 w-40 animate-pulse rounded-full bg-white/[0.05]" />
          <div className="h-16 animate-pulse rounded-2xl bg-white/[0.05]" />
          <div className="h-96 animate-pulse rounded-3xl bg-white/[0.03]" />
        </div>
      </Layout>
    );
  }

  if (missing || !post) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-6 py-24">
          <EmptyState
            icon={BookOpen}
            title="That article does not exist"
            description="It may have been unpublished or the link is slightly off."
            action={
              <Link to="/blog">
                <GlowButton>Back to writing</GlowButton>
              </Link>
            }
          />
        </div>
      </Layout>
    );
  }

  const author = post.author;
  const authorName = author?.full_name || author?.username || 'A Portify member';

  return (
    <Layout hideAnimation bare>
      <motion.div
        style={{ scaleX: progress }}
        className="fixed left-0 right-0 top-0 z-[65] h-[2px] origin-left bg-gradient-to-r from-[hsl(var(--violet))] to-[hsl(var(--cyan))]"
      />

      <article className="relative pb-24 pt-32">
        <div className="mx-auto max-w-3xl px-6">
          <Link
            to="/blog"
            className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All writing
          </Link>

          <Reveal mode="blur">
            <div className="flex flex-wrap items-center gap-2">
              {post.category && <Tag tone="primary">{post.category}</Tag>}
              {post.series && <Tag>{post.series}</Tag>}
              {!post.published && <Tag tone="warm">draft — only you can see this</Tag>}
            </div>

            <h1 className="display-lg mt-6">{post.title}</h1>

            {post.excerpt && (
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-white/[0.08] py-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-1 ring-white/15">
                  <AvatarImage src={author?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--violet))] to-[hsl(var(--cyan))] text-xs font-semibold text-[hsl(240_30%_4%)]">
                    {authorName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  {author?.username ? (
                    <Link to={`/${author.username}`} className="text-sm font-medium hover:text-primary">
                      {authorName}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium">{authorName}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {author?.title || 'Developer'} ·{' '}
                    {new Date(post.publish_date || post.created_at).toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> {post.reading_time ?? 5} min read
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> {(post.views ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
          </Reveal>

          {post.cover_image_url && (
            <Reveal mode="scale" className="mt-10">
              <div className="overflow-hidden rounded-3xl border border-white/10">
                <img src={post.cover_image_url} alt={post.title} className="w-full object-cover" />
              </div>
            </Reveal>
          )}

          <Reveal className="mt-12">
            <div className="prose-cinematic" dangerouslySetInnerHTML={{ __html: html }} />
          </Reveal>

          {(post.tags ?? []).length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2">
              {post.tags!.map((tag) => (
                <Tag key={tag}>#{tag}</Tag>
              ))}
            </div>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.08] pt-6">
            <Reactions contentType="blog_post" contentId={post.id} />
            <div className="flex items-center gap-2">
              <GhostButton onClick={share}>
                <Share2 className="h-4 w-4" /> Share
              </GhostButton>
              {(isOwner || isAdmin) && (
                <>
                  <Link to={`/blog/create?edit=${post.id}`}>
                    <GhostButton>
                      <Pencil className="h-4 w-4" /> Edit
                    </GhostButton>
                  </Link>
                  <GhostButton onClick={remove} className="border-rose-400/30 text-rose-200 hover:bg-rose-500/10">
                    <Trash2 className="h-4 w-4" /> Delete
                  </GhostButton>
                </>
              )}
            </div>
          </div>
        </div>

        {/* author card */}
        {author?.username && (
          <div className="mx-auto mt-16 max-w-3xl px-6">
            <Panel className="flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={author.avatar_url ?? undefined} />
                  <AvatarFallback className="font-semibold">{authorName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-display text-base font-semibold">{authorName}</p>
                  <p className="text-xs text-muted-foreground">{author.title || 'Developer'}</p>
                  {author.bio && <p className="mt-2 line-clamp-2 max-w-md text-xs text-muted-foreground">{author.bio}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!isOwner && author.id && <FollowButton targetUserId={author.id} />}
                <Link to={`/${author.username}`}>
                  <GhostButton>View portfolio</GhostButton>
                </Link>
              </div>
            </Panel>
          </div>
        )}

        {/* discussion */}
        <div className="mx-auto mt-16 max-w-3xl px-6">
          <Comments contentType="blog_post" contentId={post.id} />
        </div>

        {/* related */}
        {related.length > 0 && (
          <div className="mx-auto mt-20 max-w-5xl px-6">
            <p className="eyebrow mb-6">Keep reading</p>
            <div className="grid gap-5 md:grid-cols-3">
              {related.map((item) => (
                <Link key={item.id} to={`/blog/${item.slug}`}>
                  <Panel interactive className="h-full p-5">
                    <p className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {item.category || 'article'}
                    </p>
                    <h3 className="mt-3 font-display text-base font-semibold leading-snug">{item.title}</h3>
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{item.excerpt}</p>
                    <p className="mt-4 flex items-center gap-1.5 text-[11px] text-primary">
                      <Link2 className="h-3 w-3" /> Read article
                    </p>
                  </Panel>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </Layout>
  );
}
