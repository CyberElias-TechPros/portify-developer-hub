
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
}

export default function HelpTooltip({ content, side = "top", children, className = "" }: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className={`inline-flex cursor-help ${className}`}>
            {children || <InfoIcon className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />}
          </div>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
