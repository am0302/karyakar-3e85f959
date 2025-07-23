
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface RoleHierarchy {
  id: string;
  role: string;
  level: number;
  parent_role: string | null;
  created_at: string;
  updated_at: string;
}

interface HierarchyPermission {
  id: string;
  higher_role: string;
  lower_role: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_assign_locations: boolean;
  created_at: string;
  updated_at: string;
}

interface CustomRole {
  id: string;
  role_name: string;
  display_name: string;
  description: string | null;
  is_system_role: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const RoleHierarchyManager = () => {
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [hierarchyData, setHierarchyData] = useState<RoleHierarchy[]>([]);
  const [permissionsData, setPermissionsData] = useState<HierarchyPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingHierarchy, setEditingHierarchy] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string | null>(null);
  
  // New role form state
  const [showAddRoleForm, setShowAddRoleForm] = useState(false);
  const [newRoleLevel, setNewRoleLevel] = useState<number>(1);
  const [newRoleParent, setNewRoleParent] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  
  // Permission form state
  const [showAddPermissionForm, setShowAddPermissionForm] = useState(false);
  const [selectedHigherRole, setSelectedHigherRole] = useState<string>('');
  const [selectedLowerRole, setSelectedLowerRole] = useState<string>('');
  const [permissionSet, setPermissionSet] = useState({
    can_view: false,
    can_edit: false,
    can_delete: false,
    can_export: false,
    can_assign_locations: false
  });

  const { toast } = useToast();

  const loadData = async () => {
    try {
      // Load custom roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('custom_roles')
        .select('*')
        .order('role_name');

      if (rolesError) throw rolesError;
      setCustomRoles(rolesData || []);

      // Load hierarchy data using type assertion
      const { data: hierarchyData, error: hierarchyError } = await supabase
        .from('role_hierarchy' as any)
        .select('*')
        .order('level');

      if (hierarchyError) throw hierarchyError;
      setHierarchyData(hierarchyData || []);

      // Load permissions data using type assertion
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('hierarchy_permissions' as any)
        .select('*')
        .order('higher_role');

      if (permissionsError) throw permissionsError;
      setPermissionsData(permissionsData || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load hierarchy data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddToHierarchy = async () => {
    if (!selectedRole) {
      toast({
        title: 'Error',
        description: 'Please select a role to add to hierarchy',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('role_hierarchy' as any)
        .insert({
          role: selectedRole,
          level: newRoleLevel,
          parent_role: newRoleParent || null
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Role added to hierarchy successfully',
      });

      setShowAddRoleForm(false);
      setSelectedRole('');
      setNewRoleLevel(1);
      setNewRoleParent('');
      loadData();
    } catch (error: any) {
      console.error('Error adding role to hierarchy:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHierarchy = async (id: string, updates: Partial<RoleHierarchy>) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('role_hierarchy' as any)
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Hierarchy updated successfully',
      });

      setEditingHierarchy(null);
      loadData();
    } catch (error: any) {
      console.error('Error updating hierarchy:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFromHierarchy = async (id: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('role_hierarchy' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Role removed from hierarchy successfully',
      });

      loadData();
    } catch (error: any) {
      console.error('Error deleting from hierarchy:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPermission = async () => {
    if (!selectedHigherRole || !selectedLowerRole) {
      toast({
        title: 'Error',
        description: 'Please select both higher and lower roles',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Check if permission already exists
      const { data: existingPermission, error: checkError } = await supabase
        .from('hierarchy_permissions' as any)
        .select('*')
        .eq('higher_role', selectedHigherRole)
        .eq('lower_role', selectedLowerRole)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingPermission) {
        // Update existing permission
        const { error } = await supabase
          .from('hierarchy_permissions' as any)
          .update(permissionSet)
          .eq('id', existingPermission.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hierarchy_permissions' as any)
          .insert({
            higher_role: selectedHigherRole,
            lower_role: selectedLowerRole,
            ...permissionSet
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Permission updated successfully',
      });

      setShowAddPermissionForm(false);
      setSelectedHigherRole('');
      setSelectedLowerRole('');
      setPermissionSet({
        can_view: false,
        can_edit: false,
        can_delete: false,
        can_export: false,
        can_assign_locations: false
      });
      loadData();
    } catch (error: any) {
      console.error('Error updating permission:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermission = async (id: string, updates: Partial<HierarchyPermission>) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('hierarchy_permissions' as any)
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Permission updated successfully',
      });

      setEditingPermissions(null);
      loadData();
    } catch (error: any) {
      console.error('Error updating permission:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePermission = async (id: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('hierarchy_permissions' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Permission deleted successfully',
      });

      loadData();
    } catch (error: any) {
      console.error('Error deleting permission:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (roleName: string) => {
    const role = customRoles.find(r => r.role_name === roleName);
    return role ? role.display_name : roleName;
  };

  if (loading) {
    return <div className="p-4">Loading hierarchy data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Role Hierarchy Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Role Hierarchy
            <Button 
              onClick={() => setShowAddRoleForm(true)}
              size="sm"
              className="ml-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Hierarchy
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add Role Form */}
          {showAddRoleForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold mb-4">Add Role to Hierarchy</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="role-select">Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {customRoles.map((role) => (
                        <SelectItem key={role.id} value={role.role_name}>
                          {role.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="level-input">Level</Label>
                  <Input
                    id="level-input"
                    type="number"
                    value={newRoleLevel}
                    onChange={(e) => setNewRoleLevel(parseInt(e.target.value))}
                    placeholder="Enter level"
                  />
                </div>
                <div>
                  <Label htmlFor="parent-select">Parent Role</Label>
                  <Select value={newRoleParent} onValueChange={setNewRoleParent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {customRoles.map((role) => (
                        <SelectItem key={role.id} value={role.role_name}>
                          {role.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleAddToHierarchy} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Add to Hierarchy
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddRoleForm(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Hierarchy List */}
          <div className="space-y-2">
            {hierarchyData.map((hierarchy) => (
              <div key={hierarchy.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">Level {hierarchy.level}</Badge>
                  <span className="font-medium">{getRoleDisplayName(hierarchy.role)}</span>
                  {hierarchy.parent_role && (
                    <span className="text-sm text-gray-600">
                      Parent: {getRoleDisplayName(hierarchy.parent_role)}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingHierarchy(hierarchy.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteFromHierarchy(hierarchy.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Hierarchy Permissions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Hierarchy Permissions
            <Button 
              onClick={() => setShowAddPermissionForm(true)}
              size="sm"
              className="ml-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Permission
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add Permission Form */}
          {showAddPermissionForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold mb-4">Add/Update Permission</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="higher-role-select">Higher Role</Label>
                  <Select value={selectedHigherRole} onValueChange={setSelectedHigherRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select higher role" />
                    </SelectTrigger>
                    <SelectContent>
                      {customRoles.map((role) => (
                        <SelectItem key={role.id} value={role.role_name}>
                          {role.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="lower-role-select">Lower Role</Label>
                  <Select value={selectedLowerRole} onValueChange={setSelectedLowerRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lower role" />
                    </SelectTrigger>
                    <SelectContent>
                      {customRoles.map((role) => (
                        <SelectItem key={role.id} value={role.role_name}>
                          {role.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                {Object.entries(permissionSet).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => setPermissionSet(prev => ({ ...prev, [key]: checked }))}
                    />
                    <Label className="text-sm">
                      {key.replace('can_', '').replace('_', ' ').toUpperCase()}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddPermission} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Permission
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddPermissionForm(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Permissions List */}
          <div className="space-y-2">
            {permissionsData.map((permission) => (
              <div key={permission.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{getRoleDisplayName(permission.higher_role)}</span>
                    <span className="text-gray-600">→</span>
                    <span className="font-medium">{getRoleDisplayName(permission.lower_role)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPermissions(permission.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePermission(permission.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant={permission.can_view ? "default" : "secondary"}>
                    View: {permission.can_view ? 'Yes' : 'No'}
                  </Badge>
                  <Badge variant={permission.can_edit ? "default" : "secondary"}>
                    Edit: {permission.can_edit ? 'Yes' : 'No'}
                  </Badge>
                  <Badge variant={permission.can_delete ? "default" : "secondary"}>
                    Delete: {permission.can_delete ? 'Yes' : 'No'}
                  </Badge>
                  <Badge variant={permission.can_export ? "default" : "secondary"}>
                    Export: {permission.can_export ? 'Yes' : 'No'}
                  </Badge>
                  <Badge variant={permission.can_assign_locations ? "default" : "secondary"}>
                    Assign Locations: {permission.can_assign_locations ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
