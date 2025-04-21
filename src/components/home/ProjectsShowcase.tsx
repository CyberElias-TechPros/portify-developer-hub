
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/portfolio";
import { Skeleton } from "@/components/ui/skeleton";
import AnimatedWrapper from "@/components/AnimatedWrapper";

interface ProjectsShowcaseProps {
  userId?: string;
}

export default function ProjectsShowcase({ userId }: ProjectsShowcaseProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProjects = async () => {
      try {
        setLoading(true);
        let query = supabase.from("projects").select("*").limit(3);
        
        if (userId) {
          query = query.eq('user_id', userId);
        }
        
        const { data, error } = await query.order("featured", { ascending: false });
        
        if (error) {
          console.error("Error fetching projects:", error);
          return;
        }
        
        // Map the data to the Project type
        const formattedProjects: Project[] = data.map((project) => ({
          id: project.id,
          title: project.title,
          description: project.description,
          longDescription: project.long_description,
          tags: project.tags || [],
          imageUrl: project.image_url,
          repoUrl: project.repo_url,
          demoUrl: project.demo_url,
          featured: project.featured,
          stars: project.stars,
          forks: project.forks,
          category: project.category,
        }));
        
        setProjects(formattedProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    getProjects();
  }, [userId]);

  return (
    <section className="w-full py-16 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Featured Projects</h2>
            <p className="text-muted-foreground mt-2">
              Highlighted work and personal projects
            </p>
          </div>
          <Button asChild variant="ghost" className="hidden md:flex mt-4 md:mt-0">
            <Link to="/projects" className="group flex items-center">
              View all projects
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        <AnimatedWrapper>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full rounded-b-none" />
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <div className="flex flex-wrap gap-2 mt-6">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No projects available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="overflow-hidden flex flex-col h-full">
                  <div className="aspect-video overflow-hidden bg-muted/20 relative">
                    {project.imageUrl ? (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-muted-foreground">No image available</span>
                      </div>
                    )}
                    {project.featured && (
                      <Badge className="absolute top-2 right-2" variant="secondary">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                    <p className="text-muted-foreground mb-4 flex-1">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-auto pt-4">
                      {project.tags?.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                      {project.tags && project.tags.length > 3 && (
                        <Badge variant="outline">+{project.tags.length - 3}</Badge>
                      )}
                    </div>
                    <div className="flex gap-3 mt-6">
                      {project.demoUrl && (
                        <Button asChild size="sm" variant="default">
                          <a
                            href={project.demoUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Live Demo
                          </a>
                        </Button>
                      )}
                      {project.repoUrl && (
                        <Button asChild size="sm" variant="outline">
                          <a
                            href={project.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Source Code
                          </a>
                        </Button>
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
            <Link to="/projects" className="group flex items-center">
              View all projects
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
