
import { useState, useEffect } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Experience as ExperienceType } from "@/types/portfolio";
import { Skeleton } from "@/components/ui/skeleton";
import AnimatedWrapper from "@/components/AnimatedWrapper";

interface ExperienceProps {
  userId?: string;
}

export default function Experience({ userId }: ExperienceProps) {
  const [experiences, setExperiences] = useState<ExperienceType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getExperiences = async () => {
      try {
        setLoading(true);
        let query = supabase.from("experiences").select("*");
        
        if (userId) {
          query = query.eq('user_id', userId);
        }
        
        const { data, error } = await query.order("start_date", { ascending: false });
        
        if (error) {
          console.error("Error fetching experiences:", error);
          return;
        }
        
        // Map the data to the Experience type
        const formattedExperiences: ExperienceType[] = data.map((exp) => {
          // Parse dates
          const startDate = exp.start_date ? new Date(exp.start_date).toISOString() : '';
          const endDate = exp.end_date ? new Date(exp.end_date).toISOString() : null;
          
          return {
            id: exp.id,
            company: exp.company,
            position: exp.position,
            startDate,
            endDate,
            description: exp.description,
            logoUrl: exp.logo_url,
            location: exp.location || '',
            current: !exp.end_date,
            technologies: exp.technologies || [],
            projects: exp.projects || []
          };
        });
        
        setExperiences(formattedExperiences);
      } catch (error) {
        console.error("Error fetching experiences:", error);
      } finally {
        setLoading(false);
      }
    };

    getExperiences();
  }, [userId]);

  const formatExperienceDate = (date: string) => {
    try {
      return format(new Date(date), 'MMM yyyy');
    } catch (error) {
      console.error("Invalid date format:", error);
      return "Unknown";
    }
  };

  return (
    <section className="w-full py-16 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Experience</h2>
            <p className="text-muted-foreground mt-2">
              Professional journey and work history
            </p>
          </div>
          <Button asChild variant="ghost" className="hidden md:flex mt-4 md:mt-0">
            <Link to="/experience" className="group flex items-center">
              View full experience
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        <AnimatedWrapper>
          {loading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-md flex-shrink-0" />
                      <div className="space-y-3 flex-grow">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-60" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-6 w-24 hidden md:block" />
                    </div>
                    <div className="mt-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6 mt-2" />
                      <Skeleton className="h-4 w-4/6 mt-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : experiences.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No work experience available.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {experiences.slice(0, 3).map((exp) => (
                <Card key={exp.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="w-12 h-12 rounded-md bg-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {exp.logoUrl ? (
                          <img 
                            src={exp.logoUrl} 
                            alt={exp.company} 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-xl font-bold">{exp.company.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-lg font-bold">{exp.position}</h3>
                        <div className="flex flex-wrap gap-x-2 items-center">
                          <p className="text-muted-foreground">{exp.company}</p>
                          {exp.location && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <p className="text-muted-foreground">{exp.location}</p>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatExperienceDate(exp.startDate)} - {exp.endDate ? formatExperienceDate(exp.endDate) : 'Present'}
                        </p>
                      </div>
                      {exp.current && (
                        <Badge className="hidden md:inline-flex" variant="default">Current</Badge>
                      )}
                    </div>
                    <div className="mt-4">
                      <p className="text-muted-foreground">{exp.description}</p>
                      {exp.technologies && exp.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {exp.technologies.map((tech, index) => (
                            <Badge key={index} variant="outline">{tech}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </AnimatedWrapper>

        <div className="flex justify-center mt-12 md:hidden">
          <Button asChild>
            <Link to="/experience" className="group flex items-center">
              View full experience
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
