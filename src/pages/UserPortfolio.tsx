
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import LoadingState from '@/components/LoadingState';
import { supabase } from '@/integrations/supabase/client';
import { Profile, adaptDbProfileToProfile } from '@/types/portfolio';

// Create interface props types for the components we're importing
interface HeroProps {
  userProfile: Profile;
}

interface ProjectsShowcaseProps {
  userId: string;
}

interface SkillsProps {
  userId: string;
}

interface ExperienceProps {
  userId: string;
}

interface ContactSectionProps {
  userProfile: Profile;
}

// Import components after defining their prop types
import Hero from '@/components/home/Hero';
import ProjectsShowcase from '@/components/home/ProjectsShowcase';
import Skills from '@/components/home/Skills';
import Experience from '@/components/home/Experience';
import ContactSection from '@/components/home/ContactSection';

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
          .eq('id', username) // Using ID for now, can change to username field later
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          setError('User not found');
          return;
        }

        setProfile(adaptDbProfileToProfile(data));
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
        <Hero userProfile={profile as HeroProps['userProfile']} />
        <ProjectsShowcase userId={profile.id as ProjectsShowcaseProps['userId']} />
        <Skills userId={profile.id as SkillsProps['userId']} />
        <Experience userId={profile.id as ExperienceProps['userId']} />
        <ContactSection userProfile={profile as ContactSectionProps['userProfile']} />
      </div>
    </Layout>
  );
}
