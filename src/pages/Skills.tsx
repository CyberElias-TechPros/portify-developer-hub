import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Github,
  Layers,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import {
  EmptyState,
  GhostButton,
  GlowButton,
  PageHeader,
  Panel,
  SectionLabel,
  Tag,
  fieldClasses,
} from '@/components/ui-kit';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RevealGroup, RevealItem } from '@/components/experience/Reveal';
import { useAuth } from '@/hooks/useAuth';
import { api, db } from '@/lib/api/client';

interface SkillRow {
  id: string;
  name: string;
  category?: string | null;
  proficiency: number;
  endorsed?: number;
  year_acquired?: number | null;
  description?: string | null;
}

const CATEGORY_SUGGESTIONS = [
  'Language',
  'Framework',
  'Tool',
  'Database',
  'Cloud',
  'Design',
  'Soft skill',
];

export default function Skills() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SkillRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'Language',
    proficiency: 75,
    year_acquired: new Date().getFullYear(),
    description: '',
  });

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await api.get<SkillRow[]>(
      `/api/db/skills?f.user_id=eq.${user.id}&order=proficiency.desc&limit=200`
    );
    setSkills(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, SkillRow[]>();
    skills.forEach((skill) => {
      const key = skill.category || 'Other';
      map.set(key, [...(map.get(key) ?? []), skill]);
    });
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [skills]);

  const openEditor = (skill?: SkillRow) => {
    setEditing(skill ?? null);
    setForm(
      skill
        ? {
            name: skill.name,
            category: skill.category || 'Language',
            proficiency: skill.proficiency ?? 75,
            year_acquired: skill.year_acquired ?? new Date().getFullYear(),
            description: skill.description ?? '',
          }
        : {
            name: '',
            category: 'Language',
            proficiency: 75,
            year_acquired: new Date().getFullYear(),
            description: '',
          }
    );
    setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error('Give the skill a name');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      category: form.category,
      proficiency: form.proficiency,
      year_acquired: form.year_acquired,
      description: form.description.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = editing
      ? await db.from('skills').update(payload).eq('id', editing.id)
      : await db.from('skills').insert({ ...payload, user_id: user!.id });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? 'Skill updated' : 'Skill added');
    setOpen(false);
    void load();
  };

  const remove = async (skill: SkillRow) => {
    const { error } = await db.from('skills').delete().eq('id', skill.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSkills((current) => current.filter((item) => item.id !== skill.id));
    toast.success('Skill removed');
  };

  const nudgeProficiency = async (skill: SkillRow, delta: number) => {
    const next = Math.min(100, Math.max(5, (skill.proficiency ?? 50) + delta));
    setSkills((current) =>
      current.map((item) => (item.id === skill.id ? { ...item, proficiency: next } : item))
    );
    const { error } = await db.from('skills').update({ proficiency: next }).eq('id', skill.id);
    if (error) toast.error(error.message);
  };

  const importLanguages = async () => {
    setImporting(true);
    const { data, error } = await api.get<{ languages: any[] }>(
      `/api/integrations/github/languages/${encodeURIComponent(
        (user?.user_metadata?.github_username as string) || (user?.user_metadata?.username as string) || ''
      )}`
    );
    if (error) {
      setImporting(false);
      toast.error(error.message || 'Could not reach GitHub — add your username in the importer first');
      return;
    }
    const languages = data?.languages ?? [];
    if (!languages.length) {
      setImporting(false);
      toast.info('No language data found for that GitHub account');
      return;
    }
    const existing = new Set(skills.map((skill) => skill.name.toLowerCase()));
    const rows = languages
      .filter((language) => !existing.has(String(language.name).toLowerCase()))
      .slice(0, 12)
      .map((language) => ({
        user_id: user!.id,
        name: language.name,
        category: 'Language',
        proficiency: Math.min(95, Math.max(45, Math.round(language.percent ?? 60))),
        year_acquired: new Date().getFullYear(),
        description: `${language.count ?? 0} repositories on GitHub`,
      }));

    if (!rows.length) {
      setImporting(false);
      toast.info('Every language is already on your profile');
      return;
    }
    const { error: insertError } = await db.from('skills').insert(rows);
    setImporting(false);
    if (insertError) {
      toast.error(insertError.message);
      return;
    }
    toast.success(`Imported ${rows.length} skills from GitHub`);
    void load();
  };

  if (!user) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-6 py-24">
          <EmptyState
            icon={Layers}
            title="Sign in to manage skills"
            description="Document what you actually use — and let collaborators endorse it."
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

  const totalEndorsements = skills.reduce((sum, skill) => sum + (skill.endorsed ?? 0), 0);
  const average = skills.length
    ? Math.round(skills.reduce((sum, skill) => sum + (skill.proficiency ?? 0), 0) / skills.length)
    : 0;

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 pb-24">
        <PageHeader
          eyebrow="Capabilities"
          title={
            <>
              A skill set, <span className="text-gradient">not a buzzword list.</span>
            </>
          }
          description="Set honest proficiency levels. Visitors see them rendered as animated meters, and peers can endorse the ones they have seen you use."
          actions={
            <>
              <GhostButton onClick={importLanguages} disabled={importing}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
                Import languages
              </GhostButton>
              <GlowButton onClick={() => openEditor()}>
                <Plus className="h-4 w-4" /> Add skill
              </GlowButton>
            </>
          }
        />

        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Skills documented', value: skills.length },
            { label: 'Average proficiency', value: `${average}%` },
            { label: 'Endorsements received', value: totalEndorsements },
          ].map((tile, index) => (
            <Panel key={tile.label} className="p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{tile.label}</p>
              <p className="mt-2 font-display text-2xl font-semibold">{tile.value}</p>
            </Panel>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-3xl border border-white/[0.06] bg-white/[0.02]" />
            ))}
          </div>
        ) : skills.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No skills yet"
            description="Import the languages from your GitHub profile, or add them one at a time with real proficiency levels."
            action={
              <GlowButton onClick={() => openEditor()}>
                <Plus className="h-4 w-4" /> Add your first skill
              </GlowButton>
            }
          />
        ) : (
          <div className="space-y-10">
            {grouped.map(([category, items]) => (
              <div key={category}>
                <SectionLabel>{category}</SectionLabel>
                <div className="grid gap-4 md:grid-cols-2">
                  {items.map((skill) => (
                    <RevealItem key={skill.id} className="h-full">
                      <Panel className="group h-full p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium">{skill.name}</p>
                            {skill.description && (
                              <p className="mt-1 text-xs text-muted-foreground">{skill.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => openEditor(skill)}
                              className="rounded-lg px-2 py-1 text-[11px] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => void remove(skill)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-3">
                          <button
                            onClick={() => void nudgeProficiency(skill, -5)}
                            className="mono h-6 w-6 rounded-md border border-white/10 text-xs text-muted-foreground hover:text-foreground"
                          >
                            −
                          </button>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--violet))] to-[hsl(var(--cyan))] transition-[width] duration-500"
                              style={{ width: `${skill.proficiency ?? 0}%` }}
                            />
                          </div>
                          <button
                            onClick={() => void nudgeProficiency(skill, 5)}
                            className="mono h-6 w-6 rounded-md border border-white/10 text-xs text-muted-foreground hover:text-foreground"
                          >
                            +
                          </button>
                          <span className="mono w-10 text-right text-xs text-muted-foreground">
                            {skill.proficiency}%
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Award className="h-3 w-3 text-amber-300" />
                            {skill.endorsed ?? 0} endorsements
                          </span>
                          {skill.year_acquired && <span className="mono">since {skill.year_acquired}</span>}
                        </div>
                      </Panel>
                    </RevealItem>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-[hsl(240_28%_6%)]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editing ? 'Edit skill' : 'Add skill'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Honest proficiency beats a wall of 100% ratings.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs text-muted-foreground">Skill</span>
              <input
                className={fieldClasses()}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="TypeScript"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs text-muted-foreground">Category</span>
              <input
                className={fieldClasses()}
                list="skill-categories"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              />
              <datalist id="skill-categories">
                {CATEGORY_SUGGESTIONS.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </label>
            <label className="block">
              <span className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Proficiency</span>
                <span className="mono text-primary">{form.proficiency}%</span>
              </span>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={form.proficiency}
                onChange={(event) => setForm({ ...form, proficiency: Number(event.target.value) })}
                className="w-full accent-[hsl(var(--violet))]"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs text-muted-foreground">Using since</span>
              <input
                type="number"
                min={1990}
                max={new Date().getFullYear()}
                className={fieldClasses()}
                value={form.year_acquired}
                onChange={(event) => setForm({ ...form, year_acquired: Number(event.target.value) })}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs text-muted-foreground">Note (optional)</span>
              <input
                className={fieldClasses()}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Shipped three production apps with it"
              />
            </label>
            <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
              <GhostButton type="button" onClick={() => setOpen(false)}>
                Cancel
              </GhostButton>
              <GlowButton type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editing ? 'Save skill' : 'Add skill'}
              </GlowButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
