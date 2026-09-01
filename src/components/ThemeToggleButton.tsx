import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyThemePreference, getThemePreference, subscribeToThemePreference, type ThemePreference } from "@/lib/theme";

export function ThemeToggleButton({ className = "", showLabel = false }: { className?: string; showLabel?: boolean }) {
  const [theme, setTheme] = useState<ThemePreference>("light");

  useEffect(() => {
    const nextTheme = getThemePreference();
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    return subscribeToThemePreference(setTheme);
  }, []);

  const toggleTheme = () => applyThemePreference(theme === "light" ? "dark" : "light");
  const label = theme === "light" ? "Switch to dark mode" : "Switch to light mode";

  return (
    <Button type="button" variant="outline" size={showLabel ? "default" : "icon"} onClick={toggleTheme} className={`relative rounded-full transition-all hover:scale-110 ${className}`} title={label} aria-label={label}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" aria-hidden="true" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" aria-hidden="true" />
      {showLabel && <span className="ml-2">{theme === "light" ? "Dark Mode" : "Light Mode"}</span>}
      <span className="sr-only">{label}</span>
    </Button>
  );
}
