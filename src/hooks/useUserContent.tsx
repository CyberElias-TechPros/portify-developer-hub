import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { Project, Skill, Experience, BlogPost } from '@/types/portfolio';

/** Shape returned by GET /api/portfolio/:username — one request powers a whole portfolio. */
export interface PortfolioBundle {
  profile: Record<string, any>;
  stats: Record<string, number>;
  projects: any[];
  skills: any[];
  experiences: any[];
  education: any[];
  posts: any[];
  sections: any[];
  theme: Record<string, any> | null;
  testimonials: any[];
  isOwner: boolean;
}

export function usePortfolio(username?: string | null) {
  const [bundle, setBundle] = useState<PortfolioBundle | null>(null);
  const [loading, setLoading] = useState(Boolean(username));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!username) {
      setBundle(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: requestError } = await api.get<PortfolioBundle>(`/api/portfolio/${encodeURIComponent(username)}`);
    if (requestError) setError(requestError.message);
    else setBundle(data);
    setLoading(false);
  }, [username]);

  useEffect(() => {
    void load();
  }, [load]);

  return { bundle, loading, error, refetch: load };
}

function mapProject(row: any): Project {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description ?? '',
    longDescription: row.long_description ?? '',
    tags: row.tags ?? [],
    imageUrl: row.image_url ?? '',
    repoUrl: row.repo_url ?? '',
    demoUrl: row.demo_url ?? undefined,
    featured: Boolean(row.featured),
    stars: row.stars ?? 0,
    forks: row.forks ?? 0,
    contributors: row.contributors ?? 0,
    category: row.category ?? undefined,
    is_public: Boolean(row.is_public),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapExperience(row: any): Experience {
  return {
    id: row.id,
    user_id: row.user_id,
    company: row.company,
    position: row.position,
    startDate: row.start_date,
    endDate: row.end_date,
    description: row.description ?? '',
    logoUrl: row.logo_url ?? undefined,
    location: row.location ?? '',
    current: !row.end_date,
    technologies: row.technologies ?? [],
    projects: row.projects ?? [],
    is_public: Boolean(row.is_public),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapPost(row: any): BlogPost {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    content: row.content ?? '',
    excerpt: row.excerpt ?? '',
    slug: row.slug,
    publishDate: row.publish_date ?? row.created_at,
    tags: row.tags ?? [],
    coverImageUrl: row.cover_image_url ?? undefined,
    category: row.category ?? undefined,
    series: row.series ?? undefined,
    readingTime: row.reading_time ?? undefined,
    published: Boolean(row.published ?? true),
    is_public: Boolean(row.is_public ?? true),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function useUserProjects(userId: string | null) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));

  const load = useCallback(async () => {
    if (!userId) {
      setProjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await api.get<any[]>(
      `/api/db/projects?f.user_id=eq.${userId}&limit=100&order=featured.desc,created_at.desc`
    );
    setProjects((data ?? []).map(mapProject));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { projects, loading, error: null, refetch: load };
}

export function useUserSkills(userId: string | null) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));

  const load = useCallback(async () => {
    if (!userId) {
      setSkills([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await api.get<any[]>(`/api/db/skills?f.user_id=eq.${userId}&limit=100&order=proficiency.desc`);
    setSkills(
      (data ?? []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        category: row.category,
        proficiency: row.proficiency,
        iconUrl: row.icon_url ?? undefined,
        yearAcquired: row.year_acquired ?? undefined,
        endorsed: row.endorsed ?? 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }))
    );
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { skills, loading, error: null, refetch: load };
}

export function useUserExperiences(userId: string | null) {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));

  const load = useCallback(async () => {
    if (!userId) {
      setExperiences([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await api.get<any[]>(`/api/db/experiences?f.user_id=eq.${userId}&limit=50&order=start_date.desc`);
    setExperiences((data ?? []).map(mapExperience));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { experiences, loading, error: null, refetch: load };
}

export function useUserBlogPosts(userId: string | null) {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));

  const load = useCallback(async () => {
    if (!userId) {
      setBlogPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await api.get<any[]>(
      `/api/db/blog_posts?f.user_id=eq.${userId}&f.published=eq.1&limit=50&order=publish_date.desc`
    );
    setBlogPosts((data ?? []).map(mapPost));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { blogPosts, loading, error: null, refetch: load };
}
