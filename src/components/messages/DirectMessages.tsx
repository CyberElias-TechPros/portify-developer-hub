import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Inbox, Loader2, Search, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState, GhostButton, GlowButton, fieldClasses } from '@/components/ui-kit';
import { api } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';

interface Thread {
  id: string;
  subject?: string | null;
  last_message?: string | null;
  last_message_at: string;
  unread: number;
  other: { id: string; full_name?: string | null; username?: string | null; avatar_url?: string | null };
}

interface DirectMessage {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
}

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Direct-message inbox: thread list + conversation + composer. */
export default function DirectMessages() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(params.get('thread'));
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState('');
  const scroller = useRef<HTMLDivElement | null>(null);

  const loadThreads = useCallback(async () => {
    if (!user) {
      setLoadingThreads(false);
      return;
    }
    setLoadingThreads(true);
    const { data } = await api.get<{ threads: Thread[] }>('/api/dm/threads');
    const rows = data?.threads ?? [];
    setThreads(rows);
    setActiveId((current) => current ?? rows[0]?.id ?? null);
    setLoadingThreads(false);
  }, [user]);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  const loadThread = useCallback(async (id: string) => {
    setLoadingThread(true);
    const { data } = await api.get<{ thread: any; messages: DirectMessage[] }>(`/api/dm/threads/${id}`);
    setMessages(data?.messages ?? []);
    setLoadingThread(false);
    setThreads((current) => current.map((thread) => (thread.id === id ? { ...thread, unread: 0 } : thread)));
  }, []);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    void loadThread(activeId);
    setParams({ thread: activeId }, { replace: true });
  }, [activeId, loadThread, setParams]);

  useEffect(() => {
    if (!scroller.current) return;
    scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages.length]);

  const send = async () => {
    if (!activeId || draft.trim().length === 0) return;
    setSending(true);
    const body = draft.trim();
    const { data, error } = await api.post<{ message: DirectMessage }>(`/api/dm/threads/${activeId}`, { body });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDraft('');
    const created = data?.message ?? {
      id: `local-${Date.now()}`,
      sender_id: user!.id,
      body,
      created_at: new Date().toISOString(),
    };
    setMessages((current) => [...current, created]);
    setThreads((current) =>
      current.map((thread) =>
        thread.id === activeId ? { ...thread, last_message: body, last_message_at: new Date().toISOString() } : thread
      )
    );
  };

  if (!user) {
    return (
      <EmptyState
        icon={Inbox}
        title="Sign in to open your messages"
        description="Conversations started from a portfolio land here."
        action={
          <Link to="/auth">
            <GlowButton>Sign in</GlowButton>
          </Link>
        }
      />
    );
  }

  const active = threads.find((thread) => thread.id === activeId) ?? null;
  const filtered = threads.filter((thread) =>
    query
      ? `${thread.other.full_name ?? ''} ${thread.other.username ?? ''} ${thread.subject ?? ''}`
          .toLowerCase()
          .includes(query.toLowerCase())
      : true
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations…"
            className={fieldClasses('pl-11')}
          />
        </div>

        {loadingThreads ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
          ))
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No conversations yet"
            description="Open someone's portfolio and hit “Message” to start one."
            action={
              <Link to="/discover">
                <GhostButton>Find people</GhostButton>
              </Link>
            }
          />
        ) : (
          filtered.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setActiveId(thread.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
                thread.id === activeId
                  ? 'border-primary/40 bg-primary/[0.07]'
                  : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20'
              }`}
            >
              <Avatar className="h-10 w-10 ring-1 ring-white/10">
                <AvatarImage src={thread.other?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-white/[0.08] text-xs">
                  {(thread.other?.full_name || thread.other?.username || '?').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{thread.other?.full_name || thread.other?.username}</p>
                  <span className="mono shrink-0 text-[9px] text-muted-foreground">{timeAgo(thread.last_message_at)}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{thread.last_message || 'No messages yet'}</p>
              </div>
              {thread.unread > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-[hsl(240_30%_4%)]">
                  {thread.unread}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      <AnimatePresence mode="wait">
        {active ? (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="panel flex h-[560px] flex-col overflow-hidden"
          >
            <header className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-4">
              <Avatar className="h-9 w-9 ring-1 ring-white/10">
                <AvatarImage src={active.other?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-white/[0.08] text-xs">
                  {(active.other?.full_name || active.other?.username || '?').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{active.other?.full_name || active.other?.username}</p>
                {active.other?.username && (
                  <Link to={`/${active.other.username}`} className="mono text-[10px] text-primary hover:underline">
                    portify.dev/{active.other.username}
                  </Link>
                )}
              </div>
            </header>

            <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {loadingThread ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Say hello — messages are private between the two of you.
                </p>
              ) : (
                messages.map((message) => {
                  const mine = message.sender_id === user.id;
                  return (
                    <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          mine
                            ? 'bg-gradient-to-r from-[hsl(var(--violet))] to-[hsl(var(--cyan))] text-[hsl(240_30%_6%)]'
                            : 'border border-white/10 bg-white/[0.04] text-foreground/90'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.body}</p>
                        <p className={`mono mt-1 text-[9px] ${mine ? 'text-[hsl(240_30%_20%)]' : 'text-muted-foreground'}`}>
                          {timeAgo(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-white/[0.08] p-4">
              <div className="flex items-end gap-3">
                <textarea
                  rows={2}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void send();
                    }
                  }}
                  placeholder="Write a message… (Enter to send, Shift+Enter for a new line)"
                  className={fieldClasses('h-auto py-3')}
                />
                <GlowButton onClick={send} disabled={sending || draft.trim().length === 0}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </GlowButton>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-[560px] items-center justify-center rounded-3xl border border-dashed border-white/10"
          >
            <p className="text-sm text-muted-foreground">Select a conversation to start reading</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
