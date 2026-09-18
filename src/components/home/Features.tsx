import { motion } from 'framer-motion';
import {
  Boxes,
  LineChart,
  Palette,
  Rocket,
  Search,
  Users,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal, RevealGroup, RevealItem } from '@/components/experience/Reveal';
import TiltCard from '@/components/experience/TiltCard';

const features = [
  {
    icon: Boxes,
    title: 'One source of truth',
    body: 'Projects, skills, experience, education and writing live in one relational model — update once, everywhere reflects it.',
    span: 'lg:col-span-3',
    accent: 'from-[hsl(var(--violet)/.22)]',
  },
  {
    icon: Rocket,
    title: 'Rendered at the edge',
    body: 'Cloudflare Workers + D1 keep every page fast from Lagos to Lisbon. Public pages are cached, private ones never are.',
    span: 'lg:col-span-3',
    accent: 'from-[hsl(var(--cyan)/.2)]',
  },
  {
    icon: Palette,
    title: 'Motion-first theming',
    body: 'Shift the accent, radius and motion curve; your portfolio re-tunes itself without touching a stylesheet.',
    span: 'lg:col-span-2',
    accent: 'from-[hsl(var(--amber)/.18)]',
  },
  {
    icon: LineChart,
    title: 'Signals, not vanity',
    body: 'Profile views, reactions, follows and endorsement counts — measured from real interactions.',
    span: 'lg:col-span-2',
    accent: 'from-[hsl(var(--rose)/.18)]',
  },
  {
    icon: Users,
    title: 'A community that responds',
    body: 'Follow developers, react to work, leave comments and endorse the skills you have seen in the wild.',
    span: 'lg:col-span-2',
    accent: 'from-[hsl(var(--violet)/.2)]',
  },
];

export default function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-7xl px-6 py-28">
      <Reveal mode="blur" className="mb-16 max-w-3xl">
        <p className="eyebrow mb-4">Everything included</p>
        <h2 className="display-lg">
          Not a template. <span className="text-gradient">A studio.</span>
        </h2>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
          The whole pipeline — capture your work, shape the narrative, publish it beautifully, and watch what people
          actually respond to.
        </p>
      </Reveal>

      <RevealGroup className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-6" stagger={0.08}>
        {features.map((feature) => (
          <RevealItem key={feature.title} mode="rise" className={feature.span}>
            <TiltCard intensity={5} className="h-full">
              <div className="panel group relative h-full overflow-hidden p-7 transition-colors duration-500 hover:border-white/15">
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.accent} via-transparent to-transparent opacity-70`} />
                <div className="relative">
                  <span className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-primary">
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-lg font-semibold tracking-tight">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
                </div>
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
                  animate={{ opacity: [0.35, 0.7, 0.35] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </TiltCard>
          </RevealItem>
        ))}

        <RevealItem mode="rise" className="lg:col-span-2">
          <Link to="/community" className="block h-full">
            <div className="panel group relative flex h-full flex-col justify-between overflow-hidden p-7">
              <div className="relative">
                <span className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-secondary">
                  <Search className="h-5 w-5" />
                </span>
                <h3 className="font-display text-lg font-semibold tracking-tight">Discoverable by design</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Sitemaps, RSS and per-handle OG images ship automatically — your work is findable the moment you
                  publish.
                </p>
              </div>
              <span className="relative mt-8 inline-flex items-center gap-2 text-sm font-medium text-primary">
                See the community
                <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        </RevealItem>
      </RevealGroup>
    </section>
  );
}
