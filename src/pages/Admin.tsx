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
import { MasterDataForm } from '@/components/MasterDataForm';
import { format } from 'date-fns';

const Admin = () => {
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
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

  const handleDelete = async (table: string, id: string) => {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item deleted successfully",
      });

      // Refetch data based on table
      switch (table) {
        case 'profiles':
          fetchProfiles();
          break;
        case 'custom_roles':
          fetchCustomRoles();
          break;
        case 'mandirs':
          fetchMandirs();
          break;
        case 'kshetras':
          fetchKshetras();
          break;
        case 'villages':
          fetchVillages();
          break;
        case 'mandals':
          fetchMandals();
          break;
      }

      setDeletingItem(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const userRolesData = useMemo(() => {
    if (!customRoles || !profiles) return [];
    
    return customRoles.map(role => ({
      id: role.id,
      role_name: role.role_name,
      display_name: role.display_name,
      description: role.description || '',
      is_system_role: role.is_system_role ? 'Yes' : 'No',
      is_active: role.is_active ? 'Yes' : 'No',
      level: role.level?.toString() || '',
      user_count: profiles.filter(profile => profile.role === role.role_name).length.toString(),
      created_at: format(new Date(role.created_at), 'dd/MM/yyyy HH:mm'),
    }));
  }, [customRoles, profiles]);

  const userRolesColumns = useMemo(() => [
    { key: 'role_name', label: 'Role Name' },
    { key: 'display_name', label: 'Display Name' },
    { key: 'description', label: 'Description' },
    { key: 'is_system_role', label: 'System Role' },
    { key: 'is_active', label: 'Active' },
    { key: 'level', label: 'Level' },
    { key: 'user_count', label: 'User Count' },
    { key: 'created_at', label: 'Created At' },
  ], []);

  const usersData = useMemo(() => {
    if (!profiles) return [];
    
    return profiles.map(profile => ({
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email || '',
      mobile_number: profile.mobile_number,
      role: profile.role,
      is_active: profile.is_active ? 'Yes' : 'No',
      created_at: format(new Date(profile.created_at), 'dd/MM/yyyy HH:mm'),
    }));
  }, [profiles]);

  const usersColumns = useMemo(() => [
    { key: 'full_name', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    { key: 'mobile_number', label: 'Mobile Number' },
    { key: 'role', label: 'Role' },
    { key: 'is_active', label: 'Active' },
    { key: 'created_at', label: 'Created At' },
  ], []);

  const mandirsData = useMemo(() => {
    if (!mandirs) return [];
    
    return mandirs.map(mandir => ({
      id: mandir.id,
      name: mandir.name,
      address: mandir.address || '',
      contact_person: mandir.contact_person || '',
      contact_number: mandir.contact_number || '',
      email: mandir.email || '',
      is_active: mandir.is_active ? 'Yes' : 'No',
      created_at: format(new Date(mandir.created_at), 'dd/MM/yyyy HH:mm'),
    }));
  }, [mandirs]);

  const mandirsColumns = useMemo(() => [
    { key: 'name', label: 'Name' },
    { key: 'address', label: 'Address' },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'contact_number', label: 'Contact Number' },
    { key: 'email', label: 'Email' },
    { key: 'is_active', label: 'Active' },
    { key: 'created_at', label: 'Created At' },
  ], []);

  const kshetrasData = useMemo(() => {
    if (!kshetras) return [];
    
    return kshetras.map(kshetra => ({
      id: kshetra.id,
      name: kshetra.name,
      mandir_name: kshetra.mandirs?.name || '',
      contact_person: kshetra.contact_person || '',
      contact_number: kshetra.contact_number || '',
      description: kshetra.description || '',
      is_active: kshetra.is_active ? 'Yes' : 'No',
      created_at: format(new Date(kshetra.created_at), 'dd/MM/yyyy HH:mm'),
    }));
  }, [kshetras]);

  const kshetrasColumns = useMemo(() => [
    { key: 'name', label: 'Name' },
    { key: 'mandir_name', label: 'Mandir' },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'contact_number', label: 'Contact Number' },
    { key: 'description', label: 'Description' },
    { key: 'is_active', label: 'Active' },
    { key: 'created_at', label: 'Created At' },
  ], []);

  const villagesData = useMemo(() => {
    if (!villages) return [];
    
    return villages.map(village => ({
      id: village.id,
      name: village.name,
      kshetra_name: village.kshetras?.name || '',
      district: village.district || '',
      state: village.state || '',
      pincode: village.pincode || '',
      population: village.population?.toString() || '',
      contact_person: village.contact_person || '',
      contact_number: village.contact_number || '',
      is_active: village.is_active ? 'Yes' : 'No',
      created_at: format(new Date(village.created_at), 'dd/MM/yyyy HH:mm'),
    }));
  }, [villages]);

  const villagesColumns = useMemo(() => [
    { key: 'name', label: 'Name' },
    { key: 'kshetra_name', label: 'Kshetra' },
    { key: 'district', label: 'District' },
    { key: 'state', label: 'State' },
    { key: 'pincode', label: 'Pincode' },
    { key: 'population', label: 'Population' },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'contact_number', label: 'Contact Number' },
    { key: 'is_active', label: 'Active' },
    { key: 'created_at', label: 'Created At' },
  ], []);

  const mandalsData = useMemo(() => {
    if (!mandals) return [];
    
    return mandals.map(mandal => ({
      id: mandal.id,
      name: mandal.name,
      village_name: mandal.villages?.name || '',
      contact_person: mandal.contact_person || '',
      contact_number: mandal.contact_number || '',
      meeting_day: mandal.meeting_day || '',
      meeting_time: mandal.meeting_time || '',
      description: mandal.description || '',
      is_active: mandal.is_active ? 'Yes' : 'No',
      created_at: format(new Date(mandal.created_at), 'dd/MM/yyyy HH:mm'),
    }));
  }, [mandals]);

  const mandalsColumns = useMemo(() => [
    { key: 'name', label: 'Name' },
    { key: 'village_name', label: 'Village' },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'contact_number', label: 'Contact Number' },
    { key: 'meeting_day', label: 'Meeting Day' },
    { key: 'meeting_time', label: 'Meeting Time' },
    { key: 'description', label: 'Description' },
    { key: 'is_active', label: 'Active' },
    { key: 'created_at', label: 'Created At' },
  ], []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="user-roles">User Roles</TabsTrigger>
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
                data={usersData}
                columns={usersColumns}
                onEdit={(item) => setEditingItem(item)}
                onDelete={(item) => setDeletingItem(item)}
                enableActions={true}
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
                  <MasterDataForm 
                    type="custom_roles" 
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
                  <h3 className="text-lg font-semibold mb-4">Existing User Roles</h3>
                  <MasterDataTable 
                    data={userRolesData}
                    columns={userRolesColumns}
                    onEdit={(item) => setEditingItem(item)}
                    onDelete={(item) => setDeletingItem(item)}
                    enableActions={true}
                  />
                </div>
              </div>
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
                  <MasterDataForm 
                    type="mandirs" 
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
                  <h3 className="text-lg font-semibold mb-4">Existing Mandirs</h3>
                  <MasterDataTable 
                    data={mandirsData}
                    columns={mandirsColumns}
                    onEdit={(item) => setEditingItem(item)}
                    onDelete={(item) => setDeletingItem(item)}
                    enableActions={true}
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
                  <MasterDataForm 
                    type="kshetras" 
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
                  <h3 className="text-lg font-semibold mb-4">Existing Kshetras</h3>
                  <MasterDataTable 
                    data={kshetrasData}
                    columns={kshetrasColumns}
                    onEdit={(item) => setEditingItem(item)}
                    onDelete={(item) => setDeletingItem(item)}
                    enableActions={true}
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
                  <MasterDataForm 
                    type="villages" 
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
                  <h3 className="text-lg font-semibold mb-4">Existing Villages</h3>
                  <MasterDataTable 
                    data={villagesData}
                    columns={villagesColumns}
                    onEdit={(item) => setEditingItem(item)}
                    onDelete={(item) => setDeletingItem(item)}
                    enableActions={true}
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
                  <MasterDataForm 
                    type="mandals" 
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
                  <h3 className="text-lg font-semibold mb-4">Existing Mandals</h3>
                  <MasterDataTable 
                    data={mandalsData}
                    columns={mandalsColumns}
                    onEdit={(item) => setEditingItem(item)}
                    onDelete={(item) => setDeletingItem(item)}
                    enableActions={true}
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
              onClick={() => {
                if (deletingItem) {
                  handleDelete(deletingItem.table, deletingItem.id);
                }
              }}
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
