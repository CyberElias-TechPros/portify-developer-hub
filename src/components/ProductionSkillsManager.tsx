import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SkillBar from '@/components/SkillBar';
import { Calendar, CheckCheck, Trophy, Search, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skill } from '@/types/portfolio';

export default function ProductionSkillsManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('skills');
  const [searchTerm, setSearchTerm] = useState('');
  const [newSkill, setNewSkill] = useState({ name: '', category: 'languages', proficiency: 70 });

  useEffect(() => {
    if (user) {
      fetchSkills();
    }
  }, [user]);

  const fetchSkills = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('user_id', user.id)
        .order('proficiency', { ascending: false });

      if (error) throw error;

      const formattedSkills: Skill[] = data.map(skill => ({
        id: skill.id,
        user_id: skill.user_id,
        name: skill.name,
        category: skill.category,
        proficiency: skill.proficiency,
        yearAcquired: skill.year_acquired,
        endorsed: skill.endorsed || 0,
        iconUrl: skill.icon_url,
        created_at: skill.created_at,
        updated_at: skill.updated_at
      }));

      setSkills(formattedSkills);
    } catch (error) {
      console.error('Error fetching skills:', error);
      toast({
        title: "Error",
        description: "Failed to load skills",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.name.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('skills')
        .insert({
          user_id: user.id,
          name: newSkill.name,
          category: newSkill.category,
          proficiency: newSkill.proficiency,
          year_acquired: new Date().getFullYear(),
          endorsed: 0
        })
        .select()
        .single();

      if (error) throw error;

      const formattedSkill: Skill = {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        category: data.category,
        proficiency: data.proficiency,
        yearAcquired: data.year_acquired,
        endorsed: data.endorsed || 0,
        iconUrl: data.icon_url,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setSkills([...skills, formattedSkill]);
      setNewSkill({ name: '', category: 'languages', proficiency: 70 });
      setActiveTab('skills');

      toast({
        title: "Success",
        description: "Skill added successfully",
      });
    } catch (error) {
      console.error('Error adding skill:', error);
      toast({
        title: "Error",
        description: "Failed to add skill",
        variant: "destructive"
      });
    }
  };

  // Filter skills based on search term
  const filteredSkills = skills.filter(skill => 
    skill.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get category counts
  const categoryCount = {
    languages: skills.filter(s => s.category === 'languages').length,
    frameworks: skills.filter(s => s.category === 'frameworks').length,
    tools: skills.filter(s => s.category === 'tools').length,
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading skills...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Skills Management</CardTitle>
          <CardDescription>
            Manage your technical skills and track your proficiency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="skills" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="skills">My Skills</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="add">Add Skill</TabsTrigger>
            </TabsList>
            
            {/* Skills Tab */}
            <TabsContent value="skills" className="space-y-4 pt-4">
              <div className="flex items-center space-x-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button onClick={() => setActiveTab('add')}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Skill
                </Button>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">{skills.length}</span> skills total
                </div>
                <div className="flex space-x-4">
                  <div>Languages: {categoryCount.languages}</div>
                  <div>Frameworks: {categoryCount.frameworks}</div>
                  <div>Tools: {categoryCount.tools}</div>
                </div>
              </div>
              
              <div className="space-y-6 mt-4">
                {filteredSkills.map(skill => (
                  <div key={skill.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="font-medium mr-2">{skill.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {skill.category}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>Since {skill.yearAcquired}</span>
                        </div>
                        <div className="text-sm font-medium">
                          {skill.proficiency}%
                        </div>
                      </div>
                    </div>
                    <SkillBar percentage={skill.proficiency} name={skill.name} />
                  </div>
                ))}
                
                {filteredSkills.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? `No skills found matching '${searchTerm}'` : 'No skills added yet'}
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Timeline Tab */}
            <TabsContent value="timeline" className="pt-4">
              <div className="relative border-l border-muted ml-4 space-y-10 py-4">
                {[...skills]
                  .sort((a, b) => (b.yearAcquired || 0) - (a.yearAcquired || 0))
                  .map((skill, index) => (
                    <div key={skill.id} className="relative pl-8">
                      <div className="absolute left-0 -translate-x-1/2 flex h-7 w-7 items-center justify-center rounded-full border bg-background">
                        {index === 0 && <Trophy className="h-3 w-3 text-amber-500" />}
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">{skill.yearAcquired}</div>
                        <div className="font-medium">{skill.name}</div>
                        <div className="mt-1 mb-2">
                          <SkillBar percentage={skill.proficiency} name={skill.name} />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {skill.category}
                        </Badge>
                      </div>
                    </div>
                  ))
                }
              </div>
            </TabsContent>
            
            {/* Add Skill Tab */}
            <TabsContent value="add" className="space-y-4 pt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Add New Skill</CardTitle>
                  <CardDescription>
                    Add a new skill to your portfolio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="skill-name">Skill Name</Label>
                    <Input 
                      id="skill-name" 
                      value={newSkill.name} 
                      onChange={(e) => setNewSkill({...newSkill, name: e.target.value})}
                      placeholder="e.g. JavaScript, Photoshop, Project Management"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        type="button"
                        variant={newSkill.category === 'languages' ? 'default' : 'outline'}
                        className="w-full"
                        onClick={() => setNewSkill({...newSkill, category: 'languages'})}
                      >
                        Languages
                      </Button>
                      <Button 
                        type="button"
                        variant={newSkill.category === 'frameworks' ? 'default' : 'outline'}
                        className="w-full"
                        onClick={() => setNewSkill({...newSkill, category: 'frameworks'})}
                      >
                        Frameworks
                      </Button>
                      <Button 
                        type="button"
                        variant={newSkill.category === 'tools' ? 'default' : 'outline'}
                        className="w-full"
                        onClick={() => setNewSkill({...newSkill, category: 'tools'})}
                      >
                        Tools
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="skill-proficiency">Proficiency</Label>
                      <span className="text-sm text-muted-foreground">{newSkill.proficiency}%</span>
                    </div>
                    <input
                      id="skill-proficiency"
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={newSkill.proficiency}
                      onChange={(e) => setNewSkill({...newSkill, proficiency: parseInt(e.target.value)})}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Beginner</span>
                      <span>Intermediate</span>
                      <span>Expert</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setActiveTab('skills')}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSkill} disabled={!newSkill.name.trim()}>
                      Add Skill
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}