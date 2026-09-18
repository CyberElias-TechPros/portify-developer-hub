import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BadgeCheck,
  Loader2,
  Search,
  ShieldCheck,
  ShieldOff,
  UserCog,
  UserX,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { EmptyState, GhostButton, GlowButton, PageHeader, Panel, Tag, StatTile, fieldClasses } from '@/components/ui-kit';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/client';

interface AdminUser {
  id: string;
  email: string;
  roles: string[];
  role: string;
  full_name?: string | null;
  username?: string | null;
  title?: string | null;
  avatar_url?: string | null;
  email_verified: boolean;
  is_active: boolean;
  is_public: boolean;
  provider?: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
  project_count: number;
  post_count: number;
}

export default function AdminUsers() {
  const { isAdmin, user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await api.get<{ users: AdminUser[] }>(
      `/api/admin/users?limit=300${query ? `&q=${encodeURIComponent(query)}` : ''}`
    );
    setUsers(data?.users ?? []);
    setLoading(false);
  }, [isAdmin, query]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), query ? 280 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  const changeRole = async (target: AdminUser, role: string) => {
    setBusyId(target.id);
    const { error } = await api.patch(`/api/admin/users/${target.id}/role`, { role });
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setUsers((current) =>
      current.map((item) => (item.id === target.id ? { ...item, role, roles: [role] } : item))
    );
    toast.success(`${target.email} is now ${role === 'admin' ? 'an administrator' : `a ${role}`}`);
  };

  const toggleStatus = async (target: AdminUser) => {
    setBusyId(target.id);
    const { error } = await api.patch(`/api/admin/users/${target.id}/status`, { is_active: !target.is_active });
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setUsers((current) =>
      current.map((item) => (item.id === target.id ? { ...item, is_active: !item.is_active } : item))
    );
    toast.success(target.is_active ? 'Account deactivated' : 'Account reactivated');
  };

  const stats = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((item) => item.roles.includes('admin')).length,
      verified: users.filter((item) => item.email_verified).length,
      inactive: users.filter((item) => !item.is_active).length,
    }),
    [users]
  );

  if (!isAdmin) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-6 py-24">
          <EmptyState
            icon={ShieldCheck}
            title="Administrator access required"
            description="User management is limited to platform administrators."
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
    <Layout>
      <div className="mx-auto max-w-7xl px-6 pb-24">
        <PageHeader
          eyebrow="People"
          title={
            <>
              Accounts, roles and <span className="text-gradient">access.</span>
            </>
          }
          description="Promote moderators, deactivate dormant accounts and audit activity — every change is written to the audit log."
          actions={
            <Link to="/admin">
              <GhostButton>
                <ShieldCheck className="h-4 w-4" /> Back to console
              </GhostButton>
            </Link>
          }
        />

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Accounts" value={stats.total} icon={Users} />
          <StatTile label="Administrators" value={stats.admins} icon={UserCog} delay={0.05} />
          <StatTile label="Verified emails" value={stats.verified} icon={BadgeCheck} delay={0.1} />
          <StatTile label="Deactivated" value={stats.inactive} icon={UserX} delay={0.15} />
        </div>

        <div className="relative mb-6 sm:w-96">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by email, name or handle…"
            className={fieldClasses('pl-11')}
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="No accounts match" description="Try a different search term." />
        ) : (
          <Panel className="divide-y divide-white/[0.06] overflow-hidden">
            {users.map((row, index) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(index * 0.02, 0.3), ease: [0.16, 1, 0.3, 1] }}
                className={`flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between ${
                  row.is_active ? '' : 'opacity-60'
                }`}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <Avatar className="h-11 w-11 ring-1 ring-white/12">
                    <AvatarImage src={row.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-white/[0.08] text-sm font-semibold">
                      {(row.full_name || row.email).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {row.full_name || row.username || row.email}
                      </p>
                      {row.roles.includes('admin') && <Tag tone="primary">admin</Tag>}
                      {row.roles.includes('moderator') && <Tag tone="secondary">moderator</Tag>}
                      {!row.email_verified && <Tag tone="warm">unverified</Tag>}
                      {!row.is_active && <Tag tone="warm">deactivated</Tag>}
                      {row.id === user?.id && <Tag>you</Tag>}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.email}
                      {row.username ? ` · @${row.username}` : ''}
                    </p>
                    <p className="mono mt-1 text-[10px] text-muted-foreground">
                      {row.project_count} projects · {row.post_count} posts · joined{' '}
                      {new Date(row.created_at).toLocaleDateString()}
                      {row.last_sign_in_at
                        ? ` · last seen ${new Date(row.last_sign_in_at).toLocaleDateString()}`
                        : ''}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {row.username && (
                    <Link to={`/${row.username}`} target="_blank">
                      <GhostButton className="px-4 py-2 text-xs">View portfolio</GhostButton>
                    </Link>
                  )}

                  <select
                    className="h-9 rounded-full border border-white/12 bg-white/[0.04] px-3 text-xs outline-none"
                    value={row.role}
                    disabled={busyId === row.id}
                    onChange={(event) => void changeRole(row, event.target.value)}
                  >
                    <option value="user">user</option>
                    <option value="moderator">moderator</option>
                    <option value="admin">admin</option>
                  </select>

                  {row.id !== user?.id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          disabled={busyId === row.id}
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition-colors ${
                            row.is_active
                              ? 'border-white/12 text-muted-foreground hover:border-rose-400/30 hover:text-rose-300'
                              : 'border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/10'
                          }`}
                        >
                          {busyId === row.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : row.is_active ? (
                            <ShieldOff className="h-3.5 w-3.5" />
                          ) : (
                            <ShieldCheck className="h-3.5 w-3.5" />
                          )}
                          {row.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-white/10 bg-[hsl(240_28%_6%)]">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {row.is_active ? 'Deactivate this account?' : 'Reactivate this account?'}
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            {row.is_active
                              ? 'The user is signed out of every session immediately and cannot sign back in until reactivated.'
                              : 'The user will be able to sign in again straight away.'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => void toggleStatus(row)}>
                            {row.is_active ? 'Deactivate' : 'Reactivate'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </motion.div>
            ))}
          </Panel>
        )}
      </div>
    </Layout>
  );
}
