import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Lock, Mail, Users, Calendar, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface PasswordResetLog {
  id: string;
  user_email: string;
  requested_at: string;
  status: 'sent' | 'failed';
}

const SuperAdminPasswordManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [resetLogs, setResetLogs] = useState<PasswordResetLog[]>([]);
  const [logsOpen, setLogsOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchResetLogs();
  }, []);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users.',
        variant: 'destructive',
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchResetLogs = async () => {
    // For now, we'll simulate reset logs since we don't have a logging table
    // In a real implementation, you'd create a password_reset_logs table
    setResetLogs([]);
  };

  const handleChangeUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !newPassword) {
      toast({
        title: 'Missing Information',
        description: 'Please select a user and enter a new password.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('change-user-password', {
        body: {
          userId: selectedUser,
          newPassword: newPassword,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User password changed successfully.',
      });

      setSelectedUser('');
      setNewPassword('');
    } catch (error: any) {
      console.error('Error changing user password:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to change user password.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendPasswordReset = async (userId: string) => {
    const selectedUserData = users.find(u => u.id === userId);
    if (!selectedUserData) return;

    try {
      setResetLoading(true);
      
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          userEmail: selectedUserData.email,
          userName: selectedUserData.full_name || selectedUserData.email,
          resetUrl: `${window.location.origin}/auth/reset-password`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Password Reset Sent',
        description: `Password reset link sent to ${selectedUserData.email}`,
      });

      // Add to logs (in real implementation, this would be handled by the backend)
      const newLog: PasswordResetLog = {
        id: Date.now().toString(),
        user_email: selectedUserData.email,
        requested_at: new Date().toISOString(),
        status: 'sent'
      };
      setResetLogs(prev => [newLog, ...prev]);
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send password reset.',
        variant: 'destructive',
      });
    } finally {
      setResetLoading(false);
    }
  };

  if (user?.role !== 'super_admin') {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">
            Only Super Admins can access password management features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Change User Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change User Password
          </CardTitle>
          <CardDescription>
            Directly change any user's password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangeUserPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-select">Select User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {usersLoading ? (
                    <SelectItem value="loading" disabled>Loading users...</SelectItem>
                  ) : (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <span>{user.full_name || user.email}</span>
                          <Badge variant="outline" className="text-xs">
                            {user.role}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-user-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-9"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={loading || !selectedUser || !newPassword}
              className="w-full"
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Send Password Reset */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Password Reset
          </CardTitle>
          <CardDescription>
            Send password reset links to users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usersLoading ? (
              <div className="text-center py-4">Loading users...</div>
            ) : (
              <div className="grid gap-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{user.full_name || user.email}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendPasswordReset(user.id)}
                      disabled={resetLoading}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Send Reset
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reset Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Password Reset Activity
          </CardTitle>
          <CardDescription>
            View recent password reset requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                View Reset Logs ({resetLogs.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Password Reset Activity</DialogTitle>
                <DialogDescription>
                  Recent password reset requests and their status
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {resetLogs.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No reset requests found.</p>
                ) : (
                  resetLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{log.user_email}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(log.requested_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                        {log.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminPasswordManager;