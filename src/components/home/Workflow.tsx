import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { UserPlus, Github, Wand2, Globe2 } from 'lucide-react';
import { Reveal } from '@/components/experience/Reveal';

const steps = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Claim your handle',
    body: 'Sign up in seconds. Your profile, starter sections and résumé scaffold are provisioned instantly.',
  },
  {
    icon: Github,
    step: '02',
    title: 'Import your work',
    body: 'Pull repositories straight from GitHub, or add projects by hand with tags, galleries and live links.',
  },
  {
    icon: Wand2,
    step: '03',
    title: 'Shape the story',
    body: 'Reorder sections, write your narrative, tune the theme and generate a matching résumé.',
  },
  {
    icon: Globe2,
    step: '04',
    title: 'Publish & be found',
    body: 'Your portfolio goes live at /your-handle with SEO, OG images and RSS — then the community discovers you.',
  },
];

export default function Workflow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start 60%', 'end 40%'] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });
  const height = useTransform(progress, [0, 1], ['0%', '100%']);

  return (
    <section ref={containerRef} className="relative mx-auto max-w-7xl px-6 py-28">
      <Reveal mode="blur" className="mb-20 max-w-2xl">
        <p className="eyebrow mb-4">The path</p>
        <h2 className="display-lg">
          From empty page to <span className="text-gradient-warm">live portfolio</span> in four moves.
        </h2>
      </Reveal>

      <div className="relative pl-6 md:pl-0">
        {/* rail */}
        <div className="absolute left-[7px] top-2 h-full w-px bg-white/10 md:left-[calc(50%-0.5px)]">
          <motion.div
            style={{ height: reduceMotion ? '100%' : height }}
            className="w-px bg-gradient-to-b from-[hsl(var(--violet))] via-[hsl(var(--cyan))] to-[hsl(var(--amber))]"
          />
        </div>

        <div className="space-y-16 md:space-y-24">
          {steps.map((step, index) => {
            const alignRight = index % 2 === 1;
            return (
              <Reveal
                key={step.step}
                mode={alignRight ? 'right' : 'left'}
                amount={0.4}
                className={`relative md:grid md:grid-cols-2 md:gap-16 ${alignRight ? '' : ''}`}
              >
                <div className={alignRight ? 'md:col-start-2 md:pl-14' : 'md:col-start-1 md:pr-14 md:text-right'}>
                  <div className="group relative">
                    <div className="flex items-center gap-3 md:justify-start">
                      <span className={`mono text-[10px] uppercase tracking-[0.3em] text-primary ${alignRight ? '' : 'md:order-2'}`}>
                        step {step.step}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight md:text-3xl">
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:inline-block">
                      {step.body}
                    </p>
                  </div>
                </div>

                {/* node */}
                <span className="absolute -left-[25px] top-1 flex h-4 w-4 items-center justify-center md:left-[calc(50%-8px)]">
                  <span className="absolute h-4 w-4 rounded-full bg-[hsl(240_30%_4%)]" />
                  <motion.span
                    className="absolute h-4 w-4 rounded-full border border-primary/40"
                    animate={reduceMotion ? undefined : { scale: [1, 1.8], opacity: [0.7, 0] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut', delay: index * 0.4 }}
                  />
                  <span className="relative h-2 w-2 rounded-full bg-gradient-to-br from-[hsl(var(--violet))] to-[hsl(var(--cyan))]" />
                </span>

                {/* icon flourish */}
                <div
                  className={`hidden md:flex ${
                    alignRight ? 'md:col-start-1 md:row-start-1 md:justify-end md:pr-14' : 'md:col-start-2 md:pl-14'
                  }`}
                >
                  <span className="panel flex h-16 w-16 items-center justify-center rounded-3xl text-primary transition-transform duration-700 ease-cinematic hover:-translate-y-1">
                    <step.icon className="h-6 w-6" />
                  </span>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
