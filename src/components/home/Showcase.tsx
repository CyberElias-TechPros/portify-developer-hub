import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, Users } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Reveal, RevealGroup, RevealItem } from '@/components/experience/Reveal';
import TiltCard from '@/components/experience/TiltCard';

interface Person {
  id: string;
  username: string;
  full_name?: string | null;
  display_name?: string | null;
  title?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  location?: string | null;
  project_count?: number;
  follower_count?: number;
}

export default function Showcase() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api.get<{ people: Person[] }>('/api/community/featured?limit=6').then(({ data }) => {
      setPeople(data?.people ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24">
      <Reveal mode="blur" className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4">Featured work</p>
          <h2 className="display-lg">
            Portfolios worth <span className="text-gradient">studying.</span>
          </h2>
        </div>
        <Link
          to="/discover"
          className="group inline-flex items-center gap-2 text-sm font-medium text-primary"
        >
          Browse everyone
          <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </Reveal>

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="panel h-64 animate-pulse" />
          ))}
        </div>
      ) : people.length === 0 ? (
        <div className="panel flex flex-col items-center gap-4 px-8 py-16 text-center">
          <Users className="h-6 w-6 text-primary" />
          <p className="font-display text-xl font-semibold">The stage is warming up</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Public portfolios will appear here as the community publishes. Yours could be first.
          </p>
          <Link
            to="/auth?mode=register"
            className="mt-2 rounded-full bg-gradient-to-r from-[hsl(var(--violet))] to-[hsl(var(--cyan))] px-5 py-2.5 text-sm font-semibold text-[hsl(240_30%_4%)]"
          >
            Publish yours
          </Link>
        </div>
      ) : (
        <RevealGroup className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
          {people.map((person) => (
            <RevealItem key={person.id} mode="rise">
              <TiltCard intensity={6}>
                <Link to={`/${person.username}`} className="block">
                  <div className="panel relative h-full overflow-hidden p-6">
                    <div className="flex items-start justify-between">
                      <Avatar className="h-14 w-14 ring-1 ring-white/15">
                        <AvatarImage src={person.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--violet))] to-[hsl(var(--cyan))] font-semibold text-[hsl(240_30%_4%)]">
                          {(person.full_name || person.username).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1" />
                    </div>

                    <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">
                      {person.full_name || person.display_name || person.username}
                    </h3>
                    <p className="mt-1 text-sm text-secondary">{person.title || 'Developer'}</p>
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {person.bio || 'Building for the web.'}
                    </p>

                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {person.location || 'Remote'}
                      </span>
                      <span className="mono">
                        {person.project_count ?? 0} projects · {person.follower_count ?? 0} followers
                      </span>
                    </div>
                  </div>
                </Link>
              </TiltCard>
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </section>
  );
}
