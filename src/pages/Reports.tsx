
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  TrendingUp,
  Activity,
  BarChart3,
  PieChart
} from 'lucide-react';

interface RelatedData {
  name: string;
}

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
  professions?: RelatedData | null;
  seva_types?: RelatedData | null;
  mandirs?: RelatedData | null;
  kshetras?: RelatedData | null;
  villages?: RelatedData | null;
  mandals?: RelatedData | null;
}

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

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
        professions: profile.professions && typeof profile.professions === 'object' && !Array.isArray(profile.professions) && 'name' in profile.professions
          ? profile.professions as RelatedData
          : null,
        seva_types: profile.seva_types && typeof profile.seva_types === 'object' && !Array.isArray(profile.seva_types) && 'name' in profile.seva_types
          ? profile.seva_types as RelatedData
          : null,
        mandirs: profile.mandirs && typeof profile.mandirs === 'object' && !Array.isArray(profile.mandirs) && 'name' in profile.mandirs
          ? profile.mandirs as RelatedData
          : null,
        kshetras: profile.kshetras && typeof profile.kshetras === 'object' && !Array.isArray(profile.kshetras) && 'name' in profile.kshetras
          ? profile.kshetras as RelatedData
          : null,
        villages: profile.villages && typeof profile.villages === 'object' && !Array.isArray(profile.villages) && 'name' in profile.villages
          ? profile.villages as RelatedData
          : null,
        mandals: profile.mandals && typeof profile.mandals === 'object' && !Array.isArray(profile.mandals) && 'name' in profile.mandals
          ? profile.mandals as RelatedData
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

  const generateKaryakarReport = () => {
    const csv = [
      ['Name', 'Mobile', 'Email', 'Role', 'Profession', 'Seva Type'].join(','),
      ...profiles.map(profile => [
        profile.full_name,
        profile.mobile_number,
        profile.email || '',
        profile.role,
        profile.professions?.name || '',
        profile.seva_types?.name || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'karyakars_report.csv');
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
          <FileText className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Reports</h1>
        </div>
        <Button onClick={generateKaryakarReport}>
          <Download className="h-4 w-4 mr-2" />
          Generate Karyakar Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Karyakars</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles.length}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Karyakars (Last 30 Days)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Joined recently</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.5</div>
            <p className="text-xs text-muted-foreground">Overall score</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Karyakar Roles</CardTitle>
            <CardContent className="pl-2">
              <BarChart3 className="h-4 w-4 mr-2" />
            </CardContent>
          </CardHeader>
          <CardContent>
            {/* Add bar chart here */}
            <div>Bar Chart</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Karyakar Distribution by Location</CardTitle>
            <CardContent className="pl-2">
              <PieChart className="h-4 w-4 mr-2" />
            </CardContent>
          </CardHeader>
          <CardContent>
            {/* Add pie chart here */}
            <div>Pie Chart</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
