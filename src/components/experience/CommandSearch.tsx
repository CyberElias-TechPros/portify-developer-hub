import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, FileText, Search, User2, FolderGit2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api/client';

interface SearchResults {
  people: any[];
  projects: any[];
  posts: any[];
}

interface CommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Hit = { id: string; group: string; title: string; subtitle?: string; href: string; icon: JSX.Element };

export default function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onOpenChange(!open);
      }
      if (event.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const { data } = await api.get<SearchResults>(`/api/search?q=${encodeURIComponent(query.trim())}&limit=6`);
      setResults(data ?? { people: [], projects: [], posts: [] });
      setCursor(0);
      setLoading(false);
    }, 220);
    return () => clearTimeout(timer);
  }, [query]);

  const hits = useMemo<Hit[]>(() => {
    if (!results) return [];
    return [
      ...results.people.map((person) => ({
        id: `p-${person.id}`,
        group: 'People',
        title: person.full_name || person.display_name || `@${person.username}`,
        subtitle: person.title || (person.username ? `@${person.username}` : undefined),
        href: `/${person.username}`,
        icon: <User2 className="h-4 w-4" />,
      })),
      ...results.projects.map((project) => ({
        id: `pr-${project.id}`,
        group: 'Projects',
        title: project.title,
        subtitle: project.username ? `by @${project.username}` : undefined,
        href: project.username ? `/${project.username}#projects` : '/projects',
        icon: <FolderGit2 className="h-4 w-4" />,
      })),
      ...results.posts.map((post) => ({
        id: `b-${post.id}`,
        group: 'Writing',
        title: post.title,
        subtitle: post.username ? `by @${post.username}` : undefined,
        href: `/blog/${post.slug}`,
        icon: <FileText className="h-4 w-4" />,
      })),
    ];
  }, [results]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setCursor((current) => Math.min(current + 1, Math.max(hits.length - 1, 0)));
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setCursor((current) => Math.max(current - 1, 0));
      }
      if (event.key === 'Enter') {
        const hit = hits[cursor];
        if (hit) {
          onOpenChange(false);
          navigate(hit.href);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, hits, cursor, navigate, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-[hsl(240_30%_2%/.72)] backdrop-blur-md"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="glass-strong relative w-full max-w-2xl overflow-hidden rounded-3xl shadow-cinematic"
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Search className="h-4 w-4 text-muted-foreground" />
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search people, projects, writing…"
                className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
              />
              <kbd className="hidden rounded-md border border-white/15 px-2 py-0.5 text-[10px] text-muted-foreground sm:block">
                ESC
              </kbd>
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-2">
              {query.trim().length < 2 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Search across the whole community — try “react”, “design systems”, or a name.
                  </p>
                </div>
              )}

              {query.trim().length >= 2 && !loading && hits.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No matches for “{query}”.
                </div>
              )}

              {hits.map((hit, index) => (
                <button
                  key={hit.id}
                  onMouseEnter={() => setCursor(index)}
                  onClick={() => {
                    onOpenChange(false);
                    navigate(hit.href);
                  }}
                  className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
                    cursor === index ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-muted-foreground">
                    {hit.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{hit.title}</span>
                    {hit.subtitle && (
                      <span className="block truncate text-xs text-muted-foreground">{hit.subtitle}</span>
                    )}
                  </span>
                  <span className="eyebrow hidden text-[9px] sm:block">{hit.group}</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-[11px] text-muted-foreground">
              <span>↑↓ to navigate · ⏎ to open</span>
              <span className="mono">⌘K</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
