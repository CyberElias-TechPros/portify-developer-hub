
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Profile, adaptDbProfilesToProfiles } from "@/types/portfolio";
import AnimatedWrapper from "@/components/AnimatedWrapper";
import HelpTooltip from "@/components/HelpTooltip";

export default function Community() {
  const [activeTab, setActiveTab] = useState("feed");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .limit(10);
        
        if (error) throw error;
        setProfiles(adaptDbProfilesToProfiles(data || []));
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  return (
    <Layout>
      <div className="container py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Community
              <HelpTooltip 
                content="Connect with other portfolio creators, share ideas, and discover inspiring work" 
                side="right"
              />
            </h1>
            <p className="text-muted-foreground mt-1">
              Connect with other portfolio creators and discover inspiring work
            </p>
          </div>
          <Button>Create Post</Button>
        </div>

        <Tabs defaultValue="feed" value={activeTab} onValueChange={setActiveTab}>
          <div className="mb-8">
            <TabsList className="grid grid-cols-4 max-w-md">
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="blogs">Blogs</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="feed">
            <AnimatedWrapper>
              <div className="space-y-6">
                <Card className="p-6">
                  <p className="text-center text-muted-foreground">
                    Community features coming soon!
                  </p>
                </Card>
              </div>
            </AnimatedWrapper>
          </TabsContent>

          <TabsContent value="projects">
            <AnimatedWrapper>
              <div className="space-y-6">
                <Card className="p-6">
                  <p className="text-center text-muted-foreground">
                    Discover projects from our community members (coming soon)
                  </p>
                </Card>
              </div>
            </AnimatedWrapper>
          </TabsContent>

          <TabsContent value="blogs">
            <AnimatedWrapper>
              <div className="space-y-6">
                <Card className="p-6">
                  <p className="text-center text-muted-foreground">
                    Read blog posts from our community members (coming soon)
                  </p>
                </Card>
              </div>
            </AnimatedWrapper>
          </TabsContent>

          <TabsContent value="people">
            <AnimatedWrapper>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  <p>Loading profiles...</p>
                ) : (
                  profiles.map((profile) => (
                    <Card key={profile.id} className="p-6 flex flex-col items-center text-center">
                      <Avatar className="h-20 w-20 mb-4">
                        <AvatarImage src={profile.avatarUrl || profile.avatar_url} />
                        <AvatarFallback>{profile.name?.charAt(0) || profile.full_name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-medium">{profile.name || profile.full_name}</h3>
                      <p className="text-muted-foreground mb-2">{profile.title}</p>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/u/${profile.id}`}>View Portfolio</a>
                      </Button>
                    </Card>
                  ))
                )}
              </div>
            </AnimatedWrapper>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
