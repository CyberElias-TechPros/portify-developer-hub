import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyThemePreference, getThemePreference, subscribeToThemePreference, type ThemePreference } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>("light");

  useEffect(() => {
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = getThemePreference(systemPrefersDark ? "dark" : "light");
    setTheme(nextTheme);
    applyThemePreference(nextTheme);
    return subscribeToThemePreference(setTheme);
  }, []);

  const toggleTheme = () => applyThemePreference(theme === "light" ? "dark" : "light");

  return (
    <Button type="button" variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full" aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}>
      {theme === "light" ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
      <span className="sr-only">{theme === "light" ? "Switch to dark mode" : "Switch to light mode"}</span>
    </Button>
  );
}
