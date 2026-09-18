import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  Award,
  Eye,
  Globe2,
  Heart,
  Loader2,
  MessageSquare,
  Monitor,
  Smartphone,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Layout from '@/components/Layout';
import { EmptyState, GhostButton, GlowButton, PageHeader, Panel, SectionLabel, StatTile } from '@/components/ui-kit';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/client';
import usePageMeta from '@/hooks/usePageMeta';

interface AnalyticsPayload {
  range: string;
  totals: {
    views: number;
    visitors: number;
    reactions: number;
    comments: number;
    followers: number;
    endorsements: number;
  };
  daily: { day: string; views: number; visitors: number }[];
  paths: { path: string; views: number }[];
  referrers: { referrer: string | null; views: number }[];
  devices: { device: string; views: number }[];
  countries: { country: string; views: number }[];
  recent: { event_type: string; path: string | null; referrer: string | null; country: string | null; device: string | null; browser: string | null; created_at: string }[];
}

const PIE_COLOURS = ['hsl(258 90% 66%)', 'hsl(189 94% 55%)', 'hsl(42 96% 62%)', 'hsl(330 90% 66%)', 'hsl(160 84% 45%)'];

export default function AdminAnalytics() {
  usePageMeta({ title: 'Analytics · Portify', description: 'Views, visitors, reactions and referrals for everything you publish.', path: '/admin/analytics' });

  const { user } = useAuth();
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void api.get<AnalyticsPayload>(`/api/analytics/me?range=${range}`).then(({ data: payload }) => {
      setData(payload);
      setLoading(false);
    });
  }, [user, range]);

  if (!user) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-6 py-24">
          <EmptyState
            icon={Activity}
            title="Sign in to see your analytics"
            description="Views, visitors, reactions and referrals for everything you publish."
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

  const tooltipStyle = {
    background: 'hsl(240 28% 8%)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 14,
    fontSize: 12,
  };

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 pb-24">
        <PageHeader
          eyebrow="Analytics"
          title={
            <>
              Attention, <span className="text-gradient">measured honestly.</span>
            </>
          }
          description="What people actually read, where they come from and how they engage — sampled from real requests to your portfolio."
          actions={
            <div className="flex items-center gap-2">
              {(['7d', '30d', '90d'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setRange(option)}
                  className={`rounded-full border px-4 py-2 text-xs transition-colors ${
                    range === option
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-white/10 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  last {option}
                </button>
              ))}
              <Link to="/admin">
                <GhostButton>Console</GhostButton>
              </Link>
            </div>
          }
        />

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatTile label="Views" value={(data?.totals.views ?? 0).toLocaleString()} icon={Eye} />
          <StatTile label="Visitors" value={(data?.totals.visitors ?? 0).toLocaleString()} icon={Users} delay={0.05} />
          <StatTile label="Reactions" value={data?.totals.reactions ?? 0} icon={Heart} delay={0.1} />
          <StatTile label="Comments" value={data?.totals.comments ?? 0} icon={MessageSquare} delay={0.15} />
          <StatTile label="Followers" value={data?.totals.followers ?? 0} icon={Users} delay={0.2} />
          <StatTile label="Endorsements" value={data?.totals.endorsements ?? 0} icon={Award} delay={0.25} />
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-3xl border border-white/[0.06] bg-white/[0.02]">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !data || data.daily.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No traffic recorded yet"
            description="Once your portfolio is public and people visit, their (anonymised) activity appears here within minutes."
          />
        ) : (
          <div className="space-y-6">
            <Panel className="p-6">
              <SectionLabel>Traffic</SectionLabel>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.daily}>
                    <defs>
                      <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(258 90% 66%)" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="hsl(258 90% 66%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="visitorsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(189 94% 55%)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="hsl(189 94% 55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="views" stroke="hsl(258 90% 66%)" strokeWidth={2} fill="url(#viewsFill)" />
                    <Area type="monotone" dataKey="visitors" stroke="hsl(189 94% 55%)" strokeWidth={2} fill="url(#visitorsFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <div className="grid gap-6 lg:grid-cols-2">
              <Panel className="p-6">
                <SectionLabel>Most viewed pages</SectionLabel>
                <div className="space-y-3">
                  {data.paths.slice(0, 6).map((row, index) => {
                    const max = Math.max(...data.paths.map((item) => item.views), 1);
                    return (
                      <div key={row.path}>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="truncate text-muted-foreground">{row.path || '/'}</span>
                          <span className="mono text-foreground">{row.views}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--violet))] to-[hsl(var(--cyan))]"
                            initial={{ width: 0 }}
                            animate={{ width: `${(row.views / max) * 100}%` }}
                            transition={{ duration: 1, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {data.paths.length === 0 && <p className="text-sm text-muted-foreground">No page data yet.</p>}
                </div>
              </Panel>

              <Panel className="p-6">
                <SectionLabel>Referrers</SectionLabel>
                <div className="space-y-3">
                  {data.referrers.slice(0, 6).map((row) => (
                    <div
                      key={row.referrer ?? 'direct'}
                      className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-2.5 text-xs"
                    >
                      <span className="truncate text-muted-foreground">
                        {row.referrer ? row.referrer.replace(/^https?:\/\//, '') : 'Direct / unknown'}
                      </span>
                      <span className="mono">{row.views}</span>
                    </div>
                  ))}
                  {data.referrers.length === 0 && <p className="text-sm text-muted-foreground">No referrer data yet.</p>}
                </div>
              </Panel>

              <Panel className="p-6">
                <SectionLabel>Devices</SectionLabel>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.devices.map((row) => ({ name: row.device, value: row.views }))}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={82}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {data.devices.map((_, index) => (
                          <Cell key={index} fill={PIE_COLOURS[index % PIE_COLOURS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                  {data.devices.map((row, index) => (
                    <span key={row.device} className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: PIE_COLOURS[index % PIE_COLOURS.length] }}
                      />
                      {row.device}{' '}
                      {row.device === 'mobile' ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                    </span>
                  ))}
                </div>
              </Panel>

              <Panel className="p-6">
                <SectionLabel>Countries</SectionLabel>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.countries.slice(0, 7)}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="country" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="views" radius={[6, 6, 0, 0]} fill="hsl(189 94% 55%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>

            <Panel className="p-6">
              <SectionLabel>Recent events</SectionLabel>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    <tr>
                      <th className="pb-3 pr-4 font-medium">When</th>
                      <th className="pb-3 pr-4 font-medium">Event</th>
                      <th className="pb-3 pr-4 font-medium">Path</th>
                      <th className="pb-3 pr-4 font-medium">Country</th>
                      <th className="pb-3 font-medium">Device</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {data.recent.map((event, index) => (
                      <tr key={index}>
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {new Date(event.created_at).toLocaleString()}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="inline-flex items-center gap-1.5">
                            <Activity className="h-3 w-3 text-primary" />
                            {event.event_type}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{event.path || '/'}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Globe2 className="h-3 w-3" />
                            {event.country || '—'}
                          </span>
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {[event.device, event.browser].filter(Boolean).join(' · ') || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </Layout>
  );
}
