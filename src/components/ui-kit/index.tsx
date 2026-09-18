import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/experience/Reveal';

/** Editorial page header used by every studio page. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <Reveal mode="blur" className={cn('mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end', className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        <h1 className="display-lg">{title}</h1>
        {description && <p className="mt-5 text-base leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </Reveal>
  );
}

/** Frosted surface with a hairline border and optional hover lift. */
export function Panel({
  children,
  className,
  interactive = false,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  as?: 'div' | 'section' | 'article' | 'li';
}) {
  return (
    <Tag
      className={cn(
        'panel relative',
        interactive && 'transition-all duration-500 ease-cinematic hover:-translate-y-1 hover:border-white/15',
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('eyebrow mb-5', className)}>{children}</p>;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: any;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('panel flex flex-col items-center gap-4 px-8 py-16 text-center', className)}>
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-primary">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <p className="font-display text-xl font-semibold tracking-tight">{title}</p>
      {description && <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  delay = 0,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: any;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="panel group relative overflow-hidden p-5"
    >
      <div className="flex items-start justify-between">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-primary/80" />}
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      <span className="pointer-events-none absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-0" />
    </motion.div>
  );
}

export function Tag({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode;
  tone?: 'default' | 'primary' | 'secondary' | 'warm';
  className?: string;
}) {
  const tones = {
    default: 'border-white/12 text-muted-foreground',
    primary: 'border-primary/40 bg-primary/10 text-primary',
    secondary: 'border-secondary/40 bg-secondary/10 text-secondary',
    warm: 'border-amber-300/30 bg-amber-300/10 text-amber-200',
  } as const;
  return (
    <span
      className={cn(
        'mono inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]', className)}>
      <div className="animate-shimmer absolute inset-0" />
    </div>
  );
}

export function ErrorNote({ message, className }: { message?: string | null; className?: string }) {
  if (!message) return null;
  return (
    <p className={cn('rounded-xl border border-rose-400/25 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200', className)}>
      {message}
    </p>
  );
}

/** Primary gradient call-to-action, styled once and reused everywhere. */
export function GlowButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...props}
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[hsl(var(--violet))] to-[hsl(var(--cyan))] px-5 py-2.5 text-sm font-semibold text-[hsl(240_30%_4%)] shadow-glow transition-transform duration-500 ease-cinematic hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100',
        className
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full border border-white/12 px-5 py-2.5 text-sm font-medium text-foreground/90 transition-colors duration-300 hover:border-primary/50 hover:bg-white/[0.04] disabled:opacity-50',
        className
      )}
    >
      {children}
    </button>
  );
}

export function fieldClasses(className?: string) {
  return cn(
    'h-11 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60',
    className
  );
}
