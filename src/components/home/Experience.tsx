
import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Calendar, MapPin, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Experience as ExperienceType } from "@/types/portfolio";
import { useToast } from "@/hooks/use-toast";

export default function Experience() {
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [experiences, setExperiences] = useState<ExperienceType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExperiences() {
      try {
        setLoading(true);
        
        // Get the experiences from Supabase
        const { data, error } = await supabase
          .from('experiences')
          .select('*')
          .order('start_date', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Convert the database format to our app's Experience format
          const formattedExperiences: ExperienceType[] = data.map(exp => ({
            id: exp.id,
            company: exp.company,
            position: exp.position,
            startDate: exp.start_date,
            endDate: exp.end_date,
            description: exp.description,
            logoUrl: exp.logo_url,
            location: exp.location,
            current: exp.end_date === null,
            technologies: Array.isArray(exp.technologies) ? exp.technologies : [],
            projects: Array.isArray(exp.projects) ? exp.projects : [],
          }));
          
          setExperiences(formattedExperiences);
        } else {
          // Fallback to mock data if no data from Supabase
          const { experiences: mockExperiences } = await import("@/data/mock-data");
          setExperiences(mockExperiences);
        }
      } catch (error) {
        console.error('Error fetching experiences:', error);
        toast({
          title: "Error",
          description: "Failed to load experience data",
          variant: "destructive"
        });
        
        // Fallback to mock data if database fetch fails
        const { experiences: mockExperiences } = await import("@/data/mock-data");
        setExperiences(mockExperiences);
      } finally {
        setLoading(false);
      }
    }
    
    fetchExperiences();
  }, [toast]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <section id="experience" className="py-20 px-6 md:px-12 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Work Experience</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Loading experiences...</p>
          </div>
          <div className="flex justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="experience" className="py-20 px-6 md:px-12 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-on-scroll">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Work Experience</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A journey through my professional career, showcasing the roles and responsibilities 
            I've undertaken over the years.
          </p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 h-full w-0.5 bg-border"></div>

          {/* Experience items */}
          <div className="space-y-12">
            {experiences.map((exp, index) => (
              <motion.div
                key={exp.id}
                className={`relative flex flex-col ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                {/* Timeline dot */}
                <div className="absolute left-0 md:left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background"></div>

                {/* Content */}
                <div className="w-full md:w-1/2 pl-8 md:pl-0 md:pr-8 md:text-right">
                  <div className={`bg-card shadow-sm p-6 rounded-lg border ${exp.current ? 'border-primary' : ''}`}>
                    <h3 className="text-xl font-bold mb-1">{exp.position}</h3>
                    <h4 className="text-lg mb-2">{exp.company}</h4>
                    
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3 md:justify-end">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>
                          {new Date(exp.startDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                          {' - '}
                          {exp.endDate 
                            ? new Date(exp.endDate).toLocaleDateString('en-US', { 
                                month: 'short', 
                                year: 'numeric' 
                              }) 
                            : 'Present'
                          }
                        </span>
                      </div>
                      {exp.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{exp.location}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className={`text-muted-foreground mb-4 ${
                      expandedId === exp.id ? '' : 'line-clamp-3'
                    }`}>
                      {exp.description}
                    </p>
                    
                    {exp.technologies && exp.technologies.length > 0 && (
                      <div className={`flex flex-wrap gap-2 mb-4 md:justify-end ${
                        expandedId !== exp.id && exp.technologies.length > 3 ? 'hidden md:flex' : ''
                      }`}>
                        {(expandedId === exp.id ? exp.technologies : exp.technologies.slice(0, 3)).map(tech => (
                          <Badge key={tech} variant="secondary">
                            {tech}
                          </Badge>
                        ))}
                        {!expandedId && exp.technologies.length > 3 && (
                          <Badge variant="outline">+{exp.technologies.length - 3}</Badge>
                        )}
                      </div>
                    )}
                    
                    {(exp.projects && exp.projects.length > 0) && (
                      <div className={expandedId === exp.id ? 'block' : 'hidden'}>
                        <h5 className="font-medium mb-2">Key Projects:</h5>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground md:list-outside md:text-right">
                          {exp.projects.map(project => (
                            <li key={project}>{project}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="mt-4 md:text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleExpand(exp.id)}
                      >
                        {expandedId === exp.id ? 'Show less' : 'Show more'}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Empty space for timeline alignment */}
                <div className="hidden md:block w-full md:w-1/2"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
