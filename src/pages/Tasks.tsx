
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Download, Calendar, Users, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TaskCalendar from '@/components/TaskCalendar';
import { TaskStatusChart } from '@/components/TaskStatusChart';
import { useAuth } from '@/components/AuthProvider';
import { usePermissions } from '@/hooks/usePermissions';
import type { Database } from '@/integrations/supabase/types';

type TaskPriority = 'low' | 'medium' | 'high';
type TaskStatus = 'pending' | 'in_progress' | 'completed';
type TaskType = 'personal' | 'general';

interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  assigned_by: string;
  status: TaskStatus;
  priority: TaskPriority;
  task_type: TaskType;
  due_date: string;
  created_at: string;
  updated_at: string;
  assigned_to_profile?: {
    full_name: string;
  };
  assigned_by_profile?: {
    full_name: string;
  };
}

const Tasks = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium' as TaskPriority,
    task_type: 'personal' as TaskType,
    due_date: '',
    status: 'pending' as TaskStatus,
  });

  const canView = hasPermission('tasks', 'view');
  const canAdd = hasPermission('tasks', 'add');
  const canEdit = hasPermission('tasks', 'edit');
  const canDelete = hasPermission('tasks', 'delete');

  useEffect(() => {
    if (canView) {
      fetchTasks();
    }
  }, [canView]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name),
          assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter out records with query errors and transform the data
      const validTasks = data?.filter(task => {
        return task.assigned_to_profile && 
               typeof task.assigned_to_profile === 'object' && 
               !('error' in task.assigned_to_profile) &&
               'full_name' in task.assigned_to_profile &&
               task.assigned_by_profile && 
               typeof task.assigned_by_profile === 'object' && 
               !('error' in task.assigned_by_profile) &&
               'full_name' in task.assigned_by_profile;
      }) || [];

      const transformedTasks: Task[] = validTasks.map(task => ({
        ...task,
        assigned_to_profile: {
          full_name: (task.assigned_to_profile as any).full_name
        },
        assigned_by_profile: {
          full_name: (task.assigned_by_profile as any).full_name
        }
      }));

      setTasks(transformedTasks);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!canAdd) {
      toast({
        title: 'Error',
        description: 'You do not have permission to create tasks',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .insert([
          {
            ...newTask,
            assigned_by: user?.id || '',
            priority: newTask.priority as Database['public']['Enums']['task_priority'],
            task_type: newTask.task_type as Database['public']['Enums']['task_type'],
            status: newTask.status as Database['public']['Enums']['task_status'],
          }
        ]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task created successfully',
      });

      setNewTask({
        title: '',
        description: '',
        assigned_to: '',
        priority: 'medium',
        task_type: 'personal',
        due_date: '',
        status: 'pending',
      });

      fetchTasks();
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!canEdit) {
      toast({
        title: 'Error',
        description: 'You do not have permission to update tasks',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task status updated successfully',
      });

      fetchTasks();
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100';
      case 'pending':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading tasks...</div>;
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You do not have permission to view tasks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">Manage and track task assignments</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {canAdd && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Create Task</span>
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold">{taskStats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
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
                <p className="text-2xl font-bold text-yellow-600">{taskStats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-red-600">{taskStats.pending}</p>
              </div>
              <Calendar className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'calendar' ? 'default' : 'outline'}
          onClick={() => setViewMode('calendar')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Calendar View
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          onClick={() => setViewMode('list')}
        >
          <Users className="h-4 w-4 mr-2" />
          List View
        </Button>
      </div>

      {/* Task Status Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Task Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskStatusChart tasks={tasks} />
        </CardContent>
      </Card>

      {/* Task Content */}
      {viewMode === 'calendar' ? (
        <Card>
          <CardHeader>
            <CardTitle>Task Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskCalendar />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Task List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{task.title}</h3>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-2">{task.description}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Assigned to: {task.assigned_to_profile?.full_name || 'Unknown'}</span>
                    <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Tasks;
