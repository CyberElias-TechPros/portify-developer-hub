import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Comment } from "@/types/portfolio";
import { MessageCircle, Reply, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CommentsProps { contentType: "project" | "blog_post"; contentId: string; }

type CommentWithProfile = Comment & { user?: { id: string; full_name?: string | null; avatar_url?: string | null } | null };

export default function Comments({ contentType, contentId }: CommentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await supabase.from("comments").select("*").eq("content_type", contentType).eq("content_id", contentId).order("created_at", { ascending: true });
    if (result.error) {
      setError("Comments could not be loaded.");
      setLoading(false);
      return;
    }
    const nodes = new Map<string, CommentWithProfile>();
    (result.data ?? []).forEach((comment) => {
      const profile = Array.isArray(comment.user) ? comment.user[0] : comment.user;
      nodes.set(comment.id, { id: comment.id, user_id: comment.user_id, content_type: comment.content_type as "project" | "blog_post", content_id: comment.content_id, content: comment.content, parent_id: comment.parent_id, created_at: comment.created_at || new Date().toISOString(), updated_at: comment.updated_at || comment.created_at || new Date().toISOString(), user: profile ? { id: profile.id, full_name: profile.full_name, avatar_url: profile.avatar_url } : null, replies: [] });
    });
    const roots: CommentWithProfile[] = [];
    nodes.forEach((comment) => {
      if (comment.parent_id && nodes.has(comment.parent_id)) nodes.get(comment.parent_id)?.replies?.push(comment);
      else roots.push(comment);
    });
    setComments(roots);
    setLoading(false);
  }, [contentId, contentType]);

  useEffect(() => { void fetchComments(); }, [fetchComments]);

  const commentCount = useMemo(() => {
    const count = (items: CommentWithProfile[]): number => items.reduce((total, item) => total + 1 + count((item.replies ?? []) as CommentWithProfile[]), 0);
    return count(comments);
  }, [comments]);

  const submitComment = async () => {
    const content = newComment.trim();
    if (!user) { toast({ title: "Sign in required", description: "Please sign in to comment.", variant: "destructive" }); return; }
    if (content.length < 1 || content.length > 2_000) { toast({ title: "Comment length", description: "Comments must be between 1 and 2,000 characters.", variant: "destructive" }); return; }
    setSubmitting(true);
    const result = await supabase.from("comments").insert({ user_id: user.id, content_type: contentType, content_id: contentId, content, parent_id: replyTo });
    if (result.error) toast({ title: "Could not post comment", description: result.error.message, variant: "destructive" });
    else { setNewComment(""); setReplyTo(null); toast({ title: "Comment posted", description: "Your comment is now visible." }); await fetchComments(); }
    setSubmitting(false);
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return;
    const canModerate = user.role === "admin" || user.role === "moderator";
    const query = supabase.from("comments").delete().eq("id", commentId);
    if (!canModerate) query.eq("user_id", user.id);
    const result = await query;
    if (result.error) toast({ title: "Could not delete comment", description: result.error.message, variant: "destructive" });
    else { toast({ title: "Comment deleted" }); await fetchComments(); }
  };

  const renderComment = (comment: CommentWithProfile, depth = 0): JSX.Element => (
    <Card key={comment.id} className={depth > 0 ? "ml-4 md:ml-8 mt-2" : "mb-4"}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8"><AvatarImage src={comment.user?.avatar_url || undefined} alt="" /><AvatarFallback>{comment.user?.full_name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2 mb-1"><span className="font-medium text-sm">{comment.user?.full_name || "Community member"}</span><time className="text-xs text-muted-foreground" dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleDateString()}</time></div><p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p><div className="flex items-center gap-1 mt-2"><Button type="button" variant="ghost" size="sm" onClick={() => setReplyTo(comment.id)} className="h-7 px-2"><Reply className="h-3 w-3 mr-1" />Reply</Button>{(user?.id === comment.user_id || user?.role === "admin" || user?.role === "moderator") && <Button type="button" variant="ghost" size="sm" onClick={() => void deleteComment(comment.id)} className="h-7 px-2 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3 mr-1" />Delete</Button>}</div></div>
        </div>
        {depth < 4 && (comment.replies ?? []).map((reply) => renderComment(reply as CommentWithProfile, depth + 1))}
      </CardContent>
    </Card>
  );

  return <div className="space-y-6"><div className="flex items-center gap-2"><MessageCircle className="h-5 w-5" aria-hidden="true" /><h2 className="text-lg font-semibold">Comments ({commentCount})</h2></div>{user && <div className="space-y-3">{replyTo && <div className="flex items-center gap-2 text-sm text-muted-foreground"><span>Replying to a comment</span><Button type="button" variant="ghost" size="sm" onClick={() => setReplyTo(null)} className="h-7 px-2">Cancel</Button></div>}<Textarea maxLength={2000} aria-label="Comment" placeholder="Share a thoughtful comment…" value={newComment} onChange={(event) => setNewComment(event.target.value)} /><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{newComment.length}/2000</span><Button type="button" onClick={() => void submitComment()} disabled={submitting || !newComment.trim()}>{submitting ? "Posting…" : "Post comment"}</Button></div></div>}{loading ? <p className="py-8 text-center text-muted-foreground">Loading comments…</p> : error ? <div className="py-8 text-center"><p className="text-muted-foreground">{error}</p><Button variant="link" onClick={() => void fetchComments()}>Try again</Button></div> : comments.length ? <div>{comments.map((comment) => renderComment(comment))}</div> : <p className="py-8 text-center text-muted-foreground">No comments yet. Be the first to join the conversation.</p>}</div>;
}
