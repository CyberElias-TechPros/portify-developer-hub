
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Github, ExternalLink, Star, GitFork, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Project } from "@/types/portfolio";
import { useToast } from "@/hooks/use-toast";

export default function ProjectsShowcase() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch projects from Supabase
  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        
        // Get the projects from Supabase that are featured
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('featured', true);
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Convert the database format to our app's Project format
          const formattedProjects: Project[] = data.map(project => ({
            id: project.id,
            title: project.title,
            description: project.description,
            longDescription: project.long_description,
            tags: Array.isArray(project.tags) ? project.tags : [],
            imageUrl: project.image_url || '/placeholder.svg',
            repoUrl: project.repo_url,
            demoUrl: project.demo_url,
            featured: project.featured || false,
            stars: project.stars,
            forks: project.forks,
            contributors: project.contributors,
            category: project.category,
          }));
          
          setProjects(formattedProjects);
        } else {
          // Fallback to mock data if no data from Supabase
          const { projects: mockProjects } = await import("@/data/mock-data");
          const featuredProjects = mockProjects.filter(p => p.featured);
          setProjects(featuredProjects);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Error",
          description: "Failed to load projects data",
          variant: "destructive"
        });
        
        // Fallback to mock data if database fetch fails
        const { projects: mockProjects } = await import("@/data/mock-data");
        const featuredProjects = mockProjects.filter(p => p.featured);
        setProjects(featuredProjects);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProjects();
  }, [toast]);

  const filters = ["all", ...new Set(projects.map(project => project.category))];

  const filteredProjects = filter === "all" 
    ? projects
    : projects.filter(project => project.category === filter);

  if (loading) {
    return (
      <section id="projects" className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Projects</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Loading projects...</p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="projects" className="py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-on-scroll">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Projects</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore a selection of my best work, showcasing my skills and experience in building modern web applications.
          </p>
        </div>

        <div className="flex justify-center mb-10 overflow-x-auto pb-4">
          <div className="flex space-x-2">
            {filters.map((category) => (
              <Button
                key={category}
                variant={filter === category ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(category)}
                className="capitalize whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden h-full flex flex-col border transition-all hover:shadow-md">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={project.imageUrl} 
                    alt={project.title} 
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <CardContent className="flex-1 flex flex-col p-6">
                  <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                  <p className="text-muted-foreground mb-4 flex-grow">{project.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="font-normal">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  {(project.stars !== undefined || project.forks !== undefined) && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      {project.stars !== undefined && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-1 fill-amber-400 stroke-amber-400" />
                          <span>{project.stars}</span>
                        </div>
                      )}
                      {project.forks !== undefined && (
                        <div className="flex items-center">
                          <GitFork className="h-4 w-4 mr-1" />
                          <span>{project.forks}</span>
                        </div>
                      )}
                      {project.contributors !== undefined && (
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{project.contributors}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-3 mt-auto pt-2">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                      <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4" />
                        Code
                      </a>
                    </Button>
                    {project.demoUrl && (
                      <Button asChild size="sm" className="gap-2">
                        <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          Demo
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button asChild size="lg">
            <Link to="/projects">View All Projects</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
