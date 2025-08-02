import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useDynamicRoles } from '@/hooks/useDynamicRoles';
import { Trash2, Save, Users, Shield, RefreshCw } from 'lucide-react';
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
  const { getRoleOptions, loading: rolesLoading } = useDynamicRoles();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      console.log('Fetching permissions data...');
      
      await Promise.all([
        fetchProfiles(),
        fetchUserPermissions(),
        fetchRolePermissions()
      ]);
      
      console.log('All data fetched successfully');
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch permissions data: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    console.log('Fetching profiles...');
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, email')
      .eq('is_active', true)
      .order('full_name');

    if (error) {
      console.error('Error fetching profiles:', error);
      throw error;
    }
    
    console.log('Profiles fetched:', data?.length || 0);
    setProfiles(data || []);
  };

  const fetchUserPermissions = async () => {
    console.log('Fetching user permissions...');
    const { data, error } = await supabase
      .from('user_permissions')
      .select(`
        *,
        profiles!user_permissions_user_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user permissions:', error);
      setUserPermissions([]);
      return;
    }
    
    console.log('User permissions fetched:', data?.length || 0);
    setUserPermissions(data || []);
  };

  const fetchRolePermissions = async () => {
    console.log('Fetching role permissions...');
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching role permissions:', error);
      setRolePermissions([]);
      return;
    }
    
    console.log('Role permissions fetched:', data?.length || 0);
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
      setSaving(true);
      console.log('Saving user permission:', { 
        user_id: selectedUser, 
        module: selectedModule, 
        ...userPermissionSet 
      });
      
      const { data: existing, error: checkError } = await supabase
        .from('user_permissions')
        .select('id')
        .eq('user_id', selectedUser)
        .eq('module', selectedModule)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        const { error } = await supabase
          .from('user_permissions')
          .update({
            ...userPermissionSet,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
        console.log('User permission updated successfully');
      } else {
        const { error } = await supabase
          .from('user_permissions')
          .insert({
            user_id: selectedUser,
            module: selectedModule,
            ...userPermissionSet
          });

        if (error) throw error;
        console.log('User permission created successfully');
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

      await fetchUserPermissions();
    } catch (error: any) {
      console.error('Error saving user permission:', error);
      toast({
        title: 'Error',
        description: `Failed to save user permission: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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
      setSaving(true);
      console.log('Saving role permission:', { 
        role: selectedRole, 
        module_name: selectedModule, 
        ...rolePermissionSet 
      });
      
      const { data: existing, error: checkError } = await supabase
        .from('role_permissions')
        .select('id')
        .eq('role', selectedRole)
        .eq('module_name', selectedModule)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        const { error } = await supabase
          .from('role_permissions')
          .update({
            ...rolePermissionSet,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
        console.log('Role permission updated successfully');
      } else {
        const { error } = await supabase
          .from('role_permissions')
          .insert({
            role: selectedRole,
            module_name: selectedModule,
            ...rolePermissionSet
          });

        if (error) throw error;
        console.log('Role permission created successfully');
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

      await fetchRolePermissions();
    } catch (error: any) {
      console.error('Error saving role permission:', error);
      toast({
        title: 'Error',
        description: `Failed to save role permission: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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

      await fetchUserPermissions();
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

      await fetchRolePermissions();
    } catch (error: any) {
      console.error('Error deleting role permission:', error);
      toast({
        title: 'Error',
        description: `Failed to delete role permission: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  if (loading || rolesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading permissions...
        </div>
      </div>
    );
  }

  return (
    <hr className="my-6 border-gray-300" />
    
    <div className="space-y-4 lg:space-y-6 p-4 lg:p-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Permissions Management</h2>
          <p className="text-sm lg:text-base text-gray-600">Manage user and role-based permissions for different modules</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" className="self-start lg:self-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="user-permissions" className="space-y-4 lg:space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="user-permissions" className="flex items-center gap-2 text-xs lg:text-sm p-2 lg:p-3">
            <Users className="h-3 w-3 lg:h-4 lg:w-4" />
            <span className="hidden sm:inline">User Permissions</span>
            <span className="sm:hidden">Users</span>
          </TabsTrigger>
          <TabsTrigger value="role-permissions" className="flex items-center gap-2 text-xs lg:text-sm p-2 lg:p-3">
            <Shield className="h-3 w-3 lg:h-4 lg:w-4" />
            <span className="hidden sm:inline">Role Permissions</span>
            <span className="sm:hidden">Roles</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user-permissions" className="space-y-4 lg:space-y-6">
          {/* User Permission Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl">Assign User Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm lg:text-base">Select User</Label>
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
                <div className="space-y-2">
                  <Label className="text-sm lg:text-base">Select Module</Label>
                  <SearchableSelect
                    options={modules}
                    value={selectedModule}
                    onValueChange={setSelectedModule}
                    placeholder="Select Module"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm lg:text-base">Permissions</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
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
                      <Label className="text-xs lg:text-sm">{permission.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={saveUserPermission} className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save User Permission
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* User Permissions List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl">Current User Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              {userPermissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm lg:text-base">No user-specific permissions configured</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userPermissions.map((permission) => (
                    <div key={permission.id} className="border rounded-lg p-3 lg:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div>
                          <h4 className="font-medium text-sm lg:text-base">
                            {permission.profiles?.full_name || 'Unknown User'}
                          </h4>
                          <p className="text-xs lg:text-sm text-gray-600 capitalize">
                            Module: {permission.module}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteUserPermission(permission.id)}
                          className="text-red-600 hover:text-red-800 self-start sm:self-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {permissionTypes.map((perm) => (
                          <Badge
                            key={perm.key}
                            variant={permission[perm.key as keyof PermissionSet] ? "default" : "secondary"}
                            className="text-xs"
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

        <TabsContent value="role-permissions" className="space-y-4 lg:space-y-6">
          {/* Role Permission Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl">Configure Role Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm lg:text-base">Select Role</Label>
                  <SearchableSelect
                    options={getRoleOptions()}
                    value={selectedRole}
                    onValueChange={(value) => setSelectedRole(value as UserRole)}
                    placeholder="Select Role"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm lg:text-base">Select Module</Label>
                  <SearchableSelect
                    options={modules}
                    value={selectedModule}
                    onValueChange={setSelectedModule}
                    placeholder="Select Module"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm lg:text-base">Permissions</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
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
                      <Label className="text-xs lg:text-sm">{permission.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={saveRolePermission} className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Role Permission
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Role Permissions List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl">Current Role Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              {rolePermissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm lg:text-base">No role-based permissions configured</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rolePermissions.map((permission) => (
                    <div key={permission.id} className="border rounded-lg p-3 lg:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div>
                          <h4 className="font-medium text-sm lg:text-base capitalize">
                            {permission.role.replace('_', ' ')}
                          </h4>
                          <p className="text-xs lg:text-sm text-gray-600 capitalize">
                            Module: {permission.module_name}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRolePermission(permission.id)}
                          className="text-red-600 hover:text-red-800 self-start sm:self-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {permissionTypes.map((perm) => (
                          <Badge
                            key={perm.key}
                            variant={permission[perm.key as keyof PermissionSet] ? "default" : "secondary"}
                            className="text-xs"
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
