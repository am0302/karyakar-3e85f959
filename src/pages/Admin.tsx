import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MasterDataDialog } from "@/components/MasterDataDialog";
import PermissionsManager from "@/components/PermissionsManager";
import { 
  Users, 
  Building2, 
  MapPin, 
  TreePine, 
  Download,
  Database,
  Shield
} from "lucide-react";
import type { Database as DatabaseType } from "@/integrations/supabase/types";

type UserRole = DatabaseType['public']['Enums']['user_role'];

const Admin = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMandirs: 0,
    totalVillages: 0,
    totalTasks: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          profession:professions(name),
          seva_type:seva_types(name),
          mandir:mandirs(name),
          village:villages(name)
        `);

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchStats = async () => {
    try {
      const [usersCount, mandirsCount, villagesCount, tasksCount] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('mandirs').select('*', { count: 'exact', head: true }),
        supabase.from('villages').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        totalMandirs: mandirsCount.count || 0,
        totalVillages: villagesCount.count || 0,
        totalTasks: tasksCount.count || 0,
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .csv();

      if (error) throw error;

      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'karyakars-export.csv';
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Data exported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <Button onClick={exportData}>
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mandirs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMandirs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Villages</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVillages}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <TreePine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="permissions">User Permissions</TabsTrigger>
          <TabsTrigger value="master-data">Master Data</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{user.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{user.mobile_number}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{user.role}</Badge>
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                        className="px-2 py-1 border rounded"
                      >
                        <option value="sevak">Sevak</option>
                        <option value="karyakar">Karyakar</option>
                        <option value="mandal_sanchalak">Mandal Sanchalak</option>
                        <option value="sah_nirdeshak">Sah Nirdeshak</option>
                        <option value="sant_nirdeshak">Sant Nirdeshak</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <PermissionsManager />
        </TabsContent>

        <TabsContent value="master-data" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mandirs</CardTitle>
                <CardDescription>Manage temple locations</CardDescription>
              </CardHeader>
              <CardContent>
                <MasterDataDialog
                  title="Mandir"
                  table="mandirs"
                  fields={[
                    { name: 'name', label: 'Name', type: 'text', required: true },
                    { name: 'description', label: 'Description', type: 'textarea' },
                    { name: 'address', label: 'Address', type: 'textarea' },
                    { name: 'established_date', label: 'Established Date', type: 'text' },
                  ]}
                  onSuccess={fetchStats}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kshetras</CardTitle>
                <CardDescription>Manage regional areas</CardDescription>
              </CardHeader>
              <CardContent>
                <MasterDataDialog
                  title="Kshetra"
                  table="kshetras"
                  fields={[
                    { name: 'name', label: 'Name', type: 'text', required: true },
                    { name: 'description', label: 'Description', type: 'textarea' },
                    { name: 'contact_number', label: 'Contact Number', type: 'text' },
                    { name: 'mandir_id', label: 'Mandir', type: 'select', required: true, foreignKey: 'mandirs' },
                  ]}
                  onSuccess={fetchStats}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Villages</CardTitle>
                <CardDescription>Manage village locations</CardDescription>
              </CardHeader>
              <CardContent>
                <MasterDataDialog
                  title="Village"
                  table="villages"
                  fields={[
                    { name: 'name', label: 'Name', type: 'text', required: true },
                    { name: 'kshetra_id', label: 'Kshetra', type: 'select', required: true, foreignKey: 'kshetras' },
                    { name: 'population', label: 'Population', type: 'text' },
                  ]}
                  onSuccess={fetchStats}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mandals</CardTitle>
                <CardDescription>Manage community groups</CardDescription>
              </CardHeader>
              <CardContent>
                <MasterDataDialog
                  title="Mandal"
                  table="mandals"
                  fields={[
                    { name: 'name', label: 'Name', type: 'text', required: true },
                    { name: 'village_id', label: 'Village', type: 'select', required: true, foreignKey: 'villages' },
                    { name: 'description', label: 'Description', type: 'textarea' },
                    { name: 'meeting_day', label: 'Meeting Day', type: 'text' },
                  ]}
                  onSuccess={fetchStats}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Professions</CardTitle>
                <CardDescription>Manage professions</CardDescription>
              </CardHeader>
              <CardContent>
                <MasterDataDialog
                  title="Profession"
                  table="professions"
                  fields={[
                    { name: 'name', label: 'Name', type: 'text', required: true },
                    { name: 'description', label: 'Description', type: 'textarea' },
                  ]}
                  onSuccess={fetchStats}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seva Types</CardTitle>
                <CardDescription>Manage seva types</CardDescription>
              </CardHeader>
              <CardContent>
                <MasterDataDialog
                  title="Seva Type"
                  table="seva_types"
                  fields={[
                    { name: 'name', label: 'Name', type: 'text', required: true },
                    { name: 'description', label: 'Description', type: 'textarea' },
                  ]}
                  onSuccess={fetchStats}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure system-wide settings and security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Database Status</h3>
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Connected</span>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Authentication</h3>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Enabled with RLS</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
