import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SkillBarProps { name: string; percentage: number; color?: string; delay?: number; className?: string; }
export default function SkillBar({ name, percentage, color = "bg-primary", delay = 0, className }: SkillBarProps) {
  const progressRef = useRef<HTMLDivElement>(null); const containerRef = useRef<HTMLDivElement>(null); const value = Math.max(0, Math.min(100, percentage));
  useEffect(() => {
    const container = containerRef.current; const progress = progressRef.current;
    if (!container || !progress || typeof IntersectionObserver === "undefined") { if (progress) progress.style.width = `${value}%`; return; }
    let timeout: number | undefined;
    const observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { timeout = window.setTimeout(() => { progress.style.width = `${value}%`; }, delay); observer.disconnect(); } }, { threshold: 0.1 });
    observer.observe(container);
    return () => { observer.disconnect(); if (timeout !== undefined) window.clearTimeout(timeout); };
  }, [delay, value]);
  return <div ref={containerRef} className={cn("mb-4", className)}><div className="mb-1 flex justify-between"><span className="font-medium">{name}</span><span className="text-sm text-muted-foreground">{value}%</span></div><div className="skill-bar" role="progressbar" aria-label={`${name} proficiency`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><div ref={progressRef} className={`skill-progress ${color}`} /></div></div>;
}
