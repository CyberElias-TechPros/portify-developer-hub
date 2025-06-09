
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Reaction } from '@/types/portfolio';
import { Heart, Lightbulb, Laugh, Trophy, ThumbsUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReactionsProps {
  contentType: 'project' | 'blog_post' | 'comment';
  contentId: string;
}

const reactionIcons = {
  like: ThumbsUp,
  love: Heart,
  celebrate: Trophy,
  insightful: Lightbulb,
  funny: Laugh
};

const reactionLabels = {
  like: 'Like',
  love: 'Love',
  celebrate: 'Celebrate',
  insightful: 'Insightful',
  funny: 'Funny'
};

export default function Reactions({ contentType, contentId }: ReactionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReactions();
  }, [contentType, contentId]);

  const fetchReactions = async () => {
    try {
      const { data, error } = await supabase
        .from('reactions')
        .select('*')
        .eq('content_type', contentType)
        .eq('content_id', contentId);

      if (error) throw error;

      // Group reactions by type
      const groupedReactions = data.reduce((acc, reaction) => {
        if (!acc[reaction.reaction_type]) {
          acc[reaction.reaction_type] = [];
        }
        acc[reaction.reaction_type].push(reaction);
        return acc;
      }, {} as Record<string, Reaction[]>);

      setReactions(groupedReactions);

      // Track user's reactions
      if (user) {
        const userReactionTypes = new Set(
          data
            .filter(r => r.user_id === user.id)
            .map(r => r.reaction_type)
        );
        setUserReactions(userReactionTypes);
      }
    } catch (error: any) {
      console.error('Error fetching reactions:', error);
    }
  };

  const toggleReaction = async (reactionType: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to react.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      if (userReactions.has(reactionType)) {
        // Remove reaction
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('user_id', user.id)
          .eq('content_type', contentType)
          .eq('content_id', contentId)
          .eq('reaction_type', reactionType);

        if (error) throw error;

        setUserReactions(prev => {
          const newSet = new Set(prev);
          newSet.delete(reactionType);
          return newSet;
        });
      } else {
        // Add reaction
        const { error } = await supabase
          .from('reactions')
          .insert({
            user_id: user.id,
            content_type: contentType,
            content_id: contentId,
            reaction_type: reactionType
          });

        if (error) throw error;

        setUserReactions(prev => new Set([...prev, reactionType]));
      }

      fetchReactions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update reaction.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {Object.entries(reactionIcons).map(([type, Icon]) => {
        const count = reactions[type]?.length || 0;
        const isActive = userReactions.has(type);

        return (
          <Button
            key={type}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => toggleReaction(type)}
            disabled={loading}
            className="h-8 px-3"
          >
            <Icon className={`h-4 w-4 ${count > 0 ? 'mr-1' : ''}`} />
            {count > 0 && <span className="text-xs">{count}</span>}
            <span className="sr-only">{reactionLabels[type as keyof typeof reactionLabels]}</span>
          </Button>
        );
      })}
    </div>
  );
}
