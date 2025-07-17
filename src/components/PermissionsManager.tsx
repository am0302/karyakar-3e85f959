
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Save, User, Shield } from 'lucide-react';

type Profile = {
  id: string;
  full_name: string;
  role: string;
  email?: string;
};

type ModulePermission = {
  id?: string;
  user_id: string;
  module_name: string;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
};

const MODULES = [
  'karyakars',
  'tasks', 
  'communication',
  'reports',
  'admin'
];

const PERMISSIONS = [
  { key: 'can_view', label: 'View' },
  { key: 'can_add', label: 'Add' },
  { key: 'can_edit', label: 'Edit' },
  { key: 'can_delete', label: 'Delete' },
  { key: 'can_export', label: 'Export' }
];

const PermissionsManager = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserPermissions(selectedUserId);
    }
  }, [selectedUserId]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, email')
        .eq('is_active', true)
        .neq('role', 'super_admin')
        .order('full_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch user profiles',
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

      // Create a full set of permissions for all modules
      const userPermissions: ModulePermission[] = MODULES.map(module => {
        const existingPermission = data?.find(p => p.module_name === module);
        return existingPermission || {
          user_id: userId,
          module_name: module,
          can_view: false,
          can_add: false,
          can_edit: false,
          can_delete: false,
          can_export: false
        };
      });

      setPermissions(userPermissions);
    } catch (error: any) {
      console.error('Error fetching user permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch user permissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = (moduleIndex: number, permissionKey: string, value: boolean) => {
    setPermissions(prev => {
      const updated = [...prev];
      updated[moduleIndex] = {
        ...updated[moduleIndex],
        [permissionKey]: value
      };
      return updated;
    });
  };

  const setAllPermissionsForModule = (moduleIndex: number, value: boolean) => {
    setPermissions(prev => {
      const updated = [...prev];
      updated[moduleIndex] = {
        ...updated[moduleIndex],
        can_view: value,
        can_add: value,
        can_edit: value,
        can_delete: value,
        can_export: value
      };
      return updated;
    });
  };

  const savePermissions = async () => {
    if (!selectedUserId) return;

    try {
      setSaving(true);

      // Delete existing permissions for this user
      await supabase
        .from('module_permissions')
        .delete()
        .eq('user_id', selectedUserId);

      // Insert new permissions (only for modules that have at least one permission enabled)
      const permissionsToInsert = permissions.filter(permission => 
        permission.can_view || permission.can_add || permission.can_edit || 
        permission.can_delete || permission.can_export
      );

      if (permissionsToInsert.length > 0) {
        const { error } = await supabase
          .from('module_permissions')
          .insert(permissionsToInsert.map(p => ({
            user_id: p.user_id,
            module_name: p.module_name,
            can_view: p.can_view,
            can_add: p.can_add,
            can_edit: p.can_edit,
            can_delete: p.can_delete,
            can_export: p.can_export
          })));

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Permissions updated successfully',
      });

      // Refresh permissions
      fetchUserPermissions(selectedUserId);
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to save permissions',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedProfile = profiles.find(p => p.id === selectedUserId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Module Permissions</h2>
        <p className="text-gray-600">Manage user permissions for different modules</p>
      </div>

      {/* User Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Select User
          </CardTitle>
          <CardDescription>
            Choose a user to manage their module permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">User</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      <div className="flex items-center gap-2">
                        <span>{profile.full_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {profile.role.replace('_', ' ')}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProfile && (
              <div className="text-sm text-gray-600">
                <div>Email: {selectedProfile.email || 'N/A'}</div>
                <div>Role: {selectedProfile.role.replace('_', ' ')}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Permissions Grid */}
      {selectedUserId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Module Permissions
            </CardTitle>
            <CardDescription>
              Configure permissions for {selectedProfile?.full_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading permissions...</div>
            ) : (
              <div className="space-y-6">
                {permissions.map((permission, moduleIndex) => (
                  <div key={permission.module_name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium capitalize">
                          {permission.module_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Manage access to {permission.module_name} module
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAllPermissionsForModule(moduleIndex, true)}
                        >
                          Enable All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAllPermissionsForModule(moduleIndex, false)}
                        >
                          Disable All
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {PERMISSIONS.map((perm) => (
                        <div key={perm.key} className="flex items-center space-x-2">
                          <Switch
                            id={`${permission.module_name}-${perm.key}`}
                            checked={permission[perm.key as keyof ModulePermission] as boolean}
                            onCheckedChange={(checked) => 
                              updatePermission(moduleIndex, perm.key, checked)
                            }
                          />
                          <label
                            htmlFor={`${permission.module_name}-${perm.key}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {perm.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end pt-4">
                  <Button onClick={savePermissions} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Permissions'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedUserId && (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No User Selected</h3>
            <p className="text-gray-600">Select a user above to manage their module permissions</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PermissionsManager;
