import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface User {
  id: string;
  email: string;
  role: 'admin' | 'moderator' | 'user';
  full_name?: string;
  created_at: string;
  last_sign_in_at?: string;
}

interface PermissionDetail {
  name: string;
  admin: boolean;
  moderator: boolean;
  user: boolean;
}

export default function UserRoleManagement() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permissionsOpen, setPermissionsOpen] = useState(false);

  // Production permissions data
  const permissions: PermissionDetail[] = [
    { name: 'View public content', admin: true, moderator: true, user: true },
    { name: 'Create content', admin: true, moderator: true, user: true },
    { name: 'Edit own content', admin: true, moderator: true, user: true },
    { name: 'Delete own content', admin: true, moderator: true, user: true },
    { name: 'Moderate community content', admin: true, moderator: true, user: false },
    { name: 'Delete any content', admin: true, moderator: false, user: false },
    { name: 'Manage user roles', admin: true, moderator: false, user: false },
    { name: 'Access admin dashboard', admin: true, moderator: false, user: false },
    { name: 'Manage site settings', admin: true, moderator: false, user: false },
    { name: 'View analytics', admin: true, moderator: false, user: false },
  ];

  // Check if current user is admin
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    fetchUsers();
  }, []);

  const checkAdminStatus = async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .single();

      if (!error && data?.role === 'admin') {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get all user roles first
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at');

      if (rolesError) throw rolesError;

      if (!rolesData || rolesData.length === 0) {
        setUsers([]);
        return;
      }

      // Get profile data for each user
      const userIds = rolesData.map(role => role.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      // Get auth users if admin access is available
      let authUsersMap: Record<string, any> = {};
      try {
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        if (!authError && authUsers && Array.isArray(authUsers.users)) {
          authUsersMap = (authUsers.users as any[]).reduce((acc: Record<string, any>, user: any) => {
            acc[user.id] = user;
            return acc;
          }, {});
        }
      } catch (error) {
        // If admin access fails, we'll just show basic info
        console.log('Admin access not available for auth data');
      }

      // Merge all data
      const formattedUsers = rolesData.map(role => {
        const profile = profilesData?.find(p => p.id === role.user_id);
        const authUser = authUsersMap[role.user_id];
        
        return {
          id: role.user_id,
          email: authUser?.email || 'Email hidden',
          role: role.role as 'admin' | 'moderator' | 'user',
          full_name: profile?.full_name,
          created_at: role.created_at,
          last_sign_in_at: authUser?.last_sign_in_at
        };
      });
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'moderator' | 'user') => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can change user roles",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const handleViewPermissions = (user: User) => {
    setSelectedUser(user);
    setPermissionsOpen(true);
  };

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchEmail.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">You don't have permission to access user management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">User Role Management</h2>
        <Input 
          placeholder="Search by email or name" 
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="max-w-xs"
        />
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.full_name || 'Not set'}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.role === 'admin' ? 'destructive' : 
                              user.role === 'moderator' ? 'secondary' : 'outline'}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={user.role} 
                        onValueChange={(value) => handleRoleChange(user.id, value as 'admin' | 'moderator' | 'user')}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewPermissions(user)}
                      >
                        Permissions
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Permissions Dialog */}
      <Dialog open={permissionsOpen} onOpenChange={setPermissionsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.role && selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)} Role Permissions
            </DialogTitle>
            <DialogDescription>
              Showing permissions for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%]">Permission</TableHead>
                  <TableHead className="text-center">Admin</TableHead>
                  <TableHead className="text-center">Moderator</TableHead>
                  <TableHead className="text-center">User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((perm, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{perm.name}</TableCell>
                    <TableCell className="text-center">
                      {perm.admin ? '✓' : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      {perm.moderator ? '✓' : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      {perm.user ? '✓' : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setPermissionsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}