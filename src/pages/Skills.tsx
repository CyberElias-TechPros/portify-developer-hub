import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import SkillBar from "@/components/SkillBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Skill } from "@/types/portfolio";
import { Loader2 } from "lucide-react";

type DbSkill = { id: string; user_id: string | null; name: string; category: string; proficiency: number; icon_url: string | null; year_acquired: number | null; endorsed: number | null; is_public: boolean | null; created_at: string | null; updated_at: string | null };
function mapSkill(skill: DbSkill): Skill { return { id: skill.id, user_id: skill.user_id || undefined, name: skill.name, category: skill.category as Skill["category"], proficiency: Math.max(0, Math.min(100, skill.proficiency)), iconUrl: skill.icon_url || undefined, yearAcquired: skill.year_acquired || undefined, endorsed: skill.endorsed || undefined, created_at: skill.created_at || undefined, updated_at: skill.updated_at || undefined }; }

const Skills = () => {
  const { toast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const fetchSkills = useCallback(async () => { setLoading(true); setError(false); const result = await supabase.from("skills").select("*").order("proficiency", { ascending: false }); if (result.error) { setError(true); toast({ title: "Unable to load skills", description: result.error.message, variant: "destructive" }); } else setSkills((result.data ?? []).map((skill) => mapSkill(skill as DbSkill))); setLoading(false); }, [toast]);
  useEffect(() => { void fetchSkills(); }, [fetchSkills, retryKey]);
  const categories = useMemo(() => ({ languages: skills.filter((skill) => skill.category === "languages"), frameworks: skills.filter((skill) => skill.category === "frameworks"), tools: skills.filter((skill) => skill.category === "tools"), other: skills.filter((skill) => !["languages", "frameworks", "tools"].includes(skill.category)) }), [skills]);
  const group = (items: Skill[]) => items.length ? <div className="space-y-1">{items.map((skill, index) => <SkillBar key={skill.id} name={skill.name} percentage={skill.proficiency} delay={index * 80} />)}</div> : <p className="text-sm text-muted-foreground">No skills in this category yet.</p>;
  if (loading) return <Layout><div className="min-h-[55vh] flex items-center justify-center" role="status"><Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading skills</span></div></Layout>;
  return <Layout><div className="container py-12 px-4"><div className="mx-auto max-w-5xl"><div className="text-center mb-10"><h1 className="text-4xl font-bold mb-4">Skills & Expertise</h1><p className="text-lg text-muted-foreground max-w-2xl mx-auto">A current overview of the technologies and capabilities in this portfolio.</p></div>{error ? <Card><CardContent className="py-12 text-center"><h2 className="font-semibold text-xl">Skills are temporarily unavailable</h2><button className="mt-4 text-primary underline" onClick={() => setRetryKey((key) => key + 1)}>Try again</button></CardContent></Card> : skills.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No skills have been added yet.</CardContent></Card> : <Tabs defaultValue="all"><TabsList className="mx-auto mb-8 grid w-full max-w-xl grid-cols-5"><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="languages">Languages</TabsTrigger><TabsTrigger value="frameworks">Frameworks</TabsTrigger><TabsTrigger value="tools">Tools</TabsTrigger><TabsTrigger value="other">Other</TabsTrigger></TabsList><TabsContent value="all" className="grid gap-6 md:grid-cols-2">{([ ["Programming languages", "Core languages", categories.languages], ["Frameworks & libraries", "Technologies used to build products", categories.frameworks], ["Tools & platforms", "Development and deployment tools", categories.tools], ["Other skills", "Additional capabilities", categories.other] ] as [string, string, Skill[]][]).map(([title, description, items]) => <Card key={title}><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent>{group(items)}</CardContent></Card>)}</TabsContent>{([ ["languages", "Programming languages", categories.languages], ["frameworks", "Frameworks & libraries", categories.frameworks], ["tools", "Tools & platforms", categories.tools], ["other", "Other skills", categories.other] ] as [string, string, Skill[]][]).map(([value, title, items]) => <TabsContent key={value} value={value}><Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{group(items)}</CardContent></Card></TabsContent>)}</Tabs>}</div></div></Layout>;
};
export default Skills;
