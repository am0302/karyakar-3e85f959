
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Download, FileText, TrendingUp, Users, Calendar } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  mobile_number: string;
  email?: string;
  role: string;
  age?: number;
  profession_id?: string;
  seva_type_id?: string;
  mandir_id?: string;
  kshetra_id?: string;
  village_id?: string;
  mandal_id?: string;
  is_active: boolean;
  created_at: string;
  professions?: {
    name: string;
  } | null;
  seva_types?: {
    name: string;
  } | null;
  mandirs?: {
    name: string;
  } | null;
  kshetras?: {
    name: string;
  } | null;
  villages?: {
    name: string;
  } | null;
  mandals?: {
    name: string;
  } | null;
}

interface ReportData {
  roleDistribution: Array<{ name: string; value: number; color: string }>;
  ageDistribution: Array<{ name: string; value: number }>;
  locationDistribution: Array<{ name: string; value: number }>;
  professionDistribution: Array<{ name: string; value: number }>;
  monthlyRegistrations: Array<{ month: string; count: number }>;
}

const Reports = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('overview');

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (profiles.length > 0) {
      generateReportData();
    }
  }, [profiles]);

  const fetchProfiles = async () => {
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
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to handle potential query errors
      const transformedProfiles = (data || []).map(profile => ({
        ...profile,
        professions: profile.professions && !profile.professions.error ? profile.professions : null,
        seva_types: profile.seva_types && !profile.seva_types.error ? profile.seva_types : null,
        mandirs: profile.mandirs && !profile.mandirs.error ? profile.mandirs : null,
        kshetras: profile.kshetras && !profile.kshetras.error ? profile.kshetras : null,
        villages: profile.villages && !profile.villages.error ? profile.villages : null,
        mandals: profile.mandals && !profile.mandals.error ? profile.mandals : null
      }));

      setProfiles(transformedProfiles);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch profile data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReportData = () => {
    // Role distribution
    const roleCount = profiles.reduce((acc, profile) => {
      acc[profile.role] = (acc[profile.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const roleColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];
    const roleDistribution = Object.entries(roleCount).map(([role, count], index) => ({
      name: role,
      value: count,
      color: roleColors[index % roleColors.length]
    }));

    // Age distribution
    const ageGroups = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56+': 0
    };

    profiles.forEach(profile => {
      if (profile.age) {
        if (profile.age <= 25) ageGroups['18-25']++;
        else if (profile.age <= 35) ageGroups['26-35']++;
        else if (profile.age <= 45) ageGroups['36-45']++;
        else if (profile.age <= 55) ageGroups['46-55']++;
        else ageGroups['56+']++;
      }
    });

    const ageDistribution = Object.entries(ageGroups).map(([age, count]) => ({
      name: age,
      value: count
    }));

    // Location distribution (by village)
    const locationCount = profiles.reduce((acc, profile) => {
      const location = profile.villages?.name || 'Unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const locationDistribution = Object.entries(locationCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([location, count]) => ({
        name: location,
        value: count
      }));

    // Profession distribution
    const professionCount = profiles.reduce((acc, profile) => {
      const profession = profile.professions?.name || 'Unknown';
      acc[profession] = (acc[profession] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const professionDistribution = Object.entries(professionCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([profession, count]) => ({
        name: profession,
        value: count
      }));

    // Monthly registrations
    const monthlyCount = profiles.reduce((acc, profile) => {
      const month = new Date(profile.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const monthlyRegistrations = Object.entries(monthlyCount)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([month, count]) => ({
        month,
        count
      }));

    setReportData({
      roleDistribution,
      ageDistribution,
      locationDistribution,
      professionDistribution,
      monthlyRegistrations
    });
  };

  const exportReport = () => {
    if (!reportData) return;

    const csv = [
      ['Report Type', 'Category', 'Count'],
      ...reportData.roleDistribution.map(item => ['Role Distribution', item.name, item.value]),
      ...reportData.ageDistribution.map(item => ['Age Distribution', item.name, item.value]),
      ...reportData.locationDistribution.map(item => ['Location Distribution', item.name, item.value]),
      ...reportData.professionDistribution.map(item => ['Profession Distribution', item.name, item.value]),
      ...reportData.monthlyRegistrations.map(item => ['Monthly Registrations', item.month, item.count])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'karyakar-report.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BarChart className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Reports</h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedReport} onValueChange={setSelectedReport}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="demographics">Demographics</SelectItem>
              <SelectItem value="locations">Locations</SelectItem>
              <SelectItem value="professions">Professions</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Karyakars</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData?.roleDistribution.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData?.locationDistribution.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData?.monthlyRegistrations.slice(-1)[0]?.count || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {reportData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Role Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Role Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.roleDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportData.roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Age Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Age Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.ageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Location Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Top Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.locationDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Registrations */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.monthlyRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Reports;
