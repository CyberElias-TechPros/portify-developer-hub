
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer' | null;
  lastLogin?: string;
  status?: 'active' | 'inactive' | 'pending';
}

interface PermissionDetail {
  name: string;
  admin: boolean;
  editor: boolean;
  viewer: boolean;
}

export default function RoleManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [isInviting, setIsInviting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permissionsOpen, setPermissionsOpen] = useState(false);

  // Mock permissions data
  const permissions: PermissionDetail[] = [
    { name: 'View portfolio content', admin: true, editor: true, viewer: true },
    { name: 'Edit portfolio content', admin: true, editor: true, viewer: false },
    { name: 'Create new sections', admin: true, editor: true, viewer: false },
    { name: 'Delete sections', admin: true, editor: false, viewer: false },
    { name: 'Manage users & roles', admin: true, editor: false, viewer: false },
    { name: 'Change site settings', admin: true, editor: false, viewer: false },
    { name: 'View analytics data', admin: true, editor: true, viewer: false },
    { name: 'Delete user accounts', admin: true, editor: false, viewer: false },
    { name: 'Publish content', admin: true, editor: true, viewer: false },
    { name: 'Access admin dashboard', admin: true, editor: true, viewer: false },
  ];

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // In a real app, this would fetch from the Supabase database
      // Mocking users for UI demo
      const mockUsers = [
        { id: '1', email: 'admin@example.com', role: 'admin', lastLogin: '2025-04-02T10:30:00Z', status: 'active' },
        { id: '2', email: 'editor@example.com', role: 'editor', lastLogin: '2025-04-01T14:45:00Z', status: 'active' },
        { id: '3', email: 'user@example.com', role: 'viewer', lastLogin: '2025-03-28T09:15:00Z', status: 'active' },
        { id: '4', email: 'newuser@example.com', role: 'viewer', status: 'pending' },
      ] as User[];
      
      setUsers(mockUsers);
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

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: 'admin' | 'editor' | 'viewer') => {
    try {
      // In a real app, this would update the user's role in Supabase
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

  // Handle user invitation
  const handleInvite = async () => {
    if (!inviteEmail || !inviteRole) {
      toast({
        title: "Error",
        description: "Email and role are required",
        variant: "destructive"
      });
      return;
    }
    
    setIsInviting(true);
    try {
      // In a real app, this would send an invitation through Supabase
      // For now, just show a success message
      
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail} with ${inviteRole} role`,
      });
      
      setInviteEmail('');
      setInviteRole('viewer');
    } catch (error) {
      console.error('Error inviting user:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      });
    } finally {
      setIsInviting(false);
    }
  };

  // View user permissions
  const handleViewPermissions = (user: User) => {
    setSelectedUser(user);
    setPermissionsOpen(true);
  };

  // Load users on component mount
  useEffect(() => {
    if (users.length === 0 && !loading) {
      fetchUsers();
    }
  }, []);

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchEmail.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Invite New User</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <Input 
            placeholder="Email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="md:flex-1"
          />
          <Select 
            value={inviteRole} 
            onValueChange={(value) => setInviteRole(value as 'admin' | 'editor' | 'viewer')}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleInvite} 
            disabled={isInviting || !inviteEmail}
          >
            {isInviting ? "Sending..." : "Send Invite"}
          </Button>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Manage User Roles</h2>
          <Input 
            placeholder="Search by email" 
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
                <TableHead>Status</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 
                              user.status === 'pending' ? 'outline' : 'secondary'}>
                        {user.status || 'unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`capitalize font-medium ${
                        user.role === 'admin' ? 'text-purple-600 dark:text-purple-400' : 
                        user.role === 'editor' ? 'text-blue-600 dark:text-blue-400' : 
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {user.role || 'No role'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select 
                          value={user.role || 'viewer'} 
                          onValueChange={(value) => handleRoleChange(user.id, value as 'admin' | 'editor' | 'viewer')}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Change role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
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
                  <TableHead className="text-center">Editor</TableHead>
                  <TableHead className="text-center">Viewer</TableHead>
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
                      {perm.editor ? '✓' : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      {perm.viewer ? '✓' : '—'}
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
