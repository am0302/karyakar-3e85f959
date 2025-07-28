
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, MessageSquare, CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { TaskCalendar } from '@/components/TaskCalendar';
import { TaskStatusChart } from '@/components/TaskStatusChart';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'] & {
  assigned_to_profile?: {
    full_name: string;
  } | null;
  assigned_by_profile?: {
    full_name: string;
  } | null;
};

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasksCount: 0,
  });

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchStats();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_profile:profiles!assigned_to(full_name),
          assigned_by_profile:profiles!assigned_by(full_name)
        `)
        .or(`assigned_to.eq.${user?.id},assigned_by.eq.${user?.id}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Filter out tasks with query errors
      const validTasks = data?.filter((task: any) => {
        const hasValidAssignedTo = !task.assigned_to_profile || 
                                 (typeof task.assigned_to_profile === 'object' && task.assigned_to_profile.full_name);
        const hasValidAssignedBy = !task.assigned_by_profile || 
                                 (typeof task.assigned_by_profile === 'object' && task.assigned_by_profile.full_name);
        return hasValidAssignedTo && hasValidAssignedBy;
      }) || [];

      setTasks(validTasks);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
      });
    }
  };

  const fetchStats = async () => {
    try {
      const { data: allTasks, error } = await supabase
        .from('tasks')
        .select('status, due_date')
        .or(`assigned_to.eq.${user?.id},assigned_by.eq.${user?.id}`);

      if (error) throw error;

      const totalTasks = allTasks?.length || 0;
      const completedTasks = allTasks?.filter(task => task.status === 'completed').length || 0;
      const pendingTasks = allTasks?.filter(task => task.status === 'pending').length || 0;
      const overdueTasksCount = allTasks?.filter(task => 
        task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
      ).length || 0;

      setStats({
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasksCount,
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your tasks and activities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">All assigned tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">Tasks completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueTasksCount}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Task Status Overview</CardTitle>
            <CardDescription>Distribution of task statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskStatusChart 
              completed={stats.completedTasks}
              pending={stats.pendingTasks}
              inProgress={stats.totalTasks - stats.completedTasks - stats.pendingTasks}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Calendar</CardTitle>
            <CardDescription>Your upcoming tasks and deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskCalendar tasks={tasks} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
          <CardDescription>Your latest task activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                <p className="text-gray-600">Your assigned tasks will appear here</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium">{task.title}</h4>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    <div className="text-xs text-gray-500">
                      Assigned to: {task.assigned_to_profile?.full_name || 'Unassigned'} • 
                      By: {task.assigned_by_profile?.full_name || 'Unknown'}
                      {task.due_date && ` • Due: ${formatDate(task.due_date)}`}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
