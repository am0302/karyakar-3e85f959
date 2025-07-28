
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, TrendingUp, TrendingDown, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
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
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
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
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('profiles');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const canView = hasPermission('reports', 'view');
  const canExport = hasPermission('reports', 'export');

  useEffect(() => {
    if (canView) {
      fetchReportsData();
    }
  }, [canView, selectedReport]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      
      if (selectedReport === 'profiles') {
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
        
        console.log('Fetched profiles:', data);
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
      } else if (selectedReport === 'tasks') {
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
        
        console.log('Fetched tasks:', data);
        // Filter out tasks with query errors and transform the data
        const validTasks = data?.filter(task => {
          const hasValidAssignedTo = task.assigned_to_profile && 
            typeof task.assigned_to_profile === 'object' && 
            !('error' in task.assigned_to_profile) &&
            'full_name' in task.assigned_to_profile;
          
          const hasValidAssignedBy = task.assigned_by_profile && 
            typeof task.assigned_by_profile === 'object' && 
            !('error' in task.assigned_by_profile) &&
            'full_name' in task.assigned_by_profile;
          
          return hasValidAssignedTo && hasValidAssignedBy;
        }).map(task => ({
          ...task,
          assigned_to_profile: {
            full_name: task.assigned_to_profile && typeof task.assigned_to_profile === 'object' && 'full_name' in task.assigned_to_profile 
              ? (task.assigned_to_profile as any).full_name || 'Unknown User'
              : 'Unknown User'
          },
          assigned_by_profile: {
            full_name: task.assigned_by_profile && typeof task.assigned_by_profile === 'object' && 'full_name' in task.assigned_by_profile 
              ? (task.assigned_by_profile as any).full_name || 'Unknown User'
              : 'Unknown User'
          }
        })) || [];
        
        setTasks(validTasks as Task[]);
      }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">View and analyze your organization's data</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedReport} onValueChange={setSelectedReport}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="profiles">Profiles Report</SelectItem>
              <SelectItem value="tasks">Tasks Report</SelectItem>
            </SelectContent>
          </Select>
          
          {canExport && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Reports Content */}
      {selectedReport === 'profiles' && (
        <div className="space-y-6">
          {/* Profile Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Profiles</p>
                    <p className="text-2xl font-bold">{profiles.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Profiles</p>
                    <p className="text-2xl font-bold text-green-600">
                      {profiles.filter(p => p.is_active).length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Inactive Profiles</p>
                    <p className="text-2xl font-bold text-red-600">
                      {profiles.filter(p => !p.is_active).length}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profiles Table */}
          <Card>
            <CardHeader>
              <CardTitle>Profiles Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Role</th>
                      <th className="text-left p-2">Profession</th>
                      <th className="text-left p-2">Seva Type</th>
                      <th className="text-left p-2">Location</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((profile) => (
                      <tr key={profile.id} className="border-b">
                        <td className="p-2">{profile.full_name}</td>
                        <td className="p-2">
                          <Badge variant="outline">{profile.role}</Badge>
                        </td>
                        <td className="p-2">{profile.professions?.name || 'N/A'}</td>
                        <td className="p-2">{profile.seva_types?.name || 'N/A'}</td>
                        <td className="p-2">{profile.villages?.name || 'N/A'}</td>
                        <td className="p-2">
                          <Badge className={profile.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {profile.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-2">{new Date(profile.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedReport === 'tasks' && (
        <div className="space-y-6">
          {/* Task Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Tasks</p>
                    <p className="text-2xl font-bold">{tasks.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {tasks.filter(t => t.status === 'completed').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {tasks.filter(t => t.status === 'in_progress').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {tasks.filter(t => t.status === 'pending').length}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tasks Table */}
          <Card>
            <CardHeader>
              <CardTitle>Tasks Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Title</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Priority</th>
                      <th className="text-left p-2">Assigned To</th>
                      <th className="text-left p-2">Assigned By</th>
                      <th className="text-left p-2">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id} className="border-b">
                        <td className="p-2">{task.title}</td>
                        <td className="p-2">
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </td>
                        <td className="p-2">{task.assigned_to_profile?.full_name || 'Unassigned'}</td>
                        <td className="p-2">{task.assigned_by_profile?.full_name || 'Unknown'}</td>
                        <td className="p-2">{new Date(task.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Reports;
