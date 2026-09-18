import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Archive,
  Building2,
  Check,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Reply,
  Search,
  Send,
  Star,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { EmptyState, GhostButton, GlowButton, PageHeader, Panel, Tag, fieldClasses } from '@/components/ui-kit';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DirectMessages from '@/components/messages/DirectMessages';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/client';

interface Message {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  budget?: string | null;
  subject: string;
  message: string;
  read: boolean;
  starred: boolean;
  replied_at?: string | null;
  created_at: string;
}

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [counts, setCounts] = useState({ all: 0, unread: 0, starred: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await api.get<{ messages: Message[]; counts: typeof counts }>(
      `/api/messages/inbox?filter=${filter}${query ? `&q=${encodeURIComponent(query)}` : ''}`
    );
    setMessages(data?.messages ?? []);
    setCounts(data?.counts ?? { all: 0, unread: 0, starred: 0 });
    setLoading(false);
    setSelectedId((current) => current ?? data?.messages?.[0]?.id ?? null);
  }, [user, filter, query]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), query ? 280 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  const selected = useMemo(() => messages.find((message) => message.id === selectedId) ?? null, [messages, selectedId]);

  const patch = async (message: Message, body: Partial<Pick<Message, 'read' | 'starred'>>) => {
    const { error } = await api.patch(`/api/messages/${message.id}`, body);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMessages((current) =>
      current.map((item) => (item.id === message.id ? { ...item, ...body } : item))
    );
    setCounts((current) => ({
      all: current.all,
      unread: body.read ? Math.max(0, current.unread - 1) : current.unread,
      starred: body.starred === undefined ? current.starred : current.starred + (body.starred ? 1 : -1),
    }));
  };

  const openMessage = (message: Message) => {
    setSelectedId(message.id);
    setReply('');
    if (!message.read) void patch(message, { read: true });
  };

  const remove = async (message: Message) => {
    const { error } = await api.delete(`/api/messages/${message.id}`);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMessages((current) => current.filter((item) => item.id !== message.id));
    setSelectedId(null);
    toast.success('Message deleted');
  };

  const sendReply = async () => {
    if (!selected || reply.trim().length < 2) return;
    setReplying(true);
    const { data, error } = await api.post<{ sent: boolean; dev_link?: string; message?: string }>(
      `/api/messages/${selected.id}/reply`,
      { body: reply.trim() }
    );
    setReplying(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data && data.sent === false && data.dev_link) {
      window.location.href = data.dev_link;
      toast.info('No mail provider configured — opening your mail client');
    } else {
      toast.success(data?.message ?? 'Reply sent');
    }
    setReply('');
    setMessages((current) =>
      current.map((item) =>
        item.id === selected.id ? { ...item, read: true, replied_at: new Date().toISOString() } : item
      )
    );
  };

  if (!user) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-6 py-24">
          <EmptyState
            icon={Inbox}
            title="Sign in to open your inbox"
            description="Messages sent through your portfolio contact form land here."
            action={
              <Link to="/auth">
                <GlowButton>Sign in</GlowButton>
              </Link>
            }
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideAnimation>
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-28">
        <PageHeader
          eyebrow="Inbox"
          title={
            <>
              Opportunities, <span className="text-gradient">not spam.</span>
            </>
          }
          description="Every message sent through your contact forms, with read state, stars and one-click replies."
        />

        <Tabs defaultValue="inbox" className="w-full">
          <TabsList className="mb-8 flex-wrap rounded-full border border-white/10 bg-white/[0.03] p-1">
            <TabsTrigger value="inbox" className="rounded-full data-[state=active]:bg-white/[0.08]">
              Portfolio inbox
            </TabsTrigger>
            <TabsTrigger value="direct" className="rounded-full data-[state=active]:bg-white/[0.08]">
              Direct messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="direct">
            <DirectMessages />
          </TabsContent>

          <TabsContent value="inbox">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-80">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sender, subject, content…"
              className={fieldClasses('pl-11')}
            />
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'unread', 'starred'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setFilter(option)}
                className={`rounded-full border px-4 py-2 text-xs capitalize transition-colors ${
                  filter === option
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-white/10 text-muted-foreground hover:text-foreground'
                }`}
              >
                {option}
                {option === 'unread' && counts.unread > 0 && (
                  <span className="ml-2 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px]">{counts.unread}</span>
                )}
                {option === 'starred' && counts.starred > 0 && (
                  <span className="ml-2 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">{counts.starred}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* --------------------------------------------------------- list -- */}
          <div className="space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
              ))
            ) : messages.length === 0 ? (
              <EmptyState
                icon={Archive}
                title={filter === 'all' ? 'Inbox zero' : `Nothing ${filter}`}
                description={
                  filter === 'all'
                    ? 'When someone uses your portfolio contact form, the message appears here.'
                    : 'Try another filter.'
                }
              />
            ) : (
              messages.map((message) => (
                <motion.button
                  layout
                  key={message.id}
                  onClick={() => openMessage(message)}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                    selectedId === message.id
                      ? 'border-primary/40 bg-primary/[0.07]'
                      : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className={`truncate text-sm ${message.read ? 'text-muted-foreground' : 'font-semibold text-foreground'}`}>
                      {message.name}
                    </p>
                    <span className="mono shrink-0 text-[10px] text-muted-foreground">
                      {new Date(message.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-foreground/85">{message.subject}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{message.message}</p>
                  <div className="mt-3 flex items-center gap-2">
                    {!message.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    {message.starred && <Star className="h-3 w-3 fill-amber-300 text-amber-300" />}
                    {message.replied_at && <Tag tone="secondary">replied</Tag>}
                  </div>
                </motion.button>
              ))
            )}
          </div>

          {/* ------------------------------------------------------ reading -- */}
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <Panel className="p-7">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-xl font-semibold tracking-tight">{selected.subject}</h2>
                      <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          <a href={`mailto:${selected.email}`} className="hover:text-foreground">
                            {selected.email}
                          </a>
                        </span>
                        {selected.company && (
                          <span className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5" /> {selected.company}
                          </span>
                        )}
                        <span className="mono">{new Date(selected.created_at).toLocaleString()}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => void patch(selected, { starred: !selected.starred })}
                        className="rounded-xl border border-white/10 p-2.5 text-muted-foreground transition-colors hover:text-amber-300"
                        title={selected.starred ? 'Remove star' : 'Star message'}
                      >
                        <Star className={`h-4 w-4 ${selected.starred ? 'fill-amber-300 text-amber-300' : ''}`} />
                      </button>
                      <button
                        onClick={() => void patch(selected, { read: !selected.read })}
                        className="rounded-xl border border-white/10 p-2.5 text-muted-foreground transition-colors hover:text-foreground"
                        title={selected.read ? 'Mark unread' : 'Mark read'}
                      >
                        {selected.read ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => void remove(selected)}
                        className="rounded-xl border border-white/10 p-2.5 text-muted-foreground transition-colors hover:border-rose-400/30 hover:text-rose-300"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {selected.budget && (
                    <p className="mt-5">
                      <Tag tone="warm">budget · {selected.budget}</Tag>
                    </p>
                  )}

                  <div className="mt-6 whitespace-pre-wrap rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-sm leading-relaxed text-foreground/85">
                    {selected.message}
                  </div>

                  <div className="mt-7 border-t border-white/[0.08] pt-6">
                    <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Reply className="h-3.5 w-3.5" /> Reply directly — sent from your connected mailbox
                    </p>
                    <textarea
                      rows={5}
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      placeholder={`Hi ${selected.name.split(' ')[0]}, thanks for reaching out…`}
                      className={fieldClasses('h-auto py-3')}
                    />
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {selected.replied_at
                          ? `Last replied ${new Date(selected.replied_at).toLocaleDateString()}`
                          : 'No reply sent yet'}
                      </span>
                      <div className="flex items-center gap-2">
                        <a href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}>
                          <GhostButton>Open in mail app</GhostButton>
                        </a>
                        <GlowButton onClick={sendReply} disabled={replying || reply.trim().length < 2}>
                          {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          Send reply
                        </GlowButton>
                      </div>
                    </div>
                  </div>

                  {selected.replied_at && (
                    <p className="mt-4 flex items-center gap-2 text-xs text-emerald-300">
                      <Check className="h-3.5 w-3.5" /> Replied on{' '}
                      {new Date(selected.replied_at).toLocaleString()}
                    </p>
                  )}
                </Panel>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-full min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-white/10"
              >
                <p className="text-sm text-muted-foreground">Select a message to read it</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
