
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Comment } from '@/types/portfolio';
import { MessageCircle, Reply, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CommentsProps {
  contentType: 'project' | 'blog_post';
  contentId: string;
}

export default function Comments({ contentType, contentId }: CommentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [contentType, contentId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:profiles(id, full_name, avatar_url)
        `)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize comments into tree structure
      const commentMap = new Map();
      const rootComments: Comment[] = [];

      (data || []).forEach(comment => {
        const formattedComment: Comment = {
          ...comment,
          content_type: comment.content_type as 'project' | 'blog_post',
          user: Array.isArray(comment.user) ? comment.user[0] : comment.user,
          replies: []
        };
        commentMap.set(comment.id, formattedComment);

        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id);
          if (parent) {
            parent.replies.push(formattedComment);
          }
        } else {
          rootComments.push(formattedComment);
        }
      });

      setComments(rootComments);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load comments.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to comment.',
        variant: 'destructive'
      });
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          content_type: contentType,
          content_id: contentId,
          content: newComment.trim(),
          parent_id: replyTo
        });

      if (error) throw error;

      setNewComment('');
      setReplyTo(null);
      fetchComments();

      toast({
        title: 'Comment posted',
        description: 'Your comment has been posted successfully.'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to post comment.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      fetchComments();
      toast({
        title: 'Comment deleted',
        description: 'Your comment has been deleted.'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete comment.',
        variant: 'destructive'
      });
    }
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <Card className={`${isReply ? 'ml-8 mt-2' : 'mb-4'}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.user?.avatar_url || ''} />
            <AvatarFallback>
              {comment.user?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-sm">
                {comment.user?.full_name || 'Anonymous'}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm">{comment.content}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(comment.id)}
                className="h-6 px-2"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
              {user && user.id === comment.user_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteComment(comment.id)}
                  className="h-6 px-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
        {comment.replies && comment.replies.map(reply => (
          <CommentItem key={reply.id} comment={reply} isReply />
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          Comments ({comments.length})
        </h3>
      </div>

      {user && (
        <div className="space-y-3">
          {replyTo && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Replying to comment</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(null)}
                className="h-6 px-2"
              >
                Cancel
              </Button>
            </div>
          )}
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-20"
          />
          <Button
            onClick={submitComment}
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading comments...</p>
        </div>
      ) : comments.length > 0 ? (
        <div>
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
}
