
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { MasterDataTable } from '@/components/MasterDataTable';
import { MasterDataDialog } from '@/components/MasterDataDialog';
import { RoleHierarchyManager } from '@/components/RoleHierarchyManager';
import { format } from 'date-fns';

const Admin = () => {
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState<{id: string; table: string} | null>(null);
  const { toast } = useToast();

  // Fetch profiles
  const { data: profiles, refetch: fetchProfiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch custom roles
  const { data: customRoles, refetch: fetchCustomRoles } = useQuery({
    queryKey: ['custom_roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch mandirs
  const { data: mandirs, refetch: fetchMandirs } = useQuery({
    queryKey: ['mandirs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mandirs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch kshetras
  const { data: kshetras, refetch: fetchKshetras } = useQuery({
    queryKey: ['kshetras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kshetras')
        .select('*, mandirs(name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch villages
  const { data: villages, refetch: fetchVillages } = useQuery({
    queryKey: ['villages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('villages')
        .select('*, kshetras(name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch mandals
  const { data: mandals, refetch: fetchMandals } = useQuery({
    queryKey: ['mandals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mandals')
        .select('*, villages(name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleDeleteProfiles = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchProfiles();
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteCustomRoles = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_roles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchCustomRoles();
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteMandirs = async (id: string) => {
    try {
      const { error } = await supabase
        .from('mandirs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchMandirs();
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteKshetras = async (id: string) => {
    try {
      const { error } = await supabase
        .from('kshetras')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchKshetras();
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteVillages = async (id: string) => {
    try {
      const { error } = await supabase
        .from('villages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchVillages();
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteMandals = async (id: string) => {
    try {
      const { error } = await supabase
        .from('mandals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchMandals();
    } catch (error: any) {
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      switch (deletingItem.table) {
        case 'profiles':
          await handleDeleteProfiles(deletingItem.id);
          break;
        case 'custom_roles':
          await handleDeleteCustomRoles(deletingItem.id);
          break;
        case 'mandirs':
          await handleDeleteMandirs(deletingItem.id);
          break;
        case 'kshetras':
          await handleDeleteKshetras(deletingItem.id);
          break;
        case 'villages':
          await handleDeleteVillages(deletingItem.id);
          break;
        case 'mandals':
          await handleDeleteMandals(deletingItem.id);
          break;
      }

      toast({
        title: "Success",
        description: "Item deleted successfully",
      });

      setDeletingItem(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const usersData = useMemo(() => {
    if (!profiles) return [];
    
    return profiles.map(profile => ({
      id: profile.id,
      display_name: profile.full_name,
      description: `${profile.email || ''} | ${profile.mobile_number} | Role: ${profile.role}`,
      type: profile.is_active ? 'Active' : 'Inactive',
      is_system_role: false
    }));
  }, [profiles]);

  const userRolesData = useMemo(() => {
    if (!customRoles || !profiles) return [];
    
    return customRoles.map(role => ({
      id: role.id,
      display_name: role.display_name,
      description: role.description || '',
      type: `Level: ${role.level || 'N/A'} | Users: ${profiles.filter(profile => profile.role === role.role_name).length}`,
      is_system_role: role.is_system_role || false
    }));
  }, [customRoles, profiles]);

  const mandirsData = useMemo(() => {
    if (!mandirs) return [];
    
    return mandirs.map(mandir => ({
      id: mandir.id,
      display_name: mandir.name,
      description: `${mandir.address || ''} | Contact: ${mandir.contact_person || ''} | ${mandir.contact_number || ''}`,
      type: mandir.is_active ? 'Active' : 'Inactive',
      is_system_role: false
    }));
  }, [mandirs]);

  const kshetrasData = useMemo(() => {
    if (!kshetras) return [];
    
    return kshetras.map(kshetra => ({
      id: kshetra.id,
      display_name: kshetra.name,
      description: `Mandir: ${kshetra.mandirs?.name || ''} | Contact: ${kshetra.contact_person || ''}`,
      type: kshetra.is_active ? 'Active' : 'Inactive',
      is_system_role: false
    }));
  }, [kshetras]);

  const villagesData = useMemo(() => {
    if (!villages) return [];
    
    return villages.map(village => ({
      id: village.id,
      display_name: village.name,
      description: `Kshetra: ${village.kshetras?.name || ''} | District: ${village.district || ''} | Population: ${village.population || 'N/A'}`,
      type: village.is_active ? 'Active' : 'Inactive',
      is_system_role: false
    }));
  }, [villages]);

  const mandalsData = useMemo(() => {
    if (!mandals) return [];
    
    return mandals.map(mandal => ({
      id: mandal.id,
      display_name: mandal.name,
      description: `Village: ${mandal.villages?.name || ''} | Contact: ${mandal.contact_person || ''} | Meeting: ${mandal.meeting_day || ''} ${mandal.meeting_time || ''}`,
      type: mandal.is_active ? 'Active' : 'Inactive',
      is_system_role: false
    }));
  }, [mandals]);

  // Field configurations for each table
  const customRoleFields = [
    { name: 'role_name', label: 'Role Name', type: 'text' as const, required: true },
    { name: 'display_name', label: 'Display Name', type: 'text' as const, required: true },
    { name: 'description', label: 'Description', type: 'textarea' as const },
    { name: 'level', label: 'Hierarchy Level', type: 'number' as const },
  ];

  const mandirFields = [
    { name: 'name', label: 'Name', type: 'text' as const, required: true },
    { name: 'address', label: 'Address', type: 'textarea' as const },
    { name: 'contact_person', label: 'Contact Person', type: 'text' as const },
    { name: 'contact_number', label: 'Contact Number', type: 'text' as const },
    { name: 'email', label: 'Email', type: 'text' as const },
  ];

  const kshetraFields = [
    { name: 'name', label: 'Name', type: 'text' as const, required: true },
    { name: 'mandir_id', label: 'Mandir', type: 'select' as const, foreignKey: 'mandirs' },
    { name: 'contact_person', label: 'Contact Person', type: 'text' as const },
    { name: 'contact_number', label: 'Contact Number', type: 'text' as const },
    { name: 'description', label: 'Description', type: 'textarea' as const },
  ];

  const villageFields = [
    { name: 'name', label: 'Name', type: 'text' as const, required: true },
    { name: 'kshetra_id', label: 'Kshetra', type: 'select' as const, foreignKey: 'kshetras' },
    { name: 'district', label: 'District', type: 'text' as const },
    { name: 'state', label: 'State', type: 'text' as const },
    { name: 'pincode', label: 'Pincode', type: 'text' as const },
    { name: 'population', label: 'Population', type: 'number' as const },
    { name: 'contact_person', label: 'Contact Person', type: 'text' as const },
    { name: 'contact_number', label: 'Contact Number', type: 'text' as const },
  ];

  const mandalFields = [
    { name: 'name', label: 'Name', type: 'text' as const, required: true },
    { name: 'village_id', label: 'Village', type: 'select' as const, foreignKey: 'villages' },
    { name: 'contact_person', label: 'Contact Person', type: 'text' as const },
    { name: 'contact_number', label: 'Contact Number', type: 'text' as const },
    { name: 'meeting_day', label: 'Meeting Day', type: 'text' as const },
    { name: 'meeting_time', label: 'Meeting Time', type: 'time' as const },
    { name: 'description', label: 'Description', type: 'textarea' as const },
  ];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="user-roles">User Roles</TabsTrigger>
          <TabsTrigger value="role-hierarchy">Role Hierarchy</TabsTrigger>
          <TabsTrigger value="mandirs">Mandirs</TabsTrigger>
          <TabsTrigger value="kshetras">Kshetras</TabsTrigger>
          <TabsTrigger value="villages">Villages</TabsTrigger>
          <TabsTrigger value="mandals">Mandals</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users Management</CardTitle>
              <CardDescription>
                Manage user accounts and their information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MasterDataTable 
                title="User"
                data={usersData}
                onEdit={(item) => setEditingItem(item)}
                onDelete={(id) => setDeletingItem({id, table: 'profiles'})}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-roles">
          <Card>
            <CardHeader>
              <CardTitle>User Roles Management</CardTitle>
              <CardDescription>
                Manage custom user roles and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Create New Role</h3>
                  <MasterDataDialog
                    title="Role"
                    table="custom_roles"
                    fields={customRoleFields}
                    onSuccess={() => {
                      fetchCustomRoles();
                      toast({
                        title: "Success",
                        description: "Role created successfully",
                      });
                    }}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <MasterDataTable 
                    title="Role"
                    data={userRolesData}
                    onEdit={(item) => setEditingItem(item)}
                    onDelete={(id) => setDeletingItem({id, table: 'custom_roles'})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="role-hierarchy">
          <Card>
            <CardHeader>
              <CardTitle>Role Hierarchy Management</CardTitle>
              <CardDescription>
                Manage role hierarchy and set level ordering for custom roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RoleHierarchyManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mandirs">
          <Card>
            <CardHeader>
              <CardTitle>Mandirs Management</CardTitle>
              <CardDescription>
                Manage temple locations and their information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Create New Mandir</h3>
                  <MasterDataDialog
                    title="Mandir"
                    table="mandirs"
                    fields={mandirFields}
                    onSuccess={() => {
                      fetchMandirs();
                      toast({
                        title: "Success",
                        description: "Mandir created successfully",
                      });
                    }}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <MasterDataTable 
                    title="Mandir"
                    data={mandirsData}
                    onEdit={(item) => setEditingItem(item)}
                    onDelete={(id) => setDeletingItem({id, table: 'mandirs'})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kshetras">
          <Card>
            <CardHeader>
              <CardTitle>Kshetras Management</CardTitle>
              <CardDescription>
                Manage regional areas and their information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Create New Kshetra</h3>
                  <MasterDataDialog
                    title="Kshetra"
                    table="kshetras"
                    fields={kshetraFields}
                    onSuccess={() => {
                      fetchKshetras();
                      toast({
                        title: "Success",
                        description: "Kshetra created successfully",
                      });
                    }}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <MasterDataTable 
                    title="Kshetra"
                    data={kshetrasData}
                    onEdit={(item) => setEditingItem(item)}
                    onDelete={(id) => setDeletingItem({id, table: 'kshetras'})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="villages">
          <Card>
            <CardHeader>
              <CardTitle>Villages Management</CardTitle>
              <CardDescription>
                Manage village locations and their information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Create New Village</h3>
                  <MasterDataDialog
                    title="Village"
                    table="villages"
                    fields={villageFields}
                    onSuccess={() => {
                      fetchVillages();
                      toast({
                        title: "Success",
                        description: "Village created successfully",
                      });
                    }}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <MasterDataTable 
                    title="Village"
                    data={villagesData}
                    onEdit={(item) => setEditingItem(item)}
                    onDelete={(id) => setDeletingItem({id, table: 'villages'})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mandals">
          <Card>
            <CardHeader>
              <CardTitle>Mandals Management</CardTitle>
              <CardDescription>
                Manage local groups and their information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Create New Mandal</h3>
                  <MasterDataDialog
                    title="Mandal"
                    table="mandals"
                    fields={mandalFields}
                    onSuccess={() => {
                      fetchMandals();
                      toast({
                        title: "Success",
                        description: "Mandal created successfully",
                      });
                    }}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <MasterDataTable 
                    title="Mandal"
                    data={mandalsData}
                    onEdit={(item) => setEditingItem(item)}
                    onDelete={(id) => setDeletingItem({id, table: 'mandals'})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDeletingItem(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
