
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { 
  FileText, 
  Download, 
  Filter, 
  Search, 
  Users, 
  CalendarDays,
  BarChart3,
  PieChart,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

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

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'karyakars' | 'tasks' | 'locations'>('karyakars');
  const [searchTerm, setSearchTerm] = useState('');

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
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to handle potential query errors
      const transformedProfiles: Profile[] = (data || []).map(profile => ({
        ...profile,
        professions: profile.professions && typeof profile.professions === 'object' && !profile.professions.error 
          ? profile.professions 
          : null,
        seva_types: profile.seva_types && typeof profile.seva_types === 'object' && !profile.seva_types.error 
          ? profile.seva_types 
          : null,
        mandirs: profile.mandirs && typeof profile.mandirs === 'object' && !profile.mandirs.error 
          ? profile.mandirs 
          : null,
        kshetras: profile.kshetras && typeof profile.kshetras === 'object' && !profile.kshetras.error 
          ? profile.kshetras 
          : null,
        villages: profile.villages && typeof profile.villages === 'object' && !profile.villages.error 
          ? profile.villages 
          : null,
        mandals: profile.mandals && typeof profile.mandals === 'object' && !profile.mandals.error 
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

  const generateReport = () => {
    toast({
      title: 'Report Generated',
      description: 'Your report is being generated and will be downloaded shortly.',
    });
  };

  const exportData = () => {
    const csv = [
      ['Name', 'Mobile', 'Email', 'Role', 'Profession', 'Seva Type', 'Mandir', 'Kshetra', 'Village', 'Mandal'].join(','),
      ...profiles.map(profile => [
        profile.full_name,
        profile.mobile_number,
        profile.email || '',
        profile.role,
        profile.professions?.name || '',
        profile.seva_types?.name || '',
        profile.mandirs?.name || '',
        profile.kshetras?.name || '',
        profile.villages?.name || '',
        profile.mandals?.name || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${reportType}_report.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getRoleStats = () => {
    const roleStats = profiles.reduce((acc, profile) => {
      acc[profile.role] = (acc[profile.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(roleStats).map(([role, count]) => ({
      role,
      count,
      percentage: ((count / profiles.length) * 100).toFixed(1)
    }));
  };

  const getLocationStats = () => {
    const mandalStats = profiles.reduce((acc, profile) => {
      const mandal = profile.mandals?.name || 'Unassigned';
      acc[mandal] = (acc[mandal] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(mandalStats).map(([mandal, count]) => ({
      mandal,
      count,
      percentage: ((count / profiles.length) * 100).toFixed(1)
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Reports</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={generateReport}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Report Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Select value={reportType} onValueChange={(value: 'karyakars' | 'tasks' | 'locations') => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="karyakars">Karyakars Report</SelectItem>
                  <SelectItem value="tasks">Tasks Report</SelectItem>
                  <SelectItem value="locations">Locations Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Input
                placeholder="Search in reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Karyakars</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles.length}</div>
            <p className="text-xs text-muted-foreground">
              Active profiles in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getRoleStats().length}</div>
            <p className="text-xs text-muted-foreground">
              Different role types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getLocationStats().length}</div>
            <p className="text-xs text-muted-foreground">
              Mandals covered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Available report types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Content */}
      {reportType === 'karyakars' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getRoleStats().map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{stat.role}</Badge>
                      <span className="text-sm text-gray-600">{stat.count} karyakars</span>
                    </div>
                    <span className="text-sm font-medium">{stat.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getLocationStats().slice(0, 10).map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{stat.mandal}</Badge>
                      <span className="text-sm text-gray-600">{stat.count} karyakars</span>
                    </div>
                    <span className="text-sm font-medium">{stat.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === 'tasks' && (
        <Card>
          <CardHeader>
            <CardTitle>Task Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Task Reports</h3>
              <p className="text-gray-600">Task reporting functionality coming soon</p>
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === 'locations' && (
        <Card>
          <CardHeader>
            <CardTitle>Location Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Location Reports</h3>
              <p className="text-gray-600">Location reporting functionality coming soon</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Reports;
