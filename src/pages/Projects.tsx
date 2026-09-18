import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FolderGit2,
  Github,
  Loader2,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import {
  EmptyState,
  GhostButton,
  GlowButton,
  PageHeader,
  Panel,
  Tag,
  fieldClasses,
} from '@/components/ui-kit';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RevealGroup, RevealItem } from '@/components/experience/Reveal';
import { useAuth } from '@/hooks/useAuth';
import { api, db, uploadMedia } from '@/lib/api/client';

interface ProjectRow {
  id: string;
  title: string;
  description: string;
  long_description?: string | null;
  tags: string[];
  image_url?: string | null;
  repo_url?: string | null;
  demo_url?: string | null;
  category?: string | null;
  featured: boolean | number;
  is_public: boolean | number;
  stars: number;
  forks: number;
  source?: string | null;
  created_at: string;
}

const emptyForm = {
  title: '',
  description: '',
  long_description: '',
  tags: '',
  image_url: '',
  repo_url: '',
  demo_url: '',
  category: '',
  featured: false,
  is_public: true,
};

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'recent' | 'stars' | 'title'>('recent');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await api.get<ProjectRow[]>(
      `/api/db/projects?f.user_id=eq.${user.id}&order=featured.desc,created_at.desc&limit=200`
    );
    setProjects(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEditor = (project?: ProjectRow) => {
    setEditing(project ?? null);
    setForm(
      project
        ? {
            title: project.title,
            description: project.description ?? '',
            long_description: project.long_description ?? '',
            tags: (project.tags ?? []).join(', '),
            image_url: project.image_url ?? '',
            repo_url: project.repo_url ?? '',
            demo_url: project.demo_url ?? '',
            category: project.category ?? '',
            featured: Boolean(project.featured),
            is_public: Boolean(project.is_public),
          }
        : { ...emptyForm }
    );
    setEditorOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('A title and description are required');
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      long_description: form.long_description.trim() || null,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      image_url: form.image_url.trim() || null,
      repo_url: form.repo_url.trim() || null,
      demo_url: form.demo_url.trim() || null,
      category: form.category.trim() || null,
      featured: form.featured ? 1 : 0,
      is_public: form.is_public ? 1 : 0,
      updated_at: new Date().toISOString(),
    };

    const { error } = editing
      ? await db.from('projects').update(payload).eq('id', editing.id)
      : await db.from('projects').insert({ ...payload, user_id: user!.id, position: 0 });

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? 'Project updated' : 'Project published');
    setEditorOpen(false);
    void load();
  };

  const remove = async (project: ProjectRow) => {
    const { error } = await db.from('projects').delete().eq('id', project.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setProjects((current) => current.filter((item) => item.id !== project.id));
    toast.success('Project deleted');
  };

  const toggleVisibility = async (project: ProjectRow) => {
    const next = !project.is_public;
    const { error } = await db
      .from('projects')
      .update({ is_public: next ? 1 : 0 })
      .eq('id', project.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setProjects((current) =>
      current.map((item) => (item.id === project.id ? { ...item, is_public: next } : item))
    );
  };

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = projects.filter((project) =>
      !needle
        ? true
        : `${project.title} ${project.description} ${(project.tags ?? []).join(' ')}`
            .toLowerCase()
            .includes(needle)
    );
    return filtered.sort((a, b) => {
      if (sort === 'stars') return (b.stars ?? 0) - (a.stars ?? 0);
      if (sort === 'title') return a.title.localeCompare(b.title);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [projects, query, sort]);

  if (!user) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-6 py-24">
          <EmptyState
            icon={FolderGit2}
            title="Sign in to manage projects"
            description="Your project library lives behind a session — sign in to add, edit and publish work."
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
          eyebrow="Your work"
          title={
            <>
              Projects that <span className="text-gradient">prove the point.</span>
            </>
          }
          description="Every project here renders on your public portfolio the moment it is saved. Import from GitHub to keep metadata in sync."
          actions={
            <>
              <GhostButton onClick={() => setImportOpen(true)}>
                <Github className="h-4 w-4" /> Import from GitHub
              </GhostButton>
              <GlowButton onClick={() => openEditor()}>
                <Plus className="h-4 w-4" /> New project
              </GlowButton>
            </>
          }
        />

        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-80">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by title, tag…"
              className={fieldClasses('pl-11')}
            />
          </div>
          <div className="flex items-center gap-2">
            {(['recent', 'stars', 'title'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSort(option)}
                className={`rounded-full border px-4 py-2 text-xs capitalize transition-colors ${
                  sort === option
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-white/10 text-muted-foreground hover:text-foreground'
                }`}
              >
                {option}
              </button>
            ))}
            <span className="mono ml-2 text-[10px] text-muted-foreground">
              {visible.length}/{projects.length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-3xl border border-white/[0.06] bg-white/[0.02]" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={FolderGit2}
            title={projects.length === 0 ? 'No projects yet' : 'Nothing matches that filter'}
            description={
              projects.length === 0
                ? 'Add your first project by hand, or pull your repositories straight from GitHub.'
                : 'Try a different keyword or clear the filter.'
            }
            action={
              projects.length === 0 ? (
                <GlowButton onClick={() => openEditor()}>
                  <Plus className="h-4 w-4" /> Add a project
                </GlowButton>
              ) : (
                <GhostButton onClick={() => setQuery('')}>Clear filter</GhostButton>
              )
            }
          />
        ) : (
          <RevealGroup className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
            {visible.map((project) => (
              <RevealItem key={project.id}>
                <Panel interactive className="group flex h-full flex-col overflow-hidden">
                  {project.image_url ? (
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={project.image_url}
                        alt={project.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-cinematic group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(240_30%_4%)] to-transparent" />
                    </div>
                  ) : (
                    <div className="h-24 bg-[radial-gradient(80%_120%_at_20%_0%,hsl(var(--violet)/.25),transparent_60%)]" />
                  )}

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-base font-semibold leading-snug tracking-tight">
                        {project.title}
                      </h3>
                      {!project.is_public && <Tag tone="warm">draft</Tag>}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(project.tags ?? []).slice(0, 4).map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-white/[0.07] pt-4">
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" /> {project.stars ?? 0}
                        </span>
                        {project.repo_url && (
                          <a
                            href={project.repo_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="transition-colors hover:text-foreground"
                          >
                            <Github className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => void toggleVisibility(project)}
                          title={project.is_public ? 'Make private' : 'Make public'}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                        >
                          {project.is_public ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => openEditor(project)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => void remove(project)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Panel>
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </div>

      {/* ------------------------------------------------------------- editor */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-white/10 bg-[hsl(240_28%_6%)]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editing ? 'Edit project' : 'New project'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Everything here appears on your public portfolio instantly after saving.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={save} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-xs text-muted-foreground">Title</span>
                <input
                  className={fieldClasses()}
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="Realtime collaboration engine"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-xs text-muted-foreground">Short description</span>
                <textarea
                  rows={2}
                  className={fieldClasses('h-auto py-3')}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-xs text-muted-foreground">Deep dive (optional)</span>
                <textarea
                  rows={4}
                  className={fieldClasses('h-auto py-3')}
                  value={form.long_description}
                  onChange={(event) => setForm({ ...form, long_description: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs text-muted-foreground">Tags (comma separated)</span>
                <input
                  className={fieldClasses()}
                  value={form.tags}
                  onChange={(event) => setForm({ ...form, tags: event.target.value })}
                  placeholder="react, websockets, postgres"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs text-muted-foreground">Category</span>
                <input
                  className={fieldClasses()}
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  placeholder="web app"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs text-muted-foreground">Repository URL</span>
                <input
                  className={fieldClasses()}
                  value={form.repo_url}
                  onChange={(event) => setForm({ ...form, repo_url: event.target.value })}
                  placeholder="https://github.com/you/project"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs text-muted-foreground">Live URL</span>
                <input
                  className={fieldClasses()}
                  value={form.demo_url}
                  onChange={(event) => setForm({ ...form, demo_url: event.target.value })}
                  placeholder="https://project.dev"
                />
              </label>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <label className="flex flex-1 cursor-pointer items-center gap-3">
                <Upload className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  {form.image_url ? 'Replace cover image' : 'Upload a cover image'}
                  <span className="ml-2 text-xs text-muted-foreground">PNG · JPG · WebP · up to 6 MB</span>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const { url, error } = await uploadMedia(file, 'projects');
                    if (error || !url) {
                      toast.error(error?.message || 'Upload failed');
                      return;
                    }
                    setForm((current) => ({ ...current, image_url: url }));
                    toast.success('Cover uploaded');
                  }}
                />
              </label>
              {form.image_url && (
                <img src={form.image_url} alt="cover preview" className="h-12 w-20 rounded-lg object-cover" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) => setForm({ ...form, featured: event.target.checked })}
                  className="h-4 w-4 accent-[hsl(var(--violet))]"
                />
                Feature on portfolio
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_public}
                  onChange={(event) => setForm({ ...form, is_public: event.target.checked })}
                  className="h-4 w-4 accent-[hsl(var(--violet))]"
                />
                Visible publicly
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
              <GhostButton type="button" onClick={() => setEditorOpen(false)}>
                Cancel
              </GhostButton>
              <GlowButton type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editing ? 'Save changes' : 'Publish project'}
              </GlowButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <GithubImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        defaultUsername={user.user_metadata?.github_username ?? ''}
        onImported={load}
      />
    </Layout>
  );
}

/* ------------------------------------------------------- GitHub importer -- */

interface Repo {
  id: number;
  name: string;
  description?: string | null;
  html_url: string;
  homepage?: string | null;
  language?: string | null;
  language_color?: string | null;
  stars: number;
  forks: number;
  topics?: string[];
}

function GithubImportDialog({
  open,
  onOpenChange,
  defaultUsername,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultUsername?: string;
  onImported: () => void;
}) {
  const [username, setUsername] = useState(defaultUsername ?? '');
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const fetchRepos = async () => {
    if (!username.trim()) {
      toast.error('Enter your GitHub username');
      return;
    }
    setLoading(true);
    const { data, error } = await api.get<{ repositories: Repo[] }>(
      `/api/integrations/github/repos?username=${encodeURIComponent(username.trim())}`
    );
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const list = data?.repositories ?? [];
    setRepos(list);
    setSelected(new Set(list.slice(0, 3).map((repo) => repo.id)));
    if (!list.length) toast.info('No public repositories found for that username');
  };

  const runImport = async () => {
    const chosen = repos.filter((repo) => selected.has(repo.id));
    if (!chosen.length) {
      toast.error('Select at least one repository');
      return;
    }
    setImporting(true);
    const { data, error } = await api.post<{ created: number; skipped: number }>(
      '/api/integrations/github/import',
      {
        username: username.trim(),
        repositories: chosen.map((repo) => ({
          id: repo.id,
          name: repo.name,
          description: repo.description,
          html_url: repo.html_url,
          homepage: repo.homepage,
          language: repo.language,
          topics: repo.topics ?? [],
          stargazers_count: repo.stars,
          forks_count: repo.forks,
        })),
      }
    );
    setImporting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Imported ${data?.created ?? chosen.length} project${chosen.length === 1 ? '' : 's'}`);
    onImported();
    onOpenChange(false);
    setRepos([]);
    setSelected(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-white/10 bg-[hsl(240_28%_6%)]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Import from GitHub</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Pull public repositories in as projects — stars, forks, topics and links come with them.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex gap-2">
          <input
            className={fieldClasses()}
            placeholder="github username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void fetchRepos();
              }
            }}
          />
          <GlowButton type="button" onClick={fetchRepos} disabled={loading} className="shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
            Fetch
          </GlowButton>
        </div>

        <AnimatePresence>
          {repos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5 space-y-2 overflow-hidden"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{repos.length} repositories</span>
                <button
                  className="underline-sweep hover:text-foreground"
                  onClick={() =>
                    setSelected(
                      selected.size === repos.length ? new Set() : new Set(repos.map((repo) => repo.id))
                    )
                  }
                >
                  {selected.size === repos.length ? 'Clear all' : 'Select all'}
                </button>
              </div>
              <div className="max-h-[42vh] space-y-2 overflow-y-auto pr-1">
                {repos.map((repo) => {
                  const isSelected = selected.has(repo.id);
                  return (
                    <button
                      key={repo.id}
                      type="button"
                      onClick={() => {
                        const next = new Set(selected);
                        if (isSelected) next.delete(repo.id);
                        else next.add(repo.id);
                        setSelected(next);
                      }}
                      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                        isSelected ? 'border-primary/40 bg-primary/[0.07]' : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] ${
                          isSelected ? 'border-primary bg-primary text-[hsl(240_30%_4%)]' : 'border-white/20'
                        }`}
                      >
                        {isSelected ? '✓' : ''}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-medium">{repo.name}</span>
                          {repo.language && (
                            <span className="mono flex items-center gap-1 text-[10px] text-muted-foreground">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ background: repo.language_color ?? '#8b8baf' }}
                              />
                              {repo.language}
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block line-clamp-1 text-xs text-muted-foreground">
                          {repo.description || 'No description'}
                        </span>
                        <span className="mono mt-1 block text-[10px] text-muted-foreground">
                          ★ {repo.stars} · ⑂ {repo.forks}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-end pt-3">
                <GlowButton type="button" onClick={runImport} disabled={importing}>
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Import {selected.size} selected
                </GlowButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
