import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AtSign, Loader2, MessageCircle, Reply, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { api, db } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CommentRow {
  id: string;
  user_id: string;
  content_type: string;
  content_id: string;
  content: string;
  parent_id?: string | null;
  created_at: string;
  user?: {
    id: string;
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
  } | null;
}

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Comments({
  contentType,
  contentId,
  className = '',
}: {
  contentType: 'project' | 'blog_post';
  contentId: string;
  className?: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState('');
  const [replyTo, setReplyTo] = useState<CommentRow | null>(null);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await db
      .from<CommentRow>('comments')
      .select('*, user:profiles(id, full_name, username, avatar_url)')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .order('created_at', { ascending: true })
      .limit(200);
    const rows = Array.isArray(data) ? data : [];
    setComments(rows);
    setLoading(false);
  }, [contentType, contentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      navigate('/auth');
      return;
    }
    const trimmed = value.trim();
    if (trimmed.length < 2) return;

    setPosting(true);
    const { error } = await db.from('comments').insert({
      content_type: contentType,
      content_id: contentId,
      user_id: user.id,
      content: trimmed,
      parent_id: replyTo?.id ?? null,
    });
    setPosting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setValue('');
    setReplyTo(null);
    toast.success('Comment posted');
    void load();
  };

  const remove = async (id: string) => {
    const { error } = await db.from('comments').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setComments((current) => current.filter((comment) => comment.id !== id));
  };

  const roots = comments.filter((comment) => !comment.parent_id);
  const repliesFor = (id: string) => comments.filter((comment) => comment.parent_id === id);

  return (
    <section className={className}>
      <div className="mb-6 flex items-center gap-3">
        <MessageCircle className="h-4 w-4 text-primary" />
        <h3 className="font-display text-lg font-semibold tracking-tight">
          Discussion {comments.length > 0 && <span className="text-muted-foreground">({comments.length})</span>}
        </h3>
      </div>

      <form onSubmit={submit} className="mb-8">
        <div className="flex gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--violet))] to-[hsl(var(--cyan))] text-xs font-semibold text-[hsl(240_30%_4%)]">
              {(user?.user_metadata?.username || user?.email || 'Y').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <AnimatePresence>
              {replyTo && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <Reply className="h-3 w-3" /> Replying to{' '}
                  <span className="text-foreground/80">
                    {replyTo.user?.full_name || replyTo.user?.username || 'comment'}
                  </span>
                  <button type="button" onClick={() => setReplyTo(null)} className="underline-sweep text-primary">
                    cancel
                  </button>
                </motion.p>
              )}
            </AnimatePresence>
            <textarea
              rows={3}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onFocus={() => {
                if (!user) navigate('/auth');
              }}
              placeholder={user ? 'Share your perspective…' : 'Sign in to join the discussion'}
              className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Be specific, be kind, be useful.</span>
              <button
                type="submit"
                disabled={posting || value.trim().length < 2}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[hsl(var(--violet))] to-[hsl(var(--cyan))] px-4 py-2 text-xs font-semibold text-[hsl(240_30%_4%)] disabled:opacity-50"
              >
                {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Post
              </button>
            </div>
          </div>
        </div>
      </form>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
          ))}
        </div>
      ) : roots.length === 0 ? (
        <p className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-8 text-center text-sm text-muted-foreground">
          No comments yet — start the conversation.
        </p>
      ) : (
        <ul className="space-y-6">
          {roots.map((comment) => (
            <motion.li
              key={comment.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <CommentItem
                comment={comment}
                canDelete={user?.id === comment.user_id}
                onDelete={() => remove(comment.id)}
                onReply={() => setReplyTo(comment)}
              />
              {repliesFor(comment.id).length > 0 && (
                <ul className="mt-4 space-y-4 border-l border-white/10 pl-5">
                  {repliesFor(comment.id).map((reply) => (
                    <li key={reply.id}>
                      <CommentItem
                        comment={reply}
                        canDelete={user?.id === reply.user_id}
                        onDelete={() => remove(reply.id)}
                        onReply={() => setReplyTo(reply)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CommentItem({
  comment,
  canDelete,
  onDelete,
  onReply,
}: {
  comment: CommentRow;
  canDelete: boolean;
  onDelete: () => void;
  onReply: () => void;
}) {
  const name = comment.user?.full_name || comment.user?.username || 'Someone';
  return (
    <div className="flex gap-3">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={comment.user?.avatar_url ?? undefined} />
        <AvatarFallback className="bg-white/[0.08] text-xs font-semibold">{name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          {comment.user?.username ? (
            <Link to={`/${comment.user.username}`} className="font-medium hover:text-primary">
              {name}
            </Link>
          ) : (
            <span className="font-medium">{name}</span>
          )}
          <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
        </p>
        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{comment.content}</p>
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <button onClick={onReply} className="inline-flex items-center gap-1.5 hover:text-foreground">
            <Reply className="h-3 w-3" /> Reply
          </button>
          {canDelete && (
            <button onClick={onDelete} className="inline-flex items-center gap-1.5 hover:text-rose-300">
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          )}
          {comment.user?.username && (
            <span className="inline-flex items-center gap-1.5 opacity-60">
              <AtSign className="h-3 w-3" />
              {comment.user.username}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
