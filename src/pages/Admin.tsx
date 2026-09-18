import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Eye,
  EyeOff,
  FileText,
  FolderGit2,
  Heart,
  Inbox,
  Loader2,
  MessageSquare,
  RefreshCw,
  Save,
  Server,
  Settings2,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Layout from '@/components/Layout';
import { GhostButton, GlowButton, PageHeader, Panel, SectionLabel, StatTile, Tag, fieldClasses } from '@/components/ui-kit';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/client';

interface AdminStats {
  totals: Record<string, number>;
  growth: { day: string; signups: number }[];
  traffic: { day: string; views: number }[];
}

interface ContentRow {
  id: string;
  title?: string;
  name?: string;
  content?: string;
  is_public?: boolean | number;
  created_at: string;
  owner?: string | null;
}

interface HealthReport {
  database?: { ok: boolean; latencyMs?: number };
  assets?: { ok: boolean };
  media?: { ok: boolean; bound: boolean };
  kv?: { ok: boolean; bound: boolean };
  mail?: { ok: boolean; configured: boolean };
  environment?: string;
  version?: string;
}

export default function Admin() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [content, setContent] = useState<{ posts: any[]; projects: any[]; comments: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState({
    'contact_info': {} as any,
    'social_links': {} as any,
    'site_info': {} as any,
    'features': {} as any,
  });
  const [savingSettings, setSavingSettings] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    const [statsResult, healthResult, contentResult, contactInfo, socialLinks, siteInfo, features] = await Promise.all([
      api.get<AdminStats>('/api/admin/stats'),
      api.get<HealthReport>('/api/admin/health'),
      api.get<any>('/api/admin/content'),
      api.get<{ value: any }>('/api/site/settings/contact_info'),
      api.get<{ value: any }>('/api/site/settings/social_links'),
      api.get<{ value: any }>('/api/site/settings/site_info'),
      api.get<{ value: any }>('/api/site/settings/features'),
    ]);
    setStats(statsResult.data);
    setHealth(healthResult.data);
    setContent({
      posts: contentResult.data?.posts ?? [],
      projects: contentResult.data?.projects ?? [],
      comments: contentResult.data?.comments ?? [],
    });
    setSettings({
      contact_info: contactInfo.data?.value ?? {},
      social_links: socialLinks.data?.value ?? {},
      site_info: siteInfo.data?.value ?? {},
      features: features.data?.value ?? {},
    });
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveSetting = async (key: string) => {
    setSavingSettings(key);
    const { error } = await api.put(`/api/site/settings/${key}`, { value: settings[key as keyof typeof settings] });
    setSavingSettings(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${key.replace('_', ' ')} updated`);
  };

  const toggleVisibility = async (table: string, id: string, next: boolean) => {
    setBusy(true);
    const { error } = await api.post('/api/admin/content/toggle-visibility', { table, id, is_public: next });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next ? 'Content made public' : 'Content hidden');
    void load();
  };

  const removeContent = async (table: string, id: string) => {
    setBusy(true);
    const { error } = await api.delete(`/api/admin/content/${table}/${id}`);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Content deleted');
    void load();
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-6 py-24 text-center text-sm text-muted-foreground">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-6 py-24">
          <Panel className="p-12 text-center">
            <ShieldCheck className="mx-auto h-6 w-6 text-primary" />
            <h1 className="mt-5 font-display text-2xl font-semibold">Administrator access required</h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              This console manages every account, piece of content and site-wide setting. Ask an existing administrator
              for the role, or sign in with an admin account.
            </p>
            <Link to="/auth" className="mt-6 inline-block">
              <GlowButton>Sign in</GlowButton>
            </Link>
          </Panel>
        </div>
      </Layout>
    );
  }

  const totals = stats?.totals ?? {};

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 pb-24">
        <PageHeader
          eyebrow="Admin console"
          title={
            <>
              The whole platform, <span className="text-gradient">one glance.</span>
            </>
          }
          description="Growth, moderation, infrastructure health and site-wide settings — all live from the edge database."
          actions={
            <>
              <Link to="/admin/analytics">
                <GhostButton>
                  <BarChart3 className="h-4 w-4" /> My analytics
                </GhostButton>
              </Link>
              <Link to="/admin/users">
                <GhostButton>
                  <Users className="h-4 w-4" /> Manage users
                </GhostButton>
              </Link>
              <GlowButton onClick={() => void load()} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </GlowButton>
            </>
          }
        />

        <Tabs defaultValue="overview">
          <TabsList className="mb-8 flex-wrap rounded-full border border-white/10 bg-white/[0.03] p-1">
            {[
              { value: 'overview', label: 'Overview' },
              { value: 'content', label: 'Content' },
              { value: 'settings', label: 'Site settings' },
              { value: 'health', label: 'Infrastructure' },
            ].map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="rounded-full data-[state=active]:bg-white/[0.08]">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* -------------------------------------------------------- overview */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile label="Users" value={totals.users ?? 0} icon={Users} hint={`${totals.activeUsers ?? 0} active`} />
              <StatTile label="Public portfolios" value={totals.publicProfiles ?? 0} icon={Eye} delay={0.05} />
              <StatTile label="Projects" value={totals.projects ?? 0} icon={FolderGit2} delay={0.1} />
              <StatTile label="Articles" value={totals.posts ?? 0} icon={FileText} delay={0.15} />
              <StatTile label="Comments" value={totals.comments ?? 0} icon={MessageSquare} delay={0.2} />
              <StatTile label="Reactions" value={totals.reactions ?? 0} icon={Heart} delay={0.25} />
              <StatTile label="Page views" value={(totals.pageViews ?? 0).toLocaleString()} icon={Activity} delay={0.3} />
              <StatTile
                label="Inbox"
                value={totals.messages ?? 0}
                icon={Inbox}
                hint={`${totals.unreadMessages ?? 0} unread`}
                delay={0.35}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Panel className="p-6">
                <SectionLabel>Sign-ups · last 30 days</SectionLabel>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.growth ?? []}>
                      <defs>
                        <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(258 90% 66%)" stopOpacity={0.55} />
                          <stop offset="100%" stopColor="hsl(258 90% 66%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="day" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(240 28% 8%)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 14,
                          fontSize: 12,
                        }}
                      />
                      <Area type="monotone" dataKey="signups" stroke="hsl(258 90% 66%)" strokeWidth={2} fill="url(#signupFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel className="p-6">
                <SectionLabel>Page views · last 30 days</SectionLabel>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.traffic ?? []}>
                      <defs>
                        <linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(189 94% 55%)" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="hsl(189 94% 55%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="day" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(240 28% 8%)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 14,
                          fontSize: 12,
                        }}
                      />
                      <Area type="monotone" dataKey="views" stroke="hsl(189 94% 55%)" strokeWidth={2} fill="url(#trafficFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>
          </TabsContent>

          {/* --------------------------------------------------------- content */}
          <TabsContent value="content" className="space-y-8">
            {[
              { key: 'posts' as const, label: 'Articles', icon: FileText },
              { key: 'projects' as const, label: 'Projects', icon: FolderGit2 },
              { key: 'comments' as const, label: 'Recent comments', icon: MessageSquare },
            ].map(({ key, label, icon: Icon }) => (
              <Panel key={key} className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <p className="flex items-center gap-2 font-display text-base font-semibold">
                    <Icon className="h-4 w-4 text-primary" /> {label}
                  </p>
                  <span className="mono text-[10px] text-muted-foreground">
                    {content?.[key]?.length ?? 0} rows
                  </span>
                </div>

                {content?.[key]?.length ? (
                  <div className="space-y-2">
                    {content[key].map((row: ContentRow) => (
                      <div
                        key={row.id}
                        className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {row.title || row.name || row.content?.slice(0, 60) || 'untitled'}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {row.owner ? `@${row.owner} · ` : ''}
                            {new Date(row.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {row.is_public !== undefined && (
                            <button
                              disabled={busy}
                              onClick={() => void toggleVisibility(key === 'posts' ? 'blog_posts' : key === 'projects' ? 'projects' : 'comments', row.id, !row.is_public)}
                              className="rounded-xl border border-white/10 p-2 text-muted-foreground transition-colors hover:text-foreground"
                              title={row.is_public ? 'Hide' : 'Publish'}
                            >
                              {row.is_public ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </button>
                          )}
                          <button
                            disabled={busy}
                            onClick={() => void removeContent(key === 'posts' ? 'blog_posts' : key === 'projects' ? 'projects' : 'comments', row.id)}
                            className="rounded-xl border border-white/10 p-2 text-muted-foreground transition-colors hover:border-rose-400/30 hover:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center text-sm text-muted-foreground">
                    Nothing to moderate here yet.
                  </p>
                )}
              </Panel>
            ))}
          </TabsContent>

          {/* -------------------------------------------------------- settings */}
          <TabsContent value="settings" className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-2">
              {(
                [
                  {
                    key: 'contact_info',
                    label: 'Contact information',
                    fields: [
                      { name: 'email', label: 'Public email' },
                      { name: 'phone', label: 'Phone' },
                      { name: 'address', label: 'Address' },
                      { name: 'hours', label: 'Response hours' },
                    ],
                  },
                  {
                    key: 'social_links',
                    label: 'Social links',
                    fields: [
                      { name: 'github', label: 'GitHub' },
                      { name: 'linkedin', label: 'LinkedIn' },
                      { name: 'twitter', label: 'Twitter / X' },
                      { name: 'website', label: 'Website' },
                    ],
                  },
                  {
                    key: 'site_info',
                    label: 'Site information',
                    fields: [
                      { name: 'title', label: 'Site title' },
                      { name: 'tagline', label: 'Tagline' },
                      { name: 'description', label: 'Description' },
                      { name: 'support_email', label: 'Support email' },
                    ],
                  },
                ] as const
              ).map((group) => (
                <Panel key={group.key} className="p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <p className="flex items-center gap-2 font-display text-base font-semibold">
                      <Settings2 className="h-4 w-4 text-primary" /> {group.label}
                    </p>
                    <GhostButton onClick={() => void saveSetting(group.key)} disabled={savingSettings === group.key}>
                      {savingSettings === group.key ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      Save
                    </GhostButton>
                  </div>
                  <div className="space-y-4">
                    {group.fields.map((field) => (
                      <label key={field.name} className="block">
                        <span className="mb-2 block text-xs text-muted-foreground">{field.label}</span>
                        <input
                          className={fieldClasses()}
                          value={(settings[group.key] as any)?.[field.name] ?? ''}
                          onChange={(event) =>
                            setSettings({
                              ...settings,
                              [group.key]: { ...(settings[group.key] as any), [field.name]: event.target.value },
                            })
                          }
                        />
                      </label>
                    ))}
                  </div>
                </Panel>
              ))}

              <Panel className="p-6">
                <p className="mb-5 flex items-center gap-2 font-display text-base font-semibold">
                  <Settings2 className="h-4 w-4 text-primary" /> Feature flags
                </p>
                <div className="space-y-3">
                  {[
                    { key: 'publicSignups', label: 'Public sign-ups' },
                    { key: 'githubImport', label: 'GitHub import' },
                    { key: 'newsletter', label: 'Newsletter capture' },
                    { key: 'testimonials', label: 'Testimonials' },
                  ].map((flag) => (
                    <label
                      key={flag.key}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm"
                    >
                      {flag.label}
                      <input
                        type="checkbox"
                        checked={Boolean((settings.features as any)?.[flag.key] ?? true)}
                        onChange={(event) =>
                          setSettings({
                            ...settings,
                            features: { ...(settings.features as any), [flag.key]: event.target.checked },
                          })
                        }
                        className="h-4 w-4 accent-[hsl(var(--violet))]"
                      />
                    </label>
                  ))}
                </div>
                <GhostButton className="mt-5" onClick={() => void saveSetting('features')}>
                  <Save className="h-3.5 w-3.5" /> Save flags
                </GhostButton>
              </Panel>
            </div>
          </TabsContent>

          {/* ---------------------------------------------------------- health */}
          <TabsContent value="health" className="space-y-6">
            <Panel className="p-6">
              <SectionLabel>Edge infrastructure</SectionLabel>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: 'Database (D1)', value: health?.database },
                  { label: 'Static assets', value: health?.assets },
                  { label: 'Media (R2)', value: health?.media },
                  { label: 'Cache (KV)', value: health?.kv },
                  { label: 'Mail provider', value: health?.mail },
                ].map((row) => {
                  const ok = Boolean(row.value?.ok);
                  return (
                    <div
                      key={row.label}
                      className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3.5"
                    >
                      <div>
                        <p className="text-sm font-medium">{row.label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {(row.value as any)?.bound === false
                            ? 'not bound (graceful fallback)'
                            : (row.value as any)?.configured === false
                              ? 'not configured'
                              : ok
                                ? 'operational'
                                : 'degraded'}
                        </p>
                      </div>
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-amber-300'}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <Tag tone="primary">env · {health?.environment ?? 'production'}</Tag>
                {health?.database?.latencyMs !== undefined && <Tag>db {health.database.latencyMs}ms</Tag>}
                {health?.version && <Tag>build {health.version}</Tag>}
                <span className="mono flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5" /> cloudflare workers · d1 · r2
                </span>
              </div>
            </Panel>

            <Panel className="p-6">
              <SectionLabel>Maintenance</SectionLabel>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <TrendingUp className="h-4 w-4 text-primary" /> Re-seed demo dataset
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Rebuilds the demo people, projects, articles, reactions and analytics. Existing demo content is
                    replaced; real accounts are untouched unless you wipe first.
                  </p>
                  <GhostButton
                    className="mt-4"
                    onClick={async () => {
                      setBusy(true);
                      const { error } = await api.post('/api/admin/seed', {});
                      setBusy(false);
                      if (error) {
                        toast.error(error.message);
                        return;
                      }
                      toast.success('Seed run complete');
                      void load();
                    }}
                    disabled={busy}
                  >
                    Run seed
                  </GhostButton>
                </div>

                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-5">
                  <p className="flex items-center gap-2 text-sm font-medium text-rose-200">
                    <Trash2 className="h-4 w-4" /> Wipe demo data
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-rose-100/70">
                    Deletes every demo account and all seeded content. Use only in staging — this cannot be undone.
                  </p>
                  <button
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-rose-400/30 px-4 py-2 text-xs font-medium text-rose-200 transition-colors hover:bg-rose-500/15 disabled:opacity-50"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      const { error } = await api.post('/api/admin/seed', { reset: true });
                      setBusy(false);
                      if (error) {
                        toast.error(error.message);
                        return;
                      }
                      toast.success('Demo data wiped');
                      void load();
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Reset demo data
                  </button>
                </div>
              </div>
            </Panel>
          </TabsContent>
        </Tabs>

        {loading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Loader2 className="h-3 w-3 animate-spin" /> Loading platform data…
          </motion.p>
        )}
      </div>
    </Layout>
  );
}
