
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import SkillBar from '@/components/SkillBar';
import { Calendar, CheckCheck, Trophy, UserPlus, ThumbsUp, Search, Plus, ArrowUpRight, Github } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: number;
  yearAcquired: number;
  endorsed: number;
  isVerified: boolean;
}

// Sample skill data
const mockSkills: Skill[] = [
  { id: 's1', name: 'React', category: 'frameworks', proficiency: 90, yearAcquired: 2018, endorsed: 24, isVerified: true },
  { id: 's2', name: 'TypeScript', category: 'languages', proficiency: 85, yearAcquired: 2019, endorsed: 18, isVerified: true },
  { id: 's3', name: 'Node.js', category: 'frameworks', proficiency: 80, yearAcquired: 2017, endorsed: 15, isVerified: false },
  { id: 's4', name: 'Python', category: 'languages', proficiency: 75, yearAcquired: 2016, endorsed: 12, isVerified: true },
  { id: 's5', name: 'GraphQL', category: 'tools', proficiency: 70, yearAcquired: 2020, endorsed: 8, isVerified: false },
  { id: 's6', name: 'Docker', category: 'tools', proficiency: 65, yearAcquired: 2019, endorsed: 10, isVerified: true },
];

// Sample endorsements
interface Endorsement {
  id: string;
  skillId: string;
  endorserName: string;
  endorserTitle: string;
  endorserAvatar: string;
  endorsementDate: string;
  isLinkedIn: boolean;
}

const mockEndorsements: Endorsement[] = [
  { 
    id: 'e1', 
    skillId: 's1', 
    endorserName: 'Jane Smith', 
    endorserTitle: 'Senior Frontend Developer', 
    endorserAvatar: 'https://i.pravatar.cc/100?img=5', 
    endorsementDate: '2023-11-15',
    isLinkedIn: true 
  },
  { 
    id: 'e2', 
    skillId: 's1', 
    endorserName: 'Michael Johnson', 
    endorserTitle: 'CTO at TechStartup', 
    endorserAvatar: 'https://i.pravatar.cc/100?img=12', 
    endorsementDate: '2023-10-22',
    isLinkedIn: false 
  },
  { 
    id: 'e3', 
    skillId: 's2', 
    endorserName: 'Sarah Williams', 
    endorserTitle: 'Lead Engineer', 
    endorserAvatar: 'https://i.pravatar.cc/100?img=20', 
    endorsementDate: '2023-12-01',
    isLinkedIn: true 
  },
];

export default function SkillsEndorsement() {
  const [skills, setSkills] = useState<Skill[]>(mockSkills);
  const [activeTab, setActiveTab] = useState('skills');
  const [searchTerm, setSearchTerm] = useState('');
  const [newSkill, setNewSkill] = useState({ name: '', category: 'languages', proficiency: 70 });
  
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
  
  // Get endorsements for a skill
  const getEndorsementsForSkill = (skillId: string) => {
    return mockEndorsements.filter(e => e.skillId === skillId);
  };
  
  // Add a new skill
  const handleAddSkill = () => {
    if (newSkill.name.trim()) {
      const newSkillObj: Skill = {
        id: `s${Date.now()}`,
        name: newSkill.name,
        category: newSkill.category,
        proficiency: newSkill.proficiency,
        yearAcquired: new Date().getFullYear(),
        endorsed: 0,
        isVerified: false,
      };
      
      setSkills([...skills, newSkillObj]);
      setNewSkill({ name: '', category: 'languages', proficiency: 70 });
    }
  };
  
  // Toggle skill verification
  const toggleVerification = (skillId: string) => {
    setSkills(skills.map(skill => 
      skill.id === skillId 
        ? { ...skill, isVerified: !skill.isVerified } 
        : skill
    ));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Skills & Endorsements</CardTitle>
          <CardDescription>
            Manage your technical skills and receive endorsements from colleagues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="skills" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="skills">My Skills</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="endorsements">Endorsements</TabsTrigger>
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
                        {skill.isVerified && (
                          <Badge variant="secondary" className="flex items-center">
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>Since {skill.yearAcquired}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <ThumbsUp className="h-3 w-3 mr-1 text-primary" />
                          <span>{skill.endorsed} endorsements</span>
                        </div>
                        <Switch 
                          checked={skill.isVerified}
                          onCheckedChange={() => toggleVerification(skill.id)}
                        />
                      </div>
                    </div>
                    <SkillBar percentage={skill.proficiency} name={skill.name} />
                  </div>
                ))}
                
                {filteredSkills.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No skills found matching '{searchTerm}'
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Timeline Tab */}
            <TabsContent value="timeline" className="pt-4">
              <div className="relative border-l border-muted ml-4 space-y-10 py-4">
                {[...skills]
                  .sort((a, b) => b.yearAcquired - a.yearAcquired)
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
                        {skill.endorsed > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {skill.endorsed} endorsements
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                }
              </div>
            </TabsContent>
            
            {/* Endorsements Tab */}
            <TabsContent value="endorsements" className="pt-4">
              <div className="space-y-6">
                {skills
                  .filter(skill => getEndorsementsForSkill(skill.id).length > 0)
                  .map(skill => (
                    <div key={skill.id} className="space-y-4">
                      <h3 className="font-medium text-lg">{skill.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getEndorsementsForSkill(skill.id).map(endorsement => (
                          <Card key={endorsement.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start space-x-4">
                                <div className="h-12 w-12 rounded-full overflow-hidden">
                                  <img 
                                    src={endorsement.endorserAvatar} 
                                    alt={endorsement.endorserName}
                                    className="h-full w-full object-cover" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <div className="font-medium">{endorsement.endorserName}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {endorsement.endorserTitle}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Endorsed on {endorsement.endorsementDate}
                                  </div>
                                  {endorsement.isLinkedIn && (
                                    <Badge variant="outline" className="flex items-center text-xs">
                                      <svg className="h-3 w-3 mr-1 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                      </svg>
                                      LinkedIn
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                
                <div className="mt-6">
                  <Button className="w-full" variant="outline">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Colleagues to Endorse Your Skills
                  </Button>
                </div>
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
                    <Button onClick={handleAddSkill}>
                      Add Skill
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Automatic Skill Detection</CardTitle>
                  <CardDescription>
                    Auto-detect skills from your GitHub repositories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Connect your GitHub account to automatically detect programming languages 
                      and technologies from your repositories.
                    </p>
                    <Button className="w-full" variant="outline">
                      <Github className="mr-2 h-4 w-4" />
                      Connect GitHub Account
                    </Button>
                    <div className="text-center text-sm text-muted-foreground">
                      <p>
                        You can also import skills from your LinkedIn profile
                      </p>
                      <Button variant="link" size="sm" className="mt-1">
                        Import from LinkedIn
                        <ArrowUpRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
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
