
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github, Star, GitFork, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserProjects } from "@/hooks/useUserContent";

interface ProjectsShowcaseProps {
  userId?: string;
}

export default function ProjectsShowcase({ userId }: ProjectsShowcaseProps) {
  const { projects, loading, error } = useUserProjects(userId || null);
  const [showAll, setShowAll] = useState(false);

  if (loading) {
    return (
      <section className="w-full py-16 px-6 md:px-12 lg:px-24 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Projects</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Loading projects...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full py-16 px-6 md:px-12 lg:px-24 bg-muted/50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Projects</h2>
          <p className="text-lg text-muted-foreground">Projects are temporarily unavailable.</p>
        </div>
      </section>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <section className="w-full py-16 px-6 md:px-12 lg:px-24 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Projects</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No projects available at the moment.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const displayProjects = showAll ? projects : projects.slice(0, 6);
  const featuredProjects = projects.filter(project => project.featured);

  return (
    <section id="projects" className="w-full py-16 px-6 md:px-12 lg:px-24 bg-muted/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Projects</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Here are some of my favorite projects that showcase my skills and passion for development.
          </p>
        </div>

        {featuredProjects.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-6">Highlighted Work</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProjects.map((project) => (
                <Card key={project.id} className="group hover:shadow-lg transition-all duration-300 border-2 border-primary/20">
                  <CardHeader className="p-0">
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge variant="default">Featured</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <CardTitle className="mb-2 group-hover:text-primary transition-colors">
                      {project.title}
                    </CardTitle>
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        {project.stars && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4" />
                            <span>{project.stars}</span>
                          </div>
                        )}
                        {project.forks && (
                          <div className="flex items-center space-x-1">
                            <GitFork className="h-4 w-4" />
                            <span>{project.forks}</span>
                          </div>
                        )}
                        {project.contributors && (
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{project.contributors}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {project.repoUrl && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" aria-label={`View ${project.title} source code`}>
                              <Github className="h-4 w-4" aria-hidden="true" />
                            </a>
                          </Button>
                        )}
                        {project.demoUrl && (
                          <Button size="sm" asChild>
                            <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${project.title} live demo`}>
                              <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {projects.length > featuredProjects.length && (
          <div>
            <h3 className="text-2xl font-semibold mb-6">All Projects</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayProjects.filter(p => !p.featured).map((project) => (
                <Card key={project.id} className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader className="p-0">
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <CardTitle className="mb-2 group-hover:text-primary transition-colors">
                      {project.title}
                    </CardTitle>
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        {project.stars && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4" />
                            <span>{project.stars}</span>
                          </div>
                        )}
                        {project.forks && (
                          <div className="flex items-center space-x-1">
                            <GitFork className="h-4 w-4" />
                            <span>{project.forks}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {project.repoUrl && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" aria-label={`View ${project.title} source code`}>
                              <Github className="h-4 w-4" aria-hidden="true" />
                            </a>
                          </Button>
                        )}
                        {project.demoUrl && (
                          <Button size="sm" asChild>
                            <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${project.title} live demo`}>
                              <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {projects.length > 6 && (
          <div className="text-center mt-12">
            <Button 
              onClick={() => setShowAll(!showAll)}
              variant="outline" 
              size="lg"
            >
              {showAll ? "Show Less" : `View All ${projects.length} Projects`}
            </Button>
          </div>
        )}

        <div className="text-center mt-12">
          <Button asChild size="lg">
            <Link to="/projects">View All Projects</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
