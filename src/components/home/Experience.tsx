
import { Calendar, MapPin } from "lucide-react";
import { experiences } from "@/data/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Experience() {
  return (
    <section className="w-full py-16 px-6 md:px-12 lg:px-24 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-2">Work Experience</h2>
        <p className="text-muted-foreground max-w-2xl mb-12">
          My professional journey and previous roles.
        </p>

        <div className="relative pl-0 md:pl-8">
          <div className="timeline-line hidden md:block" />
          
          <div className="space-y-8">
            {experiences.map((experience, index) => (
              <div key={experience.id} className="relative animate-on-scroll">
                <div className="hidden md:flex absolute -left-8 mt-1.5 h-4 w-4 rounded-full bg-primary" />
                
                <Card className="md:ml-5">
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="mr-auto">{experience.position}</CardTitle>
                      <CardDescription className="flex items-center text-sm">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(experience.startDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short'
                        })} — {
                          experience.endDate 
                            ? new Date(experience.endDate).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short'
                              }) 
                            : 'Present'
                        }
                      </CardDescription>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 mr-2 bg-accent flex items-center justify-center rounded-md">
                        {experience.logoUrl ? (
                          <img 
                            src={experience.logoUrl} 
                            alt={experience.company} 
                            className="w-6 h-6 object-contain"
                          />
                        ) : (
                          <span className="text-xs font-bold">{experience.company.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <CardDescription className="text-base font-medium">
                          {experience.company}
                        </CardDescription>
                        <CardDescription className="flex items-center text-xs">
                          <MapPin className="mr-1 h-3 w-3" />
                          {experience.location}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{experience.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
