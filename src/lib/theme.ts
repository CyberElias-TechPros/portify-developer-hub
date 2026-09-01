export type ThemePreference = "light" | "dark";

const THEME_EVENT = "portify-theme-change";
let volatileTheme: ThemePreference | null = null;

export function getThemePreference(fallback?: ThemePreference): ThemePreference {
  let storageAvailable = false;
  try {
    const stored = window.localStorage.getItem("theme");
    storageAvailable = true;
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
  if (!storageAvailable && volatileTheme) return volatileTheme;
  if (fallback) return fallback;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyThemePreference(theme: ThemePreference) {
  volatileTheme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    window.localStorage.setItem("theme", theme);
  } catch {
    // The class still applies when persistent storage is unavailable.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function subscribeToThemePreference(onChange: (theme: ThemePreference) => void) {
  const sync = () => onChange(getThemePreference());
  window.addEventListener(THEME_EVENT, sync);
  window.addEventListener("storage", sync);
  return () => {
    window.removeEventListener(THEME_EVENT, sync);
    window.removeEventListener("storage", sync);
  };
}
