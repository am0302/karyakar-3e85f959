
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface RoleHierarchy {
  id: string;
  role: UserRole;
  level: number;
  parent_role: UserRole | null;
  created_at: string;
  updated_at: string;
}

interface CustomRole {
  id: string;
  role_name: string;
  display_name: string;
  description?: string;
  is_system_role: boolean;
  is_active: boolean;
  level?: number;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
}

export const RoleHierarchyManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleHierarchy[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [permissions, setPermissions] = useState<HierarchyPermission[]>([]);
  const [editingRole, setEditingRole] = useState<RoleHierarchy | null>(null);
  const [editingCustomRole, setEditingCustomRole] = useState<CustomRole | null>(null);
  const [newRole, setNewRole] = useState({ role: '', level: 0, parent_role: '' });
  const [newCustomRole, setNewCustomRole] = useState({ role_name: '', display_name: '', description: '', level: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [rolesRes, customRolesRes, permissionsRes] = await Promise.all([
        supabase.from('role_hierarchy').select('*').order('level'),
        supabase.from('custom_roles').select('*').order('level'),
        supabase.from('hierarchy_permissions').select('*')
      ]);

      if (rolesRes.error) throw rolesRes.error;
      if (customRolesRes.error) throw customRolesRes.error;
      if (permissionsRes.error) throw permissionsRes.error;

      setRoles(rolesRes.data || []);
      setCustomRoles(customRolesRes.data || []);
      setPermissions(permissionsRes.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch role hierarchy data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRole = async (roleData: RoleHierarchy) => {
    try {
      const { error } = await supabase
        .from('role_hierarchy')
        .update({
          role: roleData.role as UserRole,
          level: roleData.level,
          parent_role: roleData.parent_role as UserRole,
        })
        .eq('id', roleData.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Role hierarchy updated successfully',
      });

      setEditingRole(null);
      fetchData();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update role hierarchy',
        variant: 'destructive',
      });
    }
  };

  const handleSaveCustomRole = async (customRoleData: CustomRole) => {
    try {
      const { error } = await supabase
        .from('custom_roles')
        .update({
          role_name: customRoleData.role_name,
          display_name: customRoleData.display_name,
          description: customRoleData.description,
          level: customRoleData.level,
        })
        .eq('id', customRoleData.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Custom role updated successfully',
      });

      setEditingCustomRole(null);
      fetchData();
    } catch (error: any) {
      console.error('Error updating custom role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update custom role',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCustomRole = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom role?')) return;

    try {
      const { error } = await supabase
        .from('custom_roles')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Custom role deleted successfully',
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting custom role:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete custom role',
        variant: 'destructive',
      });
    }
  };

  const handleCreateCustomRole = async () => {
    try {
      const { error } = await supabase
        .from('custom_roles')
        .insert([{
          role_name: newCustomRole.role_name,
          display_name: newCustomRole.display_name,
          description: newCustomRole.description,
          level: newCustomRole.level,
          is_system_role: false,
          is_active: true,
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Custom role created successfully',
      });

      setNewCustomRole({ role_name: '', display_name: '', description: '', level: 0 });
      fetchData();
    } catch (error: any) {
      console.error('Error creating custom role:', error);
      toast({
        title: 'Error',
        description: 'Failed to create custom role',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Role Hierarchy */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Role Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                {editingRole?.id === role.id ? (
                  <div className="flex items-center space-x-4 flex-1">
                    <div>
                      <Label>Role</Label>
                      <Input
                        value={editingRole.role}
                        onChange={(e) => setEditingRole({
                          ...editingRole,
                          role: e.target.value as UserRole
                        })}
                      />
                    </div>
                    <div>
                      <Label>Level</Label>
                      <Input
                        type="number"
                        value={editingRole.level}
                        onChange={(e) => setEditingRole({
                          ...editingRole,
                          level: parseInt(e.target.value)
                        })}
                      />
                    </div>
                    <div>
                      <Label>Parent Role</Label>
                      <Input
                        value={editingRole.parent_role || ''}
                        onChange={(e) => setEditingRole({
                          ...editingRole,
                          parent_role: e.target.value as UserRole
                        })}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => handleSaveRole(editingRole)}>
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingRole(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-4">
                      <Badge variant="secondary">Level {role.level}</Badge>
                      <span className="font-medium">{role.role}</span>
                      {role.parent_role && (
                        <span className="text-gray-500">← {role.parent_role}</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingRole(role)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Roles */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add new custom role */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-3">Add New Custom Role</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Role Name</Label>
                  <Input
                    value={newCustomRole.role_name}
                    onChange={(e) => setNewCustomRole({
                      ...newCustomRole,
                      role_name: e.target.value
                    })}
                    placeholder="role_name"
                  />
                </div>
                <div>
                  <Label>Display Name</Label>
                  <Input
                    value={newCustomRole.display_name}
                    onChange={(e) => setNewCustomRole({
                      ...newCustomRole,
                      display_name: e.target.value
                    })}
                    placeholder="Display Name"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={newCustomRole.description}
                    onChange={(e) => setNewCustomRole({
                      ...newCustomRole,
                      description: e.target.value
                    })}
                    placeholder="Description"
                  />
                </div>
                <div>
                  <Label>Hierarchy Level</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newCustomRole.level}
                    onChange={(e) => setNewCustomRole({
                      ...newCustomRole,
                      level: parseInt(e.target.value) || 0
                    })}
                    placeholder="Level"
                  />
                </div>
              </div>
              <Button 
                className="mt-3" 
                onClick={handleCreateCustomRole}
                disabled={!newCustomRole.role_name || !newCustomRole.display_name || !newCustomRole.level}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Custom Role
              </Button>
            </div>

            {/* Existing custom roles */}
            {customRoles.map((role) => (
              <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                {editingCustomRole?.id === role.id ? (
                  <div className="flex items-center space-x-4 flex-1">
                    <div>
                      <Label>Role Name</Label>
                      <Input
                        value={editingCustomRole.role_name}
                        onChange={(e) => setEditingCustomRole({
                          ...editingCustomRole,
                          role_name: e.target.value
                        })}
                        disabled={role.is_system_role}
                      />
                    </div>
                    <div>
                      <Label>Display Name</Label>
                      <Input
                        value={editingCustomRole.display_name}
                        onChange={(e) => setEditingCustomRole({
                          ...editingCustomRole,
                          display_name: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={editingCustomRole.description || ''}
                        onChange={(e) => setEditingCustomRole({
                          ...editingCustomRole,
                          description: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label>Level</Label>
                      <Input
                        type="number"
                        min="1"
                        value={editingCustomRole.level || 0}
                        onChange={(e) => setEditingCustomRole({
                          ...editingCustomRole,
                          level: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => handleSaveCustomRole(editingCustomRole)}>
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingCustomRole(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-4">
                      <Badge variant={role.is_system_role ? "default" : "secondary"}>
                        {role.is_system_role ? 'System' : 'Custom'}
                      </Badge>
                      <Badge variant="outline">Level {role.level || 'N/A'}</Badge>
                      <div>
                        <span className="font-medium">{role.display_name}</span>
                        <span className="text-gray-500 ml-2">({role.role_name})</span>
                      </div>
                      {role.description && (
                        <span className="text-gray-500">{role.description}</span>
                      )}
                      {!role.is_active && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingCustomRole(role)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {!role.is_system_role && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteCustomRole(role.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
