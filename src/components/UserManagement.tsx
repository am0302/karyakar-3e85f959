
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Users, Edit, Mail, Key, Search, UserCheck, Lock } from 'lucide-react';
import { RoleDisplay } from '@/components/RoleDisplay';
import { useDynamicRoles } from '@/hooks/useDynamicRoles';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  role: string;
  created_at: string;
  is_active: boolean;
}

const UserManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getRoleOptions } = useDynamicRoles();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    role: ''
  });

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setEditFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      mobile_number: user.mobile_number || '',
      role: user.role || ''
    });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      console.log('Attempting to update user with role:', editFormData.role);
      
      // First, verify that the role exists in the custom_roles table
      const { data: roleCheck, error: roleError } = await supabase
        .from('custom_roles')
        .select('role_name')
        .eq('role_name', editFormData.role)
        .eq('is_active', true)
        .single();

      if (roleError || !roleCheck) {
        console.error('Role validation error:', roleError);
        toast({
          title: 'Error',
          description: `Role "${editFormData.role}" is not valid or inactive`,
          variant: 'destructive',
        });
        return;
      }

      // Attempt the update with better error handling
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editFormData.full_name,
          email: editFormData.email,
          mobile_number: editFormData.mobile_number,
          role: editFormData.role as any
        })
        .eq('id', selectedUser.id);

      if (error) {
        console.error('Database update error:', error);
        
        // Check if it's a role enum error
        if (error.message?.includes('invalid input value for enum user_role')) {
          toast({
            title: 'Role Error',
            description: `The role "${editFormData.role}" is not supported in the database. Please contact an administrator to add this role.`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Update Error',
            description: `Failed to update user: ${error.message}`,
            variant: 'destructive',
          });
        }
        return;
      }

      toast({
        title: 'Success',
        description: 'User updated successfully',
      });

      setEditDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: `Failed to update user: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const handleSendPasswordReset = async (userEmail: string, userName: string) => {
    try {
      setResetPasswordLoading(true);
      
      const resetUrl = `${window.location.origin}/auth/reset-password`;
      
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          userEmail,
          userName,
          resetUrl
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Password reset link sent to ${userEmail}`,
      });

    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast({
        title: 'Error',
        description: 'Failed to send password reset link',
        variant: 'destructive',
      });
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) return;

    try {
      setChangePasswordLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const { error } = await supabase.functions.invoke('change-user-password', {
        body: {
          userId: selectedUser.id,
          newPassword
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Password changed successfully',
      });

      setChangePasswordDialogOpen(false);
      setNewPassword('');
      setSelectedUser(null);

    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const openChangePasswordDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setNewPassword('');
    setChangePasswordDialogOpen(true);
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.mobile_number?.includes(searchTerm)
  );

  const roleOptions = getRoleOptions();

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users by name, email, or mobile number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                    <TableCell>{user.email || 'N/A'}</TableCell>
                    <TableCell>{user.mobile_number || 'N/A'}</TableCell>
                    <TableCell>
                      <RoleDisplay role={user.role} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendPasswordReset(user.email, user.full_name)}
                          disabled={!user.email || resetPasswordLoading}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Send Reset
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openChangePasswordDialog(user)}
                        >
                          <Lock className="h-4 w-4 mr-1" />
                          Change Password
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">
                Name
              </Label>
              <Input
                id="full_name"
                value={editFormData.full_name}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mobile" className="text-right">
                Mobile
              </Label>
              <Input
                id="mobile"
                value={editFormData.mobile_number}
                onChange={(e) => setEditFormData({ ...editFormData, mobile_number: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select
                value={editFormData.role}
                onValueChange={(value) => {
                  console.log('Selected role:', value);
                  setEditFormData({ ...editFormData, role: value });
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateUser}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordDialogOpen} onOpenChange={setChangePasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change User Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_password" className="text-right">
                New Password
              </Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="col-span-3"
                minLength={6}
              />
            </div>
            <div className="text-sm text-muted-foreground px-4">
              Password must be at least 6 characters long
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setChangePasswordDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleChangePassword}
              disabled={!newPassword || newPassword.length < 6 || changePasswordLoading}
            >
              {changePasswordLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
