import { animate, motion, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api/client';

interface PublicStats {
  portfolios: number;
  projects: number;
  posts: number;
  reactions: number;
  skills: number;
}

function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, value, reduceMotion]);

  return (
    <span ref={ref} className="font-display text-4xl font-semibold tracking-tight md:text-6xl">
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function StatsBand() {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    void api.get<PublicStats>('/api/stats/public').then(({ data }) => setStats(data ?? null));
  }, []);

  const items = [
    { label: 'public portfolios', value: stats?.portfolios ?? 0 },
    { label: 'projects published', value: stats?.projects ?? 0 },
    { label: 'skills documented', value: stats?.skills ?? 0 },
    { label: 'reactions received', value: stats?.reactions ?? 0 },
  ];

  return (
    <section className="relative mx-auto max-w-7xl px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="panel relative overflow-hidden px-8 py-12 md:px-14"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_50%_0%,hsl(var(--violet)/.16),transparent_60%)]" />
        <div className="relative grid grid-cols-2 gap-10 md:grid-cols-4">
          {items.map((item) => (
            <div key={item.label}>
              <Counter value={item.value} />
              <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
