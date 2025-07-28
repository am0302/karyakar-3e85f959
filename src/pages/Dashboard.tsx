
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
  Plus,
  TrendingUp,
  Calendar,
  Bell
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { TaskStatusChart } from '@/components/TaskStatusChart';
import TaskCalendar from '@/components/TaskCalendar';

interface RecentTask {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  assigned_to_profile: {
    full_name: string;
  } | null;
  assigned_by_profile: {
    full_name: string;
  } | null;
}

interface DashboardStats {
  totalKaryakars: number;
  completedTasks: number;
  pendingTasks: number;
  upcomingEvents: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalKaryakars: 0,
    completedTasks: 0,
    pendingTasks: 0,
    upcomingEvents: 0
  });
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const [profilesData, tasksData] = await Promise.all([
        supabase.from('profiles').select('id').eq('is_active', true),
        supabase.from('tasks').select('id, status')
      ]);

      if (profilesData.error) throw profilesData.error;
      if (tasksData.error) throw tasksData.error;

      const completedTasks = tasksData.data?.filter(task => task.status === 'completed').length || 0;
      const pendingTasks = tasksData.data?.filter(task => task.status === 'pending').length || 0;

      setStats({
        totalKaryakars: profilesData.data?.length || 0,
        completedTasks,
        pendingTasks,
        upcomingEvents: 0 // Placeholder
      });

      // Fetch recent tasks
      const { data: tasksWithProfiles, error: tasksError } = await supabase
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
        .order('created_at', { ascending: false })
        .limit(5);

      if (tasksError) throw tasksError;
      
      // Filter out tasks with query errors and transform data
      const validTasks = tasksWithProfiles?.filter(task => {
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
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
        assigned_to_profile: task.assigned_to_profile && typeof task.assigned_to_profile === 'object' && 'full_name' in task.assigned_to_profile 
          ? { full_name: (task.assigned_to_profile as any).full_name || 'Unknown User' }
          : null,
        assigned_by_profile: task.assigned_by_profile && typeof task.assigned_by_profile === 'object' && 'full_name' in task.assigned_by_profile 
          ? { full_name: (task.assigned_by_profile as any).full_name || 'Unknown User' }
          : null
      })) || [];

      setRecentTasks(validTasks);
      
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
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Welcome back, {user?.email || 'User'}
          </h1>
          <p className="text-gray-600">Here's what's happening with your organization today</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Quick Action
          </Button>
        </div>
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
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+2.5% from last month</span>
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
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+5.2% from last week</span>
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
            <div className="mt-4 flex items-center text-sm text-yellow-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>Needs attention</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Next 7 days</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Assigned to: {task.assigned_to_profile?.full_name || 'Unknown User'}
                    </p>
                    <p className="text-sm text-gray-600">
                      By: {task.assigned_by_profile?.full_name || 'Unknown User'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {recentTasks.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent tasks found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Add New Karyakar
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Event
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskStatusChart />
        <TaskCalendar />
      </div>
    </div>
  );
};

export default Dashboard;
