import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Award, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Endorsement {
  id: string;
  comment?: string | null;
  created_at: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  title?: string | null;
}

/**
 * Peer endorsement control shown on public skill meters. Toggles the signed-in
 * visitor's endorsement and reveals who else vouches for the skill.
 */
export default function EndorseButton({
  skillId,
  initialCount = 0,
  className = '',
}: {
  skillId: string;
  initialCount?: number;
  className?: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [count, setCount] = useState(initialCount);
  const [endorsed, setEndorsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState<Endorsement[]>([]);

  useEffect(() => {
    let cancelled = false;
    void api.get<{ endorsements: Endorsement[]; mine: string | null }>(`/api/social/endorsements/${skillId}`).then(
      ({ data }) => {
        if (cancelled || !data) return;
        setPeople(data.endorsements ?? []);
        setCount((data.endorsements ?? []).length);
        setEndorsed(data.mine ? (data.endorsements ?? []).some((row) => row.username && row.id) && Boolean(data.mine) : false);
        setReady(true);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [skillId, user?.id]);

  useEffect(() => {
    if (!user) return;
    // The list endpoint does not flag "mine" per row, so ask the toggle-free
    // follow-style check: fetch my endorsements of this skill via the table.
    void api
      .get<any[]>(`/api/db/skill_endorsements?f.skill_id=eq.${skillId}&limit=50`)
      .then(({ data }) => {
        if (Array.isArray(data)) {
          setCount(data.length);
          setEndorsed(data.some((row) => row.endorser_id === user.id));
        }
      });
  }, [skillId, user]);

  const toggle = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setLoading(true);
    const { data, error } = await api.post<{ endorsed: boolean; endorsements: number }>(
      `/api/social/endorse/${skillId}`,
      {}
    );
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEndorsed(Boolean(data?.endorsed));
    setCount(data?.endorsements ?? count + (data?.endorsed ? 1 : -1));
    toast.success(data?.endorsed ? 'Endorsed — nice signal for them' : 'Endorsement removed');
    setReady(true);
  };

  if (!user) return null;

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          disabled={loading || !ready}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] transition-all duration-300 ${
            endorsed
              ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
              : 'border-white/12 bg-white/[0.03] text-muted-foreground hover:border-primary/40 hover:text-primary'
          }`}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Award className="h-3 w-3" />}
          {endorsed ? 'Endorsed' : 'Endorse'}
        </button>
        {count > 0 && (
          <button
            onClick={() => setOpen((value) => !value)}
            className="mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {count} {count === 1 ? 'peer' : 'peers'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && people.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-white/10 bg-[hsl(240_28%_7%)] p-3 shadow-2xl"
          >
            {people.slice(0, 6).map((person) => (
              <div key={person.id} className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.04]">
                <Avatar className="h-7 w-7 ring-1 ring-white/10">
                  <AvatarImage src={person.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-white/[0.08] text-[10px]">
                    {(person.full_name || person.username || '?').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{person.full_name || person.username}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{person.title || 'Developer'}</p>
                  {person.comment && <p className="mt-1 text-[10px] italic text-muted-foreground">“{person.comment}”</p>}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
