
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Users, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FollowButtonProps {
  targetUserId: string;
  showCount?: boolean;
}

export default function FollowButton({ targetUserId, showCount = false }: FollowButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && targetUserId) {
      checkFollowStatus();
      fetchFollowerCount();
    }
  }, [user, targetUserId]);

  const checkFollowStatus = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .single();

    if (!error && data) {
      setIsFollowing(true);
    }
  };

  const fetchFollowerCount = async () => {
    const { data, error } = await supabase
      .from('user_follows')
      .select('id', { count: 'exact' })
      .eq('following_id', targetUserId);

    if (!error && data) {
      setFollowerCount(data.length);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to follow users.',
        variant: 'destructive'
      });
      return;
    }

    if (user.id === targetUserId) {
      toast({
        title: 'Invalid action',
        description: 'You cannot follow yourself.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) throw error;

        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
        toast({
          title: 'Unfollowed',
          description: 'You have unfollowed this user.'
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          });

        if (error) throw error;

        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        toast({
          title: 'Following',
          description: 'You are now following this user.'
        });

        // Create activity feed entry
        await supabase
          .from('activity_feed')
          .insert({
            user_id: targetUserId,
            actor_id: user.id,
            activity_type: 'follow'
          });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.id === targetUserId) {
    return showCount ? (
      <div className="flex items-center space-x-2 text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>{followerCount} followers</span>
      </div>
    ) : null;
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        onClick={handleFollow}
        disabled={loading}
        variant={isFollowing ? "outline" : "default"}
        size="sm"
      >
        {isFollowing ? (
          <>
            <Users className="h-4 w-4 mr-2" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4 mr-2" />
            Follow
          </>
        )}
      </Button>
      {showCount && (
        <span className="text-sm text-muted-foreground">
          {followerCount} followers
        </span>
      )}
    </div>
  );
}
