
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/SearchableSelect';
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
  PieChart,
  Filter,
  FileDown
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    mandirs: [],
    kshetras: [],
    villages: [],
    mandals: [],
    professions: [],
    sevaTypes: []
  });

  // Filter states
  const [filters, setFilters] = useState({
    role: '',
    mandir: '',
    kshetra: '',
    village: '',
    mandal: '',
    profession: '',
    sevaType: '',
    dateFrom: '',
    dateTo: '',
    ageFrom: '',
    ageTo: ''
  });

  useEffect(() => {
    fetchProfiles();
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [profiles, filters]);

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

  const fetchFilterOptions = async () => {
    try {
      const [mandirs, kshetras, villages, mandals, professions, sevaTypes] = await Promise.all([
        supabase.from('mandirs').select('id, name').eq('is_active', true),
        supabase.from('kshetras').select('id, name').eq('is_active', true),
        supabase.from('villages').select('id, name').eq('is_active', true),
        supabase.from('mandals').select('id, name').eq('is_active', true),
        supabase.from('professions').select('id, name').eq('is_active', true),
        supabase.from('seva_types').select('id, name').eq('is_active', true)
      ]);

      setFilterOptions({
        mandirs: mandirs.data || [],
        kshetras: kshetras.data || [],
        villages: villages.data || [],
        mandals: mandals.data || [],
        professions: professions.data || [],
        sevaTypes: sevaTypes.data || []
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...profiles];

    if (filters.role) {
      filtered = filtered.filter(p => p.role === filters.role);
    }
    if (filters.mandir) {
      filtered = filtered.filter(p => p.mandir_id === filters.mandir);
    }
    if (filters.kshetra) {
      filtered = filtered.filter(p => p.kshetra_id === filters.kshetra);
    }
    if (filters.village) {
      filtered = filtered.filter(p => p.village_id === filters.village);
    }
    if (filters.mandal) {
      filtered = filtered.filter(p => p.mandal_id === filters.mandal);
    }
    if (filters.profession) {
      filtered = filtered.filter(p => p.profession_id === filters.profession);
    }
    if (filters.sevaType) {
      filtered = filtered.filter(p => p.seva_type_id === filters.sevaType);
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(p => new Date(p.created_at) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(p => new Date(p.created_at) <= new Date(filters.dateTo));
    }
    if (filters.ageFrom) {
      filtered = filtered.filter(p => p.age && p.age >= parseInt(filters.ageFrom));
    }
    if (filters.ageTo) {
      filtered = filtered.filter(p => p.age && p.age <= parseInt(filters.ageTo));
    }

    setFilteredProfiles(filtered);
  };

  const generateCSVReport = () => {
    const csv = [
      ['Name', 'Mobile', 'Email', 'Role', 'Age', 'Profession', 'Seva Type', 'Mandir', 'Kshetra', 'Village', 'Mandal', 'Created Date'].join(','),
      ...filteredProfiles.map(profile => [
        profile.full_name,
        profile.mobile_number,
        profile.email || '',
        profile.role,
        profile.age || '',
        profile.professions?.name || '',
        profile.seva_types?.name || '',
        profile.mandirs?.name || '',
        profile.kshetras?.name || '',
        profile.villages?.name || '',
        profile.mandals?.name || '',
        new Date(profile.created_at).toLocaleDateString()
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

  const generatePDFReport = () => {
    // For now, we'll create a basic HTML that can be printed as PDF
    const htmlContent = `
      <html>
        <head>
          <title>Karyakar Report</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Karyakar Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Total Records: ${filteredProfiles.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Role</th>
                <th>Age</th>
                <th>Profession</th>
                <th>Seva Type</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              ${filteredProfiles.map(profile => `
                <tr>
                  <td>${profile.full_name}</td>
                  <td>${profile.mobile_number}</td>
                  <td>${profile.role}</td>
                  <td>${profile.age || ''}</td>
                  <td>${profile.professions?.name || ''}</td>
                  <td>${profile.seva_types?.name || ''}</td>
                  <td>${[profile.mandirs?.name, profile.kshetras?.name, profile.villages?.name, profile.mandals?.name].filter(Boolean).join(', ')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const clearFilters = () => {
    setFilters({
      role: '',
      mandir: '',
      kshetra: '',
      village: '',
      mandal: '',
      profession: '',
      sevaType: '',
      dateFrom: '',
      dateTo: '',
      ageFrom: '',
      ageTo: ''
    });
  };

  const getStats = () => {
    const stats = {
      totalKaryakars: filteredProfiles.length,
      byRole: {} as Record<string, number>,
      byMandir: {} as Record<string, number>,
      averageAge: 0,
      newThisMonth: 0
    };

    filteredProfiles.forEach(profile => {
      // Count by role
      stats.byRole[profile.role] = (stats.byRole[profile.role] || 0) + 1;
      
      // Count by mandir
      if (profile.mandirs?.name) {
        stats.byMandir[profile.mandirs.name] = (stats.byMandir[profile.mandirs.name] || 0) + 1;
      }
      
      // Check if new this month
      const profileDate = new Date(profile.created_at);
      const thisMonth = new Date();
      thisMonth.setMonth(thisMonth.getMonth() - 1);
      if (profileDate >= thisMonth) {
        stats.newThisMonth++;
      }
    });

    // Calculate average age
    const agesSum = filteredProfiles.reduce((sum, profile) => sum + (profile.age || 0), 0);
    stats.averageAge = Math.round(agesSum / filteredProfiles.filter(p => p.age).length) || 0;

    return stats;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading reports...</div>;
  }

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Reports</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={generateCSVReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={generatePDFReport}>
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="filters" className="space-y-6">
        <TabsList>
          <TabsTrigger value="filters">Filters & Data</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="filters" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Report Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Role</Label>
                  <SearchableSelect
                    options={[
                      { value: 'super_admin', label: 'Super Admin' },
                      { value: 'sant_nirdeshak', label: 'Sant Nirdeshak' },
                      { value: 'sah_nirdeshak', label: 'Sah Nirdeshak' },
                      { value: 'mandal_sanchalak', label: 'Mandal Sanchalak' },
                      { value: 'karyakar', label: 'Karyakar' },
                      { value: 'sevak', label: 'Sevak' }
                    ]}
                    value={filters.role}
                    onValueChange={(value) => setFilters({...filters, role: value})}
                    placeholder="Select Role"
                  />
                </div>

                <div>
                  <Label>Mandir</Label>
                  <SearchableSelect
                    options={filterOptions.mandirs.map(m => ({ value: m.id, label: m.name }))}
                    value={filters.mandir}
                    onValueChange={(value) => setFilters({...filters, mandir: value})}
                    placeholder="Select Mandir"
                  />
                </div>

                <div>
                  <Label>Kshetra</Label>
                  <SearchableSelect
                    options={filterOptions.kshetras.map(k => ({ value: k.id, label: k.name }))}
                    value={filters.kshetra}
                    onValueChange={(value) => setFilters({...filters, kshetra: value})}
                    placeholder="Select Kshetra"
                  />
                </div>

                <div>
                  <Label>Village</Label>
                  <SearchableSelect
                    options={filterOptions.villages.map(v => ({ value: v.id, label: v.name }))}
                    value={filters.village}
                    onValueChange={(value) => setFilters({...filters, village: value})}
                    placeholder="Select Village"
                  />
                </div>

                <div>
                  <Label>Mandal</Label>
                  <SearchableSelect
                    options={filterOptions.mandals.map(m => ({ value: m.id, label: m.name }))}
                    value={filters.mandal}
                    onValueChange={(value) => setFilters({...filters, mandal: value})}
                    placeholder="Select Mandal"
                  />
                </div>

                <div>
                  <Label>Profession</Label>
                  <SearchableSelect
                    options={filterOptions.professions.map(p => ({ value: p.id, label: p.name }))}
                    value={filters.profession}
                    onValueChange={(value) => setFilters({...filters, profession: value})}
                    placeholder="Select Profession"
                  />
                </div>

                <div>
                  <Label>From Date</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  />
                </div>

                <div>
                  <Label>To Date</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Age Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="From"
                      value={filters.ageFrom}
                      onChange={(e) => setFilters({...filters, ageFrom: e.target.value})}
                    />
                    <Input
                      type="number"
                      placeholder="To"
                      value={filters.ageTo}
                      onChange={(e) => setFilters({...filters, ageTo: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Karyakars</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalKaryakars}</div>
                <p className="text-xs text-muted-foreground">Filtered results</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New This Month</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.newThisMonth}</div>
                <p className="text-xs text-muted-foreground">Recent additions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Age</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageAge}</div>
                <p className="text-xs text-muted-foreground">Years</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Object.keys(stats.byRole).length}</div>
                <p className="text-xs text-muted-foreground">Different roles</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Karyakar Roles Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.byRole).map(([role, count]) => (
                    <div key={role} className="flex justify-between items-center">
                      <span className="capitalize">{role.replace('_', ' ')}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(count / stats.totalKaryakars) * 100}%` }}
                          />
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Karyakar Distribution by Mandir
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.byMandir).slice(0, 5).map(([mandir, count]) => (
                    <div key={mandir} className="flex justify-between items-center">
                      <span className="truncate">{mandir}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(count / stats.totalKaryakars) * 100}%` }}
                          />
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
