import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
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
import { Download, FileText, Users, TrendingUp } from 'lucide-react';

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
  date_of_birth?: string;
  is_whatsapp_same_as_mobile?: boolean;
  profile_photo_url?: string;
  updated_at: string;
  whatsapp_number?: string;
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

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'role' | 'profession' | 'location' | 'age'>('role');

  useEffect(() => {
    fetchProfiles();
  }, []);

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
        .eq('is_active', true);

      if (error) throw error;

      // Transform the data to handle potential query errors
      const transformedProfiles: Profile[] = (data || []).map(profile => ({
        ...profile,
        professions: profile.professions && typeof profile.professions === 'object' && !('error' in profile.professions)
          ? profile.professions 
          : null,
        seva_types: profile.seva_types && typeof profile.seva_types === 'object' && !('error' in profile.seva_types)
          ? profile.seva_types 
          : null,
        mandirs: profile.mandirs && typeof profile.mandirs === 'object' && !('error' in profile.mandirs)
          ? profile.mandirs 
          : null,
        kshetras: profile.kshetras && typeof profile.kshetras === 'object' && !('error' in profile.kshetras)
          ? profile.kshetras 
          : null,
        villages: profile.villages && typeof profile.villages === 'object' && !('error' in profile.villages)
          ? profile.villages 
          : null,
        mandals: profile.mandals && typeof profile.mandals === 'object' && !('error' in profile.mandals)
          ? profile.mandals 
          : null
      }));

      setProfiles(transformedProfiles);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch profiles for reports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRoleReport = () => {
    const roleCount = profiles.reduce((acc, profile) => {
      acc[profile.role] = (acc[profile.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(roleCount).map(([role, count]) => ({
      name: role,
      value: count,
    }));
  };

  const generateProfessionReport = () => {
    const professionCount = profiles.reduce((acc, profile) => {
      const profession = profile.professions?.name || 'No Profession';
      acc[profession] = (acc[profession] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(professionCount).map(([profession, count]) => ({
      name: profession,
      value: count,
    }));
  };

  const generateLocationReport = () => {
    const locationCount = profiles.reduce((acc, profile) => {
      const location = profile.villages?.name || 'No Village';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(locationCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([location, count]) => ({
        name: location,
        value: count,
      }));
  };

  const generateAgeReport = () => {
    const ageGroups = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56-65': 0,
      '65+': 0,
      'Unknown': 0,
    };

    profiles.forEach(profile => {
      const age = profile.age;
      if (!age) {
        ageGroups['Unknown']++;
      } else if (age >= 18 && age <= 25) {
        ageGroups['18-25']++;
      } else if (age >= 26 && age <= 35) {
        ageGroups['26-35']++;
      } else if (age >= 36 && age <= 45) {
        ageGroups['36-45']++;
      } else if (age >= 46 && age <= 55) {
        ageGroups['46-55']++;
      } else if (age >= 56 && age <= 65) {
        ageGroups['56-65']++;
      } else {
        ageGroups['65+']++;
      }
    });

    return Object.entries(ageGroups).map(([ageGroup, count]) => ({
      name: ageGroup,
      value: count,
    }));
  };

  const getReportData = () => {
    switch (reportType) {
      case 'role':
        return generateRoleReport();
      case 'profession':
        return generateProfessionReport();
      case 'location':
        return generateLocationReport();
      case 'age':
        return generateAgeReport();
      default:
        return [];
    }
  };

  const exportReport = () => {
    const data = getReportData();
    const csv = [
      ['Category', 'Count'].join(','),
      ...data.map(item => [item.name, item.value].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${reportType}-report.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading reports...</div>;
  }

  const reportData = getReportData();
  const totalCount = reportData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BarChart className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Reports</h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="role">Role Distribution</SelectItem>
              <SelectItem value="profession">Profession Distribution</SelectItem>
              <SelectItem value="location">Location Distribution</SelectItem>
              <SelectItem value="age">Age Distribution</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">Total karyakars</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.length}</div>
            <p className="text-xs text-muted-foreground">Different categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Largest Category</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.length > 0 ? Math.max(...reportData.map(item => item.value)) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {reportData.length > 0 ? reportData.reduce((max, item) => item.value > max.value ? item : max).name : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bar Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pie Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left">Category</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Count</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">{item.name}</td>
                    <td className="border border-gray-200 px-4 py-2">{item.value}</td>
                    <td className="border border-gray-200 px-4 py-2">
                      {((item.value / totalCount) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
