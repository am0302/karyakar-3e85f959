
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MasterDataDialog } from '@/components/MasterDataDialog';
import { PermissionsManager } from '@/components/PermissionsManager';
import { useToast } from '@/hooks/use-toast';
import { Users, Settings, Shield, Database, RefreshCw, AlertCircle } from 'lucide-react';
import type { Database as DatabaseType } from '@/integrations/supabase/types';

type UserRole = DatabaseType['public']['Enums']['user_role'];

interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  email?: string;
  mobile_number: string;
}

interface DatabaseStatus {
  connected: boolean;
  tablesAccessible: boolean;
  error?: string;
}

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({ connected: false, tablesAccessible: false });

  useEffect(() => {
    fetchData();
    checkDatabaseConnectivity();
  }, []);

  const checkDatabaseConnectivity = async () => {
    try {
      console.log('Checking database connectivity...');
      
      // Test basic connection
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (testError) {
        console.error('Database connectivity test failed:', testError);
        setDbStatus({ 
          connected: false, 
          tablesAccessible: false, 
          error: testError.message 
        });
        return;
      }

      console.log('Database connectivity test passed');
      setDbStatus({ connected: true, tablesAccessible: true });
    } catch (error: any) {
      console.error('Database connectivity check failed:', error);
      setDbStatus({ 
        connected: false, 
        tablesAccessible: false, 
        error: error.message 
      });
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      await fetchProfiles();
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch admin data: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    console.log('Fetching profiles...');
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, email, mobile_number')
      .eq('is_active', true)
      .order('full_name');

    if (error) {
      console.error('Error fetching profiles:', error);
      throw error;
    }
    
    console.log('Profiles fetched:', data?.length || 0);
    setProfiles(data || []);
  };

  const refreshData = async () => {
    await Promise.all([fetchData(), checkDatabaseConnectivity()]);
    toast({
      title: 'Success',
      description: 'Data refreshed successfully',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading admin panel...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Manage users, permissions, and system settings</p>
        </div>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All
        </Button>
      </div>

      {/* Database Status Card */}
      <Card className={`${dbStatus.connected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Database className="h-4 w-4" />
            Database Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {dbStatus.connected ? (
              <div className="flex items-center gap-2 text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Connected and accessible</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Connection issues: {dbStatus.error}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="permissions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="master-data">Master Data</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions">
          <PermissionsManager />
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
              {profiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                </div>
              )}
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
