
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import LoadingState from '@/components/LoadingState';
import { supabase } from '@/integrations/supabase/client';
import { Profile, adaptDbProfileToProfile } from '@/types/portfolio';
import { getUserIdByUsername } from '@/hooks/useUsername';
import Hero from '@/components/home/Hero';
import ProjectsShowcase from '@/components/home/ProjectsShowcase';
import Skills from '@/components/home/Skills';
import Experience from '@/components/home/Experience';
import ContactSection from '@/components/home/ContactSection';

export default function UserPortfolio() {
  const { username } = useParams<{ username: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        if (!username) {
          setError('Username is required');
          return;
        }

        // First try to resolve username to user ID
        const resolvedUserId = await getUserIdByUsername(username);
        
        if (!resolvedUserId) {
          // If username doesn't exist, try to fetch by ID directly (backward compatibility)
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', username)
            .single();

          if (error || !data) {
            setError('User not found');
            return;
          }

          setUserId(data.id);
          setProfile(adaptDbProfileToProfile(data));
        } else {
          // Fetch profile by resolved user ID
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', resolvedUserId)
            .single();

          if (error || !data) {
            setError('User profile not found');
            return;
          }

          setUserId(resolvedUserId);
          setProfile(adaptDbProfileToProfile(data));
        }
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

  if (error || !profile || !userId) {
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
        <ProjectsShowcase userId={userId} />
        <Skills userId={userId} />
        <Experience userId={userId} />
        <ContactSection userProfile={profile} />
      </div>
    </Layout>
  );
}
