import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/api";
import { Profile, adaptDbProfilesToProfiles } from "@/types/portfolio";
import { Search, MapPin, ExternalLink, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import FollowButton from "@/components/community/FollowButton";
import { getUsernamesByUserIds } from "@/hooks/useUsername";
import { useToast } from "@/hooks/use-toast";

export default function Discover() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [retryKey, setRetryKey] = useState(0);
  const load = useCallback(async () => {
    setLoading(true); setError(false);
    const result = await supabase.from("profiles").select("*").limit(50);
    if (result.error) { setError(true); toast({ title: "Could not load portfolios", description: result.error.message, variant: "destructive" }); setLoading(false); return; }
    const nextProfiles = adaptDbProfilesToProfiles(result.data ?? []).filter((profile) => Boolean(profile.name));
    setProfiles(nextProfiles);
    try {
      setUsernames(await getUsernamesByUserIds(nextProfiles.map((profile) => profile.id)));
    } catch (usernameError: unknown) {
      setUsernames({});
      toast({ title: "Could not load portfolio links", description: usernameError instanceof Error ? usernameError.message : "Please try again.", variant: "destructive" });
    }
    setLoading(false);
  }, [toast]);
  useEffect(() => { void load(); }, [load, retryKey]);
  const filtered = useMemo(() => profiles.filter((profile) => `${profile.name || ""} ${profile.title || ""} ${profile.bio || ""}`.toLowerCase().includes(searchTerm.trim().toLowerCase())), [profiles, searchTerm]);
  if (loading) return <Layout><div className="min-h-[55vh] flex items-center justify-center" role="status"><Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading creators</span></div></Layout>;
  if (error) return <Layout><div className="container py-20 text-center"><h1 className="text-3xl font-bold">Portfolios are temporarily unavailable</h1><Button className="mt-6" onClick={() => setRetryKey((key) => key + 1)}>Try again</Button></div></Layout>;
  return <Layout><div className="container py-8"><div className="mb-10 text-center"><h1 className="text-3xl font-bold mb-4">Discover developers</h1><p className="text-muted-foreground mb-6">Find public portfolios and connect with the people behind the work.</p><div className="relative mx-auto max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input aria-label="Search developers" placeholder="Search by name, title, or bio…" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="pl-10" /></div></div>{filtered.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{filtered.map((profile) => <Card key={profile.id} className="hover:shadow-lg transition-shadow"><CardHeader className="text-center"><Avatar className="mx-auto mb-4 h-20 w-20"><AvatarImage src={profile.avatarUrl} alt="" /><AvatarFallback className="text-lg">{(profile.name || "U").charAt(0).toUpperCase()}</AvatarFallback></Avatar><CardTitle className="text-xl">{profile.name}</CardTitle>{profile.title && <p className="text-muted-foreground">{profile.title}</p>}{profile.location && <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" aria-hidden="true" />{profile.location}</div>}</CardHeader><CardContent className="space-y-4">{profile.bio && <p className="line-clamp-3 text-sm text-muted-foreground">{profile.bio}</p>}<div className="flex justify-center"><FollowButton targetUserId={profile.id} showCount /></div><div className="flex justify-center">{usernames[profile.id] ? <Button asChild variant="outline" size="sm"><Link to={`/${usernames[profile.id]}`}><ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />View portfolio</Link></Button> : <span className="text-sm text-muted-foreground">Username not set</span>}</div><div className="flex justify-center gap-2">{profile.github && <Button asChild variant="ghost" size="sm"><a href={profile.github} target="_blank" rel="noopener noreferrer">GitHub</a></Button>}{profile.linkedin && <Button asChild variant="ghost" size="sm"><a href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></Button>}{profile.website && <Button asChild variant="ghost" size="sm"><a href={profile.website} target="_blank" rel="noopener noreferrer">Website</a></Button>}</div></CardContent></Card>)}</div> : <div className="py-16 text-center"><p className="text-muted-foreground">No public portfolios match your search.</p><Button variant="link" onClick={() => setSearchTerm("")}>Clear search</Button></div>}</div></Layout>;
}
