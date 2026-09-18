import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Lightbulb, Laugh, Trophy, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';

const REACTION_TYPES = ['like', 'love', 'celebrate', 'insightful', 'funny'] as const;
type ReactionType = (typeof REACTION_TYPES)[number];

const meta: Record<ReactionType, { icon: any; label: string; ring: string }> = {
  like: { icon: ThumbsUp, label: 'Like', ring: 'text-sky-300 border-sky-400/40 bg-sky-400/10' },
  love: { icon: Heart, label: 'Love', ring: 'text-rose-300 border-rose-400/40 bg-rose-400/10' },
  celebrate: { icon: Trophy, label: 'Celebrate', ring: 'text-amber-300 border-amber-400/40 bg-amber-400/10' },
  insightful: { icon: Lightbulb, label: 'Insightful', ring: 'text-cyan-300 border-cyan-400/40 bg-cyan-400/10' },
  funny: { icon: Laugh, label: 'Funny', ring: 'text-violet-300 border-violet-400/40 bg-violet-400/10' },
};

interface ReactionsProps {
  contentType: 'project' | 'blog_post' | 'comment' | 'profile';
  contentId: string;
  compact?: boolean;
  className?: string;
}

export default function Reactions({ contentType, contentId, compact = false, className = '' }: ReactionsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<string[]>([]);
  const [pending, setPending] = useState<ReactionType | null>(null);

  useEffect(() => {
    if (!contentId) return;
    void api
      .get<{ counts?: Record<string, number>; summary?: Record<string, number>; mine: string[] }>(
        `/api/social/reactions?content_type=${contentType}&content_id=${encodeURIComponent(contentId)}`
      )
      .then(({ data }) => {
        if (data) {
          setCounts(data.counts ?? data.summary ?? {});
          setMine(data.mine ?? []);
        }
      });
  }, [contentType, contentId, user?.id]);

  const toggle = async (type: ReactionType) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setPending(type);
    const optimistic = mine.includes(type);
    setCounts((current) => ({ ...current, [type]: Math.max((current[type] ?? 0) + (optimistic ? -1 : 1), 0) }));
    setMine((current) => (optimistic ? current.filter((item) => item !== type) : [...current, type]));

    const { data, error } = await api.post<{ counts?: Record<string, number>; summary?: Record<string, number>; mine: string[] }>(
      '/api/social/reactions/toggle',
      { content_type: contentType, content_id: contentId, reaction_type: type }
    );
    setPending(null);

    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      setCounts(data.counts ?? data.summary ?? {});
      setMine(data.mine ?? []);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {REACTION_TYPES.map((type) => {
        const { icon: Icon, label, ring } = meta[type];
        const active = mine.includes(type);
        const count = counts[type] ?? 0;
        if (compact && count === 0 && !active) return null;
        return (
          <motion.button
            key={type}
            whileTap={{ scale: 0.92 }}
            onClick={() => void toggle(type)}
            disabled={pending === type}
            title={label}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all duration-300 ${
              active ? ring : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/25'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {count > 0 && <span className="mono">{count}</span>}
          </motion.button>
        );
      })}
    </div>
  );
}
