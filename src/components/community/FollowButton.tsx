import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface FollowButtonProps {
  targetUserId: string;
  showCount?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export default function FollowButton({
  targetUserId,
  showCount = true,
  size = 'md',
  className = '',
}: FollowButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!targetUserId) return;
    void api
      .get<{ followers: number; isFollowing: boolean }>(`/api/social/follow/${targetUserId}`)
      .then(({ data }) => {
        if (data) {
          setIsFollowing(Boolean(data.isFollowing));
          setFollowers(data.followers ?? 0);
        }
        setReady(true);
      });
  }, [targetUserId, user?.id]);

  const toggle = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setLoading(true);
    const next = !isFollowing;
    const { data, error } = next
      ? await api.post<{ followers: number }>(`/api/social/follow/${targetUserId}`)
      : await api.delete<{ followers: number }>(`/api/social/follow/${targetUserId}`);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setIsFollowing(next);
    setFollowers(data?.followers ?? followers + (next ? 1 : -1));
    toast.success(next ? 'Following — you will see their updates' : 'Unfollowed');
  };

  const padding = size === 'sm' ? 'px-3.5 py-2 text-xs' : 'px-5 py-2.5 text-sm';

  return (
    <button
      onClick={toggle}
      disabled={loading || !ready}
      className={`group relative inline-flex items-center gap-2 overflow-hidden rounded-full border transition-all duration-500 ease-cinematic disabled:opacity-60 ${
        isFollowing
          ? 'border-white/15 bg-white/[0.04] text-foreground'
          : 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
      } ${padding} ${className}`}
    >
      <motion.span
        key={isFollowing ? 'following' : 'follow'}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
        className="flex items-center gap-2"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isFollowing ? (
          <UserCheck className="h-3.5 w-3.5" />
        ) : (
          <UserPlus className="h-3.5 w-3.5" />
        )}
        {isFollowing ? 'Following' : 'Follow'}
      </motion.span>
      {showCount && (
        <span className="mono border-l border-current/20 pl-2 text-[10px] opacity-80">{followers}</span>
      )}
    </button>
  );
}
