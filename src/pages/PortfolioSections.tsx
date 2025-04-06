
import { useState } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionManager from "@/components/portfolio/SectionManager";
import GithubImporter from "@/components/portfolio/GithubImporter";
import SkillsEndorsement from "@/components/portfolio/SkillsEndorsement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Star, Users, FileText, Award, Calendar, Trophy } from "lucide-react";

export default function PortfolioSections() {
  const [activeTab, setActiveTab] = useState("sections");
  
  return (
    <Layout>
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-2">Portfolio Content</h1>
        <p className="text-muted-foreground mb-8">
          Manage and customize the content sections of your portfolio
        </p>
        
        <Tabs defaultValue="sections" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="sections">Section Management</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="skills">Skills & Endorsements</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sections">
            <SectionManager />
          </TabsContent>
          
          <TabsContent value="projects">
            <GithubImporter />
          </TabsContent>
          
          <TabsContent value="skills">
            <SkillsEndorsement />
          </TabsContent>
          
          <TabsContent value="experience">
            <Card>
              <CardHeader>
                <CardTitle>Professional Experience</CardTitle>
                <CardDescription>
                  Manage your work history, roles, and accomplishments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Work History</h2>
                    <Button>Add Experience</Button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Experience Entry */}
                    <div className="border rounded-lg p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center">
                            <img src="https://placehold.co/100x100" alt="Company Logo" className="h-8 w-8" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Senior Frontend Developer</h3>
                            <div className="flex items-center text-muted-foreground text-sm">
                              <span>TechCorp Inc.</span>
                              <span className="mx-2">•</span>
                              <span>San Francisco, CA</span>
                            </div>
                          </div>
                        </div>
                        <Badge className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Current</span>
                        </Badge>
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground space-x-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Jan 2022 - Present</span>
                        </div>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          <span>4 Projects</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>2 Testimonials</span>
                        </div>
                      </div>
                      
                      <p className="text-sm">
                        Led frontend development for multiple high-traffic web applications, resulting in a 40% increase in user engagement and a 25% improvement in page load times.
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">React</Badge>
                        <Badge variant="outline">TypeScript</Badge>
                        <Badge variant="outline">Next.js</Badge>
                        <Badge variant="outline">AWS</Badge>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Delete</Button>
                      </div>
                    </div>
                    
                    {/* Another Experience Entry */}
                    <div className="border rounded-lg p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center">
                            <img src="https://placehold.co/100x100" alt="Company Logo" className="h-8 w-8" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Frontend Developer</h3>
                            <div className="flex items-center text-muted-foreground text-sm">
                              <span>DevStudio</span>
                              <span className="mx-2">•</span>
                              <span>Remote</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground space-x-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Mar 2020 - Dec 2021</span>
                        </div>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          <span>3 Projects</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>1 Testimonial</span>
                        </div>
                      </div>
                      
                      <p className="text-sm">
                        Developed responsive web applications using modern front-end technologies. Collaborated with UX designers to implement intuitive user interfaces and maintain design consistency.
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">React</Badge>
                        <Badge variant="outline">JavaScript</Badge>
                        <Badge variant="outline">SCSS</Badge>
                        <Badge variant="outline">GraphQL</Badge>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Delete</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle>Achievements & Certifications</CardTitle>
                <CardDescription>
                  Showcase your awards, certificates, and professional accomplishments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Your Achievements</h2>
                    <Button>Add Achievement</Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Achievement Card */}
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-base font-semibold">AWS Certified Developer</CardTitle>
                            <CardDescription>Amazon Web Services</CardDescription>
                          </div>
                          <Award className="h-5 w-5 text-amber-500" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Issued: June 2023</span>
                            <span className="mx-2">•</span>
                            <span>Expires: June 2026</span>
                          </div>
                          <p className="text-sm">
                            Certified expertise in developing applications on AWS platform, including serverless architectures and containerization.
                          </p>
                          <div className="flex justify-between items-center pt-2">
                            <Button variant="link" size="sm" className="p-0">
                              View Certificate
                            </Button>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              <span>Verified</span>
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Achievement Card */}
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-base font-semibold">React Advanced Certification</CardTitle>
                            <CardDescription>Meta Front-End Developer</CardDescription>
                          </div>
                          <Award className="h-5 w-5 text-amber-500" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Issued: February 2023</span>
                            <span className="mx-2">•</span>
                            <span>No Expiration</span>
                          </div>
                          <p className="text-sm">
                            Advanced proficiency in React library, state management, hooks, and performance optimization techniques.
                          </p>
                          <div className="flex justify-between items-center pt-2">
                            <Button variant="link" size="sm" className="p-0">
                              View Certificate
                            </Button>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              <span>Verified</span>
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Achievement Card */}
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-base font-semibold">Best Frontend Solution</CardTitle>
                            <CardDescription>WebDev Annual Hackathon</CardDescription>
                          </div>
                          <Star className="h-5 w-5 text-yellow-500" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Awarded: November 2022</span>
                          </div>
                          <p className="text-sm">
                            First place award for developing an innovative accessible UI component library with comprehensive documentation.
                          </p>
                          <div className="flex justify-end pt-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Trophy className="h-3 w-3 text-amber-500" />
                              <span>1st Place</span>
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
