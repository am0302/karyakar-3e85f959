import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MasterDataDialog } from "@/components/MasterDataDialog";
import { 
  Users, 
  Building2, 
  MapPin, 
  TreePine, 
  Settings, 
  Download,
  Upload,
  Database,
  Cloud,
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
  const [backupSettings, setBackupSettings] = useState({
    driveApiKey: '',
    driveClientId: '',
    driveClientSecret: '',
    refreshToken: '',
    folderId: '',
    autoBackup: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchStats();
    loadBackupSettings();
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

  const loadBackupSettings = () => {
    const saved = localStorage.getItem('backupSettings');
    if (saved) {
      setBackupSettings(JSON.parse(saved));
    }
  };

  const saveBackupSettings = () => {
    localStorage.setItem('backupSettings', JSON.stringify(backupSettings));
    toast({
      title: "Settings Saved",
      description: "Backup settings have been saved successfully.",
    });
  };

  const triggerBackup = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-backup', {
        body: { settings: backupSettings }
      });

      if (error) throw error;

      toast({
        title: "Backup Successful",
        description: `Data backed up to Google Drive: ${data.fileName}`,
      });
    } catch (error: any) {
      toast({
        title: "Backup Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
          <TabsTrigger value="master-data">Master Data</TabsTrigger>
          <TabsTrigger value="backup">Google Drive Backup</TabsTrigger>
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
                    { name: 'address', label: 'Address', type: 'textarea' },
                    { name: 'contact_person', label: 'Contact Person', type: 'text' },
                    { name: 'contact_number', label: 'Contact Number', type: 'text' },
                    { name: 'email', label: 'Email', type: 'text' },
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
                    { name: 'contact_person', label: 'Contact Person', type: 'text' },
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
                    { name: 'district', label: 'District', type: 'text' },
                    { name: 'state', label: 'State', type: 'text' },
                    { name: 'pincode', label: 'Pincode', type: 'text' },
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
                    { name: 'description', label: 'Description', type: 'textarea' },
                    { name: 'meeting_day', label: 'Meeting Day', type: 'text' },
                  ]}
                  onSuccess={fetchStats}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cloud className="h-5 w-5 mr-2" />
                Google Drive Backup Settings
              </CardTitle>
              <CardDescription>
                Configure automatic backup to Google Drive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="driveApiKey">Google Drive API Key</Label>
                  <Input
                    id="driveApiKey"
                    type="password"
                    value={backupSettings.driveApiKey}
                    onChange={(e) => setBackupSettings(prev => ({ ...prev, driveApiKey: e.target.value }))}
                    placeholder="Enter your Google Drive API key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driveClientId">Client ID</Label>
                  <Input
                    id="driveClientId"
                    value={backupSettings.driveClientId}
                    onChange={(e) => setBackupSettings(prev => ({ ...prev, driveClientId: e.target.value }))}
                    placeholder="Enter client ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driveClientSecret">Client Secret</Label>
                  <Input
                    id="driveClientSecret"
                    type="password"
                    value={backupSettings.driveClientSecret}
                    onChange={(e) => setBackupSettings(prev => ({ ...prev, driveClientSecret: e.target.value }))}
                    placeholder="Enter client secret"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refreshToken">Refresh Token</Label>
                  <Input
                    id="refreshToken"
                    type="password"
                    value={backupSettings.refreshToken}
                    onChange={(e) => setBackupSettings(prev => ({ ...prev, refreshToken: e.target.value }))}
                    placeholder="Enter refresh token"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="folderId">Drive Folder ID</Label>
                  <Input
                    id="folderId"
                    value={backupSettings.folderId}
                    onChange={(e) => setBackupSettings(prev => ({ ...prev, folderId: e.target.value }))}
                    placeholder="Enter Google Drive folder ID"
                  />
                </div>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button onClick={saveBackupSettings} variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
                <Button onClick={triggerBackup} disabled={loading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {loading ? "Backing up..." : "Backup Now"}
                </Button>
              </div>
            </CardContent>
          </Card>
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
