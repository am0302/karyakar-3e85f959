
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
import { Trash2, Save, Shield, RefreshCw, Users, Network } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

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
  const [roleHierarchy, setRoleHierarchy] = useState<RoleHierarchy[]>([]);
  const [hierarchyPermissions, setHierarchyPermissions] = useState<HierarchyPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [selectedHigherRole, setSelectedHigherRole] = useState<UserRole>('super_admin');
  const [selectedLowerRole, setSelectedLowerRole] = useState<UserRole>('sevak');
  const [permissionSet, setPermissionSet] = useState({
    can_view: false,
    can_edit: false,
    can_delete: false,
    can_export: false,
    can_assign_locations: false
  });

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
    const { data, error } = await supabase
      .from('role_hierarchy')
      .select('*')
      .order('level');

    if (error) throw error;
    setRoleHierarchy(data || []);
  };

  const fetchHierarchyPermissions = async () => {
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

    // Check if higher role actually has higher level
    const higherRoleData = roleHierarchy.find(r => r.role === selectedHigherRole);
    const lowerRoleData = roleHierarchy.find(r => r.role === selectedLowerRole);
    
    if (!higherRoleData || !lowerRoleData) {
      toast({
        title: 'Error',
        description: 'Invalid role selection',
        variant: 'destructive',
      });
      return;
    }

    if (higherRoleData.level >= lowerRoleData.level) {
      toast({
        title: 'Error',
        description: 'Higher role must have a lower level number than lower role',
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hierarchy-view" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Role Hierarchy
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Hierarchy Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hierarchy-view" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Role Hierarchy</CardTitle>
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
                        <h4 className="font-medium capitalize">
                          {role.role.replace('_', ' ')}
                        </h4>
                        {role.parent_role && (
                          <p className="text-sm text-gray-600">
                            Reports to: {role.parent_role.replace('_', ' ')}
                          </p>
                        )}
                      </div>
                    </div>
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
                    options={roles}
                    value={selectedHigherRole}
                    onValueChange={(value) => setSelectedHigherRole(value as UserRole)}
                    placeholder="Select Higher Role"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lower Role (Target of Actions)</Label>
                  <SearchableSelect
                    options={roles}
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
                            {permission.higher_role.replace('_', ' ')} → {permission.lower_role.replace('_', ' ')}
                          </h4>
                          <p className="text-sm text-gray-600">
                            What {permission.higher_role.replace('_', ' ')} can do with {permission.lower_role.replace('_', ' ')} data
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
