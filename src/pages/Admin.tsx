
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchableSelect } from '@/components/SearchableSelect';
import { MasterDataDialog } from '@/components/MasterDataDialog';
import { useToast } from '@/hooks/use-toast';
import { Users, Settings, Shield, Database, Plus, Edit, Trash2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  email?: string;
  mobile_number: string;
}

interface UserPermission {
  id: string;
  user_id: string;
  module: string;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  profiles?: { full_name: string };
}

interface RolePermission {
  id: string;
  role: UserRole;
  module_name: string;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
}

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('sevak');
  const [selectedModule, setSelectedModule] = useState<string>('');

  const modules = [
    'dashboard',
    'karyakars',
    'tasks',
    'communication',
    'reports',
    'admin'
  ];

  const roles: { value: UserRole; label: string }[] = [
    { value: 'sevak', label: 'Sevak' },
    { value: 'karyakar', label: 'Karyakar' },
    { value: 'mandal_sanchalak', label: 'Mandal Sanchalak' },
    { value: 'sah_nirdeshak', label: 'Sah Nirdeshak' },
    { value: 'sant_nirdeshak', label: 'Sant Nirdeshak' },
    { value: 'super_admin', label: 'Super Admin' },
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
        description: 'Failed to fetch admin data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, email, mobile_number')
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
        profiles:user_id (full_name)
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

  const saveUserPermission = async (permissionData: any) => {
    if (!selectedUser || !selectedModule) {
      toast({
        title: 'Error',
        description: 'Please select a user and module',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Saving user permission:', { ...permissionData, user_id: selectedUser, module: selectedModule });
      
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
            ...permissionData,
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
            ...permissionData
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'User permission saved successfully',
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

  const saveRolePermission = async (permissionData: any) => {
    if (!selectedRole || !selectedModule) {
      toast({
        title: 'Error',
        description: 'Please select a role and module',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Saving role permission:', { ...permissionData, role: selectedRole, module_name: selectedModule });
      
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
            ...permissionData,
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
            ...permissionData
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Role permission saved successfully',
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

  const UserPermissionForm = () => {
    const [permissions, setPermissions] = useState({
      can_view: false,
      can_add: false,
      can_edit: false,
      can_delete: false,
      can_export: false
    });

    return (
      <Card>
        <CardHeader>
          <CardTitle>User Module Permissions</CardTitle>
          <CardDescription>Assign specific permissions to individual users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Select User</Label>
              <SearchableSelect
                options={profiles.map(p => ({ value: p.id, label: p.full_name }))}
                value={selectedUser}
                onValueChange={setSelectedUser}
                placeholder="Select User"
              />
            </div>
            <div>
              <Label>Select Module</Label>
              <SearchableSelect
                options={modules.map(m => ({ value: m, label: m.charAt(0).toUpperCase() + m.slice(1) }))}
                value={selectedModule}
                onValueChange={setSelectedModule}
                placeholder="Select Module"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Permissions</Label>
            {['can_view', 'can_add', 'can_edit', 'can_delete', 'can_export'].map((permission) => (
              <div key={permission} className="flex items-center space-x-2">
                <Switch
                  checked={permissions[permission as keyof typeof permissions]}
                  onCheckedChange={(checked) => 
                    setPermissions({ ...permissions, [permission]: checked })
                  }
                />
                <Label>{permission.replace('can_', '').replace('_', ' ').toUpperCase()}</Label>
              </div>
            ))}
          </div>

          <Button onClick={() => saveUserPermission(permissions)}>
            Save User Permission
          </Button>
        </CardContent>
      </Card>
    );
  };

  const RolePermissionForm = () => {
    const [permissions, setPermissions] = useState({
      can_view: false,
      can_add: false,
      can_edit: false,
      can_delete: false,
      can_export: false
    });

    return (
      <Card>
        <CardHeader>
          <CardTitle>Role Module Permissions</CardTitle>
          <CardDescription>Set default permissions for user roles</CardDescription>
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
                options={modules.map(m => ({ value: m, label: m.charAt(0).toUpperCase() + m.slice(1) }))}
                value={selectedModule}
                onValueChange={setSelectedModule}
                placeholder="Select Module"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Permissions</Label>
            {['can_view', 'can_add', 'can_edit', 'can_delete', 'can_export'].map((permission) => (
              <div key={permission} className="flex items-center space-x-2">
                <Switch
                  checked={permissions[permission as keyof typeof permissions]}
                  onCheckedChange={(checked) => 
                    setPermissions({ ...permissions, [permission]: checked })
                  }
                />
                <Label>{permission.replace('can_', '').replace('_', ' ').toUpperCase()}</Label>
              </div>
            ))}
          </div>

          <Button onClick={() => saveRolePermission(permissions)}>
            Save Role Permission
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading admin panel...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600">Manage users, permissions, and system settings</p>
      </div>

      <Tabs defaultValue="permissions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="master-data">Master Data</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UserPermissionForm />
            <RolePermissionForm />
          </div>

          {/* User Permissions List */}
          <Card>
            <CardHeader>
              <CardTitle>Current User Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>View</TableHead>
                    <TableHead>Add</TableHead>
                    <TableHead>Edit</TableHead>
                    <TableHead>Delete</TableHead>
                    <TableHead>Export</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userPermissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>{permission.profiles?.full_name || 'Unknown'}</TableCell>
                      <TableCell className="capitalize">{permission.module}</TableCell>
                      <TableCell>{permission.can_view ? '✓' : '✗'}</TableCell>
                      <TableCell>{permission.can_add ? '✓' : '✗'}</TableCell>
                      <TableCell>{permission.can_edit ? '✓' : '✗'}</TableCell>
                      <TableCell>{permission.can_delete ? '✓' : '✗'}</TableCell>
                      <TableCell>{permission.can_export ? '✓' : '✗'}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteUserPermission(permission.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Role Permissions List */}
          <Card>
            <CardHeader>
              <CardTitle>Current Role Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>View</TableHead>
                    <TableHead>Add</TableHead>
                    <TableHead>Edit</TableHead>
                    <TableHead>Delete</TableHead>
                    <TableHead>Export</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rolePermissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell className="capitalize">{permission.role.replace('_', ' ')}</TableCell>
                      <TableCell className="capitalize">{permission.module_name}</TableCell>
                      <TableCell>{permission.can_view ? '✓' : '✗'}</TableCell>
                      <TableCell>{permission.can_add ? '✓' : '✗'}</TableCell>
                      <TableCell>{permission.can_edit ? '✓' : '✗'}</TableCell>
                      <TableCell>{permission.can_delete ? '✓' : '✗'}</TableCell>
                      <TableCell>{permission.can_export ? '✓' : '✗'}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRolePermission(permission.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>Manage user accounts and their basic information</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.full_name}</TableCell>
                      <TableCell>{profile.email || 'N/A'}</TableCell>
                      <TableCell>{profile.mobile_number}</TableCell>
                      <TableCell className="capitalize">{profile.role.replace('_', ' ')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="master-data" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MasterDataDialog
              title="Mandir"
              table="mandirs"
              fields={[
                { name: 'name', label: 'Name', type: 'text', required: true },
                { name: 'address', label: 'Address', type: 'textarea' },
                { name: 'contact_person', label: 'Contact Person', type: 'text' },
                { name: 'contact_number', label: 'Contact Number', type: 'text' },
                { name: 'email', label: 'Email', type: 'text' },
                { name: 'established_date', label: 'Established Date', type: 'date' },
                { name: 'description', label: 'Description', type: 'textarea' }
              ]}
              onSuccess={fetchData}
            />

            <MasterDataDialog
              title="Kshetra"
              table="kshetras"
              fields={[
                { name: 'name', label: 'Name', type: 'text', required: true },
                { name: 'mandir_id', label: 'Mandir', type: 'select', foreignKey: 'mandirs' },
                { name: 'contact_person', label: 'Contact Person', type: 'text' },
                { name: 'contact_number', label: 'Contact Number', type: 'text' },
                { name: 'description', label: 'Description', type: 'textarea' }
              ]}
              onSuccess={fetchData}
            />

            <MasterDataDialog
              title="Village"
              table="villages"
              fields={[
                { name: 'name', label: 'Name', type: 'text', required: true },
                { name: 'kshetra_id', label: 'Kshetra', type: 'select', foreignKey: 'kshetras' },
                { name: 'district', label: 'District', type: 'text' },
                { name: 'state', label: 'State', type: 'text' },
                { name: 'pincode', label: 'Pincode', type: 'text' },
                { name: 'population', label: 'Population', type: 'number' },
                { name: 'contact_person', label: 'Contact Person', type: 'text' },
                { name: 'contact_number', label: 'Contact Number', type: 'text' }
              ]}
              onSuccess={fetchData}
            />

            <MasterDataDialog
              title="Mandal"
              table="mandals"
              fields={[
                { name: 'name', label: 'Name', type: 'text', required: true },
                { name: 'village_id', label: 'Village', type: 'select', foreignKey: 'villages' },
                { name: 'meeting_day', label: 'Meeting Day', type: 'text' },
                { name: 'meeting_time', label: 'Meeting Time', type: 'time' },
                { name: 'contact_person', label: 'Contact Person', type: 'text' },
                { name: 'contact_number', label: 'Contact Number', type: 'text' },
                { name: 'description', label: 'Description', type: 'textarea' }
              ]}
              onSuccess={fetchData}
            />

            <MasterDataDialog
              title="Profession"
              table="professions"
              fields={[
                { name: 'name', label: 'Name', type: 'text', required: true },
                { name: 'description', label: 'Description', type: 'textarea' }
              ]}
              onSuccess={fetchData}
            />

            <MasterDataDialog
              title="Seva Type"
              table="seva_types"
              fields={[
                { name: 'name', label: 'Name', type: 'text', required: true },
                { name: 'description', label: 'Description', type: 'textarea' }
              ]}
              onSuccess={fetchData}
            />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>Configure application settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">System settings will be available in future updates.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
