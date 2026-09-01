
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUserSkills } from "@/hooks/useUserContent";

interface SkillsProps {
  userId?: string;
}

export default function Skills({ userId }: SkillsProps) {
  const { skills, loading, error } = useUserSkills(userId || null);

  if (loading) {
    return (
      <section className="w-full py-16 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Skills & Expertise</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Loading skills...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="skills" className="w-full py-16 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Skills & Expertise</h2>
          <p className="text-lg text-muted-foreground">Skills are temporarily unavailable.</p>
        </div>
      </section>
    );
  }

  if (!skills || skills.length === 0) {
    return (
      <section className="w-full py-16 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Skills & Expertise</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No skills listed at the moment.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  const categoryTitles: Record<string, string> = {
    languages: "Programming Languages",
    frameworks: "Frameworks & Libraries",
    tools: "Tools & Technologies",
    design: "Design & UI/UX",
    databases: "Databases",
    devops: "DevOps & Cloud"
  };

  return (
    <section id="skills" className="w-full py-16 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Skills & Expertise</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Technologies and tools I've mastered throughout my development journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Object.entries(groupedSkills).map(([category, categorySkills]) => (
            <Card key={category} className="h-fit">
              <CardHeader>
                <CardTitle className="capitalize">
                  {categoryTitles[category] || category}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {categorySkills.map((skill) => (
                  <div key={skill.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{skill.name}</span>
                        {skill.endorsed && skill.endorsed > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            +{skill.endorsed}
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {skill.proficiency}%
                      </span>
                    </div>
                    <Progress value={skill.proficiency} className="h-2" />
                    {skill.yearAcquired && (
                      <div className="text-xs text-muted-foreground">
                        Since {skill.yearAcquired}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
