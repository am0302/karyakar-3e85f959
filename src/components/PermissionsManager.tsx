import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDynamicRoles } from "@/hooks/useDynamicRoles";
import { Trash2, Save, Shield, RefreshCw, Settings } from "lucide-react";

interface RolePermission {
  id: string;
  role: string;
  module_name: string;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
}

interface ModulePermission {
  id: string;
  user_id: string;
  module_name: string;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
}

export const PermissionsManager = () => {
  const { toast } = useToast();
  const { getRoleOptions, getRoleDisplayName } = useDynamicRoles();
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [modulePermissions, setModulePermissions] = useState<ModulePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states for role permissions
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [rolePermissionSet, setRolePermissionSet] = useState({
    can_view: false,
    can_add: false,
    can_edit: false,
    can_delete: false,
    can_export: false
  });

  // Form states for user permissions
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedUserModule, setSelectedUserModule] = useState('');
  const [userPermissionSet, setUserPermissionSet] = useState({
    can_view: false,
    can_add: false,
    can_edit: false,
    can_delete: false,
    can_export: false
  });

  const [users, setUsers] = useState<any[]>([]);

  const modules = [
    { value: 'karyakars', label: 'Karyakars' },
    { value: 'tasks', label: 'Tasks' },
    { value: 'reports', label: 'Reports' },
    { value: 'communication', label: 'Communication' },
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
      await Promise.all([
        fetchRolePermissions(),
        fetchModulePermissions(),
        fetchUsers()
      ]);
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

  const fetchRolePermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRolePermissions(data || []);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      setRolePermissions([]);
    }
  };

  const fetchModulePermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('module_permissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setModulePermissions(data || []);
    } catch (error) {
      console.error('Error fetching module permissions:', error);
      setModulePermissions([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const saveRolePermission = async () => {
    if (!selectedRole || !selectedModule) {
      toast({
        title: 'Error',
        description: 'Please select both role and module',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      const { data: existing, error: checkError } = await supabase
        .from('role_permissions')
        .select('id')
        .eq('role', selectedRole as any) // Type assertion for database compatibility
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
      } else {
        // Cast selectedRole to the expected type for database insertion
        const { error } = await supabase
          .from('role_permissions')
          .insert({
            role: selectedRole as any, // Type assertion for database compatibility
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
      setSelectedRole('');
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

  const saveUserPermission = async () => {
    if (!selectedUser || !selectedUserModule) {
      toast({
        title: 'Error',
        description: 'Please select both user and module',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      const { data: existing, error: checkError } = await supabase
        .from('module_permissions')
        .select('id')
        .eq('user_id', selectedUser)
        .eq('module_name', selectedUserModule)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        const { error } = await supabase
          .from('module_permissions')
          .update({
            ...userPermissionSet,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('module_permissions')
          .insert({
            user_id: selectedUser,
            module_name: selectedUserModule,
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
      setSelectedUserModule('');
      setUserPermissionSet({
        can_view: false,
        can_add: false,
        can_edit: false,
        can_delete: false,
        can_export: false
      });

      await fetchModulePermissions();
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

  const deleteUserPermission = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user permission?')) return;

    try {
      const { error } = await supabase
        .from('module_permissions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User permission deleted successfully',
      });

      await fetchModulePermissions();
    } catch (error: any) {
      console.error('Error deleting user permission:', error);
      toast({
        title: 'Error',
        description: `Failed to delete user permission: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const getUserOptions = () => {
    return users.map(user => ({
      value: user.id,
      label: `${user.full_name} (${getRoleDisplayName(user.role)})`
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading permissions data...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Permissions Management</h2>
          <p className="text-gray-600">Configure role-based and user-specific permissions</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="role-permissions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="role-permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Role Permissions
          </TabsTrigger>
          <TabsTrigger value="user-permissions" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            User Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="role-permissions" className="space-y-6">
          {/* Role Permission Form */}
          <Card>
            <CardHeader>
              <CardTitle>Configure Role Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <SearchableSelect
                    options={getRoleOptions()}
                    value={selectedRole}
                    onValueChange={setSelectedRole}
                    placeholder="Select Role"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Module</Label>
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
                        checked={rolePermissionSet[permission.key as keyof typeof rolePermissionSet]}
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
              <CardTitle>Current Role Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              {rolePermissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No role permissions configured</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rolePermissions.map((permission) => (
                    <div key={permission.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">
                            {getRoleDisplayName(permission.role)} - {permission.module_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Module permissions for {getRoleDisplayName(permission.role)} role
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
                            variant={permission[perm.key as keyof typeof permission] ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {perm.label}: {permission[perm.key as keyof typeof permission] ? '✓' : '✗'}
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

        <TabsContent value="user-permissions" className="space-y-6">
          {/* User Permission Form */}
          <Card>
            <CardHeader>
              <CardTitle>Configure User Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>User</Label>
                  <SearchableSelect
                    options={getUserOptions()}
                    value={selectedUser}
                    onValueChange={setSelectedUser}
                    placeholder="Select User"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Module</Label>
                  <SearchableSelect
                    options={modules}
                    value={selectedUserModule}
                    onValueChange={setSelectedUserModule}
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
                        checked={userPermissionSet[permission.key as keyof typeof userPermissionSet]}
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
              <CardTitle>Current User Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              {modulePermissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No user permissions configured</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modulePermissions.map((permission) => {
                    const user = users.find(u => u.id === permission.user_id);
                    return (
                      <div key={permission.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">
                              {user?.full_name || 'Unknown User'} - {permission.module_name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Custom permissions for {user?.full_name || 'Unknown User'}
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
                              variant={permission[perm.key as keyof typeof permission] ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {perm.label}: {permission[perm.key as keyof typeof permission] ? '✓' : '✗'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
