import { useReducedMotion } from 'framer-motion';

const ROW_ONE = [
  'TypeScript',
  'React',
  'Rust',
  'Go',
  'Python',
  'Postgres',
  'Cloudflare Workers',
  'Tailwind',
  'Node.js',
  'Kubernetes',
];

const ROW_TWO = [
  'Design systems',
  'WebGL',
  'GraphQL',
  'Edge computing',
  'D1',
  'R2',
  'Framer Motion',
  'Vite',
  'Accessibility',
  'Performance',
];

function Row({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="marquee-mask flex overflow-hidden py-3">
      <div
        className={`flex shrink-0 items-center gap-10 pr-10 ${reduceMotion ? '' : reverse ? 'animate-marquee-slow [animation-direction:reverse]' : 'animate-marquee'}`}
      >
        {[...items, ...items].map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center gap-10 whitespace-nowrap">
            <span className="font-display text-lg font-medium tracking-tight text-foreground/45 transition-colors hover:text-foreground/90 md:text-2xl">
              {item}
            </span>
            <span className="h-1 w-1 rounded-full bg-primary/60" />
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Marquee() {
  return (
    <section className="relative border-y border-white/[0.07] py-6">
      <Row items={ROW_ONE} />
      <Row items={ROW_TWO} reverse />
    </section>
  );
}
