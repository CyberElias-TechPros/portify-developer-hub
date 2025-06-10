
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project, Skill, Experience, BlogPost } from '@/types/portfolio';

export function useUserProjects(userId: string | null) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchProjects();
    } else {
      setProjects([]);
      setLoading(false);
    }
  }, [userId]);

  const fetchProjects = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedProjects: Project[] = (data || []).map(project => ({
        id: project.id,
        user_id: project.user_id,
        title: project.title,
        description: project.description,
        longDescription: project.long_description,
        tags: project.tags || [],
        imageUrl: project.image_url || '',
        repoUrl: project.repo_url || '',
        demoUrl: project.demo_url,
        featured: project.featured || false,
        stars: project.stars,
        forks: project.forks,
        contributors: project.contributors,
        category: project.category,
        is_public: project.is_public,
        created_at: project.created_at,
        updated_at: project.updated_at
      }));
      
      setProjects(mappedProjects);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { projects, loading, error, refetch: fetchProjects };
}

export function useUserSkills(userId: string | null) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchSkills();
    } else {
      setSkills([]);
      setLoading(false);
    }
  }, [userId]);

  const fetchSkills = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('user_id', userId)
        .order('proficiency', { ascending: false });

      if (error) throw error;
      setSkills(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { skills, loading, error, refetch: fetchSkills };
}

export function useUserExperiences(userId: string | null) {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchExperiences();
    } else {
      setExperiences([]);
      setLoading(false);
    }
  }, [userId]);

  const fetchExperiences = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('start_date', { ascending: false });

      if (error) throw error;
      
      const mappedExperiences: Experience[] = (data || []).map(exp => ({
        id: exp.id,
        user_id: exp.user_id,
        company: exp.company,
        position: exp.position,
        startDate: exp.start_date,
        endDate: exp.end_date,
        description: exp.description,
        logoUrl: exp.logo_url,
        location: exp.location,
        current: !exp.end_date,
        technologies: exp.technologies,
        projects: exp.projects,
        is_public: exp.is_public,
        created_at: exp.created_at,
        updated_at: exp.updated_at
      }));
      
      setExperiences(mappedExperiences);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { experiences, loading, error, refetch: fetchExperiences };
}

export function useUserBlogPosts(userId: string | null) {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchBlogPosts();
    } else {
      setBlogPosts([]);
      setLoading(false);
    }
  }, [userId]);

  const fetchBlogPosts = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('user_id', userId)
        .eq('published', true)
        .eq('is_public', true)
        .order('publish_date', { ascending: false });

      if (error) throw error;
      
      const mappedBlogPosts: BlogPost[] = (data || []).map(post => ({
        id: post.id,
        user_id: post.user_id,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        slug: post.slug,
        publishDate: post.publish_date,
        tags: post.tags || [],
        coverImageUrl: post.cover_image_url,
        category: post.category,
        series: post.series,
        readingTime: post.reading_time,
        published: post.published,
        is_public: post.is_public,
        created_at: post.created_at,
        updated_at: post.updated_at
      }));
      
      setBlogPosts(mappedBlogPosts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { blogPosts, loading, error, refetch: fetchBlogPosts };
}
