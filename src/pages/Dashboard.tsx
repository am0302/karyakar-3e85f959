
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Activity
} from 'lucide-react';
import TaskCalendar from '@/components/TaskCalendar';
import { TaskStatusChart } from '@/components/TaskStatusChart';

interface DashboardStats {
  totalKaryakars: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalChatRooms: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string;
  assigned_to: string;
  assigned_by: string;
  created_at: string;
  profiles?: {
    full_name: string;
  } | null;
  assigned_by_profile?: {
    full_name: string;
  } | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalKaryakars: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalChatRooms: 0
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const [
        { count: karyakarsCount },
        { count: tasksCount },
        { count: completedTasksCount },
        { count: pendingTasksCount },
        { count: chatRoomsCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('chat_rooms').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        totalKaryakars: karyakarsCount || 0,
        totalTasks: tasksCount || 0,
        completedTasks: completedTasksCount || 0,
        pendingTasks: pendingTasksCount || 0,
        totalChatRooms: chatRoomsCount || 0
      });

      // Fetch recent tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles!tasks_assigned_to_fkey(full_name),
          assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name)
        `)
        .or(`assigned_to.eq.${user?.id},assigned_by.eq.${user?.id}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (tasksError) throw tasksError;

      const transformedTasks: Task[] = (tasksData || []).map(task => ({
        ...task,
        profiles: task.profiles && typeof task.profiles === 'object' && !('error' in task.profiles)
          ? task.profiles
          : null,
        assigned_by_profile: task.assigned_by_profile && typeof task.assigned_by_profile === 'object' && !('error' in task.assigned_by_profile)
          ? task.assigned_by_profile
          : null
      }));

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your overview.</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Karyakars</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalKaryakars}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">All tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">Finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">Awaiting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chat Rooms</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChatRooms}</div>
            <p className="text-xs text-muted-foreground">Active chats</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Task Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskStatusChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskCalendar />
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{task.title}</h3>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>Assigned to: {task.profiles?.full_name || 'Unknown'}</span>
                    <span>Created by: {task.assigned_by_profile?.full_name || 'Unknown'}</span>
                    <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
