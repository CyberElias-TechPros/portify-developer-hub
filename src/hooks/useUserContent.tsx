
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
      setProjects(data || []);
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
      setExperiences(data || []);
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
      setBlogPosts(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { blogPosts, loading, error, refetch: fetchBlogPosts };
}
