import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  Loader2,
  Plus,
  Printer,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { EmptyState, GhostButton, GlowButton, PageHeader, Panel, SectionLabel, fieldClasses } from '@/components/ui-kit';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/client';
import usePageMeta from '@/hooks/usePageMeta';

interface ResumeContent {
  summary: string;
  highlights: string[];
  sections: {
    experience: boolean;
    education: boolean;
    skills: boolean;
    projects: boolean;
    writing: boolean;
  };
}

const defaultContent: ResumeContent = {
  summary: '',
  highlights: [],
  sections: { experience: true, education: true, skills: true, projects: true, writing: false },
};

export default function ResumeEditor() {
  usePageMeta({ title: 'Résumé studio · Portify', description: 'Generate a recruiter-ready résumé from the same data as your portfolio.', path: '/resume' });

  const { user, profile } = useAuth();
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [name, setName] = useState('My Resume');
  const [template, setTemplate] = useState<'modern' | 'classic' | 'compact'>('modern');
  const [content, setContent] = useState<ResumeContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [highlightDraft, setHighlightDraft] = useState('');
  const [data, setData] = useState<{
    projects: any[];
    skills: any[];
    experiences: any[];
    education: any[];
    posts: any[];
  }>({ projects: [], skills: [], experiences: [], education: [], posts: [] });

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [resumeResult, projects, skills, experiences, education, posts] = await Promise.all([
      api.get<any[]>(`/api/db/resumes?f.user_id=eq.${user.id}&limit=1`),
      api.get<any[]>(`/api/db/projects?f.user_id=eq.${user.id}&order=featured.desc&limit=20`),
      api.get<any[]>(`/api/db/skills?f.user_id=eq.${user.id}&order=proficiency.desc&limit=24`),
      api.get<any[]>(`/api/db/experiences?f.user_id=eq.${user.id}&order=start_date.desc&limit=10`),
      api.get<any[]>(`/api/db/education?f.user_id=eq.${user.id}&order=start_date.desc&limit=6`),
      api.get<any[]>(`/api/db/blog_posts?f.user_id=eq.${user.id}&f.published=eq.1&limit=6`),
    ]);

    const resume = Array.isArray(resumeResult.data) ? resumeResult.data[0] : null;
    if (resume) {
      setResumeId(resume.id);
      setName(resume.name ?? 'My Resume');
      setTemplate((resume.template as any) ?? 'modern');
      try {
        const parsed = typeof resume.content === 'string' ? JSON.parse(resume.content) : resume.content;
        setContent({ ...defaultContent, ...parsed, sections: { ...defaultContent.sections, ...(parsed?.sections ?? {}) } });
      } catch {
        setContent(defaultContent);
      }
    }

    setData({
      projects: Array.isArray(projects.data) ? projects.data : [],
      skills: Array.isArray(skills.data) ? skills.data : [],
      experiences: Array.isArray(experiences.data) ? experiences.data : [],
      education: Array.isArray(education.data) ? education.data : [],
      posts: Array.isArray(posts.data) ? posts.data : [],
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      name,
      template,
      content: JSON.stringify(content),
      is_default: 1,
      updated_at: new Date().toISOString(),
    };
    const { error } = resumeId
      ? await api.patch(`/api/db/resumes?f.id=eq.${resumeId}`, payload)
      : await api.post('/api/db/resumes', { rows: { ...payload, user_id: user.id } });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Résumé saved');
    void load();
  };

  const downloadJson = () => {
    const payload = {
      profile: {
        name: profile?.full_name,
        title: profile?.title,
        email: profile?.email,
        location: profile?.location,
        website: profile?.website,
        github: profile?.github,
        linkedin: profile?.linkedin,
      },
      summary: content.summary,
      highlights: content.highlights,
      experience: data.experiences,
      education: data.education,
      skills: data.skills,
      projects: data.projects.map((project) => ({
        title: project.title,
        description: project.description,
        url: project.repo_url || project.demo_url,
        tags: project.tags,
      })),
      writing: data.posts.map((post) => ({ title: post.title, url: `/blog/${post.slug}` })),
      generated_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(profile?.username || 'resume').toLowerCase()}-resume.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Résumé data downloaded');
  };

  const previewSections = useMemo(
    () =>
      [
        { key: 'experience', title: 'Experience', items: data.experiences.map((row) => ({
          title: `${row.position} · ${row.company}`,
          meta: `${row.start_date?.slice(0, 7)} — ${row.end_date?.slice(0, 7) ?? 'present'}`,
          body: row.description,
        })) },
        { key: 'education', title: 'Education', items: data.education.map((row) => ({
          title: `${row.degree} · ${row.institution}`,
          meta: `${row.start_date?.slice(0, 4)} — ${row.end_date?.slice(0, 4) ?? 'present'}`,
          body: row.description,
        })) },
        { key: 'projects', title: 'Selected projects', items: data.projects.slice(0, 4).map((row) => ({
          title: row.title,
          meta: (row.tags ?? []).slice(0, 4).join(' · '),
          body: row.description,
        })) },
        { key: 'writing', title: 'Writing', items: data.posts.map((row) => ({
          title: row.title,
          meta: row.category ?? 'article',
          body: row.excerpt,
        })) },
      ].filter((section) => (content.sections as any)[section.key] && section.items.length > 0),
    [data, content.sections]
  );

  if (!user) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-6 py-24">
          <EmptyState
            icon={FileText}
            title="Sign in to build your résumé"
            description="Your résumé is generated from the same data as your portfolio — no double entry."
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
      <div className="mx-auto max-w-7xl px-6 pb-24">
        <PageHeader
          eyebrow="Résumé"
          title={
            <>
              One dataset, <span className="text-gradient">two audiences.</span>
            </>
          }
          description="Your portfolio convinces the curious; the résumé convinces the recruiter. Both are generated from the same records."
          actions={
            <>
              <GhostButton onClick={downloadJson}>
                <Download className="h-4 w-4" /> Export data
              </GhostButton>
              <GhostButton onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print / PDF
              </GhostButton>
              <GlowButton onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save résumé
              </GlowButton>
            </>
          }
        />

        {loading ? (
          <div className="h-96 animate-pulse rounded-3xl border border-white/[0.06] bg-white/[0.02]" />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            {/* ----------------------------------------------------- editor */}
            <div className="space-y-6 print:hidden">
              <Panel className="p-7">
                <SectionLabel>Basics</SectionLabel>
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-xs text-muted-foreground">Document name</span>
                    <input className={fieldClasses()} value={name} onChange={(event) => setName(event.target.value)} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs text-muted-foreground">Professional summary</span>
                    <textarea
                      rows={4}
                      className={fieldClasses('h-auto py-3')}
                      placeholder="Product-minded engineer with 6 years shipping design systems and edge infrastructure…"
                      value={content.summary}
                      onChange={(event) => setContent({ ...content, summary: event.target.value })}
                    />
                  </label>
                  <div>
                    <span className="mb-2 block text-xs text-muted-foreground">Template</span>
                    <div className="grid grid-cols-3 gap-2">
                      {(['modern', 'classic', 'compact'] as const).map((option) => (
                        <button
                          key={option}
                          onClick={() => setTemplate(option)}
                          className={`rounded-xl border px-3 py-2.5 text-xs capitalize transition-colors ${
                            template === option
                              ? 'border-primary/50 bg-primary/10 text-primary'
                              : 'border-white/10 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel className="p-7">
                <SectionLabel>Career highlights</SectionLabel>
                <div className="flex gap-2">
                  <input
                    className={fieldClasses()}
                    placeholder="Reduced infra cost 38% in one quarter"
                    value={highlightDraft}
                    onChange={(event) => setHighlightDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && highlightDraft.trim()) {
                        event.preventDefault();
                        setContent({ ...content, highlights: [...content.highlights, highlightDraft.trim()] });
                        setHighlightDraft('');
                      }
                    }}
                  />
                  <GhostButton
                    onClick={() => {
                      if (!highlightDraft.trim()) return;
                      setContent({ ...content, highlights: [...content.highlights, highlightDraft.trim()] });
                      setHighlightDraft('');
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </GhostButton>
                </div>
                <ul className="mt-4 space-y-2">
                  {content.highlights.map((highlight, index) => (
                    <motion.li
                      key={`${highlight}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-sm"
                    >
                      <span className="flex items-start gap-2">
                        <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                        {highlight}
                      </span>
                      <button
                        onClick={() =>
                          setContent({
                            ...content,
                            highlights: content.highlights.filter((_, position) => position !== index),
                          })
                        }
                        className="text-muted-foreground hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </motion.li>
                  ))}
                  {content.highlights.length === 0 && (
                    <li className="text-xs text-muted-foreground">
                      Add three to five quantified wins — numbers beat adjectives.
                    </li>
                  )}
                </ul>
              </Panel>

              <Panel className="p-7">
                <SectionLabel>Sections included</SectionLabel>
                <div className="space-y-2">
                  {(
                    [
                      ['experience', 'Work experience'],
                      ['education', 'Education'],
                      ['projects', 'Projects'],
                      ['skills', 'Skills'],
                      ['writing', 'Writing'],
                    ] as const
                  ).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm"
                    >
                      {label}
                      <input
                        type="checkbox"
                        checked={(content.sections as any)[key]}
                        onChange={(event) =>
                          setContent({
                            ...content,
                            sections: { ...content.sections, [key]: event.target.checked },
                          })
                        }
                        className="h-4 w-4 accent-[hsl(var(--violet))]"
                      />
                    </label>
                  ))}
                </div>
              </Panel>
            </div>

            {/* ---------------------------------------------------- preview */}
            <div>
              <Panel
                className={`p-8 ${template === 'compact' ? 'text-[13px]' : ''} ${
                  template === 'classic' ? 'font-serif' : ''
                }`}
              >
                <header className="border-b border-white/10 pb-6">
                  <h2 className="font-display text-3xl font-semibold tracking-tight">
                    {profile?.full_name || profile?.username || 'Your name'}
                  </h2>
                  <p className="mt-1 text-sm text-secondary">{profile?.title || 'Developer'}</p>
                  <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {profile?.email && <span>{profile.email}</span>}
                    {profile?.location && <span>{profile.location}</span>}
                    {profile?.website && <span>{profile.website}</span>}
                    {profile?.github && <span>{profile.github}</span>}
                    {profile?.linkedin && <span>{profile.linkedin}</span>}
                  </p>
                </header>

                {content.summary && (
                  <section className="mt-6">
                    <h3 className="eyebrow mb-3">Summary</h3>
                    <p className="text-sm leading-relaxed text-foreground/85">{content.summary}</p>
                  </section>
                )}

                {content.highlights.length > 0 && (
                  <section className="mt-6">
                    <h3 className="eyebrow mb-3">Highlights</h3>
                    <ul className="space-y-2 text-sm text-foreground/85">
                      {content.highlights.map((highlight, index) => (
                        <li key={index} className="flex gap-2">
                          <span className="text-primary">▸</span>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {previewSections.map((section) => (
                  <section key={section.key} className="mt-6">
                    <h3 className="eyebrow mb-3">{section.title}</h3>
                    <div className="space-y-4">
                      {section.items.map((item, index) => (
                        <div key={index}>
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="mono text-[10px] text-muted-foreground">{item.meta}</p>
                          </div>
                          {item.body && (
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                ))}

                {content.sections.skills && data.skills.length > 0 && (
                  <section className="mt-6">
                    <h3 className="eyebrow mb-3">Skills</h3>
                    <p className="text-sm leading-relaxed text-foreground/85">
                      {data.skills.map((skill) => skill.name).join(' · ')}
                    </p>
                  </section>
                )}

                <footer className="mt-8 border-t border-white/10 pt-4 text-[10px] text-muted-foreground">
                  Generated from portify.dev/{profile?.username ?? 'your-handle'} ·{' '}
                  {new Date().toLocaleDateString()}
                </footer>
              </Panel>

              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{template} template · {previewSections.length + 2} sections</span>
                <span className="mono">saved to d1</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
