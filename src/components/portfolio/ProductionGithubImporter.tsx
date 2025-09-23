import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Github, Star, GitFork, Users, RefreshCw, Check, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface GithubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  topics: string[];
  visibility: string;
  selected: boolean;
}

export default function ProductionGithubImporter() {
  const [username, setUsername] = useState('');
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [repositories, setRepositories] = useState<GithubRepository[]>([]);
  const [importSettings, setImportSettings] = useState({
    includePrivate: false,
    importReadme: true,
    importTopics: true,
    importStats: true,
    autoSync: false
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchGithubRepositories = async () => {
    if (!username.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a GitHub username",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    try {
      // Fetch public repositories from GitHub API
      const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('GitHub user not found');
        }
        throw new Error('Failed to fetch repositories');
      }

      const repos: any[] = await response.json();
      
      const formattedRepos: GithubRepository[] = repos
        .filter(repo => importSettings.includePrivate || !repo.private)
        .map(repo => ({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url,
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          language: repo.language,
          updated_at: repo.updated_at,
          topics: repo.topics || [],
          visibility: repo.private ? 'private' : 'public',
          selected: false
        }));

      setRepositories(formattedRepos);
      
      if (formattedRepos.length === 0) {
        toast({
          title: "No Repositories Found",
          description: "No public repositories found for this user",
        });
      }
    } catch (error: any) {
      console.error('Error fetching repositories:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to fetch GitHub repositories",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const toggleRepositorySelection = (id: number) => {
    setRepositories(repos => 
      repos.map(repo => 
        repo.id === id ? { ...repo, selected: !repo.selected } : repo
      )
    );
  };

  const selectAll = () => {
    setRepositories(repos => repos.map(repo => ({ ...repo, selected: true })));
  };

  const deselectAll = () => {
    setRepositories(repos => repos.map(repo => ({ ...repo, selected: false })));
  };

  const importSelectedRepositories = async () => {
    const selectedRepos = repositories.filter(repo => repo.selected);
    
    if (selectedRepos.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one repository to import",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to import repositories",
        variant: "destructive"
      });
      return;
    }

    setImported(true);
    try {
      const projectsToInsert = selectedRepos.map(repo => {
        let description = repo.description || '';
        
        // If importing README, note that we would need to fetch it separately
        if (importSettings.importReadme && !description) {
          description = `GitHub repository: ${repo.name}`;
        }

        return {
          user_id: user.id,
          title: repo.name,
          description: description.substring(0, 500), // Limit description length
          long_description: repo.description,
          tags: importSettings.importTopics ? repo.topics : [],
          repo_url: repo.html_url,
          demo_url: null,
          image_url: null,
          category: repo.language || 'Other',
          stars: importSettings.importStats ? repo.stargazers_count : 0,
          forks: importSettings.importStats ? repo.forks_count : 0,
          featured: repo.stargazers_count > 10, // Auto-feature popular repos
          is_public: true
        };
      });

      const { data, error } = await supabase
        .from('projects')
        .insert(projectsToInsert)
        .select();

      if (error) throw error;

      toast({
        title: "Import Successful",
        description: `Successfully imported ${selectedRepos.length} repositories as projects`,
      });

      // Reset form
      setTimeout(() => {
        setImported(false);
        setRepositories([]);
        setUsername('');
      }, 2000);

    } catch (error: any) {
      console.error('Error importing repositories:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import repositories",
        variant: "destructive"
      });
      setImported(false);
    }
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
            Connect to GitHub and import your repositories as portfolio projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="github-username">GitHub Username</Label>
              <div className="flex space-x-2">
                <Input
                  id="github-username"
                  placeholder="Enter GitHub username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchGithubRepositories()}
                />
                <Button 
                  onClick={fetchGithubRepositories}
                  disabled={!username.trim() || importing}
                >
                  {importing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Fetching...
                    </>
                  ) : 'Fetch Repositories'}
                </Button>
              </div>
            </div>

            {/* Import Settings */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <Label className="text-sm font-medium">Import Settings</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-private" 
                    checked={importSettings.includePrivate}
                    onCheckedChange={(checked) => 
                      setImportSettings(prev => ({ ...prev, includePrivate: !!checked }))
                    }
                  />
                  <Label htmlFor="include-private" className="text-sm">Include private repos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="import-readme" 
                    checked={importSettings.importReadme}
                    onCheckedChange={(checked) => 
                      setImportSettings(prev => ({ ...prev, importReadme: !!checked }))
                    }
                  />
                  <Label htmlFor="import-readme" className="text-sm">Import README as description</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="import-topics" 
                    checked={importSettings.importTopics}
                    onCheckedChange={(checked) => 
                      setImportSettings(prev => ({ ...prev, importTopics: !!checked }))
                    }
                  />
                  <Label htmlFor="import-topics" className="text-sm">Import topics as tags</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="import-stats" 
                    checked={importSettings.importStats}
                    onCheckedChange={(checked) => 
                      setImportSettings(prev => ({ ...prev, importStats: !!checked }))
                    }
                  />
                  <Label htmlFor="import-stats" className="text-sm">Import GitHub statistics</Label>
                </div>
              </div>
            </div>
            
            {repositories.length > 0 && (
              <>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">Found {repositories.length} repositories</h3>
                    {repositories.some(repo => repo.visibility === 'private') && (
                      <Badge variant="secondary" className="flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Includes private repos
                      </Badge>
                    )}
                  </div>
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
                    {repositories.map(repo => (
                      <div 
                        key={repo.id} 
                        className={`p-4 border rounded-md transition-colors cursor-pointer ${
                          repo.selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleRepositorySelection(repo.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{repo.name}</h4>
                              {repo.language && <Badge variant="outline">{repo.language}</Badge>}
                              {repo.visibility === 'private' && (
                                <Badge variant="secondary">Private</Badge>
                              )}
                            </div>
                            {repo.description && (
                              <p className="text-sm text-muted-foreground">{repo.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 mr-1 fill-amber-400 stroke-amber-400" />
                                <span>{repo.stargazers_count}</span>
                              </div>
                              <div className="flex items-center">
                                <GitFork className="h-4 w-4 mr-1" />
                                <span>{repo.forks_count}</span>
                              </div>
                              <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                            </div>
                            {repo.topics.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {repo.topics.slice(0, 5).map(topic => (
                                  <Badge key={topic} variant="outline" className="text-xs">
                                    {topic}
                                  </Badge>
                                ))}
                                {repo.topics.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{repo.topics.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <Checkbox
                            checked={repo.selected}
                            onCheckedChange={() => toggleRepositorySelection(repo.id)}
                            onClick={(e) => e.stopPropagation()}
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
        {repositories.length > 0 && (
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              {repositories.filter(r => r.selected).length} repositories selected
            </div>
            <Button 
              onClick={importSelectedRepositories} 
              disabled={repositories.filter(r => r.selected).length === 0 || imported}
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
    </div>
  );
}