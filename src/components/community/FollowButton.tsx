import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Users, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FollowButton({ targetUserId, showCount = false }: { targetUserId: string; showCount?: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!targetUserId) return;
    setLoadError(null);
    const [countResult, statusResult] = await Promise.all([
      supabase.from("user_follows").select("id", { count: "exact" }).eq("following_id", targetUserId),
      user && user.id !== targetUserId ? supabase.from("user_follows").select("id").eq("follower_id", user.id).eq("following_id", targetUserId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ]);
    const failed = countResult.error || statusResult.error;
    if (failed) {
      setLoadError(failed.message);
      return;
    }
    setFollowerCount(countResult.count ?? countResult.data?.length ?? 0);
    setIsFollowing(Boolean(statusResult.data));
  }, [targetUserId, user]);

  useEffect(() => { void load(); }, [load]);

  const handleFollow = async () => {
    if (!user) { toast({ title: "Sign in required", description: "Please sign in to follow users.", variant: "destructive" }); return; }
    if (user.id === targetUserId) { toast({ title: "Invalid action", description: "You cannot follow yourself.", variant: "destructive" }); return; }
    setLoading(true);
    const result = isFollowing
      ? await supabase.from("user_follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId)
      : await supabase.from("user_follows").insert({ follower_id: user.id, following_id: targetUserId });
    if (result.error) toast({ title: isFollowing ? "Could not unfollow" : "Could not follow", description: result.error.message, variant: "destructive" });
    else { toast({ title: isFollowing ? "Unfollowed" : "Following", description: isFollowing ? "You are no longer following this creator." : "You are now following this creator." }); await load(); }
    setLoading(false);
  };

  if (loadError) return <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground" role="alert"><span>Follow status unavailable.</span><Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => void load()}>Try again</Button></div>;
  if (user?.id === targetUserId) return showCount ? <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" aria-hidden="true" /><span>{followerCount} followers</span></div> : null;
  return <div className="flex items-center gap-2"><Button type="button" onClick={() => void handleFollow()} disabled={loading} variant={isFollowing ? "outline" : "default"} size="sm" aria-pressed={isFollowing}>{isFollowing ? <><Users className="h-4 w-4 mr-2" aria-hidden="true" />Following</> : <><UserPlus className="h-4 w-4 mr-2" aria-hidden="true" />Follow</>}</Button>{showCount && <span className="text-sm text-muted-foreground">{followerCount} followers</span>}</div>;
}
