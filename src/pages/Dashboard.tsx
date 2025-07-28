
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock, 
  MessageCircle, 
  TrendingUp,
  MapPin,
  UserPlus,
  FileText,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface DashboardStats {
  totalKaryakars: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalMessages: number;
  recentActivity: any[];
}

interface RecentTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string;
  assigned_to_profile?: {
    full_name: string;
  };
  assigned_by_profile?: {
    full_name: string;
  };
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalKaryakars: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalMessages: 0,
    recentActivity: []
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
      
      // Fetch total karyakars
      const { count: karyakarsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch tasks stats
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('status');

      const totalTasks = tasksData?.length || 0;
      const completedTasks = tasksData?.filter(t => t.status === 'completed').length || 0;
      const pendingTasks = tasksData?.filter(t => t.status === 'pending').length || 0;

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
        .order('created_at', { ascending: false })
        .limit(5);

      // Filter out tasks with query errors and transform the data
      const validRecentTasks = recentTasksData?.filter(task => {
        return task.assigned_to_profile && 
               typeof task.assigned_to_profile === 'object' && 
               !('error' in task.assigned_to_profile) &&
               'full_name' in task.assigned_to_profile &&
               task.assigned_by_profile && 
               typeof task.assigned_by_profile === 'object' && 
               !('error' in task.assigned_by_profile) &&
               'full_name' in task.assigned_by_profile;
      }) || [];

      const transformedRecentTasks: RecentTask[] = validRecentTasks.map(task => ({
        ...task,
        assigned_to_profile: {
          full_name: (task.assigned_to_profile as any).full_name
        },
        assigned_by_profile: {
          full_name: (task.assigned_by_profile as any).full_name
        }
      }));

      // Fetch messages count
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalKaryakars: karyakarsCount || 0,
        totalTasks,
        completedTasks,
        pendingTasks,
        totalMessages: messagesCount || 0,
        recentActivity: []
      });

      setRecentTasks(transformedRecentTasks);
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
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-red-100 text-red-800';
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

  const completionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Karyakar</span>
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Reports</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Karyakars</p>
                <p className="text-2xl font-bold">{stats.totalKaryakars}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold">{stats.totalTasks}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Tasks</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Messages</p>
                <p className="text-2xl font-bold">{stats.totalMessages}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Task Completion Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-gray-600">{Math.round(completionRate)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{stats.completedTasks}</div>
                  <div className="text-xs text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">{stats.totalTasks - stats.completedTasks - stats.pendingTasks}</div>
                  <div className="text-xs text-gray-600">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{stats.pendingTasks}</div>
                  <div className="text-xs text-gray-600">Pending</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No recent tasks</p>
              ) : (
                recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <p className="text-xs text-gray-600">
                        Assigned to: {task.assigned_to_profile?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <UserPlus className="h-6 w-6 mb-2" />
              Add New Karyakar
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Calendar className="h-6 w-6 mb-2" />
              Create Task
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <MessageCircle className="h-6 w-6 mb-2" />
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
