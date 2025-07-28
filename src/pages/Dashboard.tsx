
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import TaskCalendar from '@/components/TaskCalendar';
import { TaskStatusChart } from '@/components/TaskStatusChart';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Calendar,
  TrendingUp,
  MessageSquare,
  Bell
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  assigned_to: string;
  assigned_by: string;
  created_at: string;
  assigned_to_profile?: {
    full_name: string;
  };
  assigned_by_profile?: {
    full_name: string;
  };
}

interface DashboardStats {
  totalKaryakars: number;
  activeTasks: number;
  completedTasks: number;
  pendingTasks: number;
  todayTasks: number;
}

const Dashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalKaryakars: 0,
    activeTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    todayTasks: 0
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchRecentTasks()
      ]);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_active', true);

    const { data: tasks } = await supabase
      .from('tasks')
      .select('status, due_date');

    const today = new Date().toISOString().split('T')[0];
    
    const activeTasks = tasks?.filter(t => t.status !== 'completed').length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
    const pendingTasks = tasks?.filter(t => t.status === 'pending').length || 0;
    const todayTasks = tasks?.filter(t => t.due_date === today).length || 0;

    setStats({
      totalKaryakars: profiles?.length || 0,
      activeTasks,
      completedTasks,
      pendingTasks,
      todayTasks
    });
  };

  const fetchRecentTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name),
        assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching recent tasks:', error);
      setRecentTasks([]);
      return;
    }

    // Filter out tasks with query errors
    const validTasks = (data || []).filter(task => {
      return task.assigned_to_profile && !('error' in task.assigned_to_profile) &&
             task.assigned_by_profile && !('error' in task.assigned_by_profile);
    }).map(task => ({
      ...task,
      assigned_to_profile: task.assigned_to_profile || { full_name: 'Unknown' },
      assigned_by_profile: task.assigned_by_profile || { full_name: 'Unknown' }
    }));

    setRecentTasks(validTasks);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getCompletionRate = () => {
    const total = stats.activeTasks + stats.completedTasks;
    return total > 0 ? (stats.completedTasks / total) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening in your organization.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Karyakars</p>
                <p className="text-2xl font-bold">{stats.totalKaryakars}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                <p className="text-2xl font-bold">{stats.activeTasks}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                <p className="text-2xl font-bold">{stats.completedTasks}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Tasks</p>
                <p className="text-2xl font-bold">{stats.todayTasks}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Task Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TaskStatusChart 
              data={{
                completed: stats.completedTasks,
                pending: stats.pendingTasks,
                inProgress: stats.activeTasks - stats.pendingTasks
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completion Rate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{getCompletionRate().toFixed(1)}%</span>
              </div>
              <Progress value={getCompletionRate()} className="h-2" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.activeTasks - stats.pendingTasks}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingTasks}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks and Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recent Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No recent tasks found</p>
              ) : (
                recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      <p className="text-sm text-gray-600">
                        Assigned to: {task.assigned_to_profile?.full_name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">
                        By: {task.assigned_by_profile?.full_name || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`} />
                    </div>
                  </div>
                ))
              )}
            </div>
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="flex items-center gap-2 h-12">
              <Users className="h-5 w-5" />
              Add New Karyakar
            </Button>
            <Button variant="outline" className="flex items-center gap-2 h-12">
              <Calendar className="h-5 w-5" />
              Create Task
            </Button>
            <Button variant="outline" className="flex items-center gap-2 h-12">
              <MessageSquare className="h-5 w-5" />
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
