import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Loader2, Palette, RotateCcw, Save, Sparkles, Type, Zap } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { GhostButton, GlowButton, PageHeader, Panel, SectionLabel, fieldClasses } from '@/components/ui-kit';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/client';
import {
  DEFAULT_THEME,
  THEME_PRESETS,
  applyTheme,
  loadTheme,
  normaliseColour,
  saveTheme,
  type ThemeTokens,
} from '@/lib/theme';

export default function ThemeCustomizer() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<ThemeTokens>(DEFAULT_THEME);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = loadTheme();
    setTokens(stored);
    if (user) {
      // Prefer the theme saved against the account.
      void api
        .get<any[]>('/api/db/themes?f.is_active=eq.1&limit=1')
        .then(({ data }) => {
          const row = Array.isArray(data) ? data[0] : null;
          if (!row?.config) return;
          try {
            const parsed = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
            const merged = { ...DEFAULT_THEME, ...parsed };
            setTokens(merged);
            applyTheme(merged);
          } catch {
            /* ignore malformed config */
          }
        });
    }
  }, [user]);

  const update = (patch: Partial<ThemeTokens>, live = true) => {
    const next = { ...tokens, ...patch };
    setTokens(next);
    if (live) applyTheme(next);
  };

  const persist = async () => {
    setSaving(true);
    saveTheme(tokens);
    if (user) {
      const payload = {
        name: 'Active theme',
        config: JSON.stringify(tokens),
        is_active: 1,
        updated_at: new Date().toISOString(),
      };
      const existing = await api.get<any[]>(`/api/db/themes?f.user_id=eq.${user.id}&limit=1`);
      const row = Array.isArray(existing.data) ? existing.data[0] : null;
      const { error } = row
        ? await api.patch(`/api/db/themes?f.id=eq.${row.id}`, payload)
        : await api.post('/api/db/themes', { rows: { ...payload, user_id: user.id } });
      if (error) {
        setSaving(false);
        toast.error(error.message);
        return;
      }
    }
    setSaving(false);
    toast.success('Theme saved — this is how your portfolio renders now');
  };

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 pb-24">
        <PageHeader
          eyebrow="Theme studio"
          title={
            <>
              Tune the <span className="text-gradient">atmosphere.</span>
            </>
          }
          description="Colour, radius and motion are first-class design tokens here — adjust them and watch the whole experience respond instantly."
          actions={
            <>
              <GhostButton
                onClick={() => {
                  setTokens(DEFAULT_THEME);
                  applyTheme(DEFAULT_THEME);
                  toast.info('Reset to the default look');
                }}
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </GhostButton>
              <GlowButton onClick={persist} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save theme
              </GlowButton>
            </>
          }
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          {/* ------------------------------------------------------ controls */}
          <div className="space-y-6">
            <Panel className="p-7">
              <SectionLabel>Presets</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                {THEME_PRESETS.map((preset) => {
                  const active =
                    tokens.accent === preset.tokens.accent && tokens.secondary === preset.tokens.secondary;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => update(preset.tokens)}
                      className={`group flex items-center justify-between rounded-2xl border p-4 text-left transition-colors ${
                        active ? 'border-primary/50 bg-primary/[0.08]' : 'border-white/10 hover:border-white/25'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium">{preset.name}</p>
                        <div className="mt-2 flex gap-1.5">
                          <span
                            className="h-4 w-4 rounded-full border border-white/20"
                            style={{ background: `hsl(${preset.tokens.accent})` }}
                          />
                          <span
                            className="h-4 w-4 rounded-full border border-white/20"
                            style={{ background: `hsl(${preset.tokens.secondary})` }}
                          />
                        </div>
                      </div>
                      {active && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </Panel>

            <Panel className="p-7">
              <SectionLabel>Colours</SectionLabel>
              <div className="space-y-5">
                {(
                  [
                    { key: 'accent' as const, label: 'Accent', icon: Palette },
                    { key: 'secondary' as const, label: 'Secondary', icon: Sparkles },
                  ]
                ).map(({ key, label, icon: Icon }) => (
                  <div key={key}>
                    <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" /> {label}
                      </span>
                      <span className="mono">{tokens[key]}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={`#${hslTripletToHex(tokens[key])}`}
                        onChange={(event) => update({ [key]: normaliseColour(event.target.value) } as Partial<ThemeTokens>)}
                        className="h-10 w-14 cursor-pointer rounded-xl border border-white/15 bg-transparent"
                      />
                      <input
                        className={fieldClasses('font-mono text-xs')}
                        value={tokens[key]}
                        onChange={(event) =>
                          update({ [key]: normaliseColour(event.target.value) } as Partial<ThemeTokens>, false)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="p-7">
              <SectionLabel>Form & motion</SectionLabel>
              <div className="space-y-6">
                <div>
                  <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Corner radius</span>
                    <span className="mono">{tokens.radius}rem</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.05}
                    value={tokens.radius}
                    onChange={(event) => update({ radius: Number(event.target.value) })}
                    className="w-full accent-[hsl(var(--violet))]"
                  />
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Glow strength</span>
                    <span className="mono">{tokens.glow.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={tokens.glow}
                    onChange={(event) => update({ glow: Number(event.target.value) })}
                    className="w-full accent-[hsl(var(--violet))]"
                  />
                </div>

                <div>
                  <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Type className="h-3.5 w-3.5" /> Display typography
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['sora', 'inter', 'mono'] as const).map((option) => (
                      <button
                        key={option}
                        onClick={() => update({ typography: option })}
                        className={`rounded-xl border px-3 py-2.5 text-xs capitalize transition-colors ${
                          tokens.typography === option
                            ? 'border-primary/50 bg-primary/10 text-primary'
                            : 'border-white/10 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap className="h-3.5 w-3.5" /> Motion intensity
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['cinematic', 'subtle', 'off'] as const).map((option) => (
                      <button
                        key={option}
                        onClick={() => update({ motion: option })}
                        className={`rounded-xl border px-3 py-2.5 text-xs capitalize transition-colors ${
                          tokens.motion === option
                            ? 'border-primary/50 bg-primary/10 text-primary'
                            : 'border-white/10 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
                  Film grain overlay
                  <input
                    type="checkbox"
                    checked={tokens.grain}
                    onChange={(event) => update({ grain: event.target.checked })}
                    className="h-4 w-4 accent-[hsl(var(--violet))]"
                  />
                </label>
              </div>
            </Panel>
          </div>

          {/* ------------------------------------------------------- preview */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Panel className="overflow-hidden">
              <div className="relative h-44 overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(80% 140% at 20% 0%, hsl(${tokens.accent} / .45), transparent 60%), radial-gradient(70% 120% at 85% 10%, hsl(${tokens.secondary} / .35), transparent 60%)`,
                  }}
                />
                <div className="absolute inset-0 grid-overlay opacity-40" />
                <div className="relative flex h-full items-end p-6">
                  <div>
                    <div
                      className="mb-3 flex h-11 w-11 items-center justify-center text-sm font-bold"
                      style={{
                        borderRadius: `${tokens.radius}rem`,
                        background: `linear-gradient(135deg, hsl(${tokens.accent}), hsl(${tokens.secondary}))`,
                        color: 'hsl(240 30% 4%)',
                      }}
                    >
                      P
                    </div>
                    <p className="font-display text-lg font-semibold">Preview mode</p>
                    <p className="text-xs text-muted-foreground">
                      radius {tokens.radius}rem · {tokens.typography} · {tokens.motion}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div className="flex flex-wrap gap-2">
                  <span
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold"
                    style={{
                      borderRadius: `${tokens.radius}rem`,
                      background: `linear-gradient(90deg, hsl(${tokens.accent}), hsl(${tokens.secondary}))`,
                      color: 'hsl(240 30% 4%)',
                      boxShadow: `0 20px 60px -30px hsl(${tokens.accent} / ${tokens.glow + 0.3})`,
                    }}
                  >
                    Primary action
                  </span>
                  <span
                    className="border border-white/12 px-4 py-2 text-xs"
                    style={{ borderRadius: `${tokens.radius}rem` }}
                  >
                    Secondary
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[68, 92, 45].map((value, index) => (
                    <div
                      key={index}
                      className="border border-white/[0.08] bg-white/[0.03] p-3"
                      style={{ borderRadius: `${tokens.radius}rem` }}
                    >
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">metric</p>
                      <p className="mt-1 font-display text-lg font-semibold">{value}%</p>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full"
                          style={{
                            background: `linear-gradient(90deg, hsl(${tokens.accent}), hsl(${tokens.secondary}))`,
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${value}%` }}
                          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className="border border-white/[0.08] bg-white/[0.02] p-4 text-xs leading-relaxed text-muted-foreground"
                  style={{ borderRadius: `${tokens.radius}rem` }}
                >
                  Every surface in the app — cards, dialogs, meters, navigation — reads from the same token set, so one
                  change here propagates everywhere.
                </div>

                {user && (
                  <p className="text-[11px] text-muted-foreground">
                    Saved themes are stored on your account and applied the next time you sign in.
                  </p>
                )}
              </div>
            </Panel>

            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <Link to="/sections" className="hover:text-foreground underline-sweep">
                Manage portfolio sections
              </Link>
              <span className="mono">theme tokens persisted to d1</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

/** "#rrggbb" for an <input type="color"> from an hsl triplet. */
function hslTripletToHex(triplet: string): string {
  const match = triplet.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!match) return '7c5cff';
  const h = Number(match[1]) / 360;
  const s = Number(match[2]) / 100;
  const l = Number(match[3]) / 100;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + h * 12) % 12;
    const value = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * value)
      .toString(16)
      .padStart(2, '0');
  };
  return `${channel(0)}${channel(8)}${channel(4)}`;
}
