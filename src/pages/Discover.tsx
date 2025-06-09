
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Profile, adaptDbProfileToProfile } from '@/types/portfolio';
import { Search, MapPin, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import FollowButton from '@/components/community/FollowButton';
import { getUsernameByUserId } from '@/hooks/useUsername';

export default function Discover() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [usernames, setUsernames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (profiles.length > 0) {
      fetchUsernames();
    }
  }, [profiles]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('full_name', 'is', null)
        .limit(50);

      if (error) throw error;

      const adaptedProfiles = data.map(adaptDbProfileToProfile);
      setProfiles(adaptedProfiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsernames = async () => {
    const usernameMap: Record<string, string> = {};
    
    await Promise.all(
      profiles.map(async (profile) => {
        const username = await getUsernameByUserId(profile.id);
        if (username) {
          usernameMap[profile.id] = username;
        }
      })
    );
    
    setUsernames(usernameMap);
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.bio?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Discover Developers</h1>
            <p className="text-muted-foreground mb-8">Loading amazing developers...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Discover Developers</h1>
          <p className="text-muted-foreground mb-6">
            Connect with talented developers from around the world
          </p>
          
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search developers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <Card key={profile.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                  <AvatarFallback className="text-lg">
                    {profile.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{profile.name}</CardTitle>
                {profile.title && (
                  <p className="text-muted-foreground">{profile.title}</p>
                )}
                {profile.location && (
                  <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {profile.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {profile.bio}
                  </p>
                )}
                
                <div className="flex justify-center">
                  <FollowButton targetUserId={profile.id} showCount />
                </div>
                
                <div className="flex justify-center space-x-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/${usernames[profile.id] || profile.id}`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Portfolio
                    </Link>
                  </Button>
                </div>
                
                <div className="flex justify-center space-x-2">
                  {profile.github && (
                    <Button asChild variant="ghost" size="sm">
                      <a href={profile.github} target="_blank" rel="noopener noreferrer">
                        GitHub
                      </a>
                    </Button>
                  )}
                  {profile.linkedin && (
                    <Button asChild variant="ghost" size="sm">
                      <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {profile.website && (
                    <Button asChild variant="ghost" size="sm">
                      <a href={profile.website} target="_blank" rel="noopener noreferrer">
                        Website
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProfiles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No developers found matching your search.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
