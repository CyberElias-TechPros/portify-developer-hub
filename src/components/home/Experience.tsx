
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, MapPin, Building } from "lucide-react";
import { useUserExperiences } from "@/hooks/useUserContent";

interface ExperienceProps {
  userId?: string;
}

export default function Experience({ userId }: ExperienceProps) {
  const { experiences, loading, error } = useUserExperiences(userId || null);

  if (loading) {
    return (
      <section className="w-full py-16 px-6 md:px-12 lg:px-24 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Professional Experience</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Loading experience...
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Professional Experience</h2>
          <p className="text-lg text-muted-foreground">Experience is temporarily unavailable.</p>
        </div>
      </section>
    );
  }

  if (!experiences || experiences.length === 0) {
    return (
      <section className="w-full py-16 px-6 md:px-12 lg:px-24 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Professional Experience</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No experience listed at the moment.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  return (
    <section id="experience" className="w-full py-16 px-6 md:px-12 lg:px-24 bg-muted/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Professional Experience</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            My professional journey and the roles that have shaped my career in technology.
          </p>
        </div>

        <div className="space-y-8">
          {experiences.map((exp, index) => (
            <Card key={exp.id} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              {index === 0 && !exp.endDate && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-green-500 hover:bg-green-600">Current</Badge>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    {exp.logoUrl && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border bg-white flex-shrink-0">
                        <img
                          src={exp.logoUrl}
                          alt={`${exp.company} logo`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {exp.position}
                      </CardTitle>
                      <div className="flex items-center space-x-2 text-muted-foreground mt-1">
                        <Building className="h-4 w-4" />
                        <span className="font-medium">{exp.company}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <CalendarDays className="h-4 w-4" />
                          <span>
                            {formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : 'Present'}
                          </span>
                        </div>
                        {exp.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{exp.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <p className="text-muted-foreground leading-relaxed">
                  {exp.description}
                </p>

                {exp.technologies && exp.technologies.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Technologies Used</h4>
                    <div className="flex flex-wrap gap-2">
                      {exp.technologies.map((tech) => (
                        <Badge key={tech} variant="secondary">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {exp.projects && exp.projects.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Key Projects</h4>
                    <ul className="space-y-1">
                      {exp.projects.map((project, idx) => (
                        <li key={idx} className="text-muted-foreground flex items-start">
                          <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          {project}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
