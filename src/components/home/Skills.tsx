
import { useState } from 'react';
import { skills } from "@/data/mock-data";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SkillBar from "@/components/SkillBar";

export default function Skills() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const categories = [
    { id: 'all', name: 'All Skills' },
    { id: 'languages', name: 'Languages' },
    { id: 'frameworks', name: 'Frameworks' },
    { id: 'tools', name: 'Tools & Databases' },
  ];

  const filteredSkills = selectedCategory === 'all' 
    ? skills
    : skills.filter(skill => skill.category === selectedCategory);
    
  const skillsByProficiency = [...filteredSkills].sort((a, b) => b.proficiency - a.proficiency);

  return (
    <section id="skills" className="py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-on-scroll">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Skills & Expertise</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            I specialize in building modern web applications with these technologies and tools.
          </p>
        </div>

        <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-12">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {skillsByProficiency.map((skill, index) => (
                  <motion.div 
                    key={skill.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        {skill.iconUrl && (
                          <img 
                            src={skill.iconUrl} 
                            alt={skill.name} 
                            className="w-5 h-5 mr-2"
                          />
                        )}
                        <span className="font-medium">{skill.name}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-muted-foreground mr-2">
                          {skill.yearAcquired && `Since ${skill.yearAcquired}`}
                        </span>
                        {skill.endorsed && (
                          <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                            {skill.endorsed}+ endorsements
                          </span>
                        )}
                      </div>
                    </div>
                    <SkillBar percentage={skill.proficiency} />
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
