import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Github, Sparkles, Star, Users, Zap } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PublicStats {
  portfolios: number;
  projects: number;
  posts: number;
  reactions: number;
  skills: number;
}

interface FeaturedPerson {
  id: string;
  username: string;
  full_name?: string | null;
  display_name?: string | null;
  title?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  follower_count?: number;
  project_count?: number;
  skill_count?: number;
}

const HEADLINE = ['Build', 'a', 'portfolio', 'that', 'moves', 'people.'];

export default function Hero() {
  const reduceMotion = useReducedMotion();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [people, setPeople] = useState<FeaturedPerson[]>([]);
  const [spotlight, setSpotlight] = useState(0);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 700], [0, reduceMotion ? 0 : 120]);
  const heroOpacity = useTransform(scrollY, [0, 460], [1, 0.25]);

  useEffect(() => {
    void api.get<PublicStats>('/api/stats/public').then(({ data }) => setStats(data ?? null));
    void api
      .get<{ people: FeaturedPerson[] }>('/api/community/featured?limit=5')
      .then(({ data }) => setPeople(data?.people ?? []));
  }, []);

  useEffect(() => {
    if (people.length < 2 || reduceMotion) return;
    const timer = setInterval(() => setSpotlight((index) => (index + 1) % people.length), 6200);
    return () => clearInterval(timer);
  }, [people.length, reduceMotion]);

  const active = people[spotlight];
  const proofStats = useMemo(
    () => [
      { label: 'Portfolios', value: stats?.portfolios ?? 0, icon: Users },
      { label: 'Projects shipped', value: stats?.projects ?? 0, icon: Github },
      { label: 'Reactions', value: stats?.reactions ?? 0, icon: Star },
    ],
    [stats]
  );

  return (
    <section className="relative isolate overflow-hidden px-6 pb-24 pt-16 lg:pb-32 lg:pt-24">
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
        {/* ------------------------------------------------------------ copy */}
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="glass mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              edge-rendered portfolios · cloudflare d1
            </span>
          </motion.div>

          <h1 className="display-xl max-w-[16ch]">
            {HEADLINE.map((word, index) => (
              <motion.span
                key={word + index}
                initial={{ opacity: 0, y: 40, filter: 'blur(14px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.95, delay: 0.12 + index * 0.07, ease: [0.16, 1, 0.3, 1] }}
                className="mr-[0.28em] inline-block"
              >
                {index >= 5 ? <span className="text-gradient">{word}</span> : word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.62, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground"
          >
            Portify is the studio where developers write once and ship everywhere: projects, skills, writing and
            experience rendered as one cinematic, living portfolio — at the edge.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.74, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/auth?mode=register"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[hsl(var(--violet))] via-[hsl(var(--violet))] to-[hsl(var(--cyan))] px-7 py-3.5 text-sm font-semibold text-[hsl(240_30%_4%)] shadow-glow transition-transform duration-500 ease-cinematic hover:scale-[1.03]"
            >
              <Sparkles className="h-4 w-4" />
              Claim your handle
              <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
            <Link
              to="/discover"
              className="group inline-flex items-center gap-2 rounded-full border border-white/12 px-6 py-3.5 text-sm font-medium text-foreground/90 transition-all duration-500 ease-cinematic hover:border-primary/50 hover:bg-white/[0.04]"
            >
              Explore portfolios
              <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-5"
          >
            {proofStats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-display text-lg font-semibold leading-none">
                    {value.toLocaleString()}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* -------------------------------------------------------- mock stage */}
        <motion.div
          initial={{ opacity: 0, y: 60, rotateX: 12 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.3, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
          style={{ perspective: 1400 }}
        >
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, -14, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            className="panel glow-ring relative z-10 p-3"
          >
            {/* fake chrome */}
            <div className="flex items-center gap-2 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
              <span className="mono ml-3 truncate text-[10px] text-muted-foreground">
                {active?.username ? `portify.dev/${active.username}` : 'portify.dev/your-handle'}
              </span>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[hsl(240_30%_3%)]">
              <div className="relative h-[290px] p-6">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_80%_at_20%_0%,hsl(var(--violet)/.25),transparent_60%),radial-gradient(70%_60%_at_90%_20%,hsl(var(--cyan)/.18),transparent_60%)]" />
                {active ? (
                  <motion.div
                    key={active.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="relative"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-1 ring-white/20">
                        <AvatarImage src={active.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--violet))] to-[hsl(var(--cyan))] text-sm font-semibold text-[hsl(240_30%_4%)]">
                          {(active.full_name || active.username).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-display text-base font-semibold">
                          {active.full_name || active.display_name || active.username}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{active.title || 'Developer'}</p>
                      </div>
                    </div>

                    <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {active.bio || 'Building things for the web, one commit at a time.'}
                    </p>

                    <div className="mt-5 grid grid-cols-3 gap-2">
                      {[
                        { label: 'Projects', value: active.project_count ?? 0 },
                        { label: 'Skills', value: active.skill_count ?? 0 },
                        { label: 'Followers', value: active.follower_count ?? 0 },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                          <p className="font-display text-lg font-semibold leading-none">{item.value}</p>
                          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--violet))] to-[hsl(var(--cyan))]"
                        initial={{ width: '0%' }}
                        animate={{ width: '78%' }}
                        transition={{ duration: 1.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <div className="relative space-y-4">
                    <div className="h-12 w-12 animate-pulse rounded-full bg-white/10" />
                    <div className="h-4 w-40 animate-pulse rounded-full bg-white/10" />
                    <div className="h-3 w-full animate-pulse rounded-full bg-white/5" />
                    <div className="h-3 w-3/4 animate-pulse rounded-full bg-white/5" />
                  </div>
                )}

                {people.length > 1 && (
                  <div className="absolute bottom-4 left-6 flex gap-1.5">
                    {people.map((person, index) => (
                      <button
                        key={person.id}
                        aria-label={`Show ${person.username}`}
                        onClick={() => setSpotlight(index)}
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          index === spotlight ? 'w-6 bg-primary' : 'w-1.5 bg-white/25 hover:bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* floating ornaments */}
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, 16, 0], rotate: [0, 3, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
            className="glass absolute -left-6 top-24 z-20 hidden rounded-2xl px-4 py-3 sm:block"
          >
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-secondary" />
              <span className="mono text-[10px]">edge · 42ms</span>
            </div>
          </motion.div>

          <motion.div
            animate={reduceMotion ? undefined : { y: [0, -18, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="glass absolute -right-4 bottom-16 z-20 hidden rounded-2xl px-4 py-3 sm:block"
          >
            <p className="mono text-[10px] text-muted-foreground">reactions</p>
            <p className="font-display text-xl font-semibold leading-none text-gradient-warm">
              {(stats?.reactions ?? 0).toLocaleString()}
            </p>
          </motion.div>

          <div className="absolute -inset-10 -z-10 bg-[radial-gradient(50%_50%_at_50%_50%,hsl(var(--violet)/.28),transparent_70%)] blur-2xl" />
        </motion.div>
      </div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="mx-auto mt-20 hidden w-full max-w-7xl lg:block"
      >
        <div className="flex items-center gap-4">
          <span className="mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">scroll</span>
          <span className="relative h-px flex-1 overflow-hidden bg-white/10">
            <motion.span
              className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-primary to-transparent"
              animate={reduceMotion ? undefined : { x: ['-20%', '110%'] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </span>
        </div>
      </motion.div>
    </section>
  );
}
