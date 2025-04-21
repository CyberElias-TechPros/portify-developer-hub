
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReactNode } from "react";

interface HelpTooltipProps {
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  children?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function HelpTooltip({ 
  content, 
  side = "top", 
  children, 
  className = "",
  size = "md" 
}: HelpTooltipProps) {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className={`inline-flex cursor-help ${className}`}>
            {children || <InfoIcon className={`${sizeClasses[size]} text-muted-foreground hover:text-primary transition-colors`} />}
          </div>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
