
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Github, ExternalLink, Star, GitFork, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Project } from "@/types/portfolio";
import { useToast } from "@/hooks/use-toast";

export default function Projects() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch projects from Supabase
  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        
        // Get the projects table data from Supabase
        const { data, error } = await supabase
          .from('projects')
          .select('*');
        
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
          setProjects(mockProjects);
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
        setProjects(mockProjects);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProjects();
  }, [toast]);
  
  // Get unique categories from projects
  const allCategories = ["all", ...Array.from(new Set(projects.map(p => p.category).filter(Boolean)))];
  
  // Get all tags from projects (flattened and deduplicated)
  const allTags = Array.from(new Set(projects.flatMap(p => p.tags)));
  
  // Filter projects based on search, category, and tags
  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchQuery || 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || project.category === selectedCategory;
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => project.tags.includes(tag));
    
    return matchesSearch && matchesCategory && matchesTags;
  });
  
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prevTags => 
      prevTags.includes(tag)
        ? prevTags.filter(t => t !== tag)
        : [...prevTags, tag]
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">My Projects</h1>
          <p className="text-muted-foreground mx-auto max-w-2xl">
            Explore my portfolio of projects spanning web development, design, and more.
            Each project showcases different skills and technologies.
          </p>
        </div>
        
        {/* Filter and Search */}
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8 mb-10">
          {/* Sidebar filters - visible on desktop */}
          <div className="hidden md:block space-y-8">
            <div>
              <h3 className="font-medium mb-3">Search</h3>
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Categories</h3>
              <div className="space-y-2">
                {allCategories.map(category => (
                  <Button 
                    key={category as string} 
                    variant={selectedCategory === category ? "default" : "ghost"}
                    className="justify-start w-full py-1.5 h-auto font-normal"
                    onClick={() => setSelectedCategory(category as string)}
                  >
                    {category as string}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          {/* Mobile filters */}
          <div className="md:hidden space-y-4 mb-6">
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            
            <div className="overflow-x-auto whitespace-nowrap pb-2">
              <div className="inline-flex gap-2">
                {allCategories.map(category => (
                  <Button 
                    key={category as string} 
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category as string)}
                  >
                    {category as string}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="overflow-x-auto whitespace-nowrap pb-2">
              <div className="inline-flex gap-2">
                {allTags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          {/* Projects grid */}
          <div>
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No projects found</h3>
                <p className="text-muted-foreground mb-6">
                  Try changing your search criteria or filters
                </p>
                <Button 
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setSelectedTags([]);
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <Card key={project.id} className="overflow-hidden flex flex-col h-full">
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={project.imageUrl} 
                        alt={project.title} 
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle>{project.title}</CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="font-normal">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      {(project.stars !== undefined || project.forks !== undefined || project.contributors !== undefined) && (
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
                    </CardContent>
                    <CardFooter className="flex gap-3">
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
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
