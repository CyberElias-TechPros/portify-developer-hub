import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Reveal } from "@/components/experience/Reveal";
import { toast } from 'sonner';

export default function CtaFinale() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const reduceMotion = useReducedMotion();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Enter a valid email address');
      return;
    }
    setStatus('loading');
    const { error } = await api.post('/api/newsletter', { email });
    if (error) {
      toast.error(error.message || 'Could not subscribe right now');
      setStatus('idle');
      return;
    }
    setStatus('done');
    toast.success('You are on the list');
  };

  return (
    <section className="relative mx-auto max-w-7xl px-6 py-32">
      <Reveal mode="scale">
        <div className="panel relative overflow-hidden px-8 py-20 text-center md:px-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_100%_at_50%_0%,hsl(var(--violet)/.28),transparent_65%),radial-gradient(50%_80%_at_80%_100%,hsl(var(--cyan)/.18),transparent_65%)]" />
          <div className="pointer-events-none absolute inset-0 grid-overlay opacity-40" />

          <motion.span
            aria-hidden
            className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-[hsl(var(--rose)/.18)] blur-3xl"
            animate={reduceMotion ? undefined : { y: [0, 26, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative mx-auto max-w-3xl">
            <span className="glass mx-auto mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                free forever plan
              </span>
            </span>

            <h2 className="display-lg">
              Your next role is one <span className="text-gradient">portfolio</span> away.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Join the developers turning scattered repositories into a single, deliberate story.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/auth?mode=register"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[hsl(var(--violet))] to-[hsl(var(--cyan))] px-7 py-3.5 text-sm font-semibold text-[hsl(240_30%_4%)] shadow-glow transition-transform duration-500 ease-cinematic hover:scale-[1.03]"
              >
                Start building — it's free
                <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
            </div>

            <form onSubmit={submit} className="mx-auto mt-12 flex max-w-md items-center gap-2">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.dev"
                disabled={status !== 'idle'}
                className="h-12 flex-1 rounded-full border border-white/12 bg-white/[0.04] px-5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60"
              />
              <button
                type="submit"
                disabled={status !== 'idle'}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/12 px-5 text-sm font-medium transition-colors hover:border-primary/50 disabled:opacity-60"
              >
                {status === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : status === 'done' ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : null}
                {status === 'done' ? 'Subscribed' : 'Get updates'}
              </button>
            </form>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Occasional product notes. No spam, unsubscribe anytime.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
