import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, GraduationCap, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { EmptyState, GhostButton, GlowButton, PageHeader, Panel, Tag, fieldClasses } from '@/components/ui-kit';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Reveal } from '@/components/experience/Reveal';
import { useAuth } from '@/hooks/useAuth';
import { api, db } from '@/lib/api/client';

interface ExperienceRow {
  id: string;
  company: string;
  position: string;
  employment?: string | null;
  location?: string | null;
  start_date: string;
  end_date?: string | null;
  description?: string | null;
  company_url?: string | null;
  technologies?: string[];
}

interface EducationRow {
  id: string;
  institution: string;
  degree: string;
  field?: string | null;
  location?: string | null;
  start_date: string;
  end_date?: string | null;
  description?: string | null;
}

const emptyExperience = {
  company: '',
  position: '',
  employment: 'Full-time',
  location: '',
  start_date: '',
  end_date: '',
  description: '',
  company_url: '',
  technologies: '',
};

const emptyEducation = {
  institution: '',
  degree: '',
  field: '',
  location: '',
  start_date: '',
  end_date: '',
  description: '',
};

export default function Experience() {
  const { user } = useAuth();
  const [experiences, setExperiences] = useState<ExperienceRow[]>([]);
  const [education, setEducation] = useState<EducationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [experienceOpen, setExperienceOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<ExperienceRow | null>(null);
  const [experienceForm, setExperienceForm] = useState({ ...emptyExperience });

  const [educationOpen, setEducationOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<EducationRow | null>(null);
  const [educationForm, setEducationForm] = useState({ ...emptyEducation });

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [experienceResult, educationResult] = await Promise.all([
      api.get<ExperienceRow[]>(`/api/db/experiences?f.user_id=eq.${user.id}&order=start_date.desc&limit=100`),
      api.get<EducationRow[]>(`/api/db/education?f.user_id=eq.${user.id}&order=start_date.desc&limit=100`),
    ]);
    setExperiences(Array.isArray(experienceResult.data) ? experienceResult.data : []);
    setEducation(Array.isArray(educationResult.data) ? educationResult.data : []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveExperience = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!experienceForm.company.trim() || !experienceForm.position.trim() || !experienceForm.start_date) {
      toast.error('Company, role and start date are required');
      return;
    }
    setSaving(true);
    const payload = {
      company: experienceForm.company.trim(),
      position: experienceForm.position.trim(),
      employment: experienceForm.employment || null,
      location: experienceForm.location.trim() || null,
      start_date: experienceForm.start_date,
      end_date: experienceForm.end_date || null,
      description: experienceForm.description.trim() || null,
      company_url: experienceForm.company_url.trim() || null,
      technologies: experienceForm.technologies
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      updated_at: new Date().toISOString(),
    };
    const { error } = editingExperience
      ? await db.from('experiences').update(payload).eq('id', editingExperience.id)
      : await db.from('experiences').insert({ ...payload, user_id: user!.id, position_order: 0 });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editingExperience ? 'Role updated' : 'Role added');
    setExperienceOpen(false);
    void load();
  };

  const saveEducation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!educationForm.institution.trim() || !educationForm.degree.trim() || !educationForm.start_date) {
      toast.error('Institution, qualification and start date are required');
      return;
    }
    setSaving(true);
    const payload = {
      institution: educationForm.institution.trim(),
      degree: educationForm.degree.trim(),
      field: educationForm.field.trim() || null,
      location: educationForm.location.trim() || null,
      start_date: educationForm.start_date,
      end_date: educationForm.end_date || null,
      description: educationForm.description.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = editingEducation
      ? await db.from('education').update(payload).eq('id', editingEducation.id)
      : await db.from('education').insert({ ...payload, user_id: user!.id, position_order: 0 });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editingEducation ? 'Education updated' : 'Education added');
    setEducationOpen(false);
    void load();
  };

  const removeExperience = async (row: ExperienceRow) => {
    const { error } = await db.from('experiences').delete().eq('id', row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setExperiences((current) => current.filter((item) => item.id !== row.id));
    toast.success('Role removed');
  };

  const removeEducation = async (row: EducationRow) => {
    const { error } = await db.from('education').delete().eq('id', row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEducation((current) => current.filter((item) => item.id !== row.id));
    toast.success('Education removed');
  };

  if (!user) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-6 py-24">
          <EmptyState
            icon={Briefcase}
            title="Sign in to build your timeline"
            description="Work history and education feed your portfolio, résumé and public profile."
            action={
              <Link to="/auth">
                <GlowButton>Sign in</GlowButton>
              </Link>
            }
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <PageHeader
          eyebrow="Track record"
          title={
            <>
              A timeline that <span className="text-gradient-warm">reads like momentum.</span>
            </>
          }
          description="Keep your roles, impact and education current — they appear on your portfolio and generate your résumé."
          actions={
            <>
              <GhostButton onClick={() => {
                setEditingEducation(null);
                setEducationForm({ ...emptyEducation });
                setEducationOpen(true);
              }}>
                <GraduationCap className="h-4 w-4" /> Add education
              </GhostButton>
              <GlowButton onClick={() => {
                setEditingExperience(null);
                setExperienceForm({ ...emptyExperience });
                setExperienceOpen(true);
              }}>
                <Plus className="h-4 w-4" /> Add experience
              </GlowButton>
            </>
          }
        />

        <Tabs defaultValue="experience">
          <TabsList className="mb-8 rounded-full border border-white/10 bg-white/[0.03] p-1">
            <TabsTrigger value="experience" className="rounded-full data-[state=active]:bg-white/[0.08]">
              Experience
            </TabsTrigger>
            <TabsTrigger value="education" className="rounded-full data-[state=active]:bg-white/[0.08]">
              Education
            </TabsTrigger>
          </TabsList>

          <TabsContent value="experience" className="space-y-5">
            {loading ? (
              <div className="h-32 animate-pulse rounded-3xl border border-white/[0.06] bg-white/[0.02]" />
            ) : experiences.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No roles yet"
                description="Add your current role first — recruiters scan for it."
                action={
                  <GlowButton onClick={() => setExperienceOpen(true)}>
                    <Plus className="h-4 w-4" /> Add experience
                  </GlowButton>
                }
              />
            ) : (
              experiences.map((row, index) => (
                <Reveal key={row.id} mode="rise" delay={index * 0.04}>
                  <Panel className="group grid gap-5 p-6 md:grid-cols-[190px_1fr_auto]">
                    <div>
                      <p className="mono text-xs text-primary">
                        {row.start_date?.slice(0, 7)} — {row.end_date?.slice(0, 7) ?? 'present'}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">{row.employment || 'Full-time'}</p>
                      {row.location && <p className="mt-1 text-xs text-muted-foreground">{row.location}</p>}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold tracking-tight">{row.position}</h3>
                      <p className="text-sm text-secondary">{row.company}</p>
                      {row.description && (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                          {row.description}
                        </p>
                      )}
                      {(row.technologies ?? []).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {row.technologies!.map((tech) => (
                            <Tag key={tech}>{tech}</Tag>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => {
                          setEditingExperience(row);
                          setExperienceForm({
                            company: row.company,
                            position: row.position,
                            employment: row.employment ?? 'Full-time',
                            location: row.location ?? '',
                            start_date: row.start_date?.slice(0, 10) ?? '',
                            end_date: row.end_date?.slice(0, 10) ?? '',
                            description: row.description ?? '',
                            company_url: row.company_url ?? '',
                            technologies: (row.technologies ?? []).join(', '),
                          });
                          setExperienceOpen(true);
                        }}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => void removeExperience(row)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </Panel>
                </Reveal>
              ))
            )}
          </TabsContent>

          <TabsContent value="education" className="space-y-5">
            {loading ? (
              <div className="h-32 animate-pulse rounded-3xl border border-white/[0.06] bg-white/[0.02]" />
            ) : education.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="No education added"
                description="Degrees, bootcamps and certifications all belong here."
                action={
                  <GlowButton onClick={() => setEducationOpen(true)}>
                    <Plus className="h-4 w-4" /> Add education
                  </GlowButton>
                }
              />
            ) : (
              education.map((row, index) => (
                <Reveal key={row.id} mode="rise" delay={index * 0.04}>
                  <Panel className="group grid gap-5 p-6 md:grid-cols-[190px_1fr_auto]">
                    <div>
                      <p className="mono text-xs text-primary">
                        {row.start_date?.slice(0, 4)} — {row.end_date?.slice(0, 4) ?? 'present'}
                      </p>
                      {row.location && <p className="mt-2 text-xs text-muted-foreground">{row.location}</p>}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold tracking-tight">{row.degree}</h3>
                      <p className="text-sm text-secondary">{row.institution}</p>
                      {row.field && <p className="mt-1 text-xs text-muted-foreground">{row.field}</p>}
                      {row.description && (
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{row.description}</p>
                      )}
                    </div>
                    <div className="flex items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => {
                          setEditingEducation(row);
                          setEducationForm({
                            institution: row.institution,
                            degree: row.degree,
                            field: row.field ?? '',
                            location: row.location ?? '',
                            start_date: row.start_date?.slice(0, 10) ?? '',
                            end_date: row.end_date?.slice(0, 10) ?? '',
                            description: row.description ?? '',
                          });
                          setEducationOpen(true);
                        }}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => void removeEducation(row)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </Panel>
                </Reveal>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* --------------------------------------------------------- dialogs -- */}
      <Dialog open={experienceOpen} onOpenChange={setExperienceOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-white/10 bg-[hsl(240_28%_6%)]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingExperience ? 'Edit role' : 'Add role'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Lead with impact — what changed because you were there?
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveExperience} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs text-muted-foreground">Company</span>
                <input
                  className={fieldClasses()}
                  value={experienceForm.company}
                  onChange={(event) => setExperienceForm({ ...experienceForm, company: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs text-muted-foreground">Role</span>
                <input
                  className={fieldClasses()}
                  value={experienceForm.position}
                  onChange={(event) => setExperienceForm({ ...experienceForm, position: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs text-muted-foreground">Employment</span>
                <select
                  className={fieldClasses()}
                  value={experienceForm.employment}
                  onChange={(event) => setExperienceForm({ ...experienceForm, employment: event.target.value })}
                >
                  {['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs text-muted-foreground">Location</span>
                <input
                  className={fieldClasses()}
                  placeholder="Remote · Lagos"
                  value={experienceForm.location}
                  onChange={(event) => setExperienceForm({ ...experienceForm, location: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs text-muted-foreground">Start date</span>
                <input
                  type="date"
                  className={fieldClasses()}
                  value={experienceForm.start_date}
                  onChange={(event) => setExperienceForm({ ...experienceForm, start_date: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs text-muted-foreground">End date (leave blank for current)</span>
                <input
                  type="date"
                  className={fieldClasses()}
                  value={experienceForm.end_date}
                  onChange={(event) => setExperienceForm({ ...experienceForm, end_date: event.target.value })}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-xs text-muted-foreground">Impact</span>
                <textarea
                  rows={4}
                  className={fieldClasses('h-auto py-3')}
                  value={experienceForm.description}
                  onChange={(event) => setExperienceForm({ ...experienceForm, description: event.target.value })}
                  placeholder="Cut checkout latency by 42% by replacing N+1 queries…"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs text-muted-foreground">Company URL</span>
                <input
                  className={fieldClasses()}
                  value={experienceForm.company_url}
                  onChange={(event) => setExperienceForm({ ...experienceForm, company_url: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs text-muted-foreground">Technologies</span>
                <input
                  className={fieldClasses()}
                  placeholder="react, node, postgres"
                  value={experienceForm.technologies}
                  onChange={(event) => setExperienceForm({ ...experienceForm, technologies: event.target.value })}
                />
              </label>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
              <GhostButton type="button" onClick={() => setExperienceOpen(false)}>
                Cancel
              </GhostButton>
              <GlowButton type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingExperience ? 'Save role' : 'Add role'}
              </GlowButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={educationOpen} onOpenChange={setEducationOpen}>
        <DialogContent className="max-w-2xl border-white/10 bg-[hsl(240_28%_6%)]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingEducation ? 'Edit education' : 'Add education'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Degrees, diplomas, bootcamps and certifications.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveEducation} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs text-muted-foreground">Institution</span>
                <input
                  className={fieldClasses()}
                  value={educationForm.institution}
                  onChange={(event) => setEducationForm({ ...educationForm, institution: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs text-muted-foreground">Qualification</span>
                <input
                  className={fieldClasses()}
                  placeholder="BSc Computer Science"
                  value={educationForm.degree}
                  onChange={(event) => setEducationForm({ ...educationForm, degree: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs text-muted-foreground">Field</span>
                <input
                  className={fieldClasses()}
                  value={educationForm.field}
                  onChange={(event) => setEducationForm({ ...educationForm, field: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs text-muted-foreground">Location</span>
                <input
                  className={fieldClasses()}
                  value={educationForm.location}
                  onChange={(event) => setEducationForm({ ...educationForm, location: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs text-muted-foreground">Start date</span>
                <input
                  type="date"
                  className={fieldClasses()}
                  value={educationForm.start_date}
                  onChange={(event) => setEducationForm({ ...educationForm, start_date: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs text-muted-foreground">End date</span>
                <input
                  type="date"
                  className={fieldClasses()}
                  value={educationForm.end_date}
                  onChange={(event) => setEducationForm({ ...educationForm, end_date: event.target.value })}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-xs text-muted-foreground">Notes</span>
                <textarea
                  rows={3}
                  className={fieldClasses('h-auto py-3')}
                  value={educationForm.description}
                  onChange={(event) => setEducationForm({ ...educationForm, description: event.target.value })}
                />
              </label>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
              <GhostButton type="button" onClick={() => setEducationOpen(false)}>
                Cancel
              </GhostButton>
              <GlowButton type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingEducation ? 'Save education' : 'Add education'}
              </GlowButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
