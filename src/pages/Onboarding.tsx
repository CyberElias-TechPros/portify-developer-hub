import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  Compass,
  Github,
  Globe,
  Loader2,
  MapPin,
  Palette,
  Sparkles,
  Upload,
  User,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { GhostButton, GlowButton, Panel, SectionLabel, fieldClasses } from '@/components/ui-kit';
import { useAuth } from '@/hooks/useAuth';
import { api, uploadMedia } from '@/lib/api/client';
import { DEFAULT_THEME, THEME_PRESETS, applyTheme, saveTheme } from '@/lib/theme';
import usePageMeta from '@/hooks/usePageMeta';

type Intent = 'job' | 'freelance' | 'community' | 'personal';

const INTENTS: { id: Intent; label: string; blurb: string; icon: any }[] = [
  { id: 'job', label: 'Get hired', blurb: 'Recruiters should see outcomes fast — lead with projects and numbers.', icon: Briefcase },
  { id: 'freelance', label: 'Win clients', blurb: 'Proof of delivery, testimonials and a contact form that reaches you.', icon: Sparkles },
  { id: 'community', label: 'Build in public', blurb: 'Writing, reactions and a following that compounds over time.', icon: Users },
  { id: 'personal', label: 'Own my corner', blurb: 'A fast, beautiful home for everything you make — no algorithm.', icon: Compass },
];

const STEPS = ['Identity', 'Handle', 'Intent', 'Look'] as const;

export default function Onboarding() {
  usePageMeta({ title: 'Set up your studio · Portify', description: 'Claim your handle, pick an intent and a look — about a minute end to end.', path: '/onboarding' });

  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [handleState, setHandleState] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const [form, setForm] = useState({
    full_name: '',
    title: '',
    bio: '',
    location: '',
    github: '',
    website: '',
    username: '',
    intent: 'personal' as Intent,
    avatar_url: '',
  });
  const [accent, setAccent] = useState(DEFAULT_THEME.accent);

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      full_name: current.full_name || profile?.full_name || '',
      title: current.title || profile?.title || '',
      bio: current.bio || profile?.bio || '',
      location: current.location || profile?.location || '',
      github: current.github || profile?.github || '',
      website: current.website || profile?.website || '',
      username: current.username || profile?.username || '',
      avatar_url: current.avatar_url || profile?.avatar_url || '',
    }));
  }, [user, profile]);

  const preview = useMemo(
    () => ({
      name: form.full_name || 'Your name',
      title: form.title || 'What you do',
      handle: form.username || 'your-handle',
      bio: form.bio || 'A short line about the work you want to be known for.',
    }),
    [form]
  );

  useEffect(() => {
    const preset = THEME_PRESETS.find((item) => item.tokens.accent === accent);
    applyTheme({ ...DEFAULT_THEME, accent, secondary: preset?.tokens.secondary ?? DEFAULT_THEME.secondary });
  }, [accent]);

  const checkHandle = async (candidate: string) => {
    setForm((current) => ({ ...current, username: candidate }));
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(candidate)) {
      setHandleState('idle');
      return;
    }
    setHandleState('checking');
    const { data } = await api.get<{ available: boolean }>(`/api/usernames/check/${encodeURIComponent(candidate)}`);
    setHandleState(data?.available ? 'available' : 'taken');
  };

  const uploadAvatar = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    const { url, error } = await uploadMedia(file, 'avatar');
    setUploading(false);
    if (error || !url) {
      toast.error(error?.message ?? 'Upload failed');
      return;
    }
    setForm((current) => ({ ...current, avatar_url: url }));
    toast.success('Photo uploaded');
  };

  const persist = async (complete: boolean) => {
    setSaving(true);
    const { error } = await api.post('/api/onboarding', {
      full_name: form.full_name || undefined,
      title: form.title || undefined,
      bio: form.bio || undefined,
      location: form.location || undefined,
      github: form.github || undefined,
      website: form.website || undefined,
      username: form.username || undefined,
      avatar_url: form.avatar_url || undefined,
      accent,
      intent: form.intent,
      complete,
    });
    if (!error) {
      saveTheme({ ...DEFAULT_THEME, accent });
      const preset = THEME_PRESETS.find((item) => item.tokens.accent === accent);
      const existing = await api.get<any[]>(`/api/db/themes?f.user_id=eq.${user!.id}&limit=1`).catch(() => ({ data: [] }));
      const row = Array.isArray(existing.data) ? existing.data[0] : null;
      const payload = {
        name: 'Active theme',
        config: JSON.stringify({ ...DEFAULT_THEME, accent, secondary: preset?.tokens.secondary ?? DEFAULT_THEME.secondary }),
        is_active: 1,
        updated_at: new Date().toISOString(),
      };
      if (row) await api.patch(`/api/db/themes?f.id=eq.${row.id}`, payload);
      else await api.post('/api/db/themes', { rows: { ...payload, user_id: user!.id } });
      await refreshProfile();
    }
    setSaving(false);
    return error;
  };

  const next = async () => {
    const error = await persist(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const finish = async () => {
    const error = await persist(true);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Studio set up — go make something worth showing');
    navigate(`/${form.username || profile?.username || 'profile'}`, { replace: true });
  };

  if (!user) {
    return (
      <Layout>
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <Panel className="p-10">
            <User className="mx-auto h-5 w-5 text-primary" />
            <h1 className="mt-5 font-display text-2xl font-semibold">Set up your studio</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Create an account first — the setup wizard takes about a minute.
            </p>
            <Link to="/auth?mode=register" className="mt-6 inline-block">
              <GlowButton>Create your account</GlowButton>
            </Link>
          </Panel>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideAnimation>
      <div className="mx-auto max-w-5xl px-6 pb-24">
        {/* ------------------------------------------------------- progress */}
        <div className="mb-10 flex items-center gap-3">
          {STEPS.map((label, index) => (
            <div key={label} className="flex flex-1 items-center gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                    index < step
                      ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
                      : index === step
                        ? 'border-primary/50 bg-primary/15 text-primary'
                        : 'border-white/12 text-muted-foreground'
                  }`}
                >
                  {index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className={`text-xs ${index === step ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
              </div>
              {index < STEPS.length - 1 && (
                <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-white/5" />
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <Panel className="p-8">
                {step === 0 && (
                  <>
                    <SectionLabel>Step 1 · Identity</SectionLabel>
                    <h1 className="font-display text-2xl font-semibold tracking-tight">
                      Who should people meet?
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      This becomes the hero of your portfolio.
                    </p>

                    <div className="mt-7 space-y-5">
                      <div className="flex items-center gap-4">
                        <div
                          className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04]"
                          style={
                            form.avatar_url
                              ? { backgroundImage: `url(${form.avatar_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                              : undefined
                          }
                        >
                          {!form.avatar_url && (uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-5 w-5 text-muted-foreground" />)}
                        </div>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            aria-label="Upload profile photo"
                            className="absolute inset-0 cursor-pointer opacity-0"
                            onChange={(event) => void uploadAvatar(event.target.files?.[0])}
                          />
                          <GhostButton type="button" className="pointer-events-none">
                            <Upload className="h-4 w-4" /> Upload photo
                          </GhostButton>
                        </div>
                      </div>

                      <label className="block">
                        <span className="mb-2 block text-xs text-muted-foreground">Full name</span>
                        <input
                          className={fieldClasses()}
                          placeholder="Ada Lovelace"
                          value={form.full_name}
                          onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                        />
                      </label>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs text-muted-foreground">What you do</span>
                          <input
                            className={fieldClasses()}
                            placeholder="Frontend engineer · Design systems"
                            value={form.title}
                            onChange={(event) => setForm({ ...form, title: event.target.value })}
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" /> Location
                          </span>
                          <input
                            className={fieldClasses()}
                            placeholder="Lagos, Nigeria · Remote"
                            value={form.location}
                            onChange={(event) => setForm({ ...form, location: event.target.value })}
                          />
                        </label>
                      </div>

                      <label className="block">
                        <span className="mb-2 block text-xs text-muted-foreground">One-line bio</span>
                        <textarea
                          rows={3}
                          className={fieldClasses('h-auto py-3')}
                          placeholder="I build interfaces that make complex systems feel obvious."
                          value={form.bio}
                          onChange={(event) => setForm({ ...form, bio: event.target.value })}
                        />
                      </label>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <SectionLabel>Step 2 · Handle</SectionLabel>
                    <h1 className="font-display text-2xl font-semibold tracking-tight">Claim your address</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Your portfolio lives at <span className="mono text-foreground">portify.dev/{form.username || 'handle'}</span>
                    </p>

                    <div className="mt-7 space-y-5">
                      <label className="block">
                        <span className="mb-2 block text-xs text-muted-foreground">Handle</span>
                        <div className="relative">
                          <input
                            className={fieldClasses('pr-28')}
                            placeholder="ada"
                            value={form.username}
                            onChange={(event) => void checkHandle(event.target.value.trim())}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                            {handleState === 'checking' && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                            {handleState === 'available' && <span className="text-emerald-300">available</span>}
                            {handleState === 'taken' && <span className="text-rose-300">taken</span>}
                          </span>
                        </div>
                        <span className="mt-2 block text-[11px] text-muted-foreground">
                          3–30 characters — letters, numbers, dashes and underscores.
                        </span>
                      </label>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Github className="h-3 w-3" /> GitHub
                          </span>
                          <input
                            className={fieldClasses()}
                            placeholder="https://github.com/ada"
                            value={form.github}
                            onChange={(event) => setForm({ ...form, github: event.target.value })}
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Globe className="h-3 w-3" /> Website
                          </span>
                          <input
                            className={fieldClasses()}
                            placeholder="https://ada.dev"
                            value={form.website}
                            onChange={(event) => setForm({ ...form, website: event.target.value })}
                          />
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <SectionLabel>Step 3 · Intent</SectionLabel>
                    <h1 className="font-display text-2xl font-semibold tracking-tight">What is this for?</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      We shape your starting sections around the answer.
                    </p>
                    <div className="mt-7 grid gap-3 sm:grid-cols-2">
                      {INTENTS.map((intent) => (
                        <button
                          key={intent.id}
                          onClick={() => setForm({ ...form, intent: intent.id })}
                          className={`rounded-2xl border p-5 text-left transition-colors ${
                            form.intent === intent.id
                              ? 'border-primary/50 bg-primary/[0.08]'
                              : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                          }`}
                        >
                          <intent.icon className="h-4 w-4 text-primary" />
                          <p className="mt-3 text-sm font-medium">{intent.label}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{intent.blurb}</p>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <SectionLabel>Step 4 · Look</SectionLabel>
                    <h1 className="font-display text-2xl font-semibold tracking-tight">Pick your accent</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Motion, depth and typography stay cinematic — this sets the colour temperature.
                    </p>
                    <div className="mt-7 grid gap-3 sm:grid-cols-3">
                      {THEME_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => setAccent(preset.tokens.accent)}
                          className={`rounded-2xl border p-4 text-left transition-colors ${
                            accent === preset.tokens.accent
                              ? 'border-primary/50 bg-primary/[0.08]'
                              : 'border-white/10 hover:border-white/25'
                          }`}
                        >
                          <span className="flex gap-1.5">
                            <span className="h-5 w-5 rounded-full" style={{ background: `hsl(${preset.tokens.accent})` }} />
                            <span className="h-5 w-5 rounded-full" style={{ background: `hsl(${preset.tokens.secondary})` }} />
                          </span>
                          <p className="mt-3 text-xs">{preset.name}</p>
                        </button>
                      ))}
                    </div>
                    <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                      <Palette className="h-3.5 w-3.5" /> You can fine-tune everything later in the theme studio.
                    </p>
                  </>
                )}

                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
                  <GhostButton
                    onClick={() => (step === 0 ? navigate('/profile') : setStep(step - 1))}
                    disabled={saving}
                  >
                    <ArrowLeft className="h-4 w-4" /> {step === 0 ? 'Skip for now' : 'Back'}
                  </GhostButton>

                  {step < STEPS.length - 1 ? (
                    <GlowButton onClick={next} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                      Continue
                    </GlowButton>
                  ) : (
                    <GlowButton onClick={finish} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Finish setup
                    </GlowButton>
                  )}
                </div>
              </Panel>
            </motion.div>
          </AnimatePresence>

          {/* ------------------------------------------------------- preview */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Panel className="overflow-hidden">
              <div className="relative h-40 overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(80% 140% at 20% 0%, hsl(${accent} / .35), transparent 60%), radial-gradient(70% 120% at 85% 10%, hsl(var(--cyan) / .28), transparent 60%)`,
                  }}
                />
                <div className="absolute inset-0 grid-overlay opacity-40" />
                <div className="relative flex h-full items-end p-6">
                  <p className="font-display text-lg font-semibold">Live preview</p>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.05] font-display text-lg font-semibold"
                    style={
                      form.avatar_url
                        ? { backgroundImage: `url(${form.avatar_url})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' }
                        : undefined
                    }
                  >
                    {preview.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-semibold">{preview.name}</p>
                    <p className="truncate text-xs text-secondary">{preview.title}</p>
                    <p className="mono mt-1 text-[10px] text-muted-foreground">portify.dev/{preview.handle}</p>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{preview.bio}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span
                    className="rounded-full px-4 py-2 text-xs font-semibold"
                    style={{ background: `linear-gradient(90deg, hsl(${accent}), hsl(var(--cyan)))`, color: 'hsl(240 30% 4%)' }}
                  >
                    Get in touch
                  </span>
                  <span className="rounded-full border border-white/12 px-4 py-2 text-xs">View work</span>
                </div>
                <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
                  Starter sections, a theme record and a résumé are provisioned automatically the moment your account
                  is created — you can edit or hide any of them.
                </p>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </Layout>
  );
}
