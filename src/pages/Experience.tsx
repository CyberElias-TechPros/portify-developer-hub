
import { useState } from "react";
import Layout from "@/components/Layout";
import { Calendar, MapPin, Briefcase, Tag, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Experience } from "@/types/portfolio";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function ExperiencePage() {
  // Fetch experiences data
  const { data: experiences, isLoading } = useQuery({
    queryKey: ["experiences"],
    queryFn: async () => {
      // In a real app, this would fetch from the Supabase database
      // For now, we'll use mock data
      return [
        {
          id: "1",
          company: "Tech Innovators",
          position: "Senior Frontend Developer",
          startDate: "2021-06-01",
          endDate: null,
          current: true,
          description: "Lead developer for enterprise web applications using React, TypeScript, and GraphQL. Implemented CI/CD pipelines and improved performance by 35%.",
          logoUrl: "https://source.unsplash.com/random/100x100?tech",
          location: "San Francisco, CA",
          technologies: ["React", "TypeScript", "GraphQL", "Tailwind CSS", "Jest"],
          projects: ["Company Dashboard", "Customer Portal"]
        },
        {
          id: "2",
          company: "Digital Solutions Inc",
          position: "Frontend Developer",
          startDate: "2019-03-15",
          endDate: "2021-05-30",
          current: false,
          description: "Developed responsive web applications for clients in financial sector. Collaborated with UX designers to implement pixel-perfect interfaces.",
          logoUrl: "https://source.unsplash.com/random/100x100?digital",
          location: "Boston, MA",
          technologies: ["React", "JavaScript", "SASS", "Redux", "REST APIs"],
          projects: ["Banking Portal", "Investment Dashboard"]
        },
        {
          id: "3",
          company: "Creative Web Agency",
          position: "Junior Developer",
          startDate: "2017-09-01",
          endDate: "2019-02-28",
          current: false,
          description: "Built websites and web applications for various clients using modern web technologies and frameworks.",
          logoUrl: "https://source.unsplash.com/random/100x100?creative",
          location: "Portland, OR",
          technologies: ["JavaScript", "HTML", "CSS", "jQuery", "Bootstrap"],
          projects: ["E-commerce Site", "Company Website"]
        }
      ] as Experience[];
    }
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="w-full py-16 px-6 md:px-12 lg:px-24 animate-pulse">
          <h1 className="text-3xl font-bold mb-8 bg-muted h-10 w-1/3 rounded"></h1>
          <div className="space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-muted h-64 rounded-lg"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full py-16 px-6 md:px-12 lg:px-24">
        <h1 className="text-3xl font-bold mb-2">Professional Experience</h1>
        <p className="text-muted-foreground mb-8">My career journey and professional growth</p>

        <div className="relative mb-16">
          {/* Timeline */}
          <div className="absolute left-0 md:left-[50%] h-full w-0.5 bg-border"></div>

          {/* Experience Items */}
          <div className="space-y-12">
            {experiences?.map((experience, index) => (
              <div key={experience.id} className={`relative ${index % 2 === 0 ? 'md:pr-[50%]' : 'md:pl-[50%] md:ml-auto'}`}>
                {/* Timeline Dot */}
                <div className="absolute left-[-8px] md:left-[50%] md:ml-[-8px] top-0 w-4 h-4 rounded-full bg-primary"></div>

                {/* Card */}
                <Card className={`shadow-md ml-6 md:ml-0 ${index % 2 === 0 ? 'md:mr-6' : 'md:ml-6'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Logo */}
                      <div className="hidden md:block w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
                        {experience.logoUrl ? (
                          <img src={experience.logoUrl} alt={experience.company} className="w-full h-full object-cover" />
                        ) : (
                          <div className="bg-secondary w-full h-full flex items-center justify-center">
                            <Briefcase className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <h2 className="text-xl font-semibold">{experience.position}</h2>
                          {experience.current && (
                            <Badge variant="secondary" className="self-start">Current</Badge>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-medium text-primary">{experience.company}</h3>
                        
                        <div className="flex flex-wrap gap-3 my-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {formatDate(experience.startDate)} - {experience.endDate ? formatDate(experience.endDate) : 'Present'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{experience.location}</span>
                          </div>
                        </div>
                        
                        <p className="my-3">{experience.description}</p>
                        
                        {/* Technologies */}
                        {experience.technologies && experience.technologies.length > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Tag className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Technologies</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {experience.technologies.map(tech => (
                                <Badge key={tech} variant="outline">{tech}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Associated Projects */}
                        {experience.projects && experience.projects.length > 0 && (
                          <Collapsible 
                            className="mt-4" 
                            open={expandedId === experience.id}
                            onOpenChange={() => toggleExpand(experience.id)}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Associated Projects</span>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  {expandedId === experience.id ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent className="pt-2">
                              <ul className="space-y-2">
                                {experience.projects.map(project => (
                                  <li key={project} className="flex items-center gap-2">
                                    <ExternalLink className="w-4 h-4 text-primary" />
                                    <span>{project}</span>
                                  </li>
                                ))}
                              </ul>
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                        
                        {/* Testimonials would go here */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Skills Development Timeline Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Skills Development Timeline</h2>
          <p className="text-muted-foreground mb-8">How my technical skills have evolved throughout my career</p>
          
          <div className="relative pb-12">
            <div className="absolute left-0 w-full h-0.5 bg-border top-4"></div>
            <div className="flex justify-between relative">
              {['2017', '2018', '2019', '2020', '2021', '2022', '2023'].map((year) => (
                <div key={year} className="flex flex-col items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mb-2"></div>
                  <span className="text-sm">{year}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-8 space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold">2017 - Basic Web Development</h3>
                  <p className="text-sm text-muted-foreground">HTML, CSS, JavaScript, jQuery</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold">2019 - Frontend Frameworks</h3>
                  <p className="text-sm text-muted-foreground">React, Redux, SASS</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold">2021 - Advanced Frontend</h3>
                  <p className="text-sm text-muted-foreground">TypeScript, GraphQL, Testing</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold">2023 - Full Stack Development</h3>
                  <p className="text-sm text-muted-foreground">Node.js, SQL, AWS</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
