
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, Settings } from 'lucide-react';

interface UserPermission {
  id: string;
  user_id: string;
  module_name: string;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

const MODULES = ['karyakars', 'tasks', 'communication', 'reports', 'admin'];

const PermissionsManager = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserPermissions(selectedUser);
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchUserPermissions = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('module_permissions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setPermissions(data || []);
    } catch (error: any) {
      console.error('Error fetching permissions:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (
    module: string, 
    permissionType: string, 
    value: boolean
  ) => {
    if (!selectedUser) return;

    try {
      const existingPermission = permissions.find(p => p.module_name === module);

      if (existingPermission) {
        // Update existing permission
        const { error } = await supabase
          .from('module_permissions')
          .update({
            [permissionType]: value,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPermission.id);

        if (error) throw error;
      } else {
        // Create new permission record
        const newPermission = {
          user_id: selectedUser,
          module_name: module,
          can_view: permissionType === 'can_view' ? value : false,
          can_add: permissionType === 'can_add' ? value : false,
          can_edit: permissionType === 'can_edit' ? value : false,
          can_delete: permissionType === 'can_delete' ? value : false,
          can_export: permissionType === 'can_export' ? value : false,
        };

        const { error } = await supabase
          .from('module_permissions')
          .insert(newPermission);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Permission updated successfully',
      });

      // Refresh permissions
      await fetchUserPermissions(selectedUser);
    } catch (error: any) {
      console.error('Error updating permission:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getPermissionValue = (module: string, permissionType: string): boolean => {
    const permission = permissions.find(p => p.module_name === module);
    return permission ? permission[permissionType as keyof UserPermission] as boolean : false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        <h2 className="text-2xl font-bold">User Permissions Management</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select User</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Select a user to manage permissions" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name} ({user.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>Module Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading permissions...</div>
            ) : (
              <div className="space-y-6">
                {MODULES.map((module) => (
                  <div key={module} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4 capitalize">{module}</h3>
                    <div className="grid grid-cols-5 gap-4">
                      {['can_view', 'can_add', 'can_edit', 'can_delete', 'can_export'].map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Switch
                            id={`${module}-${permission}`}
                            checked={getPermissionValue(module, permission)}
                            onCheckedChange={(checked) => updatePermission(module, permission, checked)}
                          />
                          <Label htmlFor={`${module}-${permission}`} className="text-sm">
                            {permission.replace('can_', '').replace('_', ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PermissionsManager;
