import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AtSign,
  Camera,
  Check,
  Download,
  ExternalLink,
  Github,
  Globe,
  Linkedin,
  Loader2,
  LogOut,
  MapPin,
  Save,
  ShieldAlert,
  Trash2,
  Twitter,
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { EmptyState, GhostButton, GlowButton, PageHeader, Panel, SectionLabel, fieldClasses } from '@/components/ui-kit';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { api, auth, uploadMedia } from '@/lib/api/client';

interface Dashboard {
  counts: Record<string, number>;
  completeness: { score: number; checks?: { label: string; done: boolean }[]; nextSteps?: string[] };
  profile: Record<string, any>;
}

const socialFields = [
  { key: 'github', label: 'GitHub', icon: Github, placeholder: 'https://github.com/you' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/you' },
  { key: 'twitter', label: 'Twitter / X', icon: Twitter, placeholder: 'https://x.com/you' },
  { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://your-site.dev' },
] as const;

export default function Profile() {
  const { user, profile, updateProfile, refreshProfile, changePassword, signOut } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [handle, setHandle] = useState('');
  const [handleState, setHandleState] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '' });
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void api.get<Dashboard>('/api/dashboard').then(({ data }) => setDashboard(data ?? null));
  }, [profile?.updated_at]);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? '',
      display_name: profile.display_name ?? '',
      title: profile.title ?? '',
      bio: profile.bio ?? '',
      long_bio: profile.long_bio ?? '',
      location: profile.location ?? '',
      pronouns: profile.pronouns ?? '',
      availability: profile.availability ?? '',
      github: profile.github ?? '',
      linkedin: profile.linkedin ?? '',
      twitter: profile.twitter ?? '',
      website: profile.website ?? '',
      is_public: profile.is_public ?? true,
    });
    setHandle(profile.username ?? '');
  }, [profile]);

  const completeness = dashboard?.completeness?.score ?? 0;
  const nextSteps = dashboard?.completeness?.nextSteps ?? [];
  const isPublic = Boolean(form.is_public ?? profile?.is_public);

  const checklist = useMemo(
    () => [
      { label: 'Add a profile photo', done: Boolean(profile?.avatar_url) },
      { label: 'Write a short bio', done: Boolean(profile?.bio) },
      { label: 'Publish at least one project', done: (dashboard?.counts.projects ?? 0) > 0 },
      { label: 'List your skills', done: (dashboard?.counts.skills ?? 0) > 0 },
      { label: 'Add work experience', done: (dashboard?.counts.experiences ?? 0) > 0 },
      { label: 'Write your first article', done: (dashboard?.counts.posts ?? 0) > 0 },
    ],
    [profile, dashboard]
  );
  const visibleSteps = nextSteps.slice(0, 3);

  const save = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setSaving(true);
    const { error } = await updateProfile(form);
    setSaving(false);
    if (error) {
      toast.error(error.message || 'Could not save your profile');
      return;
    }
    toast.success('Profile saved');
  };

  const checkHandle = async (candidate: string) => {
    setHandle(candidate);
    if (candidate.length < 3 || !/^[a-z0-9_-]+$/i.test(candidate)) {
      setHandleState('idle');
      return;
    }
    setHandleState('checking');
    const { data } = await api.get<{ available: boolean }>(`/api/usernames/check/${encodeURIComponent(candidate)}`);
    setHandleState(data?.available ? 'available' : 'taken');
  };

  const claimHandle = async () => {
    const { error } = await api.patch('/api/profile', { username: handle });
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    toast.success(`Your portfolio is live at /${handle}`);
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const { url, error } = await uploadMedia(file, 'avatars');
      if (error || !url) throw new Error(error?.message || 'Upload failed');
      await api.post('/api/profile/avatar', { url });
      await refreshProfile();
      toast.success('Avatar updated');
    } catch (caught: any) {
      toast.error(caught.message);
    } finally {
      setUploading(false);
    }
  };

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwordForm.next.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    const { error } = await changePassword(passwordForm.current, passwordForm.next);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPasswordForm({ current: '', next: '' });
    toast.success('Password changed');
  };

  const exportData = async () => {
    const { data, error } = await api.get<Record<string, unknown>>('/api/account/export');
    if (error || !data) {
      toast.error('Export failed');
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `portify-export-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Export downloaded');
  };

  const deleteAccount = async () => {
    const { error } = await api.delete('/api/account', { confirm: 'DELETE' });
    if (error) {
      toast.error(error.message);
      return;
    }
    await auth.signOut();
    toast.success('Account deleted');
    window.location.href = '/';
  };

  if (!user) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-6 py-24">
          <EmptyState
            icon={AtSign}
            title="Sign in to manage your studio"
            description="Your profile, handle, theme and analytics all live behind a session."
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
          eyebrow="Your studio"
          title={<>Hello, {profile?.full_name?.split(' ')[0] || profile?.username || 'developer'}.</>}
          description="This is the control room for your public identity — profile, handle, visibility and account security."
          actions={
            <>
              {profile?.username && (
                <Link to={`/${profile.username}`} target="_blank">
                  <GhostButton>
                    <ExternalLink className="h-4 w-4" /> View live portfolio
                  </GhostButton>
                </Link>
              )}
              <GlowButton onClick={() => void save()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </GlowButton>
            </>
          }
        />

        {/* --------------------------------------------------------- identity */}
        <Panel className="mb-8 overflow-hidden">
          <div className="relative h-40 bg-[radial-gradient(90%_200%_at_20%_0%,hsl(var(--violet)/.42),transparent_60%),radial-gradient(70%_160%_at_80%_0%,hsl(var(--cyan)/.3),transparent_60%)]">
            <div className="absolute inset-0 grid-overlay opacity-40" />
          </div>
          <div className="relative -mt-14 flex flex-col gap-6 px-7 pb-7 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-5">
              <div className="group relative">
                <Avatar className="h-24 w-24 ring-4 ring-[hsl(240_30%_4%)]">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--violet))] to-[hsl(var(--cyan))] font-display text-2xl font-bold text-[hsl(240_30%_4%)]">
                    {(profile?.full_name || profile?.username || user.email || 'P').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInput.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Upload avatar"
                >
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadAvatar(file);
                  }}
                />
              </div>
              <div className="pb-1">
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  {profile?.full_name || profile?.display_name || 'Unnamed developer'}
                </h2>
                <p className="text-sm text-secondary">
                  {profile?.title || 'Add a headline to introduce yourself'}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {profile?.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {profile.location}
                    </span>
                  )}
                  {profile?.username && (
                    <span className="mono text-primary">portify.dev/{profile.username}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Completeness</p>
                <p className="font-display text-2xl font-semibold">{completeness}%</p>
              </div>
              <div className="h-14 w-14">
                <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                  <motion.circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(completeness / 100) * 97.4} 97.4`}
                    initial={{ strokeDasharray: '0 97.4' }}
                    animate={{ strokeDasharray: `${(completeness / 100) * 97.4} 97.4` }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                </svg>
              </div>
            </div>
          </div>
        </Panel>

        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          {/* ---------------------------------------------------------- form */}
          <form onSubmit={save} className="space-y-8">
            <Panel className="p-7">
              <SectionLabel>Identity</SectionLabel>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs text-muted-foreground">Full name</span>
                  <input
                    className={fieldClasses()}
                    value={form.full_name ?? ''}
                    onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs text-muted-foreground">Display name</span>
                  <input
                    className={fieldClasses()}
                    value={form.display_name ?? ''}
                    onChange={(event) => setForm({ ...form, display_name: event.target.value })}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-xs text-muted-foreground">Headline</span>
                  <input
                    className={fieldClasses()}
                    placeholder="Senior frontend engineer · design systems"
                    value={form.title ?? ''}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-xs text-muted-foreground">Short bio</span>
                  <textarea
                    rows={3}
                    className={fieldClasses('h-auto py-3')}
                    value={form.bio ?? ''}
                    onChange={(event) => setForm({ ...form, bio: event.target.value })}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-xs text-muted-foreground">Long bio (portfolio “About”)</span>
                  <textarea
                    rows={6}
                    className={fieldClasses('h-auto py-3')}
                    value={form.long_bio ?? ''}
                    onChange={(event) => setForm({ ...form, long_bio: event.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs text-muted-foreground">Location</span>
                  <input
                    className={fieldClasses()}
                    placeholder="Lagos, Nigeria"
                    value={form.location ?? ''}
                    onChange={(event) => setForm({ ...form, location: event.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs text-muted-foreground">Availability</span>
                  <input
                    className={fieldClasses()}
                    placeholder="Open to senior roles"
                    value={form.availability ?? ''}
                    onChange={(event) => setForm({ ...form, availability: event.target.value })}
                  />
                </label>
              </div>
            </Panel>

            <Panel className="p-7">
              <SectionLabel>Links</SectionLabel>
              <div className="grid gap-4 sm:grid-cols-2">
                {socialFields.map(({ key, label, icon: Icon, placeholder }) => (
                  <label key={key} className="block">
                    <span className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </span>
                    <input
                      className={fieldClasses()}
                      placeholder={placeholder}
                      value={form[key] ?? ''}
                      onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                    />
                  </label>
                ))}
              </div>
            </Panel>

            <Panel className="p-7">
              <SectionLabel>Account security</SectionLabel>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs text-muted-foreground">Current password</span>
                  <input
                    type="password"
                    className={fieldClasses()}
                    value={passwordForm.current}
                    onChange={(event) => setPasswordForm({ ...passwordForm, current: event.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs text-muted-foreground">New password</span>
                  <input
                    type="password"
                    className={fieldClasses()}
                    value={passwordForm.next}
                    onChange={(event) => setPasswordForm({ ...passwordForm, next: event.target.value })}
                  />
                </label>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <GhostButton type="button" onClick={updatePassword}>
                  Update password
                </GhostButton>
                <GhostButton
                  type="button"
                  onClick={async () => {
                    await auth.logoutAll();
                    toast.success('Signed out of every device');
                    window.location.href = '/auth';
                  }}
                >
                  <LogOut className="h-4 w-4" /> Sign out everywhere
                </GhostButton>
                <GhostButton type="button" onClick={exportData}>
                  <Download className="h-4 w-4" /> Export my data
                </GhostButton>
              </div>
              <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-5">
                <p className="flex items-center gap-2 text-sm font-medium text-rose-200">
                  <ShieldAlert className="h-4 w-4" /> Danger zone
                </p>
                <p className="mt-2 text-xs text-rose-100/70">
                  Deleting your account removes your profile, projects, posts, messages and sessions permanently.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="mt-4 inline-flex items-center gap-2 rounded-full border border-rose-400/30 px-4 py-2 text-xs font-medium text-rose-200 transition-colors hover:bg-rose-500/15"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete my account
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-white/10 bg-[hsl(240_28%_6%)]">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete everything?</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        This cannot be undone. Your portfolio will stop resolving immediately.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep my account</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={deleteAccount}
                        className="bg-rose-500 text-white hover:bg-rose-600"
                      >
                        Delete permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Panel>
          </form>

          {/* --------------------------------------------------------- aside */}
          <div className="space-y-8">
            <Panel className="p-7">
              <SectionLabel>Your handle</SectionLabel>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  portify.dev/
                </span>
                <input
                  value={handle}
                  onChange={(event) => void checkHandle(event.target.value.toLowerCase())}
                  className={fieldClasses('pl-[104px]')}
                  placeholder="your-handle"
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {handleState === 'checking' && 'Checking availability…'}
                  {handleState === 'available' && <span className="text-emerald-300">Available</span>}
                  {handleState === 'taken' && <span className="text-rose-300">Already taken</span>}
                  {handleState === 'idle' && '3–30 letters, numbers, dashes, underscores'}
                </span>
                <button
                  type="button"
                  onClick={claimHandle}
                  disabled={handleState === 'taken' || handle.length < 3}
                  className="rounded-full border border-white/12 px-4 py-1.5 text-xs transition-colors hover:border-primary/50 disabled:opacity-40"
                >
                  Claim
                </button>
              </div>
            </Panel>

            <Panel className="p-7">
              <SectionLabel>Visibility</SectionLabel>
              <button
                type="button"
                onClick={() => setForm({ ...form, is_public: !isPublic })}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-left"
              >
                <span>
                  <span className="block text-sm font-medium">{isPublic ? 'Public portfolio' : 'Private portfolio'}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {isPublic ? 'Anyone with your link can view it' : 'Only you can view it'}
                  </span>
                </span>
                <span
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    isPublic ? 'bg-primary' : 'bg-white/15'
                  }`}
                >
                  <motion.span
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${
                      isPublic ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </span>
              </button>
              <p className="mt-3 text-xs text-muted-foreground">
                Toggle visibility, then hit <span className="text-foreground">Save changes</span>.
              </p>
            </Panel>

            <Panel className="p-7">
              <SectionLabel>Launch checklist</SectionLabel>
              <ul className="space-y-3">
                {checklist.map((item) => (
                  <li key={item.label} className="flex items-center gap-3 text-sm">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        item.done
                          ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300'
                          : 'border-white/15 text-transparent'
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    <span className={item.done ? 'text-muted-foreground line-through' : 'text-foreground/90'}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 grid grid-cols-2 gap-3 text-center">
                {[
                  { label: 'Projects', value: dashboard?.counts.projects ?? 0, to: '/projects' },
                  { label: 'Skills', value: dashboard?.counts.skills ?? 0, to: '/skills' },
                  { label: 'Posts', value: dashboard?.counts.posts ?? 0, to: '/blog' },
                  { label: 'Followers', value: dashboard?.counts.followers ?? 0, to: '/discover' },
                ].map((tile) => (
                  <Link
                    key={tile.label}
                    to={tile.to}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-4 transition-colors hover:border-primary/40"
                  >
                    <p className="font-display text-xl font-semibold">{tile.value}</p>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{tile.label}</p>
                  </Link>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </Layout>
  );
}
