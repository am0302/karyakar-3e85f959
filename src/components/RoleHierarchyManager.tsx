
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

interface HierarchyPermission {
  id: string;
  higher_role: string;
  lower_role: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_assign_locations: boolean;
}

export const RoleHierarchyManager = () => {
  const { toast } = useToast();
  const { roles, loading: rolesLoading, fetchRoles, getRoleOptions, getRoleDisplayName } = useDynamicRoles();
  
  const [hierarchyPermissions, setHierarchyPermissions] = useState<HierarchyPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        fetchHierarchyPermissions(),
        clearOldRoleHierarchy()
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

  const clearOldRoleHierarchy = async () => {
    try {
      // Clear old role_hierarchy data as it's no longer needed
      const { error } = await supabase
        .from('role_hierarchy')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) {
        console.error('Error clearing old role hierarchy:', error);
        // Don't throw error, just log it
      }
    } catch (error) {
      console.error('Error clearing old role hierarchy:', error);
      // Don't throw error, just log it
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

  const isValidRole = (role: string): boolean => {
    return roles.some(r => r.role_name === role);
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

    if (!isValidRole(selectedHigherRole) || !isValidRole(selectedLowerRole)) {
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
        .eq('higher_role', selectedHigherRole as any)
        .eq('lower_role', selectedLowerRole as any)
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
            higher_role: selectedHigherRole as any,
            lower_role: selectedLowerRole as any,
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
          <p className="text-sm sm:text-base text-gray-600">Manage permissions between roles</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" className="w-full sm:w-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="permissions" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2">
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
