
import { useState, useEffect, useRef } from "react";
import { skills } from "@/data/mock-data";

export default function Skills() {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Group skills by category
  const skillCategories = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  // Observe intersection for animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const formatCategoryName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  return (
    <section className="w-full py-16 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <h2 className="text-3xl font-bold mb-2">Skills & Expertise</h2>
        <p className="text-muted-foreground max-w-2xl mb-12">
          A comprehensive overview of my technical abilities and proficiency levels.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {Object.entries(skillCategories).map(([category, categorySkills]) => (
            <div key={category} className="space-y-6">
              <h3 className="text-xl font-semibold">{formatCategoryName(category)}</h3>
              <div className="space-y-4">
                {categorySkills.map((skill) => (
                  <div key={skill.id}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{skill.name}</span>
                      <span className="text-muted-foreground">{skill.proficiency}%</span>
                    </div>
                    <div className="skill-bar">
                      <div 
                        className="skill-progress" 
                        style={{ 
                          width: isIntersecting ? `${skill.proficiency}%` : '0%'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
