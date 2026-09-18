import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AtSign, Award, Bell, Heart, MessageSquare, Sparkles, UserPlus } from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  read: boolean;
  created_at: string;
  actor?: { id: string; username?: string | null; full_name?: string | null; avatar_url?: string | null } | null;
}

const ICONS: Record<string, any> = {
  follow: UserPlus,
  endorsement: Award,
  comment: MessageSquare,
  reaction: Heart,
  mention: AtSign,
  message: MessageSquare,
  system: Sparkles,
};

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

/** Activity bell with unread badge — polls while signed in. */
export default function NotificationsBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await api.get<{ notifications: Notification[]; unread: number }>('/api/notifications');
    setItems(data?.notifications ?? []);
    setUnread(data?.unread ?? 0);
  }, [user]);

  useEffect(() => {
    void load();
    if (!user) return;
    const timer = setInterval(() => void load(), 60_000);
    return () => clearInterval(timer);
  }, [load, user]);

  const markAllRead = async () => {
    await api.post('/api/notifications/read', { all: true });
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    setUnread(0);
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((value) => !value);
          if (!open) void load();
        }}
        aria-label="Notifications"
        className="relative rounded-full border border-white/10 bg-white/[0.03] p-2.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-[hsl(var(--violet))] to-[hsl(var(--cyan))] px-1 text-[9px] font-bold text-[hsl(240_30%_4%)]"
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <button className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} aria-label="Close" />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 z-40 mt-3 w-[340px] overflow-hidden rounded-3xl border border-white/10 bg-[hsl(240_28%_6%)] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                <p className="font-display text-sm font-semibold">Activity</p>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-[11px] text-primary hover:underline underline-offset-4">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[380px] overflow-y-auto">
                {items.length === 0 ? (
                  <p className="px-5 py-10 text-center text-xs text-muted-foreground">
                    Nothing yet — follow a few developers and the activity lands here.
                  </p>
                ) : (
                  items.slice(0, 12).map((item) => {
                    const Icon = ICONS[item.type] ?? Bell;
                    return (
                      <Link
                        key={item.id}
                        to={item.link || '/community'}
                        onClick={() => setOpen(false)}
                        className={`flex items-start gap-3 border-b border-white/[0.05] px-5 py-3.5 transition-colors hover:bg-white/[0.03] ${
                          item.read ? '' : 'bg-primary/[0.05]'
                        }`}
                      >
                        {item.actor ? (
                          <Avatar className="h-8 w-8 shrink-0 ring-1 ring-white/10">
                            <AvatarImage src={item.actor.avatar_url ?? undefined} />
                            <AvatarFallback className="bg-white/[0.08] text-[10px]">
                              {(item.actor.full_name || item.actor.username || '?').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                            <Icon className="h-3.5 w-3.5 text-primary" />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">{item.title}</p>
                          {item.body && <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{item.body}</p>}
                          <p className="mono mt-1 text-[9px] text-muted-foreground">{timeAgo(item.created_at)} ago</p>
                        </div>
                        {!item.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      </Link>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
