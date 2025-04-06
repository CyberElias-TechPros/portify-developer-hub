
import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SkillBar from "@/components/SkillBar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skill } from "@/types/portfolio";
import { useToast } from "@/hooks/use-toast";

export default function Skills() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  
  const categories = [
    { id: 'all', name: 'All Skills' },
    { id: 'languages', name: 'Languages' },
    { id: 'frameworks', name: 'Frameworks' },
    { id: 'tools', name: 'Tools & Databases' },
  ];

  // Fetch skills from Supabase
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
        
        if (data) {
          setSkills(data as Skill[]);
        }
      } catch (error) {
        console.error('Error fetching skills:', error);
        toast({
          title: "Error",
          description: "Failed to load skills data",
          variant: "destructive"
        });
        // Fallback to mock data if database fetch fails
        const { skills } = await import("@/data/mock-data");
        setSkills(skills);
      } finally {
        setLoading(false);
      }
    }

    fetchSkills();
  }, [toast]);

  const filteredSkills = selectedCategory === 'all' 
    ? skills
    : skills.filter(skill => skill.category === selectedCategory);
    
  const skillsByProficiency = [...filteredSkills].sort((a, b) => b.proficiency - a.proficiency);

  if (loading) {
    return (
      <section id="skills" className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Skills & Expertise</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Loading skills...</p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="skills" className="py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-on-scroll">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Skills & Expertise</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            I specialize in building modern web applications with these technologies and tools.
          </p>
        </div>

        <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-12">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {skillsByProficiency.map((skill, index) => (
                  <motion.div 
                    key={skill.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        {skill.iconUrl && (
                          <img 
                            src={skill.iconUrl} 
                            alt={skill.name} 
                            className="w-5 h-5 mr-2"
                          />
                        )}
                        <span className="font-medium">{skill.name}</span>
                        {skill.endorsed && skill.endorsed > 10 && (
                          <Badge variant="secondary" className="ml-2 flex items-center text-xs">
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-muted-foreground mr-2">
                          {skill.yearAcquired && `Since ${skill.yearAcquired}`}
                        </span>
                        {skill.endorsed && (
                          <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                            {skill.endorsed}+ endorsements
                          </span>
                        )}
                      </div>
                    </div>
                    <SkillBar percentage={skill.proficiency} name={skill.name} />
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Timeline View */}
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Skill Timeline</h3>
              <div className="relative border-l border-muted pl-6 space-y-8 py-2">
                {[...skillsByProficiency]
                  .filter(s => s.yearAcquired)
                  .sort((a, b) => b.yearAcquired! - a.yearAcquired!)
                  .slice(0, 5)
                  .map((skill, index) => (
                    <div key={`timeline-${skill.id}`} className="relative">
                      <div className="absolute left-0 -translate-x-[1.34rem] flex h-6 w-6 items-center justify-center rounded-full border bg-background">
                        {skill.iconUrl ? (
                          <img src={skill.iconUrl} alt={skill.name} className="h-3 w-3" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{skill.yearAcquired}</span>
                        </div>
                        <h4 className="font-medium mt-1">{skill.name}</h4>
                        <div className="mt-1 mb-1">
                          <SkillBar percentage={skill.proficiency} name={skill.name} />
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>

          {/* Skills Growth */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Endorsed Skills</h3>
              <div className="space-y-4">
                {[...skillsByProficiency]
                  .filter(s => s.endorsed)
                  .sort((a, b) => b.endorsed! - a.endorsed!)
                  .slice(0, 5)
                  .map((skill) => (
                    <div key={`endorsed-${skill.id}`} className="flex items-center justify-between pb-2 border-b">
                      <div className="flex items-center">
                        {skill.iconUrl && (
                          <img 
                            src={skill.iconUrl} 
                            alt={skill.name} 
                            className="w-5 h-5 mr-2"
                          />
                        )}
                        <span>{skill.name}</span>
                      </div>
                      <Badge variant="outline">
                        {skill.endorsed} endorsements
                      </Badge>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
