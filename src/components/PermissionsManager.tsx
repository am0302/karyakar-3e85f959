import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Save, Users, Shield } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  email?: string;
}

interface PermissionSet {
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
}

interface UserPermission extends PermissionSet {
  id: string;
  user_id: string;
  module: string;
  profiles?: { full_name: string };
}

interface RolePermission extends PermissionSet {
  id: string;
  role: UserRole;
  module_name: string;
}

export const PermissionsManager = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('sevak');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [userPermissionSet, setUserPermissionSet] = useState<PermissionSet>({
    can_view: false,
    can_add: false,
    can_edit: false,
    can_delete: false,
    can_export: false
  });
  const [rolePermissionSet, setRolePermissionSet] = useState<PermissionSet>({
    can_view: false,
    can_add: false,
    can_edit: false,
    can_delete: false,
    can_export: false
  });

  const modules = [
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'karyakars', label: 'Karyakars' },
    { value: 'tasks', label: 'Tasks' },
    { value: 'communication', label: 'Communication' },
    { value: 'reports', label: 'Reports' },
    { value: 'admin', label: 'Admin' }
  ];

  const roles: { value: UserRole; label: string }[] = [
    { value: 'sevak', label: 'Sevak' },
    { value: 'karyakar', label: 'Karyakar' },
    { value: 'mandal_sanchalak', label: 'Mandal Sanchalak' },
    { value: 'sah_nirdeshak', label: 'Sah Nirdeshak' },
    { value: 'sant_nirdeshak', label: 'Sant Nirdeshak' },
    { value: 'super_admin', label: 'Super Admin' },
  ];

  const permissionTypes = [
    { key: 'can_view', label: 'View' },
    { key: 'can_add', label: 'Add' },
    { key: 'can_edit', label: 'Edit' },
    { key: 'can_delete', label: 'Delete' },
    { key: 'can_export', label: 'Export' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchProfiles(),
        fetchUserPermissions(),
        fetchRolePermissions()
      ]);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch permissions data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, email')
      .eq('is_active', true)
      .order('full_name');

    if (error) throw error;
    setProfiles(data || []);
  };

  const fetchUserPermissions = async () => {
    const { data, error } = await supabase
      .from('user_permissions')
      .select(`
        *,
        profiles!user_permissions_user_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user permissions:', error);
      return;
    }
    setUserPermissions(data || []);
  };

  const fetchRolePermissions = async () => {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching role permissions:', error);
      return;
    }
    setRolePermissions(data || []);
  };

  const saveUserPermission = async () => {
    if (!selectedUser || !selectedModule) {
      toast({
        title: 'Error',
        description: 'Please select a user and module',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Saving user permission:', { 
        user_id: selectedUser, 
        module: selectedModule, 
        ...userPermissionSet 
      });
      
      // Check if permission already exists
      const { data: existing } = await supabase
        .from('user_permissions')
        .select('id')
        .eq('user_id', selectedUser)
        .eq('module', selectedModule)
        .single();

      if (existing) {
        // Update existing permission
        const { error } = await supabase
          .from('user_permissions')
          .update({
            ...userPermissionSet,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new permission
        const { error } = await supabase
          .from('user_permissions')
          .insert({
            user_id: selectedUser,
            module: selectedModule,
            ...userPermissionSet
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'User permission saved successfully',
      });

      // Reset form
      setSelectedUser('');
      setSelectedModule('');
      setUserPermissionSet({
        can_view: false,
        can_add: false,
        can_edit: false,
        can_delete: false,
        can_export: false
      });

      fetchUserPermissions();
    } catch (error: any) {
      console.error('Error saving user permission:', error);
      toast({
        title: 'Error',
        description: `Failed to save user permission: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const saveRolePermission = async () => {
    if (!selectedRole || !selectedModule) {
      toast({
        title: 'Error',
        description: 'Please select a role and module',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Saving role permission:', { 
        role: selectedRole, 
        module_name: selectedModule, 
        ...rolePermissionSet 
      });
      
      // Check if permission already exists
      const { data: existing } = await supabase
        .from('role_permissions')
        .select('id')
        .eq('role', selectedRole)
        .eq('module_name', selectedModule)
        .single();

      if (existing) {
        // Update existing permission
        const { error } = await supabase
          .from('role_permissions')
          .update({
            ...rolePermissionSet,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new permission
        const { error } = await supabase
          .from('role_permissions')
          .insert({
            role: selectedRole,
            module_name: selectedModule,
            ...rolePermissionSet
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Role permission saved successfully',
      });

      // Reset form
      setSelectedRole('sevak');
      setSelectedModule('');
      setRolePermissionSet({
        can_view: false,
        can_add: false,
        can_edit: false,
        can_delete: false,
        can_export: false
      });

      fetchRolePermissions();
    } catch (error: any) {
      console.error('Error saving role permission:', error);
      toast({
        title: 'Error',
        description: `Failed to save role permission: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const deleteUserPermission = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user permission?')) return;

    try {
      const { error } = await supabase
        .from('user_permissions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User permission deleted successfully',
      });

      fetchUserPermissions();
    } catch (error: any) {
      console.error('Error deleting user permission:', error);
      toast({
        title: 'Error',
        description: `Failed to delete user permission: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const deleteRolePermission = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role permission?')) return;

    try {
      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Role permission deleted successfully',
      });

      fetchRolePermissions();
    } catch (error: any) {
      console.error('Error deleting role permission:', error);
      toast({
        title: 'Error',
        description: `Failed to delete role permission: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading permissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Permissions Management</h2>
        <p className="text-gray-600">Manage user and role-based permissions for different modules</p>
      </div>

      <Tabs defaultValue="user-permissions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="user-permissions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Permissions
          </TabsTrigger>
          <TabsTrigger value="role-permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Role Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user-permissions" className="space-y-6">
          {/* User Permission Form */}
          <Card>
            <CardHeader>
              <CardTitle>Assign User Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Select User</Label>
                  <SearchableSelect
                    options={profiles.map(p => ({ 
                      value: p.id, 
                      label: `${p.full_name} (${p.role.replace('_', ' ')})` 
                    }))}
                    value={selectedUser}
                    onValueChange={setSelectedUser}
                    placeholder="Select User"
                  />
                </div>
                <div>
                  <Label>Select Module</Label>
                  <SearchableSelect
                    options={modules}
                    value={selectedModule}
                    onValueChange={setSelectedModule}
                    placeholder="Select Module"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {permissionTypes.map((permission) => (
                    <div key={permission.key} className="flex items-center space-x-2">
                      <Switch
                        checked={userPermissionSet[permission.key as keyof PermissionSet]}
                        onCheckedChange={(checked) => 
                          setUserPermissionSet({ 
                            ...userPermissionSet, 
                            [permission.key]: checked 
                          })
                        }
                      />
                      <Label className="text-sm">{permission.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={saveUserPermission} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save User Permission
              </Button>
            </CardContent>
          </Card>

          {/* User Permissions List */}
          <Card>
            <CardHeader>
              <CardTitle>Current User Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              {userPermissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No user-specific permissions configured</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userPermissions.map((permission) => (
                    <div key={permission.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">
                            {permission.profiles?.full_name || 'Unknown User'}
                          </h4>
                          <p className="text-sm text-gray-600 capitalize">
                            Module: {permission.module}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteUserPermission(permission.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {permissionTypes.map((perm) => (
                          <Badge
                            key={perm.key}
                            variant={permission[perm.key as keyof PermissionSet] ? "default" : "secondary"}
                          >
                            {perm.label}: {permission[perm.key as keyof PermissionSet] ? '✓' : '✗'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="role-permissions" className="space-y-6">
          {/* Role Permission Form */}
          <Card>
            <CardHeader>
              <CardTitle>Configure Role Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Select Role</Label>
                  <SearchableSelect
                    options={roles}
                    value={selectedRole}
                    onValueChange={(value) => setSelectedRole(value as UserRole)}
                    placeholder="Select Role"
                  />
                </div>
                <div>
                  <Label>Select Module</Label>
                  <SearchableSelect
                    options={modules}
                    value={selectedModule}
                    onValueChange={setSelectedModule}
                    placeholder="Select Module"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {permissionTypes.map((permission) => (
                    <div key={permission.key} className="flex items-center space-x-2">
                      <Switch
                        checked={rolePermissionSet[permission.key as keyof PermissionSet]}
                        onCheckedChange={(checked) => 
                          setRolePermissionSet({ 
                            ...rolePermissionSet, 
                            [permission.key]: checked 
                          })
                        }
                      />
                      <Label className="text-sm">{permission.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={saveRolePermission} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Role Permission
              </Button>
            </CardContent>
          </Card>

          {/* Role Permissions List */}
          <Card>
            <CardHeader>
              <CardTitle>Current Role Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              {rolePermissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No role-based permissions configured</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rolePermissions.map((permission) => (
                    <div key={permission.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium capitalize">
                            {permission.role.replace('_', ' ')}
                          </h4>
                          <p className="text-sm text-gray-600 capitalize">
                            Module: {permission.module_name}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRolePermission(permission.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {permissionTypes.map((perm) => (
                          <Badge
                            key={perm.key}
                            variant={permission[perm.key as keyof PermissionSet] ? "default" : "secondary"}
                          >
                            {perm.label}: {permission[perm.key as keyof PermissionSet] ? '✓' : '✗'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
