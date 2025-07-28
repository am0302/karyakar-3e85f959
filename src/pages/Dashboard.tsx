
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date?: string;
  created_at: string;
  assigned_to_profile?: {
    full_name: string;
  } | null;
  assigned_by_profile?: {
    full_name: string;
  } | null;
}

const Dashboard = () => {
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentTasks();
  }, []);

  const fetchRecentTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          priority,
          due_date,
          created_at,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name),
          assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      // Filter out tasks with query errors and transform data
      const validTasks = data?.filter(task => {
        const hasValidAssignedTo = !task.assigned_to_profile || 
          (task.assigned_to_profile && typeof task.assigned_to_profile === 'object' && 
           !('error' in task.assigned_to_profile) &&
           'full_name' in task.assigned_to_profile);
        
        const hasValidAssignedBy = !task.assigned_by_profile || 
          (task.assigned_by_profile && typeof task.assigned_by_profile === 'object' && 
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
      
      setRecentTasks(validTasks);
    } catch (error: any) {
      console.error('Error fetching recent tasks:', error);
    } finally {
      setLoading(false);
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
        <p className="text-gray-600">Overview of your organization</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Karyakars</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">150</div>
            <p className="text-gray-500">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Mandals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">30</div>
            <p className="text-gray-500">Active groups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75</div>
            <p className="text-gray-500">Pending tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-gray-500">Scheduled events</p>
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
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{task.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    {task.assigned_to_profile && (
                      <span>Assigned to: {task.assigned_to_profile.full_name}</span>
                    )}
                    {task.assigned_by_profile && (
                      <span>By: {task.assigned_by_profile.full_name}</span>
                    )}
                    <span>Priority: {task.priority}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                    {task.status}
                  </Badge>
                  <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
                    {task.priority}
                  </Badge>
                </div>
              </div>
            ))}
            {recentTasks.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No recent tasks</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Add New Karyakar
            </button>
            <button className="p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Create New Mandal
            </button>
            <button className="p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Schedule Event
            </button>
            <button className="p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Assign Task
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
