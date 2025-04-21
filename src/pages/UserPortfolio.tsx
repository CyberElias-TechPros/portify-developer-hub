
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import LoadingState from '@/components/LoadingState';
import { supabase } from '@/integrations/supabase/client';
import Hero from '@/components/home/Hero';
import ProjectsShowcase from '@/components/home/ProjectsShowcase';
import Skills from '@/components/home/Skills';
import Experience from '@/components/home/Experience';
import ContactSection from '@/components/home/ContactSection';
import { Profile } from '@/types/portfolio';

export default function UserPortfolio() {
  const { username } = useParams<{ username: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile by username
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          setError('User not found');
          return;
        }

        setProfile(data as Profile);
      } catch (err: any) {
        console.error('Error fetching user profile:', err);
        setError(err.message || 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !profile) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-3xl font-bold">User Not Found</h1>
          <p className="mt-4 text-muted-foreground">
            The portfolio you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-background">
        <Hero userProfile={profile} />
        <ProjectsShowcase userId={profile.id} />
        <Skills userId={profile.id} />
        <Experience userId={profile.id} />
        <ContactSection userProfile={profile} />
      </div>
    </Layout>
  );
}
