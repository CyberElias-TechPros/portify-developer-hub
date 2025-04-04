
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Github, Star, GitFork, Users, RefreshCw, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GithubProject {
  id: string;
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  contributors: number;
  updated: string;
  url: string;
  selected: boolean;
}

export default function GithubImporter() {
  const [username, setUsername] = useState('');
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [projects, setProjects] = useState<GithubProject[]>([]);

  // Mock function to simulate GitHub API call
  const fetchGithubProjects = (username: string) => {
    setImporting(true);
    
    // Simulate API delay
    setTimeout(() => {
      // Mock data
      const mockProjects: GithubProject[] = [
        {
          id: '1',
          name: 'portfolio-website',
          description: 'My personal portfolio website built with React and Tailwind CSS',
          stars: 24,
          forks: 8,
          language: 'TypeScript',
          contributors: 2,
          updated: '2023-12-15',
          url: 'https://github.com/username/portfolio-website',
          selected: false
        },
        {
          id: '2',
          name: 'ai-image-generator',
          description: 'An AI-powered image generator using DALL-E API',
          stars: 156,
          forks: 37,
          language: 'JavaScript',
          contributors: 4,
          updated: '2023-11-28',
          url: 'https://github.com/username/ai-image-generator',
          selected: false
        },
        {
          id: '3',
          name: 'react-component-library',
          description: 'Reusable React components with Storybook documentation',
          stars: 89,
          forks: 21,
          language: 'TypeScript',
          contributors: 3,
          updated: '2023-12-02',
          url: 'https://github.com/username/react-component-library',
          selected: false
        },
        {
          id: '4',
          name: 'markdown-blog',
          description: 'Static blog generator using Markdown files',
          stars: 45,
          forks: 12,
          language: 'JavaScript',
          contributors: 1,
          updated: '2023-10-20',
          url: 'https://github.com/username/markdown-blog',
          selected: false
        },
        {
          id: '5',
          name: 'e-commerce-api',
          description: 'RESTful API for e-commerce applications',
          stars: 72,
          forks: 14,
          language: 'JavaScript',
          contributors: 2,
          updated: '2023-11-15',
          url: 'https://github.com/username/e-commerce-api',
          selected: false
        },
      ];
      
      setProjects(mockProjects);
      setImporting(false);
    }, 1500);
  };
  
  // Toggle selection of a project
  const toggleProjectSelection = (id: string) => {
    setProjects(projects.map(project => 
      project.id === id 
        ? { ...project, selected: !project.selected } 
        : project
    ));
  };
  
  // Select all projects
  const selectAll = () => {
    setProjects(projects.map(project => ({ ...project, selected: true })));
  };
  
  // Deselect all projects
  const deselectAll = () => {
    setProjects(projects.map(project => ({ ...project, selected: false })));
  };
  
  // Import selected projects
  const importSelectedProjects = () => {
    setImported(true);
    // In a real app, we would save the selected projects to the database
    setTimeout(() => {
      setImported(false);
      // Optionally clear the form or show success message
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Github className="mr-2 h-5 w-5" />
            Import Projects from GitHub
          </CardTitle>
          <CardDescription>
            Connect your GitHub account to automatically import your repositories as portfolio projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="github-username">GitHub Username</Label>
              <div className="flex space-x-2">
                <Input
                  id="github-username"
                  placeholder="Enter your GitHub username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <Button 
                  onClick={() => fetchGithubProjects(username)}
                  disabled={!username.trim() || importing}
                >
                  {importing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Fetching...
                    </>
                  ) : 'Fetch Projects'}
                </Button>
              </div>
            </div>
            
            {projects.length > 0 && (
              <>
                <div className="flex items-center justify-between py-2">
                  <h3 className="font-medium">Found {projects.length} repositories</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAll}>
                      Deselect All
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="h-[400px] border rounded-md p-4">
                  <div className="space-y-4">
                    {projects.map(project => (
                      <div 
                        key={project.id} 
                        className={`p-4 border rounded-md transition-colors ${
                          project.selected ? 'border-primary bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{project.name}</h4>
                              <Badge variant="outline">{project.language}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{project.description}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 mr-1 fill-amber-400 stroke-amber-400" />
                                <span>{project.stars}</span>
                              </div>
                              <div className="flex items-center">
                                <GitFork className="h-4 w-4 mr-1" />
                                <span>{project.forks}</span>
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                <span>{project.contributors}</span>
                              </div>
                              <span>Updated {project.updated}</span>
                            </div>
                          </div>
                          <Checkbox
                            checked={project.selected}
                            onCheckedChange={() => toggleProjectSelection(project.id)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        </CardContent>
        {projects.length > 0 && (
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              {projects.filter(p => p.selected).length} repositories selected
            </div>
            <Button 
              onClick={importSelectedProjects} 
              disabled={projects.filter(p => p.selected).length === 0 || imported}
            >
              {imported ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Imported!
                </>
              ) : 'Import Selected Projects'}
            </Button>
          </CardFooter>
        )}
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>GitHub Integration Settings</CardTitle>
          <CardDescription>
            Configure how GitHub projects are synchronized with your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="auto-sync" />
              <Label htmlFor="auto-sync">Automatically sync project changes from GitHub</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="import-readme" defaultChecked />
              <Label htmlFor="import-readme">Import README.md as project description</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="import-topics" defaultChecked />
              <Label htmlFor="import-topics">Import GitHub topics as project tags</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="import-stats" defaultChecked />
              <Label htmlFor="import-stats">Show GitHub statistics (stars, forks, etc.)</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="private-repos" />
              <Label htmlFor="private-repos">Include private repositories</Label>
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex justify-between">
              <Button variant="outline">Disconnect GitHub</Button>
              <Button>Save Settings</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
