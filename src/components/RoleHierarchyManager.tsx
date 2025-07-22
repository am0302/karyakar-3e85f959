import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Save, Shield, RefreshCw, Users, Network, Plus, Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Database } from '@/integrations/supabase/types';

// Define types based on the expected database structure
type UserRole = Database['public']['Enums']['user_role'];

interface RoleInfo {
  role_name: UserRole;
  display_name: string;
  is_system_role: boolean;
}

interface RoleHierarchy {
  id: string;
  role: UserRole;
  level: number;
  parent_role: UserRole | null;
}

interface HierarchyPermission {
  id: string;
  higher_role: UserRole;
  lower_role: UserRole;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_assign_locations: boolean;
}

export const RoleHierarchyManager = () => {
  const { toast } = useToast();
  const [availableRoles, setAvailableRoles] = useState<RoleInfo[]>([]);
  const [roleHierarchy, setRoleHierarchy] = useState<RoleHierarchy[]>([]);
  const [hierarchyPermissions, setHierarchyPermissions] = useState<HierarchyPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New role form states
  const [newRoleLevel, setNewRoleLevel] = useState(1);
  const [newRoleParent, setNewRoleParent] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('sevak');
  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false);

  // Edit hierarchy states
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editLevel, setEditLevel] = useState(1);
  const [editParent, setEditParent] = useState('');

  // Permission form states
  const [selectedHigherRole, setSelectedHigherRole] = useState<UserRole>('super_admin');
  const [selectedLowerRole, setSelectedLowerRole] = useState<UserRole>('sevak');
  const [permissionSet, setPermissionSet] = useState({
    can_view: false,
    can_edit: false,
    can_delete: false,
    can_export: false,
    can_assign_locations: false
  });

  const permissionTypes = [
    { key: 'can_view', label: 'View' },
    { key: 'can_edit', label: 'Edit' },
    { key: 'can_delete', label: 'Delete' },
    { key: 'can_export', label: 'Export' },
    { key: 'can_assign_locations', label: 'Assign Locations' }
  ];

  // System roles with display names
  const systemRoles: RoleInfo[] = [
    { role_name: 'super_admin', display_name: 'Super Admin', is_system_role: true },
    { role_name: 'sant_nirdeshak', display_name: 'Sant Nirdeshak', is_system_role: true },
    { role_name: 'sah_nirdeshak', display_name: 'Sah Nirdeshak', is_system_role: true },
    { role_name: 'mandal_sanchalak', display_name: 'Mandal Sanchalak', is_system_role: true },
    { role_name: 'karyakar', display_name: 'Karyakar', is_system_role: true },
    { role_name: 'sevak', display_name: 'Sevak', is_system_role: true }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setAvailableRoles(systemRoles);
      await Promise.all([
        fetchRoleHierarchy(),
        fetchHierarchyPermissions()
      ]);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch hierarchy data: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleHierarchy = async () => {
    try {
      const { data, error } = await supabase
        .from('role_hierarchy')
        .select('*')
        .order('level');

      if (error) {
        console.error('Error fetching role hierarchy:', error);
        setRoleHierarchy([]);
        return;
      }
      
      setRoleHierarchy(data || []);
    } catch (error) {
      console.error('Error fetching role hierarchy:', error);
      setRoleHierarchy([]);
    }
  };

  const fetchHierarchyPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('hierarchy_permissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching hierarchy permissions:', error);
        setHierarchyPermissions([]);
        return;
      }
      
      setHierarchyPermissions(data || []);
    } catch (error) {
      console.error('Error fetching hierarchy permissions:', error);
      setHierarchyPermissions([]);
    }
  };

  const addRoleToHierarchy = async () => {
    if (!selectedRole) {
      toast({
        title: 'Error',
        description: 'Please select a role',
        variant: 'destructive',
      });
      return;
      console.log("Adding role with data:", {
  role: selectedRole,
  level: newRoleLevel,
  parent_role: newRoleParent || null
});
    }

    try {
      setSaving(true);
      
      // Check if role already exists in hierarchy
      const existingRole = roleHierarchy.find(r => r.role === selectedRole);
      if (existingRole) {
        toast({
          title: 'Error',
          description: 'Role already exists in hierarchy',
          variant: 'destructive',
        });
        return;
      }

     /* const { error } = await supabase
        .from('role_hierarchy')
        .insert({
          role: selectedRole,
          level: newRoleLevel,
          parent_role: newRoleParent ? newRoleParent as UserRole : null
        });*/
const { error } = await supabase.from('role_hierarchy').insert({
  role: selectedRole,
  level: newRoleLevel,
  parent_role: newRoleParent || null
});
if (error) {
  console.error("Failed to add role:", error.message);
}

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Role added to hierarchy successfully',
      });

      // Reset form
      setSelectedRole('sevak');
      setNewRoleLevel(1);
      setNewRoleParent('');
      setShowAddRoleDialog(false);

      await fetchRoleHierarchy();
    } catch (error: any) {
      console.error('Error adding role to hierarchy:', error);
      toast({
        title: 'Error',
        description: `Failed to add role to hierarchy: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateRoleHierarchy = async (roleName: string) => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('role_hierarchy')
        .update({
          level: editLevel,
          parent_role: editParent ? editParent as UserRole : null,
          updated_at: new Date().toISOString()
        })
        .eq('role', roleName as UserRole);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Role hierarchy updated successfully',
      });

      setEditingRole(null);
      await fetchRoleHierarchy();
    } catch (error: any) {
      console.error('Error updating role hierarchy:', error);
      toast({
        title: 'Error',
        description: `Failed to update role hierarchy: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveHierarchyPermission = async () => {
    if (!selectedHigherRole || !selectedLowerRole) {
      toast({
        title: 'Error',
        description: 'Please select both higher and lower roles',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      const { data: existing, error: checkError } = await supabase
        .from('hierarchy_permissions')
        .select('id')
        .eq('higher_role', selectedHigherRole)
        .eq('lower_role', selectedLowerRole)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        const { error } = await supabase
          .from('hierarchy_permissions')
          .update({
            ...permissionSet,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hierarchy_permissions')
          .insert({
            higher_role: selectedHigherRole,
            lower_role: selectedLowerRole,
            ...permissionSet
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Hierarchy permission saved successfully',
      });

      // Reset form
      setSelectedHigherRole('super_admin');
      setSelectedLowerRole('sevak');
      setPermissionSet({
        can_view: false,
        can_edit: false,
        can_delete: false,
        can_export: false,
        can_assign_locations: false
      });

      await fetchHierarchyPermissions();
    } catch (error: any) {
      console.error('Error saving hierarchy permission:', error);
      toast({
        title: 'Error',
        description: `Failed to save hierarchy permission: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteHierarchyPermission = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hierarchy permission?')) return;

    try {
      const { error } = await supabase
        .from('hierarchy_permissions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Hierarchy permission deleted successfully',
      });

      await fetchHierarchyPermissions();
    } catch (error: any) {
      console.error('Error deleting hierarchy permission:', error);
      toast({
        title: 'Error',
        description: `Failed to delete hierarchy permission: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const getRoleOptions = () => {
    return availableRoles.map(role => ({
      value: role.role_name,
      label: role.display_name
    }));
  };

  const getRoleDisplayName = (roleName: string) => {
    const role = availableRoles.find(r => r.role_name === roleName);
    return role ? role.display_name : roleName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getAvailableRolesForHierarchy = () => {
    const existingRoles = roleHierarchy.map(r => r.role);
    return availableRoles.filter(role => !existingRoles.includes(role.role_name));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading hierarchy data...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Hierarchy Management</h2>
          <p className="text-gray-600">Manage role hierarchy and permissions between roles</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="hierarchy-view" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hierarchy-view" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Role Hierarchy
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Hierarchy Permissions
          </TabsTrigger>
          <TabsTrigger value="manage-roles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Manage Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hierarchy-view" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Current Role Hierarchy</CardTitle>
              <Dialog open={showAddRoleDialog} onOpenChange={setShowAddRoleDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Role to Hierarchy
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Role to Hierarchy</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Role</Label>
                   
                      <div>
  <Label>Role</Label>
  <Input
    placeholder="Enter Role Name"
    value={selectedRole}
    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
  />
</div>

                      {/* <SearchableSelect
                        options={getAvailableRolesForHierarchy().map(role => ({
                          value: role.role_name,
                          label: role.display_name
                        }))}
                        value={selectedRole}
                        onValueChange={(value) => setSelectedRole(value as UserRole)}
                        placeholder="Select Role"
                      />*/}
                    </div>
                    <div>
                      <Label>Hierarchy Level</Label>
                      <Input
                        type="number"
                        value={newRoleLevel}
                        onChange={(e) => setNewRoleLevel(parseInt(e.target.value))}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label>Parent Role (Optional)</Label>
                      <SearchableSelect
                        options={[
                          { value: '', label: 'No Parent' },
                          ...getRoleOptions().filter(r => r.value !== selectedRole)
                        ]}
                        value={newRoleParent}
                        onValueChange={setNewRoleParent}
                        placeholder="Select Parent Role"
                      />
                    </div>
                    <Button onClick={addRoleToHierarchy} className="w-full" disabled={saving}>
                      {saving ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Adding Role...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Role
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roleHierarchy.map((role) => (
                  <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="min-w-8 justify-center">
                        {role.level}
                      </Badge>
                      <div>
                        <h4 className="font-medium">
                          {getRoleDisplayName(role.role)}
                        </h4>
                        {role.parent_role && (
                          <p className="text-sm text-gray-600">
                            Reports to: {getRoleDisplayName(role.parent_role)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {editingRole === role.role ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editLevel}
                            onChange={(e) => setEditLevel(parseInt(e.target.value))}
                            className="w-20"
                            min="1"
                          />
                          <SearchableSelect
                            options={[
                              { value: '', label: 'No Parent' },
                              ...getRoleOptions().filter(r => r.value !== role.role)
                            ]}
                            value={editParent}
                            onValueChange={setEditParent}
                            placeholder="Parent Role"
                          />
                          <Button
                            size="sm"
                            onClick={() => updateRoleHierarchy(role.role)}
                            disabled={saving}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingRole(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingRole(role.role);
                            setEditLevel(role.level);
                            setEditParent(role.parent_role || '');
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage-roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available System Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableRoles.map((role) => (
                  <div key={role.role_name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{role.display_name}</h4>
                      <p className="text-sm text-gray-600">
                        {role.role_name} {role.is_system_role && '(System Role)'}
                      </p>
                    </div>
                    <Badge variant={role.is_system_role ? "secondary" : "default"}>
                      {role.is_system_role ? 'System' : 'Custom'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          {/* Permission Form */}
          <Card>
            <CardHeader>
              <CardTitle>Configure Hierarchy Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Higher Role (Can Perform Actions)</Label>
                  <SearchableSelect
                    options={getRoleOptions()}
                    value={selectedHigherRole}
                    onValueChange={(value) => setSelectedHigherRole(value as UserRole)}
                    placeholder="Select Higher Role"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lower Role (Target of Actions)</Label>
                  <SearchableSelect
                    options={getRoleOptions()}
                    value={selectedLowerRole}
                    onValueChange={(value) => setSelectedLowerRole(value as UserRole)}
                    placeholder="Select Lower Role"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {permissionTypes.map((permission) => (
                    <div key={permission.key} className="flex items-center space-x-2">
                      <Switch
                        checked={permissionSet[permission.key as keyof typeof permissionSet]}
                        onCheckedChange={(checked) => 
                          setPermissionSet({ 
                            ...permissionSet, 
                            [permission.key]: checked 
                          })
                        }
                      />
                      <Label className="text-sm">{permission.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={saveHierarchyPermission} className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Hierarchy Permission
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Permissions List */}
          <Card>
            <CardHeader>
              <CardTitle>Current Hierarchy Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              {hierarchyPermissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hierarchy permissions configured</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {hierarchyPermissions.map((permission) => (
                    <div key={permission.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">
                            {getRoleDisplayName(permission.higher_role)} → {getRoleDisplayName(permission.lower_role)}
                          </h4>
                          <p className="text-sm text-gray-600">
                            What {getRoleDisplayName(permission.higher_role)} can do with {getRoleDisplayName(permission.lower_role)} data
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteHierarchyPermission(permission.id)}
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
      </Tabs>
    </div>
  );
};
