
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarIcon, GraduationCap, Briefcase } from "lucide-react";
import { experiences } from "@/data/mock-data";

const Experience = () => {
  // Format date function
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM yyyy");
  };

  // Get unique companies for filtering
  const companies = Array.from(
    new Set(experiences.map((exp) => exp.company))
  );

  return (
    <Layout>
      <div className="container py-12 px-4 md:px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Professional Experience</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A chronological overview of my professional journey, highlighting key roles and accomplishments.
            </p>
          </div>

          <Tabs defaultValue="all" className="space-y-8">
            <div className="flex justify-center">
              <TabsList>
                <TabsTrigger value="all">All Experience</TabsTrigger>
                <TabsTrigger value="work">Work History</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Work Experience
                </h2>
              </div>

              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {experiences.map((experience, index) => (
                  <div key={experience.id} className="relative flex items-start md:justify-center">
                    <div className="hidden md:block absolute left-1/2 -translate-x-px h-full w-0.5 bg-border" />
                    
                    {/* Timeline Circle */}
                    <div className="absolute left-0 md:left-1/2 mt-1.5 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-primary bg-background"></div>
                    
                    {/* Content */}
                    <div className="ml-8 md:ml-0 md:w-5/12 md:mr-auto md:pr-8 pb-8">
                      <Card className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-xl">{experience.position}</CardTitle>
                            {experience.current && (
                              <Badge variant="default" className="ml-2">Current</Badge>
                            )}
                          </div>
                          <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                            <span className="font-medium">{experience.company}</span>
                            <span className="hidden sm:inline text-xs">•</span>
                            <span>{experience.location}</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <CalendarIcon className="mr-1 h-4 w-4" />
                            <span>
                              {formatDate(experience.startDate)} — {experience.endDate ? formatDate(experience.endDate) : 'Present'}
                            </span>
                          </div>
                          
                          <p className="text-sm">{experience.description}</p>
                          
                          {experience.technologies && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {experience.technologies.map((tech) => (
                                <Badge key={tech} variant="secondary">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Right Side (Date for desktop) */}
                    <div className="hidden md:block md:w-5/12 md:pl-8 absolute right-0 top-0 text-sm">
                      {index % 2 === 1 && (
                        <div className="font-medium text-muted-foreground pt-1.5">
                          {formatDate(experience.startDate)} — {experience.endDate ? formatDate(experience.endDate) : 'Present'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-8">
                <h2 className="text-2xl font-bold flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Education
                </h2>
              </div>

              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                <div className="relative flex items-start md:justify-center">
                  <div className="absolute left-0 md:left-1/2 mt-1.5 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-primary bg-background"></div>
                  
                  <div className="ml-8 md:ml-0 md:w-5/12 md:mr-auto md:pr-8 pb-8">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl">Master of Computer Science</CardTitle>
                        <CardDescription>Stanford University</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <CalendarIcon className="mr-1 h-4 w-4" />
                          <span>2017 — 2019</span>
                        </div>
                        
                        <p className="text-sm">
                          Specialized in Artificial Intelligence and Machine Learning. Thesis on "Neural Networks for Natural Language Processing."
                        </p>
                        
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Badge variant="secondary">Artificial Intelligence</Badge>
                          <Badge variant="secondary">Machine Learning</Badge>
                          <Badge variant="secondary">Data Science</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <div className="relative flex items-start md:justify-center">
                  <div className="absolute left-0 md:left-1/2 mt-1.5 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-primary bg-background"></div>
                  
                  <div className="ml-8 md:ml-0 md:w-5/12 md:ml-auto md:pl-8">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl">Bachelor of Science in Computer Science</CardTitle>
                        <CardDescription>MIT</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <CalendarIcon className="mr-1 h-4 w-4" />
                          <span>2013 — 2017</span>
                        </div>
                        
                        <p className="text-sm">
                          Graduated with honors. Focused on software engineering and algorithms. Participated in multiple hackathons and coding competitions.
                        </p>
                        
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Badge variant="secondary">Software Engineering</Badge>
                          <Badge variant="secondary">Algorithms</Badge>
                          <Badge variant="secondary">Data Structures</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="work">
              <div className="space-y-4">
                <div className="flex gap-3 flex-wrap">
                  {companies.map((company) => (
                    <Badge key={company} variant="outline">
                      {company}
                    </Badge>
                  ))}
                </div>
                
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {experiences.map((experience, index) => (
                    <div key={experience.id} className="relative flex items-start md:justify-center">
                      <div className="hidden md:block absolute left-1/2 -translate-x-px h-full w-0.5 bg-border" />
                      
                      {/* Timeline Circle */}
                      <div className="absolute left-0 md:left-1/2 mt-1.5 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-primary bg-background"></div>
                      
                      {/* Content */}
                      <div className={`ml-8 md:ml-0 md:w-5/12 ${
                        index % 2 === 0 ? "md:mr-auto md:pr-8" : "md:ml-auto md:pl-8"
                      } pb-8`}>
                        <Card>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-xl">{experience.position}</CardTitle>
                              {experience.current && (
                                <Badge variant="default" className="ml-2">Current</Badge>
                              )}
                            </div>
                            <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                              <span className="font-medium">{experience.company}</span>
                              <span className="hidden sm:inline text-xs">•</span>
                              <span>{experience.location}</span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <CalendarIcon className="mr-1 h-4 w-4" />
                              <span>
                                {formatDate(experience.startDate)} — {experience.endDate ? formatDate(experience.endDate) : 'Present'}
                              </span>
                            </div>
                            
                            <p className="text-sm">{experience.description}</p>
                            
                            {experience.technologies && (
                              <div className="flex flex-wrap gap-2 pt-2">
                                {experience.technologies.map((tech) => (
                                  <Badge key={tech} variant="secondary">
                                    {tech}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="education">
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                <div className="relative flex items-start md:justify-center">
                  <div className="absolute left-0 md:left-1/2 mt-1.5 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-primary bg-background"></div>
                  
                  <div className="ml-8 md:ml-0 md:w-5/12 md:mr-auto md:pr-8">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl">Master of Computer Science</CardTitle>
                        <CardDescription>Stanford University</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <CalendarIcon className="mr-1 h-4 w-4" />
                          <span>2017 — 2019</span>
                        </div>
                        
                        <p className="text-sm">
                          Specialized in Artificial Intelligence and Machine Learning. Thesis on "Neural Networks for Natural Language Processing."
                        </p>
                        
                        <div className="pt-4 space-y-2">
                          <p className="text-sm font-medium">Notable Courses:</p>
                          <ul className="text-sm list-disc pl-5 space-y-1">
                            <li>Advanced Machine Learning</li>
                            <li>Deep Neural Networks</li>
                            <li>Computer Vision</li>
                            <li>Natural Language Processing</li>
                            <li>Reinforcement Learning</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <div className="relative flex items-start md:justify-center">
                  <div className="absolute left-0 md:left-1/2 mt-1.5 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-primary bg-background"></div>
                  
                  <div className="ml-8 md:ml-0 md:w-5/12 md:ml-auto md:pl-8">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl">Bachelor of Science in Computer Science</CardTitle>
                        <CardDescription>MIT</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <CalendarIcon className="mr-1 h-4 w-4" />
                          <span>2013 — 2017</span>
                        </div>
                        
                        <p className="text-sm">
                          Graduated with honors. Focused on software engineering and algorithms. Participated in multiple hackathons and coding competitions.
                        </p>
                        
                        <div className="pt-4 space-y-2">
                          <p className="text-sm font-medium">Notable Courses:</p>
                          <ul className="text-sm list-disc pl-5 space-y-1">
                            <li>Algorithms and Data Structures</li>
                            <li>Computer Systems Engineering</li>
                            <li>Programming Languages</li>
                            <li>Database Systems</li>
                            <li>Web Development</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Looking for my complete resume?</h3>
                  <p className="text-muted-foreground">
                    Download my resume to get a comprehensive overview of my professional experience and skills.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Badge variant="outline" className="py-2 px-4 text-sm">PDF</Badge>
                  <Badge variant="outline" className="py-2 px-4 text-sm">Word</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Experience;
