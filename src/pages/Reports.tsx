import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Download, 
  Filter, 
  Calendar, 
  Users, 
  CheckSquare, 
  TrendingUp, 
  Building,
  MapPin,
  Activity,
  LayoutGrid,
  List
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  professions?: { name: string } | null;
  seva_types?: { name: string } | null;
  mandirs?: { name: string } | null;
  kshetras?: { name: string } | null;
  villages?: { name: string } | null;
  mandals?: { name: string } | null;
};

type CustomRole = Database['public']['Tables']['custom_roles']['Row'];

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [karyakars, setKaryakars] = useState<Profile[]>([]);
  const [filteredKaryakars, setFilteredKaryakars] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [mandirFilter, setMandirFilter] = useState<string>('all');
  const [mandirs, setMandirs] = useState<any[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);

  useEffect(() => {
    if (user) {
      fetchKaryakars();
      fetchMandirs();
      fetchCustomRoles();
    }
  }, [user]);

  useEffect(() => {
    filterKaryakars();
  }, [karyakars, searchTerm, roleFilter, mandirFilter]);

  const fetchKaryakars = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          professions(name),
          seva_types(name),
          mandirs(name),
          kshetras(name),
          villages(name),
          mandals(name)
        `)
        .eq('is_active', true);

      if (error) throw error;
      setKaryakars(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch karyakars',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMandirs = async () => {
    try {
      const { data, error } = await supabase
        .from('mandirs')
        .select('id, name')
        .eq('is_active', true);

      if (error) throw error;
      setMandirs(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch mandirs',
        variant: 'destructive',
      });
    }
  };

  const fetchCustomRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      setCustomRoles(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch custom roles',
        variant: 'destructive',
      });
    }
  };

  const filterKaryakars = () => {
    let filtered = karyakars;

    if (searchTerm) {
      filtered = filtered.filter(k => 
        k.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.mobile_number.includes(searchTerm)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(k => k.role === roleFilter);
    }

    if (mandirFilter !== 'all') {
      filtered = filtered.filter(k => k.mandir_id === mandirFilter);
    }

    setFilteredKaryakars(filtered);
  };

  const exportData = () => {
    const csvContent = [
      'Name,Email,Mobile,Role,Profession,Mandir,Kshetra,Village,Mandal',
      ...filteredKaryakars.map(k => 
        `${k.full_name},${k.email || ''},${k.mobile_number},${k.role},${k.professions?.name || ''},${k.mandirs?.name || ''},${k.kshetras?.name || ''},${k.villages?.name || ''},${k.mandals?.name || ''}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `karyakars-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'sant_nirdeshak': return 'bg-purple-100 text-purple-800';
      case 'sah_nirdeshak': return 'bg-blue-100 text-blue-800';
      case 'mandal_sanchalak': return 'bg-green-100 text-green-800';
      case 'karyakar': return 'bg-yellow-100 text-yellow-800';
      case 'sevak': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (roleName: string) => {
    const role = customRoles.find(r => r.role_name === roleName);
    return role?.display_name || roleName;
  };

  const KaryakarCard = ({ karyakar }: { karyakar: Profile }) => (
    <Card className="p-4">
      <div className="flex items-center space-x-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={karyakar.profile_photo_url || ''} alt={karyakar.full_name} />
          <AvatarFallback>
            {karyakar.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-medium">{karyakar.full_name}</h3>
          <p className="text-sm text-gray-600">{karyakar.mobile_number}</p>
          <p className="text-sm text-gray-600">{karyakar.email}</p>
          <div className="flex items-center space-x-2 mt-2">
            <Badge className={getRoleColor(karyakar.role)}>
              {getRoleDisplayName(karyakar.role)}
            </Badge>
            <span className="text-xs text-gray-500">{karyakar.mandirs?.name}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-1 text-sm text-gray-600">
        <p><strong>Profession:</strong> {karyakar.professions?.name || 'N/A'}</p>
        <p><strong>Kshetra:</strong> {karyakar.kshetras?.name || 'N/A'}</p>
        <p><strong>Village:</strong> {karyakar.villages?.name || 'N/A'}</p>
        <p><strong>Mandal:</strong> {karyakar.mandals?.name || 'N/A'}</p>
        <p><strong>Seva Type:</strong> {karyakar.seva_types?.name || 'N/A'}</p>
      </div>
    </Card>
  );

  const KaryakarTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Photo</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Mobile</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Profession</TableHead>
          <TableHead>Mandir</TableHead>
          <TableHead>Kshetra</TableHead>
          <TableHead>Mandal</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredKaryakars.map((karyakar) => (
          <TableRow key={karyakar.id}>
            <TableCell>
              <Avatar className="h-8 w-8">
                <AvatarImage src={karyakar.profile_photo_url || ''} alt={karyakar.full_name} />
                <AvatarFallback className="text-xs">
                  {karyakar.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </TableCell>
            <TableCell className="font-medium">{karyakar.full_name}</TableCell>
            <TableCell>{karyakar.email || 'N/A'}</TableCell>
            <TableCell>{karyakar.mobile_number}</TableCell>
            <TableCell>
              <Badge className={getRoleColor(karyakar.role)}>
                {getRoleDisplayName(karyakar.role)}
              </Badge>
            </TableCell>
            <TableCell>{karyakar.professions?.name || 'N/A'}</TableCell>
            <TableCell>{karyakar.mandirs?.name || 'N/A'}</TableCell>
            <TableCell>{karyakar.kshetras?.name || 'N/A'}</TableCell>
            <TableCell>{karyakar.mandals?.name || 'N/A'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Karyakar Reports</h1>
          <p className="text-gray-600">View and analyze karyakar data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {customRoles.map((role) => (
                    <SelectItem key={role.id} value={role.role_name}>
                      {role.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mandir">Mandir</Label>
              <Select value={mandirFilter} onValueChange={setMandirFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Mandir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Mandirs</SelectItem>
                  {mandirs.map((mandir) => (
                    <SelectItem key={mandir.id} value={mandir.id}>
                      {mandir.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="view">View Mode</Label>
              <div className="flex space-x-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'card' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Karyakars</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredKaryakars.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Mandirs</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredKaryakars.map(k => k.mandir_id)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Villages</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredKaryakars.map(k => k.village_id)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredKaryakars.filter(k => k.role === 'super_admin').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Display */}
      <Tabs defaultValue="karyakars" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="karyakars">Karyakars</TabsTrigger>
          <TabsTrigger value="roles">Role Distribution</TabsTrigger>
          <TabsTrigger value="locations">Location Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="karyakars">
          <Card>
            <CardHeader>
              <CardTitle>Karyakar Directory</CardTitle>
              <CardDescription>Complete list of registered karyakars</CardDescription>
            </CardHeader>
            <CardContent>
              {viewMode === 'list' ? (
                <KaryakarTable />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredKaryakars.map((karyakar) => (
                    <KaryakarCard key={karyakar.id} karyakar={karyakar} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Role Distribution</CardTitle>
              <CardDescription>Breakdown of karyakars by their roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customRoles.map(role => {
                  const count = filteredKaryakars.filter(k => k.role === role.role_name).length;
                  const percentage = filteredKaryakars.length > 0 ? (count / filteredKaryakars.length) * 100 : 0;
                  return (
                    <div key={role.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <Badge className={getRoleColor(role.role_name)}>
                          {role.display_name}
                        </Badge>
                        <span className="font-medium">{count} karyakars</span>
                      </div>
                      <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle>Location Analysis</CardTitle>
              <CardDescription>Distribution across mandirs and regions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3">By Mandir</h3>
                  <div className="space-y-2">
                    {mandirs.map(mandir => {
                      const count = filteredKaryakars.filter(k => k.mandir_id === mandir.id).length;
                      return (
                        <div key={mandir.id} className="flex items-center justify-between p-2 border rounded">
                          <span>{mandir.name}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      );
                    })}
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

export default Reports;
