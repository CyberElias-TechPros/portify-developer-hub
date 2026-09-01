import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, ThumbsUp, Lightbulb } from "lucide-react";
import { supabase } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ReactionsProps { contentType: "project" | "blog_post"; contentId: string; }
type ReactionKind = "like" | "love" | "insightful";

export default function Reactions({ contentType, contentId }: ReactionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [counts, setCounts] = useState<Record<ReactionKind, number>>({ like: 0, love: 0, insightful: 0 });
  const [selected, setSelected] = useState<ReactionKind | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const result = await supabase.from("reactions").select("*").eq("content_type", contentType).eq("content_id", contentId);
    if (result.error) {
      setLoadError(result.error.message);
      setLoading(false);
      return;
    }
    const next: Record<ReactionKind, number> = { like: 0, love: 0, insightful: 0 };
    (result.data ?? []).forEach((reaction) => { if (reaction.reaction_type in next) next[reaction.reaction_type as ReactionKind] += 1; });
    setCounts(next);
    const ownReaction = (result.data ?? []).find((reaction) => reaction.user_id === user?.id)?.reaction_type;
    setSelected(ownReaction === "like" || ownReaction === "love" || ownReaction === "insightful" ? ownReaction : null);
    setLoading(false);
  }, [contentId, contentType, user]);

  useEffect(() => { void load(); }, [load]);

  const toggle = async (kind: ReactionKind) => {
    if (!user) { toast({ title: "Sign in required", description: "Please sign in to react to this post.", variant: "destructive" }); return; }
    if (loading) return;
    setLoading(true);
    const current = selected;
    try {
      if (current === kind) {
        const result = await supabase.from("reactions").delete().eq("content_type", contentType).eq("content_id", contentId).eq("user_id", user.id).eq("reaction_type", kind);
        if (result.error) {
          toast({ title: "Could not remove reaction", description: result.error.message, variant: "destructive" });
          return;
        }
      } else {
        if (current) {
          const remove = await supabase.from("reactions").delete().eq("content_type", contentType).eq("content_id", contentId).eq("user_id", user.id);
          if (remove.error) {
            toast({ title: "Could not update reaction", description: remove.error.message, variant: "destructive" });
            return;
          }
        }
        const result = await supabase.from("reactions").insert({ user_id: user.id, content_type: contentType, content_id: contentId, reaction_type: kind });
        if (result.error) {
          toast({ title: "Could not save reaction", description: result.error.message, variant: "destructive" });
          return;
        }
      }
      await load();
    } finally {
      setLoading(false);
    }
  };

  const reactions: { kind: ReactionKind; label: string; icon: typeof Heart }[] = [{ kind: "like", label: "Like", icon: ThumbsUp }, { kind: "love", label: "Love", icon: Heart }, { kind: "insightful", label: "Insightful", icon: Lightbulb }];
  if (loadError) return <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground" role="alert"><span>Reactions unavailable.</span><Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => void load()}>Try again</Button></div>;
  return <div className="flex flex-wrap items-center gap-2" aria-label="Reactions">{reactions.map(({ kind, label, icon: Icon }) => <Button key={kind} type="button" variant={selected === kind ? "default" : "outline"} size="sm" disabled={loading} onClick={() => void toggle(kind)} aria-pressed={selected === kind}><Icon className="mr-1.5 h-4 w-4" aria-hidden="true" />{label} <span className="ml-1 tabular-nums">{counts[kind]}</span></Button>)}</div>;
}
