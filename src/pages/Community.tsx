import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { BookOpen, Briefcase, Loader2, Users } from "lucide-react";
import { supabase } from "@/lib/api";
import { adaptDbProfilesToProfiles, Profile, Project, BlogPost } from "@/types/portfolio";
import FollowButton from "@/components/community/FollowButton";
import { getUsernamesByUserIds } from "@/hooks/useUsername";
import { useToast } from "@/hooks/use-toast";

type DbProject = { id: string; title: string; description: string; tags: string[] | null; image_url: string | null; repo_url: string | null; demo_url: string | null; featured: boolean | null; user_id: string | null };
type DbPost = { id: string; user_id: string | null; title: string; excerpt: string | null; slug: string; publish_date: string | null; created_at: string | null; tags: string[] | null };
function project(item: DbProject): Project { return { id: item.id, user_id: item.user_id || undefined, title: item.title, description: item.description, tags: item.tags || [], imageUrl: item.image_url || "/placeholder.svg", repoUrl: item.repo_url || "", demoUrl: item.demo_url || undefined, featured: item.featured ?? false }; }
function post(item: DbPost): BlogPost { return { id: item.id, user_id: item.user_id || undefined, title: item.title, content: "", excerpt: item.excerpt || item.title, slug: item.slug, publishDate: item.publish_date || item.created_at || new Date().toISOString(), tags: item.tags || [], published: true }; }

export default function Community() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("feed");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const load = useCallback(async () => {
    setLoading(true); setError(false);
    const [profileResult, projectResult, postResult] = await Promise.all([supabase.from("profiles").select("*").limit(50), supabase.from("projects").select("*").eq("is_public", true).limit(20), supabase.from("blog_posts").select("*").eq("published", true).eq("is_public", true).limit(20)]);
    if (profileResult.error || projectResult.error || postResult.error) { setError(true); toast({ title: "Could not load community", description: profileResult.error?.message || projectResult.error?.message || postResult.error?.message, variant: "destructive" }); }
    else {
      const nextProfiles = adaptDbProfilesToProfiles(profileResult.data ?? []);
      setProfiles(nextProfiles);
      setProjects((projectResult.data ?? []).map((item) => project(item as DbProject)));
      setPosts((postResult.data ?? []).map((item) => post(item as DbPost)));
      try {
        setUsernames(await getUsernamesByUserIds(nextProfiles.map((profile) => profile.id)));
      } catch (usernameError: unknown) {
        setUsernames({});
        toast({ title: "Could not load portfolio links", description: usernameError instanceof Error ? usernameError.message : "Please try again.", variant: "destructive" });
      }
    }
    setLoading(false);
  }, [toast]);
  useEffect(() => { void load(); }, [load, retryKey]);
  const feed = useMemo(() => [...projects.map((item) => ({ kind: "Project", title: item.title, description: item.description, href: "/projects", date: "" })), ...posts.map((item) => ({ kind: "Article", title: item.title, description: item.excerpt, href: `/blog/${item.slug}`, date: item.publishDate }))].slice(0, 10), [posts, projects]);
  if (loading) return <Layout><div className="min-h-[55vh] flex items-center justify-center" role="status"><Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading community</span></div></Layout>;
  if (error) return <Layout><div className="container py-20 text-center"><h1 className="text-3xl font-bold">Community is temporarily unavailable</h1><Button className="mt-6" onClick={() => setRetryKey((key) => key + 1)}>Try again</Button></div></Layout>;
  return <Layout><div className="container py-10"><div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="flex items-center gap-2 text-3xl font-bold"><Users className="h-7 w-7 text-primary" aria-hidden="true" />Community</h1><p className="mt-1 text-muted-foreground">Discover creators, projects, and ideas shared through Portify.</p></div><Button asChild><Link to="/blog/create">Write an article</Link></Button></div><Tabs value={activeTab} onValueChange={setActiveTab}><TabsList className="grid w-full max-w-lg grid-cols-4"><TabsTrigger value="feed">Feed</TabsTrigger><TabsTrigger value="projects">Projects</TabsTrigger><TabsTrigger value="blogs">Articles</TabsTrigger><TabsTrigger value="people">People</TabsTrigger></TabsList><TabsContent value="feed" className="mt-6"><div className="grid gap-4 md:grid-cols-2">{feed.length ? feed.map((item, index) => <Card key={`${item.kind}-${item.title}-${index}`}><CardHeader><div className="flex items-center gap-2 text-sm text-muted-foreground"><Badge variant="secondary">{item.kind}</Badge>{item.kind === "Project" ? <Briefcase className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}</div><CardTitle className="text-xl"><Link className="hover:text-primary" to={item.href}>{item.title}</Link></CardTitle><CardDescription>{item.description}</CardDescription></CardHeader></Card>) : <Card className="md:col-span-2"><CardContent className="py-12 text-center text-muted-foreground">No community activity yet. Be the first to publish an article.</CardContent></Card>}</div></TabsContent><TabsContent value="projects" className="mt-6"><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{projects.length ? projects.map((item) => <Card key={item.id} className="overflow-hidden"><div className="aspect-video bg-muted"><img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" /></div><CardHeader><CardTitle>{item.title}</CardTitle><CardDescription>{item.description}</CardDescription></CardHeader><CardContent><div className="mb-4 flex flex-wrap gap-2">{item.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}</div><Button variant="outline" asChild><Link to="/projects">Explore projects</Link></Button></CardContent></Card>) : <p className="text-muted-foreground">No public projects yet.</p>}</div></TabsContent><TabsContent value="blogs" className="mt-6"><div className="grid gap-6 md:grid-cols-2">{posts.length ? posts.map((item) => <Card key={item.id}><CardHeader><div className="flex flex-wrap gap-2">{item.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}</div><CardTitle><Link to={`/blog/${item.slug}`} className="hover:text-primary">{item.title}</Link></CardTitle><CardDescription>{item.excerpt}</CardDescription></CardHeader><CardContent className="text-sm text-muted-foreground">{new Date(item.publishDate).toLocaleDateString()}</CardContent></Card>) : <p className="text-muted-foreground">No public articles yet.</p>}</div></TabsContent><TabsContent value="people" className="mt-6"><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{profiles.length ? profiles.map((profile) => <Card key={profile.id}><CardContent className="flex flex-col items-center p-6 text-center"><Avatar className="mb-4 h-20 w-20"><AvatarImage src={profile.avatarUrl} alt="" /><AvatarFallback>{(profile.name || "U").charAt(0).toUpperCase()}</AvatarFallback></Avatar><h2 className="text-xl font-semibold">{profile.name || "Portfolio creator"}</h2>{profile.title && <p className="text-muted-foreground">{profile.title}</p>}<div className="mt-4 flex flex-wrap justify-center gap-2"><FollowButton targetUserId={profile.id} showCount />{usernames[profile.id] && <Button variant="outline" size="sm" asChild><Link to={`/${usernames[profile.id]}`}>View portfolio</Link></Button>}</div></CardContent></Card>) : <p className="text-muted-foreground">No public profiles yet.</p>}</div></TabsContent></Tabs></div></Layout>;
}
