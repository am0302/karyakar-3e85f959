
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, 
  Filter, 
  FileText, 
  Users, 
  TrendingUp, 
  Calendar,
  BarChart3,
  Search
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
  is_active: boolean;
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

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  assigned_to_profile?: {
    full_name: string;
  } | null;
  assigned_by_profile?: {
    full_name: string;
  } | null;
}

const Reports = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'profiles' | 'tasks'>('profiles');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const canView = hasPermission('reports', 'view');
  const canExport = hasPermission('reports', 'export');

  useEffect(() => {
    if (canView) {
      fetchData();
    }
  }, [canView, reportType, dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (reportType === 'profiles') {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            role,
            created_at,
            is_active,
            professions(name),
            seva_types(name),
            mandirs(name),
            kshetras(name),
            villages(name),
            mandals(name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Filter out records with query errors and transform the data
        const validProfiles = data?.filter(profile => {
          return (!profile.professions || (typeof profile.professions === 'object' && !('error' in profile.professions))) &&
                 (!profile.seva_types || (typeof profile.seva_types === 'object' && !('error' in profile.seva_types))) &&
                 (!profile.mandirs || (typeof profile.mandirs === 'object' && !('error' in profile.mandirs))) &&
                 (!profile.kshetras || (typeof profile.kshetras === 'object' && !('error' in profile.kshetras))) &&
                 (!profile.villages || (typeof profile.villages === 'object' && !('error' in profile.villages))) &&
                 (!profile.mandals || (typeof profile.mandals === 'object' && !('error' in profile.mandals)));
        }).map(profile => ({
          ...profile,
          professions: profile.professions && typeof profile.professions === 'object' && 'name' in profile.professions
            ? { name: (profile.professions as any).name }
            : null,
          seva_types: profile.seva_types && typeof profile.seva_types === 'object' && 'name' in profile.seva_types
            ? { name: (profile.seva_types as any).name }
            : null,
          mandirs: profile.mandirs && typeof profile.mandirs === 'object' && 'name' in profile.mandirs
            ? { name: (profile.mandirs as any).name }
            : null,
          kshetras: profile.kshetras && typeof profile.kshetras === 'object' && 'name' in profile.kshetras
            ? { name: (profile.kshetras as any).name }
            : null,
          villages: profile.villages && typeof profile.villages === 'object' && 'name' in profile.villages
            ? { name: (profile.villages as any).name }
            : null,
          mandals: profile.mandals && typeof profile.mandals === 'object' && 'name' in profile.mandals
            ? { name: (profile.mandals as any).name }
            : null
        })) || [];
        
        setProfiles(validProfiles as Profile[]);
      } else {
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            id,
            title,
            status,
            priority,
            created_at,
            assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name),
            assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Filter out tasks with query errors and transform the data
        const validTasks = data?.filter(task => {
          const hasValidAssignedTo = !task.assigned_to_profile || 
            (typeof task.assigned_to_profile === 'object' && 
             !('error' in task.assigned_to_profile) &&
             'full_name' in task.assigned_to_profile);
          
          const hasValidAssignedBy = !task.assigned_by_profile || 
            (typeof task.assigned_by_profile === 'object' && 
             !('error' in task.assigned_by_profile) &&
             'full_name' in task.assigned_by_profile);
          
          return hasValidAssignedTo && hasValidAssignedBy;
        }).map(task => ({
          ...task,
          assigned_to_profile: task.assigned_to_profile && typeof task.assigned_to_profile === 'object' && 'full_name' in task.assigned_to_profile
            ? { full_name: (task.assigned_to_profile as any).full_name || 'Unknown User' }
            : null,
          assigned_by_profile: task.assigned_by_profile && typeof task.assigned_by_profile === 'object' && 'full_name' in task.assigned_by_profile
            ? { full_name: (task.assigned_by_profile as any).full_name || 'Unknown User' }
            : null
        })) || [];
        
        setTasks(validTasks as Task[]);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch report data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!canExport) {
      toast({
        title: 'Error',
        description: 'You do not have permission to export reports',
        variant: 'destructive',
      });
      return;
    }

    // TODO: Implement export functionality
    toast({
      title: 'Info',
      description: 'Export functionality will be implemented soon',
    });
  };

  const filteredProfiles = profiles.filter(profile => 
    profile.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading reports...</div>;
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You do not have permission to view reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and view organizational reports</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {canExport && (
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={reportType} onValueChange={(value: 'profiles' | 'tasks') => setReportType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profiles">Profiles</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateRange} onValueChange={(value: '7d' | '30d' | '90d' | 'all') => setDateRange(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold">
                  {reportType === 'profiles' ? filteredProfiles.length : filteredTasks.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Records</p>
                <p className="text-2xl font-bold">
                  {reportType === 'profiles' 
                    ? filteredProfiles.filter(p => p.is_active).length
                    : filteredTasks.filter(t => t.status === 'completed').length
                  }
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold">
                  {reportType === 'profiles' 
                    ? filteredProfiles.filter(p => {
                        const created = new Date(p.created_at);
                        const now = new Date();
                        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                      }).length
                    : filteredTasks.filter(t => {
                        const created = new Date(t.created_at);
                        const now = new Date();
                        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                      }).length
                  }
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {reportType === 'profiles' ? 'Profiles Report' : 'Tasks Report'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  {reportType === 'profiles' ? (
                    <>
                      <th className="text-left p-4">Name</th>
                      <th className="text-left p-4">Role</th>
                      <th className="text-left p-4">Profession</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Created</th>
                    </>
                  ) : (
                    <>
                      <th className="text-left p-4">Title</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Priority</th>
                      <th className="text-left p-4">Assigned To</th>
                      <th className="text-left p-4">Created</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {reportType === 'profiles' ? (
                  filteredProfiles.map((profile) => (
                    <tr key={profile.id} className="border-b">
                      <td className="p-4">{profile.full_name}</td>
                      <td className="p-4">
                        <Badge variant="outline">{profile.role}</Badge>
                      </td>
                      <td className="p-4">{profile.professions?.name || 'N/A'}</td>
                      <td className="p-4">
                        <Badge variant={profile.is_active ? 'default' : 'secondary'}>
                          {profile.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-4">{new Date(profile.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task.id} className="border-b">
                      <td className="p-4">{task.title}</td>
                      <td className="p-4">
                        <Badge variant="outline">{task.status}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={
                          task.priority === 'high' ? 'destructive' :
                          task.priority === 'medium' ? 'default' : 'secondary'
                        }>
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="p-4">{task.assigned_to_profile?.full_name || 'Unassigned'}</td>
                      <td className="p-4">{new Date(task.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
