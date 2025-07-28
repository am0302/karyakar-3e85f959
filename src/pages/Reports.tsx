
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Download,
  Filter,
  Calendar,
  BarChart3,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import type { Database } from '@/integrations/supabase/types';

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

interface TaskReport {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  due_date: string;
  assigned_to_profile: {
    full_name: string;
  };
  assigned_by_profile: {
    full_name: string;
  };
}

const Reports = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<TaskReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedRole, setSelectedRole] = useState('all');

  const canView = hasPermission('reports', 'view');
  const canExport = hasPermission('reports', 'export');

  useEffect(() => {
    if (canView) {
      fetchReportsData();
    }
  }, [canView]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles with related data
      const { data: profilesData, error: profilesError } = await supabase
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
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;
      
      // Filter out profiles with query errors
      const validProfiles = profilesData?.filter(profile => {
        return (!profile.professions || (typeof profile.professions === 'object' && !('error' in profile.professions))) &&
               (!profile.seva_types || (typeof profile.seva_types === 'object' && !('error' in profile.seva_types))) &&
               (!profile.mandirs || (typeof profile.mandirs === 'object' && !('error' in profile.mandirs))) &&
               (!profile.kshetras || (typeof profile.kshetras === 'object' && !('error' in profile.kshetras))) &&
               (!profile.villages || (typeof profile.villages === 'object' && !('error' in profile.villages))) &&
               (!profile.mandals || (typeof profile.mandals === 'object' && !('error' in profile.mandals)));
      }) || [];

      setProfiles(validProfiles as Profile[]);

      // Fetch tasks with related data
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          priority,
          created_at,
          due_date,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name),
          assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      
      // Filter out tasks with query errors
      const validTasks = tasksData?.filter(task => {
        const hasValidAssignedTo = task.assigned_to_profile && 
          typeof task.assigned_to_profile === 'object' && 
          !('error' in task.assigned_to_profile) &&
          'full_name' in task.assigned_to_profile;
        
        const hasValidAssignedBy = task.assigned_by_profile && 
          typeof task.assigned_by_profile === 'object' && 
          !('error' in task.assigned_by_profile) &&
          'full_name' in task.assigned_by_profile;
        
        return hasValidAssignedTo && hasValidAssignedBy;
      }) || [];

      const transformedTasks: TaskReport[] = validTasks.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        created_at: task.created_at,
        due_date: task.due_date,
        assigned_to_profile: {
          full_name: task.assigned_to_profile && typeof task.assigned_to_profile === 'object' && 'full_name' in task.assigned_to_profile 
            ? (task.assigned_to_profile as any).full_name 
            : 'Unknown User'
        },
        assigned_by_profile: {
          full_name: task.assigned_by_profile && typeof task.assigned_by_profile === 'object' && 'full_name' in task.assigned_by_profile 
            ? (task.assigned_by_profile as any).full_name 
            : 'Unknown User'
        }
      }));

      setTasks(transformedTasks);
    } catch (error: any) {
      console.error('Error fetching reports data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch reports data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = (type: 'profiles' | 'tasks') => {
    if (!canExport) {
      toast({
        title: 'Error',
        description: 'You do not have permission to export data',
        variant: 'destructive',
      });
      return;
    }

    // TODO: Implement actual export functionality
    toast({
      title: 'Info',
      description: 'Export functionality will be implemented soon',
    });
  };

  const getTaskStatusStats = () => {
    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
    };
    
    return stats;
  };

  const getRoleDistribution = () => {
    const distribution: Record<string, number> = {};
    profiles.forEach(profile => {
      distribution[profile.role] = (distribution[profile.role] || 0) + 1;
    });
    return distribution;
  };

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

  const taskStats = getTaskStatusStats();
  const roleDistribution = getRoleDistribution();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Analytics and insights for your organization</p>
        </div>
        
        {canExport && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportData('profiles')}>
              <Download className="h-4 w-4 mr-2" />
              Export Profiles
            </Button>
            <Button variant="outline" onClick={() => exportData('tasks')}>
              <Download className="h-4 w-4 mr-2" />
              Export Tasks
            </Button>
          </div>
        )}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Profiles</p>
                <p className="text-2xl font-bold text-gray-900">{profiles.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{taskStats.completed}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{taskStats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="profiles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profiles">Profiles Report</TabsTrigger>
          <TabsTrigger value="tasks">Tasks Report</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles">
          <Card>
            <CardHeader>
              <CardTitle>Profiles Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Role Distribution</h3>
                  <div className="space-y-2">
                    {Object.entries(roleDistribution).map(([role, count]) => (
                      <div key={role} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{role.replace('_', ' ')}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Recent Registrations</h3>
                  <div className="space-y-2">
                    {profiles.slice(0, 5).map(profile => (
                      <div key={profile.id} className="flex justify-between items-center">
                        <span className="text-sm">{profile.full_name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Tasks Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Task Status Distribution</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Completed</span>
                      <Badge className="bg-green-100 text-green-800">{taskStats.completed}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">In Progress</span>
                      <Badge className="bg-blue-100 text-blue-800">{taskStats.in_progress}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pending</span>
                      <Badge className="bg-yellow-100 text-yellow-800">{taskStats.pending}</Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Recent Tasks</h3>
                  <div className="space-y-2">
                    {tasks.slice(0, 5).map(task => (
                      <div key={task.id} className="flex justify-between items-center">
                        <span className="text-sm truncate">{task.title}</span>
                        <Badge className={
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {task.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Key Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Task Completion Rate</span>
                      <span className="text-lg font-bold text-green-600">
                        {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Profiles</span>
                      <span className="text-lg font-bold text-blue-600">{profiles.length}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Growth Trends</h3>
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Advanced analytics coming soon</p>
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
