import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Compass, Loader2, MapPin, Search, Users } from 'lucide-react';
import Layout from '@/components/Layout';
import { EmptyState, PageHeader, Panel, Tag, fieldClasses } from '@/components/ui-kit';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RevealGroup, RevealItem } from '@/components/experience/Reveal';
import TiltCard from '@/components/experience/TiltCard';
import FollowButton from '@/components/community/FollowButton';
import { api } from '@/lib/api/client';

interface Person {
  id: string;
  username: string;
  full_name?: string | null;
  display_name?: string | null;
  title?: string | null;
  bio?: string | null;
  location?: string | null;
  avatar_url?: string | null;
  accent?: string | null;
  project_count?: number;
  follower_count?: number;
  isFollowing?: boolean;
}

export default function Discover() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'followers' | 'projects' | 'recent'>('followers');
  const [locationFilter, setLocationFilter] = useState('all');

  const load = useCallback(async (searchTerm: string) => {
    setLoading(true);
    const { data } = await api.get<{ people: Person[] }>(
      `/api/community/people?limit=60${searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : ''}`
    );
    setPeople(data?.people ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(query.trim()), query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [query, load]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    people.forEach((person) => {
      if (person.location) set.add(person.location);
    });
    return ['all', ...[...set].slice(0, 6)];
  }, [people]);

  const visible = useMemo(() => {
    const filtered = people.filter((person) =>
      locationFilter === 'all' ? true : person.location === locationFilter
    );
    return filtered.sort((a, b) => {
      if (sort === 'projects') return (b.project_count ?? 0) - (a.project_count ?? 0);
      if (sort === 'recent') return a.username.localeCompare(b.username);
      return (b.follower_count ?? 0) - (a.follower_count ?? 0);
    });
  }, [people, sort, locationFilter]);

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 pb-24">
        <PageHeader
          eyebrow="Discover"
          title={
            <>
              Find the people <span className="text-gradient">building the future.</span>
            </>
          }
          description="Search by name, role or skill. Follow the developers whose work you want to keep watching."
        />

        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative lg:w-96">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search designers, engineers, writers…"
              className={fieldClasses('pl-11')}
            />
            {loading && (
              <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['followers', 'projects', 'recent'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSort(option)}
                className={`rounded-full border px-4 py-2 text-xs capitalize transition-colors ${
                  sort === option
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-white/10 text-muted-foreground hover:text-foreground'
                }`}
              >
                {option === 'recent' ? 'A–Z' : `most ${option}`}
              </button>
            ))}
          </div>
        </div>

        {locations.length > 1 && (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            {locations.map((location) => (
              <button
                key={location}
                onClick={() => setLocationFilter(location)}
                className={`rounded-full border px-3.5 py-1.5 text-[11px] transition-colors ${
                  locationFilter === location
                    ? 'border-secondary/40 bg-secondary/10 text-secondary'
                    : 'border-white/10 text-muted-foreground hover:text-foreground'
                }`}
              >
                <MapPin className="mr-1 inline h-3 w-3" />
                {location === 'all' ? 'Everywhere' : location}
              </button>
            ))}
          </div>
        )}

        {loading && people.length === 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-64 animate-pulse rounded-3xl border border-white/[0.06] bg-white/[0.02]" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Compass}
            title={query ? 'No one matches that search' : 'No public portfolios yet'}
            description={
              query
                ? 'Try a different keyword, or browse everyone instead.'
                : 'As members publish their portfolios they will appear here.'
            }
            action={
              query ? (
                <button onClick={() => setQuery('')} className="text-sm text-primary underline-offset-4 hover:underline">
                  Clear search
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <p className="mb-5 text-xs text-muted-foreground">
              {visible.length} {visible.length === 1 ? 'developer' : 'developers'}
            </p>
            <RevealGroup className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" stagger={0.05}>
              {visible.map((person) => (
                <RevealItem key={person.id}>
                  <TiltCard intensity={5}>
                    <Panel className="group h-full p-6">
                      <div className="flex items-start justify-between">
                        <Avatar className="h-14 w-14 ring-1 ring-white/15">
                          <AvatarImage src={person.avatar_url ?? undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--violet))] to-[hsl(var(--cyan))] font-semibold text-[hsl(240_30%_4%)]">
                            {(person.full_name || person.username).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <Link
                          to={`/${person.username}`}
                          className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </Link>
                      </div>

                      <Link to={`/${person.username}`} className="mt-5 block">
                        <h3 className="font-display text-lg font-semibold tracking-tight">
                          {person.full_name || person.display_name || person.username}
                        </h3>
                        <p className="mt-1 text-sm text-secondary">{person.title || 'Developer'}</p>
                      </Link>

                      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {person.bio || 'Building quietly in public.'}
                      </p>

                      <div className="mt-5 flex flex-wrap items-center gap-2">
                        <Tag>{person.project_count ?? 0} projects</Tag>
                        <Tag tone="primary">{person.follower_count ?? 0} followers</Tag>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4">
                        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {person.location || 'Remote'}
                        </span>
                        <FollowButton targetUserId={person.id} size="sm" showCount={false} />
                      </div>
                    </Panel>
                  </TiltCard>
                </RevealItem>
              ))}
            </RevealGroup>
          </>
        )}

        {!loading && visible.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 flex flex-col items-center gap-4 rounded-3xl border border-white/[0.07] bg-white/[0.02] px-8 py-12 text-center"
          >
            <Users className="h-5 w-5 text-primary" />
            <p className="font-display text-xl font-semibold">Not on the list yet?</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Claim your handle and your portfolio appears here the moment you make it public.
            </p>
            <Link
              to="/auth?mode=register"
              className="rounded-full bg-gradient-to-r from-[hsl(var(--violet))] to-[hsl(var(--cyan))] px-6 py-3 text-sm font-semibold text-[hsl(240_30%_4%)]"
            >
              Create your portfolio
            </Link>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
