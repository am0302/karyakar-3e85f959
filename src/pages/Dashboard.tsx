
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  MessageCircle, 
  Calendar,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';

// Define types for the dashboard data
interface DashboardStats {
  totalKaryakars: number;
  completedTasks: number;
  pendingTasks: number;
  unreadMessages: number;
}

interface RecentTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string;
  assigned_to_profile: {
    full_name: string;
  };
  assigned_by_profile: {
    full_name: string;
  };
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalKaryakars: 0,
    completedTasks: 0,
    pendingTasks: 0,
    unreadMessages: 0
  });
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch karyakars count
      const { count: karyakarsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch tasks stats
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status')
        .or(`assigned_to.eq.${user?.id},assigned_by.eq.${user?.id}`);

      const completedTasks = tasks?.filter(task => task.status === 'completed').length || 0;
      const pendingTasks = tasks?.filter(task => task.status === 'pending').length || 0;

      // Fetch recent tasks
      const { data: recentTasksData } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          priority,
          due_date,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name),
          assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name)
        `)
        .or(`assigned_to.eq.${user?.id},assigned_by.eq.${user?.id}`)
        .order('created_at', { ascending: false })
        .limit(5);

      console.log('Recent tasks data:', recentTasksData);

      // Filter out tasks with query errors
      const validTasks = recentTasksData?.filter(task => {
        return task.assigned_to_profile && 
               typeof task.assigned_to_profile === 'object' && 
               !('error' in task.assigned_to_profile) &&
               'full_name' in task.assigned_to_profile &&
               task.assigned_by_profile && 
               typeof task.assigned_by_profile === 'object' && 
               !('error' in task.assigned_by_profile) &&
               'full_name' in task.assigned_by_profile;
      }) || [];

      const transformedTasks: RecentTask[] = validTasks.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
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

      setStats({
        totalKaryakars: karyakarsCount || 0,
        completedTasks,
        pendingTasks,
        unreadMessages: 0 // TODO: Implement unread messages count
      });

      setRecentTasks(transformedTasks);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening in your organization.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Karyakars</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalKaryakars}</p>
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
                <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedTasks}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.pendingTasks}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unreadMessages}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <MessageCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recent tasks</h3>
              <p className="text-gray-600">You don't have any recent tasks to display.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    <p className="text-sm text-gray-600">
                      Assigned to: {task.assigned_to_profile.full_name} | 
                      By: {task.assigned_by_profile.full_name}
                    </p>
                    {task.due_date && (
                      <p className="text-sm text-gray-500">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Manage Karyakars</h3>
                <p className="text-sm text-gray-600">Add, edit, or view karyakars</p>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline" onClick={() => window.location.href = '/karyakars'}>
              Go to Karyakars
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Task Management</h3>
                <p className="text-sm text-gray-600">Create and track tasks</p>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline" onClick={() => window.location.href = '/tasks'}>
              Go to Tasks
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Reports</h3>
                <p className="text-sm text-gray-600">View analytics and reports</p>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline" onClick={() => window.location.href = '/reports'}>
              Go to Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
