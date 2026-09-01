import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/api";
import type { Project, Skill, Experience, BlogPost } from "@/types/portfolio";

function message(error: unknown) { return error instanceof Error ? error.message : "Unable to load portfolio content."; }

export function useUserProjects(userId: string | null) {
  const [projects, setProjects] = useState<Project[]>([]); const [loading, setLoading] = useState(Boolean(userId)); const [error, setError] = useState<string | null>(null);
  const fetchProjects = useCallback(async () => { if (!userId) { setProjects([]); setLoading(false); return; } setLoading(true); setError(null); const result = await supabase.from("projects").select("*").eq("user_id", userId).eq("is_public", true).order("featured", { ascending: false }).order("created_at", { ascending: false }); if (result.error) setError(message(result.error)); else setProjects((result.data ?? []).map((project) => ({ id: project.id, user_id: project.user_id || undefined, title: project.title, description: project.description, longDescription: project.long_description || undefined, tags: project.tags || [], imageUrl: project.image_url || "/placeholder.svg", repoUrl: project.repo_url || "", demoUrl: project.demo_url || undefined, featured: project.featured ?? false, stars: project.stars ?? undefined, forks: project.forks ?? undefined, contributors: project.contributors ?? undefined, category: project.category || undefined, is_public: project.is_public ?? true, created_at: project.created_at || undefined, updated_at: project.updated_at || undefined }))); setLoading(false); }, [userId]);
  useEffect(() => { void fetchProjects(); }, [fetchProjects]); return { projects, loading, error, refetch: fetchProjects };
}

export function useUserSkills(userId: string | null) {
  const [skills, setSkills] = useState<Skill[]>([]); const [loading, setLoading] = useState(Boolean(userId)); const [error, setError] = useState<string | null>(null);
  const fetchSkills = useCallback(async () => { if (!userId) { setSkills([]); setLoading(false); return; } setLoading(true); setError(null); const result = await supabase.from("skills").select("*").eq("user_id", userId).eq("is_public", true).order("proficiency", { ascending: false }); if (result.error) setError(message(result.error)); else setSkills((result.data ?? []).map((skill) => ({ id: skill.id, user_id: skill.user_id || undefined, name: skill.name, category: skill.category, proficiency: skill.proficiency, iconUrl: skill.icon_url || undefined, yearAcquired: skill.year_acquired || undefined, endorsed: skill.endorsed || undefined, is_public: skill.is_public ?? true, created_at: skill.created_at || undefined, updated_at: skill.updated_at || undefined }))); setLoading(false); }, [userId]);
  useEffect(() => { void fetchSkills(); }, [fetchSkills]); return { skills, loading, error, refetch: fetchSkills };
}

export function useUserExperiences(userId: string | null) {
  const [experiences, setExperiences] = useState<Experience[]>([]); const [loading, setLoading] = useState(Boolean(userId)); const [error, setError] = useState<string | null>(null);
  const fetchExperiences = useCallback(async () => { if (!userId) { setExperiences([]); setLoading(false); return; } setLoading(true); setError(null); const result = await supabase.from("experiences").select("*").eq("user_id", userId).eq("is_public", true).order("start_date", { ascending: false }); if (result.error) setError(message(result.error)); else setExperiences((result.data ?? []).map((exp) => ({ id: exp.id, user_id: exp.user_id || undefined, company: exp.company, position: exp.position, startDate: exp.start_date, endDate: exp.end_date, description: exp.description, logoUrl: exp.logo_url || undefined, location: exp.location || "", current: !exp.end_date, technologies: exp.technologies || [], projects: exp.projects || [], is_public: exp.is_public ?? true, created_at: exp.created_at || undefined, updated_at: exp.updated_at || undefined }))); setLoading(false); }, [userId]);
  useEffect(() => { void fetchExperiences(); }, [fetchExperiences]); return { experiences, loading, error, refetch: fetchExperiences };
}

export function useUserBlogPosts(userId: string | null) {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]); const [loading, setLoading] = useState(Boolean(userId)); const [error, setError] = useState<string | null>(null);
  const fetchBlogPosts = useCallback(async () => { if (!userId) { setBlogPosts([]); setLoading(false); return; } setLoading(true); setError(null); const result = await supabase.from("blog_posts").select("*").eq("user_id", userId).eq("published", true).eq("is_public", true).order("publish_date", { ascending: false }); if (result.error) setError(message(result.error)); else setBlogPosts((result.data ?? []).map((post) => ({ id: post.id, user_id: post.user_id || undefined, title: post.title, content: post.content, excerpt: post.excerpt || post.title, slug: post.slug, publishDate: post.publish_date || post.created_at || new Date().toISOString(), tags: post.tags || [], coverImageUrl: post.cover_image_url || "/placeholder.svg", category: post.category || undefined, series: post.series || undefined, readingTime: post.reading_time || 1, published: post.published ?? false, is_public: post.is_public ?? true, created_at: post.created_at || undefined, updated_at: post.updated_at || undefined }))); setLoading(false); }, [userId]);
  useEffect(() => { void fetchBlogPosts(); }, [fetchBlogPosts]); return { blogPosts, loading, error, refetch: fetchBlogPosts };
}
