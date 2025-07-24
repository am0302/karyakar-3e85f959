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
import { useDynamicRoles } from '@/hooks/useDynamicRoles';
import type { Database } from '@/integrations/supabase/types';

// Define types based on the expected database structure
type UserRole = Database['public']['Enums']['user_role'];

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
  const { roles, loading: rolesLoading, fetchRoles, getRoleOptions, getRoleDisplayName } = useDynamicRoles();
  
  const [roleHierarchy, setRoleHierarchy] = useState<RoleHierarchy[]>([]);
  const [hierarchyPermissions, setHierarchyPermissions] = useState<HierarchyPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New role form states
  const [newRoleLevel, setNewRoleLevel] = useState(1);
  const [newRoleParent, setNewRoleParent] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false);

  // Edit hierarchy states
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editLevel, setEditLevel] = useState(1);
  const [editParent, setEditParent] = useState('');

  // Permission form states
  const [selectedHigherRole, setSelectedHigherRole] = useState<string>('');
  const [selectedLowerRole, setSelectedLowerRole] = useState<string>('');
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchRoles(),
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

  const isValidUserRole = (role: string): role is UserRole => {
    // Check if the role exists in our custom roles
    return roles.some(r => r.role_name === role);
  };

  const addRoleToHierarchy = async () => {
    if (!selectedRole) {
      toast({
        title: 'Error',
        description: 'Please select a role',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidUserRole(selectedRole)) {
      toast({
        title: 'Error',
        description: 'Selected role is not valid. Please select from available roles.',
        variant: 'destructive',
      });
      return;
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

      const { error } = await supabase
        .from('role_hierarchy')
        .insert({
          role: selectedRole as UserRole,
          level: newRoleLevel,
          parent_role: newRoleParent && isValidUserRole(newRoleParent) ? newRoleParent as UserRole : null
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Role added to hierarchy successfully',
      });

      // Reset form
      setSelectedRole('');
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
    if (!isValidUserRole(roleName)) {
      toast({
        title: 'Error',
        description: 'Invalid role',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('role_hierarchy')
        .update({
          level: editLevel,
          parent_role: editParent && isValidUserRole(editParent) ? editParent as UserRole : null,
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

    if (!isValidUserRole(selectedHigherRole) || !isValidUserRole(selectedLowerRole)) {
      toast({
        title: 'Error',
        description: 'Invalid role selection',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      const { data: existing, error: checkError } = await supabase
        .from('hierarchy_permissions')
        .select('id')
        .eq('higher_role', selectedHigherRole as UserRole)
        .eq('lower_role', selectedLowerRole as UserRole)
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
            higher_role: selectedHigherRole as UserRole,
            lower_role: selectedLowerRole as UserRole,
            ...permissionSet
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Hierarchy permission saved successfully',
      });

      // Reset form
      setSelectedHigherRole('');
      setSelectedLowerRole('');
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

  const getAvailableRolesForHierarchy = () => {
    const existingRoles = roleHierarchy.map(r => r.role);
    return roles.filter(role => !existingRoles.includes(role.role_name as UserRole));
  };

  if (loading || rolesLoading) {
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Role Hierarchy Management</h2>
          <p className="text-sm sm:text-base text-gray-600">Manage role hierarchy and permissions between roles</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" className="w-full sm:w-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="hierarchy-view" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hierarchy-view" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Network className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Role Hierarchy</span>
            <span className="sm:hidden">Hierarchy</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Permissions</span>
            <span className="sm:hidden">Perms</span>
          </TabsTrigger>
          <TabsTrigger value="manage-roles" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Manage Roles</span>
            <span className="sm:hidden">Roles</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hierarchy-view" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 pb-4">
              <CardTitle className="text-lg sm:text-xl">Current Role Hierarchy</CardTitle>
              <Dialog open={showAddRoleDialog} onOpenChange={setShowAddRoleDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto text-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Role to Hierarchy
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md mx-4 sm:mx-0">
                  <DialogHeader>
                    <DialogTitle>Add Role to Hierarchy</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm">Role</Label>
                      <SearchableSelect
                        options={getAvailableRolesForHierarchy().map(role => ({
                          value: role.role_name,
                          label: role.display_name
                        }))}
                        value={selectedRole}
                        onValueChange={setSelectedRole}
                        placeholder="Select Role"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Hierarchy Level</Label>
                      <Input
                        type="number"
                        value={newRoleLevel}
                        onChange={(e) => setNewRoleLevel(parseInt(e.target.value))}
                        min="1"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Parent Role (Optional)</Label>
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
                    <Button onClick={addRoleToHierarchy} className="w-full text-sm" disabled={saving}>
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
              <div className="space-y-3 sm:space-y-4">
                {roleHierarchy.map((role) => (
                  <div key={role.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <Badge variant="outline" className="min-w-6 sm:min-w-8 justify-center text-xs">
                        {role.level}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm sm:text-base truncate">
                          {getRoleDisplayName(role.role)}
                        </h4>
                        {role.parent_role && (
                          <p className="text-xs sm:text-sm text-gray-600 truncate">
                            Reports to: {getRoleDisplayName(role.parent_role)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      {editingRole === role.role ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                          <Input
                            type="number"
                            value={editLevel}
                            onChange={(e) => setEditLevel(parseInt(e.target.value))}
                            className="w-full sm:w-20 text-sm"
                            min="1"
                          />
                          <div className="min-w-0 flex-1 sm:min-w-32">
                            <SearchableSelect
                              options={[
                                { value: '', label: 'No Parent' },
                                ...getRoleOptions().filter(r => r.value !== role.role)
                              ]}
                              value={editParent}
                              onValueChange={setEditParent}
                              placeholder="Parent Role"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateRoleHierarchy(role.role)}
                              disabled={saving}
                              className="flex-1 sm:flex-none"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingRole(null)}
                              className="flex-1 sm:flex-none"
                            >
                              Cancel
                            </Button>
                          </div>
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
                          className="w-full sm:w-auto"
                        >
                          <Edit2 className="h-4 w-4 mr-2 sm:mr-0" />
                          <span className="sm:hidden">Edit</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage-roles" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Available Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {roles.map((role) => (
                  <div key={role.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg space-y-2 sm:space-y-0">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm sm:text-base truncate">{role.display_name}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        {role.role_name} {role.is_system_role && '(System Role)'}
                      </p>
                      {role.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{role.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant={role.is_system_role ? "secondary" : "default"} className="text-xs">
                        {role.is_system_role ? 'System' : 'Custom'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {role.status || 'active'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {role.type || 'custom'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4 sm:space-y-6">
          {/* Permission Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Configure Hierarchy Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Higher Role (Can Perform Actions)</Label>
                  <SearchableSelect
                    options={getRoleOptions()}
                    value={selectedHigherRole}
                    onValueChange={setSelectedHigherRole}
                    placeholder="Select Higher Role"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Lower Role (Target of Actions)</Label>
                  <SearchableSelect
                    options={getRoleOptions()}
                    value={selectedLowerRole}
                    onValueChange={setSelectedLowerRole}
                    placeholder="Select Lower Role"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm">Permissions</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
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
                        className="scale-90 sm:scale-100"
                      />
                      <Label className="text-xs sm:text-sm">{permission.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={saveHierarchyPermission} className="w-full text-sm" disabled={saving}>
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
              <CardTitle className="text-lg sm:text-xl">Current Hierarchy Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              {hierarchyPermissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">No hierarchy permissions configured</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {hierarchyPermissions.map((permission) => (
                    <div key={permission.id} className="border rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 space-y-2 sm:space-y-0">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm sm:text-base truncate">
                            {getRoleDisplayName(permission.higher_role)} → {getRoleDisplayName(permission.lower_role)}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">
                            What {getRoleDisplayName(permission.higher_role)} can do with {getRoleDisplayName(permission.lower_role)} data
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteHierarchyPermission(permission.id)}
                          className="text-red-600 hover:text-red-800 w-full sm:w-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-2 sm:mr-0" />
                          <span className="sm:hidden">Delete</span>
                        </Button>
                      </div>
                      <div className="flex gap-1 sm:gap-2 flex-wrap">
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
