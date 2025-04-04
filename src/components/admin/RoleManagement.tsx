
import { useState } from 'react';
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer' | null;
}

export default function RoleManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [isInviting, setIsInviting] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // In a real app, this would fetch from the Supabase database
      // Mocking users for UI demo
      const mockUsers = [
        { id: '1', email: 'admin@example.com', role: 'admin' },
        { id: '2', email: 'editor@example.com', role: 'editor' },
        { id: '3', email: 'user@example.com', role: 'viewer' },
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

  // Load users on component mount
  if (users.length === 0 && !loading) {
    fetchUsers();
  }

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
                <TableHead>Current Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className={`capitalize ${
                        user.role === 'admin' ? 'text-purple-600 dark:text-purple-400' : 
                        user.role === 'editor' ? 'text-blue-600 dark:text-blue-400' : 
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {user.role || 'No role'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={user.role || 'viewer'} 
                        onValueChange={(value) => handleRoleChange(user.id, value as 'admin' | 'editor' | 'viewer')}
                      >
                        <SelectTrigger className="w-[140px]">
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
