
import { useEffect, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface SkillBarProps {
  name: string;
  percentage: number;
  color?: string;
  delay?: number;
  className?: string;
}

const SkillBar = ({ 
  name, 
  percentage, 
  color = "bg-primary", 
  delay = 0,
  className 
}: SkillBarProps) => {
  const progressRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && progressRef.current) {
            setTimeout(() => {
              if (progressRef.current) {
                progressRef.current.style.width = `${percentage}%`;
              }
            }, delay);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [percentage, delay]);

  return (
    <div ref={containerRef} className={cn("mb-4", className)}>
      <div className="flex justify-between mb-1">
        <span className="font-medium">{name}</span>
        <span className="text-sm text-muted-foreground">{percentage}%</span>
      </div>
      <div className="skill-bar">
        <div
          ref={progressRef}
          className={`skill-progress ${color}`}
        ></div>
      </div>
    </div>
  );
};

export default SkillBar;
