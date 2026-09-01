import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, ExternalLink, Star, GitFork, Users, Loader2 } from "lucide-react";
import { supabase } from "@/lib/api";
import type { Project } from "@/types/portfolio";
import { useToast } from "@/hooks/use-toast";

type DbProject = { id: string; user_id: string | null; title: string; description: string; long_description: string | null; tags: string[] | null; image_url: string | null; repo_url: string | null; demo_url: string | null; featured: boolean | null; stars: number | null; forks: number | null; contributors: number | null; category: string | null; is_public: boolean | null; created_at: string | null; updated_at: string | null };
function mapProject(project: DbProject): Project { return { id: project.id, user_id: project.user_id || undefined, title: project.title, description: project.description, longDescription: project.long_description || undefined, tags: project.tags || [], imageUrl: project.image_url || "/placeholder.svg", repoUrl: project.repo_url || "", demoUrl: project.demo_url || undefined, featured: project.featured ?? false, stars: project.stars ?? undefined, forks: project.forks ?? undefined, contributors: project.contributors ?? undefined, category: project.category || undefined, is_public: project.is_public ?? true, created_at: project.created_at || undefined, updated_at: project.updated_at || undefined }; }

export default function Projects() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const fetchProjects = useCallback(async () => {
    setLoading(true); setError(false);
    const result = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (result.error) { setError(true); toast({ title: "Unable to load projects", description: result.error.message, variant: "destructive" }); }
    else setProjects((result.data ?? []).map((project) => mapProject(project as DbProject)));
    setLoading(false);
  }, [toast]);
  useEffect(() => { void fetchProjects(); }, [fetchProjects, retryKey]);

  const categories = useMemo(() => ["all", ...Array.from(new Set(projects.map((project) => project.category).filter((category): category is string => Boolean(category))))], [projects]);
  const tags = useMemo(() => Array.from(new Set(projects.flatMap((project) => project.tags))).sort(), [projects]);
  const filtered = useMemo(() => projects.filter((project) => {
    const query = searchQuery.trim().toLowerCase();
    return (!query || project.title.toLowerCase().includes(query) || project.description.toLowerCase().includes(query)) && (selectedCategory === "all" || project.category === selectedCategory) && (!selectedTags.length || selectedTags.every((tag) => project.tags.includes(tag)));
  }), [projects, searchQuery, selectedCategory, selectedTags]);

  if (loading) return <Layout><div className="min-h-[50vh] flex items-center justify-center" role="status"><Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading projects</span></div></Layout>;
  return <Layout><div className="container py-12"><div className="text-center mb-10"><h1 className="text-4xl font-bold mb-4">Projects</h1><p className="text-muted-foreground mx-auto max-w-2xl">Explore work spanning web development, design, and product engineering.</p></div>{error ? <Card><CardContent className="py-12 text-center"><h2 className="font-semibold text-xl">Projects are temporarily unavailable</h2><Button className="mt-5" onClick={() => setRetryKey((key) => key + 1)}>Try again</Button></CardContent></Card> : <><div className="grid gap-6 md:grid-cols-[220px_1fr] mb-10"><aside className="space-y-6"><div><label htmlFor="project-search" className="font-medium block mb-2">Search</label><Input id="project-search" placeholder="Search projects…" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /></div><div><h2 className="font-medium mb-2">Categories</h2><div className="flex flex-wrap gap-2 md:flex-col">{categories.map((category) => <Button key={category} type="button" size="sm" variant={selectedCategory === category ? "default" : "ghost"} className="md:justify-start" onClick={() => setSelectedCategory(category)}>{category}</Button>)}</div></div><div><h2 className="font-medium mb-2">Tags</h2><div className="flex flex-wrap gap-2">{tags.map((tag) => <Button key={tag} type="button" size="sm" variant={selectedTags.includes(tag) ? "default" : "outline"} onClick={() => setSelectedTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])}>{tag}</Button>)}</div></div></aside><section aria-label="Project results">{filtered.length === 0 ? <div className="text-center py-12"><h2 className="font-semibold">No projects found</h2><p className="text-muted-foreground mt-2">Try changing your search or filters.</p><Button variant="link" onClick={() => { setSearchQuery(""); setSelectedCategory("all"); setSelectedTags([]); }}>Reset filters</Button></div> : <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((project) => <Card key={project.id} className="flex flex-col overflow-hidden"><div className="aspect-video bg-muted overflow-hidden"><img src={project.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform hover:scale-105" /></div><CardHeader><div className="flex items-start justify-between gap-3"><CardTitle>{project.title}</CardTitle>{project.featured && <Badge>Featured</Badge>}</div><CardDescription>{project.description}</CardDescription></CardHeader><CardContent className="flex flex-1 flex-col"><div className="flex flex-wrap gap-2 mb-5">{project.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}</div><div className="mt-auto flex flex-wrap gap-3 text-sm text-muted-foreground">{project.stars !== undefined && <span className="inline-flex items-center gap-1"><Star className="h-4 w-4" aria-hidden="true" />{project.stars}</span>}{project.forks !== undefined && <span className="inline-flex items-center gap-1"><GitFork className="h-4 w-4" aria-hidden="true" />{project.forks}</span>}{project.contributors !== undefined && <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" aria-hidden="true" />{project.contributors}</span>}</div><div className="mt-5 flex gap-2">{project.repoUrl && <Button asChild variant="outline" size="sm"><a href={project.repoUrl} target="_blank" rel="noopener noreferrer"><Github className="mr-2 h-4 w-4" aria-hidden="true" />Code</a></Button>}{project.demoUrl && <Button asChild size="sm"><a href={project.demoUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />Live demo</a></Button>}</div></CardContent></Card>)}</div>}</section></div></>}</div></Layout>;
}
