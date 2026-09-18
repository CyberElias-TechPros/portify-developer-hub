export interface ThemeTokens {
  accent: string; // hsl triplet, e.g. "258 90% 66%"
  secondary: string;
  radius: number; // rem
  typography: 'inter' | 'sora' | 'mono';
  motion: 'cinematic' | 'subtle' | 'off';
  grain: boolean;
  glow: number; // 0 – 1
}

export const DEFAULT_THEME: ThemeTokens = {
  accent: '258 90% 66%',
  secondary: '189 94% 55%',
  radius: 1,
  typography: 'sora',
  motion: 'cinematic',
  grain: true,
  glow: 0.35,
};

export const THEME_PRESETS: { id: string; name: string; tokens: Partial<ThemeTokens> }[] = [
  { id: 'violet-dusk', name: 'Violet Dusk', tokens: { accent: '258 90% 66%', secondary: '189 94% 55%' } },
  { id: 'ember', name: 'Ember', tokens: { accent: '14 92% 60%', secondary: '42 96% 62%' } },
  { id: 'emerald', name: 'Emerald Circuit', tokens: { accent: '160 84% 45%', secondary: '190 90% 55%' } },
  { id: 'rose-noir', name: 'Rose Noir', tokens: { accent: '330 88% 62%', secondary: '270 80% 68%' } },
  { id: 'mono', name: 'Monochrome', tokens: { accent: '220 12% 78%', secondary: '220 10% 55%' } },
];

const STORAGE_KEY = 'portify.theme';

export function loadTheme(): ThemeTokens {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    return { ...DEFAULT_THEME, ...(JSON.parse(raw) as Partial<ThemeTokens>) };
  } catch {
    return DEFAULT_THEME;
  }
}

function hexToHslTriplet(hex: string): string | null {
  const normalised = hex.trim().replace('#', '');
  if (![3, 6].includes(normalised.length)) return null;
  const expanded =
    normalised.length === 3
      ? normalised
          .split('')
          .map((char) => char + char)
          .join('')
      : normalised;
  const r = parseInt(expanded.slice(0, 2), 16) / 255;
  const g = parseInt(expanded.slice(2, 4), 16) / 255;
  const b = parseInt(expanded.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Accepts either an hsl triplet ("258 90% 66%") or a hex string. */
export function normaliseColour(input: string): string {
  if (!input) return DEFAULT_THEME.accent;
  if (input.startsWith('#')) return hexToHslTriplet(input) ?? DEFAULT_THEME.accent;
  const cleaned = input.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.split(' ').length >= 3 ? cleaned : DEFAULT_THEME.accent;
}

export function applyTheme(tokens: ThemeTokens) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--primary', tokens.accent);
  root.style.setProperty('--ring', tokens.accent);
  root.style.setProperty('--violet', tokens.accent);
  root.style.setProperty('--secondary', tokens.secondary);
  root.style.setProperty('--cyan', tokens.secondary);
  root.style.setProperty('--radius', `${tokens.radius}rem`);
  root.style.setProperty('--glow', `${tokens.glow}`);
  root.dataset.typography = tokens.typography;
  root.dataset.motion = tokens.motion;
  root.dataset.grain = String(tokens.grain);

  if (tokens.typography === 'inter') {
    root.style.setProperty('--font-display', '"Inter", ui-sans-serif, system-ui');
  } else if (tokens.typography === 'mono') {
    root.style.setProperty('--font-display', '"JetBrains Mono", ui-monospace, monospace');
  } else {
    root.style.setProperty('--font-display', '"Sora", "Inter", ui-sans-serif, system-ui');
  }
}

export function saveTheme(tokens: ThemeTokens, _persistRemotely = false) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    window.dispatchEvent(new CustomEvent('portify:theme', { detail: tokens }));
  }
  applyTheme(tokens);
}
