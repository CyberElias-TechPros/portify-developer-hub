
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skill } from "@/types/portfolio";
import SkillBar from "@/components/SkillBar";
import { Skeleton } from "@/components/ui/skeleton";
import AnimatedWrapper from "@/components/AnimatedWrapper";

interface SkillsProps {
  userId?: string;
}

export default function Skills({ userId }: SkillsProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  
  useEffect(() => {
    const getSkills = async () => {
      try {
        setLoading(true);
        let query = supabase.from("skills").select("*");
        
        if (userId) {
          query = query.eq('user_id', userId);
        }
        
        const { data, error } = await query.order("proficiency", { ascending: false });
        
        if (error) {
          console.error("Error fetching skills:", error);
          return;
        }
        
        // Map the data to the Skill type and extract unique categories
        const formattedSkills: Skill[] = data.map((skill) => ({
          id: skill.id,
          name: skill.name,
          category: skill.category,
          proficiency: skill.proficiency,
          iconUrl: skill.icon_url,
          yearAcquired: skill.year_acquired,
          endorsed: skill.endorsed,
        }));
        
        const uniqueCategories = [...new Set(formattedSkills.map(skill => skill.category))];
        
        setSkills(formattedSkills);
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Error fetching skills:", error);
      } finally {
        setLoading(false);
      }
    };

    getSkills();
  }, [userId]);

  return (
    <section className="w-full py-16">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Skills</h2>
            <p className="text-muted-foreground mt-2">
              Technical expertise and proficiencies
            </p>
          </div>
          <Button asChild variant="ghost" className="hidden md:flex mt-4 md:mt-0">
            <Link to="/skills" className="group flex items-center">
              View all skills
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        <AnimatedWrapper>
          {loading ? (
            <div className="space-y-8">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-7 w-32 mb-4" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="space-y-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-5 w-24" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-2.5 w-full rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : skills.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No skills available.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {categories.map(category => {
                const categorySkills = skills.filter(skill => skill.category === category);
                return (
                  <div key={category} className="space-y-4">
                    <h3 className="text-xl font-semibold capitalize mb-6">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      {categorySkills.slice(0, 8).map((skill) => (
                        <div key={skill.id}>
                          <SkillBar
                            name={skill.name}
                            proficiency={skill.proficiency}
                            iconUrl={skill.iconUrl}
                            endorsed={skill.endorsed}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AnimatedWrapper>
        
        <div className="flex justify-center mt-12 md:hidden">
          <Button asChild>
            <Link to="/skills" className="group flex items-center">
              View all skills
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
