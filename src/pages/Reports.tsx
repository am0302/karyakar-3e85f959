
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Users, TrendingUp, Calendar, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useDynamicRoles } from '@/hooks/useDynamicRoles';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  professions?: { name: string } | null;
  mandirs?: { name: string } | null;
  kshetras?: { name: string } | null;
  villages?: { name: string } | null;
  mandals?: { name: string } | null;
};

interface ReportStats {
  totalKaryakars: number;
  activeKaryakars: number;
  roleDistribution: Record<string, number>;
  locationDistribution: {
    mandirs: Record<string, number>;
    kshetras: Record<string, number>;
    villages: Record<string, number>;
    mandals: Record<string, number>;
  };
}

export default function Reports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getRoleDisplayName, getRoleOptions } = useDynamicRoles();
  const [stats, setStats] = useState<ReportStats>({
    totalKaryakars: 0,
    activeKaryakars: 0,
    roleDistribution: {},
    locationDistribution: {
      mandirs: {},
      kshetras: {},
      villages: {},
      mandals: {}
    }
  });
  const [karyakars, setKaryakars] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [reportType, setReportType] = useState<'summary' | 'detailed'>('summary');

  useEffect(() => {
    fetchReportData();
  }, [selectedRole]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select(`
          *,
          professions(name),
          mandirs(name),
          kshetras(name),
          villages(name),
          mandals(name)
        `);

      if (selectedRole !== 'all') {
        // Cast selectedRole to the proper enum type
        query = query.eq('role', selectedRole as Database['public']['Enums']['user_role']);
      }

      const { data, error } = await query;

      if (error) throw error;

      const profileData = data || [];
      setKaryakars(profileData);

      // Calculate statistics
      const totalKaryakars = profileData.length;
      const activeKaryakars = profileData.filter(p => p.is_active).length;
      
      const roleDistribution: Record<string, number> = {};
      const mandirDistribution: Record<string, number> = {};
      const kshetraDistribution: Record<string, number> = {};
      const villageDistribution: Record<string, number> = {};
      const mandalDistribution: Record<string, number> = {};

      profileData.forEach(profile => {
        // Role distribution
        const roleName = profile.role;
        roleDistribution[roleName] = (roleDistribution[roleName] || 0) + 1;

        // Location distributions
        if (profile.mandirs?.name) {
          mandirDistribution[profile.mandirs.name] = (mandirDistribution[profile.mandirs.name] || 0) + 1;
        }
        if (profile.kshetras?.name) {
          kshetraDistribution[profile.kshetras.name] = (kshetraDistribution[profile.kshetras.name] || 0) + 1;
        }
        if (profile.villages?.name) {
          villageDistribution[profile.villages.name] = (villageDistribution[profile.villages.name] || 0) + 1;
        }
        if (profile.mandals?.name) {
          mandalDistribution[profile.mandals.name] = (mandalDistribution[profile.mandals.name] || 0) + 1;
        }
      });

      setStats({
        totalKaryakars,
        activeKaryakars,
        roleDistribution,
        locationDistribution: {
          mandirs: mandirDistribution,
          kshetras: kshetraDistribution,
          villages: villageDistribution,
          mandals: mandalDistribution
        }
      });

    } catch (error: any) {
      console.error('Error fetching report data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch report data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Name',
      'Role',
      'Mobile',
      'Email',
      'Profession',
      'Mandir',
      'Kshetra',
      'Village',
      'Mandal',
      'Status'
    ];

    const csvData = karyakars.map(karyakar => [
      karyakar.full_name,
      getRoleDisplayName(karyakar.role),
      karyakar.mobile_number,
      karyakar.email || '',
      karyakar.professions?.name || '',
      karyakar.mandirs?.name || '',
      karyakar.kshetras?.name || '',
      karyakar.villages?.name || '',
      karyakar.mandals?.name || '',
      karyakar.is_active ? 'Active' : 'Inactive'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `karyakars-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Success',
      description: 'Report exported successfully',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Analytics and insights for karyakars</p>
        </div>
        
        <div className="flex gap-3">
          <Select value={reportType} onValueChange={(value: 'summary' | 'detailed') => setReportType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Summary</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Filter by Role
              </label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {getRoleOptions().map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Karyakars</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalKaryakars}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Karyakars</p>
                <p className="text-3xl font-bold text-green-600">{stats.activeKaryakars}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Karyakars</p>
                <p className="text-3xl font-bold text-red-600">{stats.totalKaryakars - stats.activeKaryakars}</p>
              </div>
              <Users className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Rate</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.totalKaryakars > 0 ? Math.round((stats.activeKaryakars / stats.totalKaryakars) * 100) : 0}%
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Role Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.roleDistribution).map(([role, count]) => {
              const percentage = stats.totalKaryakars > 0 ? (count / stats.totalKaryakars) * 100 : 0;
              return (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{getRoleDisplayName(role)}</Badge>
                    <span className="text-sm text-gray-600">{count} karyakars</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Location Distribution */}
      {reportType === 'detailed' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mandir Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Mandir Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.locationDistribution.mandirs).slice(0, 10).map(([mandir, count]) => (
                  <div key={mandir} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 truncate">{mandir}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Kshetra Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Kshetra Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.locationDistribution.kshetras).slice(0, 10).map(([kshetra, count]) => (
                  <div key={kshetra} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 truncate">{kshetra}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
