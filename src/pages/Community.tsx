import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  GitFork,
  Heart,
  MessageCircle,
  Sparkles,
  Star,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { EmptyState, GhostButton, GlowButton, PageHeader, Panel, Tag, StatTile } from '@/components/ui-kit';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Reveal, RevealGroup, RevealItem } from '@/components/experience/Reveal';
import FollowButton from '@/components/community/FollowButton';
import { api } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';
import usePageMeta from '@/hooks/usePageMeta';

interface Person {
  id: string;
  username: string;
  full_name?: string | null;
  title?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  follower_count?: number;
  project_count?: number;
}

interface ActivityItem {
  id: string;
  activity_type: string;
  created_at: string;
  metadata?: Record<string, any> | null;
  actor?: {
    id: string;
    username?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
  target?: string | null;
}

interface Stats {
  portfolios: number;
  projects: number;
  posts: number;
  reactions: number;
  skills: number;
}

const ACTIVITY_META: Record<string, { icon: any; verb: string; tone: string }> = {
  project_created: { icon: GitFork, verb: 'published a project', tone: 'text-violet-300' },
  post_published: { icon: Star, verb: 'published an article', tone: 'text-amber-300' },
  follow: { icon: UserPlus, verb: 'started following someone', tone: 'text-emerald-300' },
  comment: { icon: MessageCircle, verb: 'joined a discussion', tone: 'text-sky-300' },
  reaction: { icon: Heart, verb: 'reacted to work', tone: 'text-rose-300' },
  testimonial: { icon: Sparkles, verb: 'left a testimonial', tone: 'text-cyan-300' },
};

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Community() {
  usePageMeta({ title: 'Community · Portify', description: 'Follow developers, react to what they ship and watch a living feed of what the community is building.', path: '/community' });

  const { user } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const requests: Promise<any>[] = [
      api.get<{ people: Person[] }>('/api/community/featured?limit=8'),
      api.get<Stats>('/api/stats/public'),
    ];
    if (user) requests.push(api.get<{ activity?: ActivityItem[] }>('/api/activity?limit=25'));

    void Promise.all(requests).then(([peopleResult, statsResult, activityResult]) => {
      setPeople(peopleResult.data?.people ?? []);
      setStats(statsResult.data ?? null);
      setActivity(activityResult?.data?.activity ?? []);
      setLoading(false);
    });
  }, [user]);

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 pb-24">
        <PageHeader
          eyebrow="Community"
          title={
            <>
              Where the work <span className="text-gradient">gets noticed.</span>
            </>
          }
          description="Follow developers, react to what they ship, and watch a living feed of what the community is building right now."
          actions={
            <Link to="/discover">
              <GhostButton>Browse everyone</GhostButton>
            </Link>
          }
        />

        <div className="mb-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Portfolios" value={(stats?.portfolios ?? 0).toLocaleString()} icon={Sparkles} />
          <StatTile label="Projects" value={(stats?.projects ?? 0).toLocaleString()} icon={GitFork} delay={0.05} />
          <StatTile label="Articles" value={(stats?.posts ?? 0).toLocaleString()} icon={Star} delay={0.1} />
          <StatTile label="Reactions" value={(stats?.reactions ?? 0).toLocaleString()} icon={Heart} delay={0.15} />
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          {/* ------------------------------------------------------- featured */}
          <div>
            <Reveal mode="blur" className="mb-6 flex items-end justify-between">
              <div>
                <p className="eyebrow mb-3">Featured</p>
                <h2 className="display-md">Developers to watch</h2>
              </div>
              <Link to="/discover" className="text-sm text-primary hover:underline underline-offset-4">
                See all
              </Link>
            </Reveal>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-24 animate-pulse rounded-3xl border border-white/[0.06] bg-white/[0.02]" />
                ))}
              </div>
            ) : people.length === 0 ? (
              <EmptyState icon={Sparkles} title="No public portfolios yet" />
            ) : (
              <RevealGroup className="space-y-4" stagger={0.06}>
                {people.map((person, index) => (
                  <RevealItem key={person.id}>
                    <Panel className="group flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <span className="mono w-8 text-lg text-white/15">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <Avatar className="h-12 w-12 ring-1 ring-white/15">
                          <AvatarImage src={person.avatar_url ?? undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--violet))] to-[hsl(var(--cyan))] text-sm font-semibold text-[hsl(240_30%_4%)]">
                            {(person.full_name || person.username).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <Link
                            to={`/${person.username}`}
                            className="font-display text-base font-semibold hover:text-primary"
                          >
                            {person.full_name || person.username}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">
                            {person.title || 'Developer'} · {person.project_count ?? 0} projects
                          </p>
                        </div>
                      </div>
                      <FollowButton targetUserId={person.id} size="sm" showCount={false} />
                    </Panel>
                  </RevealItem>
                ))}
              </RevealGroup>
            )}
          </div>

          {/* ------------------------------------------------------- activity */}
          <div>
            <Reveal mode="blur" className="mb-6">
              <p className="eyebrow mb-3 flex items-center gap-2">
                <Activity className="h-3 w-3" /> Live feed
              </p>
              <h2 className="display-md">Happening now</h2>
            </Reveal>

            <Panel className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-12 animate-pulse rounded-2xl bg-white/[0.03]" />
                  ))}
                </div>
              ) : !user ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Your feed follows the people you follow.
                  </p>
                  <Link to="/auth" className="mt-3 inline-block text-sm text-primary hover:underline underline-offset-4">
                    Sign in to see it
                  </Link>
                </div>
              ) : activity.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  The feed is quiet — follow a few developers and their updates land here.
                </p>
              ) : (
                <ol className="relative space-y-6 border-l border-white/[0.08] pl-6">
                  {activity.map((item, index) => {
                    const meta = ACTIVITY_META[item.activity_type] ?? {
                      icon: TrendingUp,
                      verb: item.activity_type.replace(/_/g, ' '),
                      tone: 'text-primary',
                    };
                    const Icon = meta.icon;
                    const actorName =
                      item.actor?.full_name || item.actor?.username || 'Someone';
                    return (
                      <motion.li
                        key={item.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                        className="relative"
                      >
                        <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[hsl(240_30%_5%)]">
                          <Icon className={`h-3 w-3 ${meta.tone}`} />
                        </span>
                        <p className="text-sm">
                          {item.actor?.username ? (
                            <Link to={`/${item.actor.username}`} className="font-medium hover:text-primary">
                              {actorName}
                            </Link>
                          ) : (
                            <span className="font-medium">{actorName}</span>
                          )}{' '}
                          <span className="text-muted-foreground">{meta.verb}</span>
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(item.created_at)}</p>
                      </motion.li>
                    );
                  })}
                </ol>
              )}
            </Panel>

            <Reveal mode="rise" delay={0.15} className="mt-6">
              <Panel className="relative overflow-hidden p-7">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_100%_at_100%_0%,hsl(var(--violet)/.2),transparent_60%)]" />
                <div className="relative">
                  <Tag tone="primary">community etiquette</Tag>
                  <p className="mt-4 font-display text-lg font-semibold">React generously, critique kindly.</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Every reaction and comment notifies a real person. Praise specifics, ask questions before judging,
                    and endorse skills you have actually seen in practice.
                  </p>
                  <Link to="/help" className="mt-5 inline-flex text-sm text-primary hover:underline underline-offset-4">
                    Read the guidelines
                  </Link>
                </div>
              </Panel>
            </Reveal>
          </div>
        </div>

        <section className="mt-20">
          <Reveal mode="blur" className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="eyebrow mb-3">Get involved</p>
              <h2 className="display-md">Three ways to join in today</h2>
            </div>
            <Link to="/auth?mode=register">
              <GlowButton>Create your studio</GlowButton>
            </Link>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                title: 'Publish your portfolio',
                body: 'Turn your repositories into a story, then share the link where it matters.',
              },
              {
                title: 'React and comment',
                body: 'Good work spreads when people take thirty seconds to say something specific.',
              },
              {
                title: 'Endorse real skills',
                body: 'Back the proficiencies you have seen delivered — it means more than a like.',
              },
            ].map((card, index) => (
              <Reveal key={card.title} mode="rise" delay={index * 0.08}>
                <Panel className="h-full p-7">
                  <p className="font-display text-lg font-semibold">{card.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                </Panel>
              </Reveal>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
