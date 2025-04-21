
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/portfolio";
import { Search } from "lucide-react";
import AnimatedWrapper from "@/components/AnimatedWrapper";

export default function Discover() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        // In a real implementation, we would use search functionality
        // Here we just fetch all profiles for demonstration
        const { data, error } = await supabase
          .from('profiles')
          .select('*');
        
        if (error) throw error;
        setProfiles(data as Profile[]);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  // Filter profiles based on search query
  const filteredProfiles = profiles.filter(profile => 
    profile.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    profile.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="container py-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-4xl font-bold mb-4">Discover Portfolios</h1>
          <p className="text-muted-foreground text-lg">
            Explore and connect with talented professionals showcasing their work
          </p>
        </div>

        <div className="max-w-xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search by name or title..." 
              className="pl-10 py-6 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <AnimatedWrapper>
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.length > 0 ? (
                filteredProfiles.map((profile) => (
                  <Card key={profile.id} className="overflow-hidden">
                    <div className="h-24 bg-gradient-to-r from-primary/30 to-blue-500/30"></div>
                    <CardContent className="pt-0">
                      <div className="-mt-12 flex justify-center">
                        <Avatar className="h-24 w-24 border-4 border-background">
                          <AvatarImage src={profile.avatarUrl} />
                          <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="text-center mt-4">
                        <h2 className="text-xl font-semibold">{profile.name}</h2>
                        <p className="text-muted-foreground">{profile.title}</p>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm line-clamp-3">{profile.bio}</p>
                      </div>
                      {profile.location && (
                        <div className="flex items-center justify-center mt-4">
                          <Badge variant="secondary">{profile.location}</Badge>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-center">
                      <Button asChild>
                        <a href={`/u/${profile.id}`}>View Portfolio</a>
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-10">
                  <p className="text-muted-foreground">No profiles match your search criteria</p>
                </div>
              )}
            </div>
          )}
        </AnimatedWrapper>
      </div>
    </Layout>
  );
}
