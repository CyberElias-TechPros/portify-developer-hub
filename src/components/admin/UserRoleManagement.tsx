import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { api, supabase } from "@/lib/api";

type Role = "admin" | "moderator" | "user";
type User = { id: string; email?: string; role?: Role; full_name?: string; created_at?: string; last_sign_in_at?: string | null };
const permissions: { name: string; admin: boolean; moderator: boolean; user: boolean }[] = [{ name: "View public content", admin: true, moderator: true, user: true }, { name: "Create content", admin: true, moderator: true, user: true }, { name: "Edit own content", admin: true, moderator: true, user: true }, { name: "Delete own content", admin: true, moderator: true, user: true }, { name: "Moderate community content", admin: true, moderator: true, user: false }, { name: "Delete any content", admin: true, moderator: false, user: false }, { name: "Manage user roles", admin: true, moderator: false, user: false }, { name: "Access admin dashboard", admin: true, moderator: false, user: false }, { name: "Manage site settings", admin: true, moderator: false, user: false }, { name: "View analytics", admin: true, moderator: false, user: false }];
function errorMessage(error: unknown) { return error instanceof Error ? error.message : "Please try again."; }

export default function UserRoleManagement() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const isAdmin = currentUser?.role === "admin";
  const load = useCallback(async () => { setLoading(true); const result = await api.auth.admin.listUsers(); if (result.error) toast({ title: "Could not load users", description: result.error.message, variant: "destructive" }); else setUsers(result.data?.users ?? []); setLoading(false); }, [toast]);
  useEffect(() => { if (isAdmin) void load(); else setLoading(false); }, [isAdmin, load]);
  const filtered = useMemo(() => users.filter((user) => `${user.email ?? ""} ${user.full_name ?? ""}`.toLowerCase().includes(search.toLowerCase())), [search, users]);
  const changeRole = async (userId: string, role: Role) => { const result = await supabase.from("user_roles").update({ role }).eq("user_id", userId); if (result.error) toast({ title: "Role not changed", description: result.error.message, variant: "destructive" }); else { setUsers((current) => current.map((user) => user.id === userId ? { ...user, role } : user)); toast({ title: "Role updated" }); } };
  if (!isAdmin) return <p className="p-8 text-center text-muted-foreground">You do not have permission to manage users.</p>;
  return <div className="space-y-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-xl font-semibold">User role management</h2><Input className="max-w-xs" placeholder="Search by email or name" aria-label="Search users" value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="overflow-x-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Joined</TableHead><TableHead>Last sign-in</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={6} className="py-8 text-center">Loading users…</TableCell></TableRow> : filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="py-8 text-center">No users found.</TableCell></TableRow> : filtered.map((user) => <TableRow key={user.id}><TableCell>{user.email || "—"}</TableCell><TableCell>{user.full_name || "Not set"}</TableCell><TableCell><Badge variant={user.role === "admin" ? "destructive" : user.role === "moderator" ? "secondary" : "outline"}>{user.role || "user"}</Badge></TableCell><TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</TableCell><TableCell>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : "Never"}</TableCell><TableCell><div className="flex flex-wrap gap-2"><Select value={user.role || "user"} onValueChange={(value) => void changeRole(user.id, value as Role)}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="moderator">Moderator</SelectItem><SelectItem value="user">User</SelectItem></SelectContent></Select><Button variant="outline" size="sm" onClick={() => { setSelected(user); setDialogOpen(true); }}>Permissions</Button></div></TableCell></TableRow>)}</TableBody></Table></div><Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{selected?.role || "user"} role permissions</DialogTitle><DialogDescription>Permissions for {selected?.email || selected?.id}</DialogDescription></DialogHeader><Table><TableHeader><TableRow><TableHead>Permission</TableHead><TableHead>Admin</TableHead><TableHead>Moderator</TableHead><TableHead>User</TableHead></TableRow></TableHeader><TableBody>{permissions.map((permission) => <TableRow key={permission.name}><TableCell>{permission.name}</TableCell><TableCell>{permission.admin ? "✓" : "—"}</TableCell><TableCell>{permission.moderator ? "✓" : "—"}</TableCell><TableCell>{permission.user ? "✓" : "—"}</TableCell></TableRow>)}</TableBody></Table><DialogFooter><Button onClick={() => setDialogOpen(false)}>Close</Button></DialogFooter></DialogContent></Dialog></div>;
}
