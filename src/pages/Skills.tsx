
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import SkillBar from "@/components/SkillBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Skill } from "@/types/portfolio";
import { Loader2 } from "lucide-react";

const Skills = () => {
  const { toast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSkills() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('skills')
          .select('*');
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Convert the database format to our app's Skill format
          const formattedSkills: Skill[] = data.map(skill => ({
            id: skill.id,
            name: skill.name,
            // Convert string category from DB to the union type expected by Skill
            category: skill.category as "languages" | "frameworks" | "tools" | "other",
            proficiency: skill.proficiency,
            iconUrl: skill.icon_url,
            yearAcquired: skill.year_acquired,
            endorsed: skill.endorsed
          }));
          
          setSkills(formattedSkills);
        } else {
          // Fallback to mock data if no data from Supabase
          const { skills: mockSkills } = await import("@/data/mock-data");
          setSkills(mockSkills);
        }
      } catch (error) {
        console.error('Error fetching skills:', error);
        toast({
          title: "Error",
          description: "Failed to load skills data",
          variant: "destructive"
        });
        // Fallback to mock data if there's an error
        const { skills: mockSkills } = await import("@/data/mock-data");
        setSkills(mockSkills);
      } finally {
        setLoading(false);
      }
    }

    fetchSkills();
  }, [toast]);

  const categories = {
    languages: skills.filter(skill => skill.category === "languages"),
    frameworks: skills.filter(skill => skill.category === "frameworks"),
    tools: skills.filter(skill => skill.category === "tools"),
    other: skills.filter(skill => skill.category === "other"),
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 px-4 md:px-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Loading skills...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-4">Skills & Expertise</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A comprehensive overview of my technical skills and proficiency levels across various technologies and domains.
            </p>
          </div>

          <Tabs defaultValue="all" className="mb-12">
            <div className="flex justify-center mb-6">
              <TabsList className="grid grid-cols-5 w-full max-w-md">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="languages">Languages</TabsTrigger>
                <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
                <TabsTrigger value="tools">Tools</TabsTrigger>
                <TabsTrigger value="other">Other</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Programming Languages</CardTitle>
                  <CardDescription>Core languages I work with</CardDescription>
                </CardHeader>
                <CardContent>
                  {categories.languages.map((skill, index) => (
                    <SkillBar
                      key={skill.id}
                      name={skill.name}
                      percentage={skill.proficiency}
                      delay={index * 100}
                    />
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Frameworks & Libraries</CardTitle>
                  <CardDescription>Technologies I build with</CardDescription>
                </CardHeader>
                <CardContent>
                  {categories.frameworks.map((skill, index) => (
                    <SkillBar
                      key={skill.id}
                      name={skill.name}
                      percentage={skill.proficiency}
                      delay={index * 100}
                    />
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tools & Platforms</CardTitle>
                  <CardDescription>Development and deployment tools I use</CardDescription>
                </CardHeader>
                <CardContent>
                  {categories.tools.map((skill, index) => (
                    <SkillBar
                      key={skill.id}
                      name={skill.name}
                      percentage={skill.proficiency}
                      delay={index * 100}
                    />
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Other Skills</CardTitle>
                  <CardDescription>Additional technologies and concepts</CardDescription>
                </CardHeader>
                <CardContent>
                  {categories.other.map((skill, index) => (
                    <SkillBar
                      key={skill.id}
                      name={skill.name}
                      percentage={skill.proficiency}
                      delay={index * 100}
                    />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="languages">
              <Card>
                <CardHeader>
                  <CardTitle>Programming Languages</CardTitle>
                  <CardDescription>Core languages I work with</CardDescription>
                </CardHeader>
                <CardContent>
                  {categories.languages.map((skill, index) => (
                    <SkillBar
                      key={skill.id}
                      name={skill.name}
                      percentage={skill.proficiency}
                      delay={index * 100}
                    />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="frameworks">
              <Card>
                <CardHeader>
                  <CardTitle>Frameworks & Libraries</CardTitle>
                  <CardDescription>Technologies I build with</CardDescription>
                </CardHeader>
                <CardContent>
                  {categories.frameworks.map((skill, index) => (
                    <SkillBar
                      key={skill.id}
                      name={skill.name}
                      percentage={skill.proficiency}
                      delay={index * 100}
                    />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tools">
              <Card>
                <CardHeader>
                  <CardTitle>Tools & Platforms</CardTitle>
                  <CardDescription>Development and deployment tools I use</CardDescription>
                </CardHeader>
                <CardContent>
                  {categories.tools.map((skill, index) => (
                    <SkillBar
                      key={skill.id}
                      name={skill.name}
                      percentage={skill.proficiency}
                      delay={index * 100}
                    />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="other">
              <Card>
                <CardHeader>
                  <CardTitle>Other Skills</CardTitle>
                  <CardDescription>Additional technologies and concepts</CardDescription>
                </CardHeader>
                <CardContent>
                  {categories.other.map((skill, index) => (
                    <SkillBar
                      key={skill.id}
                      name={skill.name}
                      percentage={skill.proficiency}
                      delay={index * 100}
                    />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Certifications</CardTitle>
                <CardDescription>Professional certifications and qualifications</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="mr-2 mt-1 flex h-2 w-2 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium">AWS Certified Solutions Architect</p>
                      <p className="text-sm text-muted-foreground">Amazon Web Services, 2023</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 mt-1 flex h-2 w-2 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium">Professional Scrum Master I</p>
                      <p className="text-sm text-muted-foreground">Scrum.org, 2022</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 mt-1 flex h-2 w-2 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium">Google Analytics Certification</p>
                      <p className="text-sm text-muted-foreground">Google, 2021</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Journey</CardTitle>
                <CardDescription>What I'm currently learning and improving</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="mr-2 mt-1 flex h-2 w-2 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium">Machine Learning & AI</p>
                      <p className="text-sm text-muted-foreground">
                        Exploring TensorFlow and PyTorch for building intelligent applications
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 mt-1 flex h-2 w-2 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium">Blockchain Development</p>
                      <p className="text-sm text-muted-foreground">
                        Smart contracts with Solidity and Web3 integration
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 mt-1 flex h-2 w-2 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium">Advanced System Design</p>
                      <p className="text-sm text-muted-foreground">
                        Distributed systems and high-scale architecture patterns
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Skills;
