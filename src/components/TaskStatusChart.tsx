
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/AuthProvider';

interface TaskStatusData {
  name: string;
  value: number;
  color: string;
}

const COLORS = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444'
};

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export const TaskStatusChart = () => {
  const { user } = useAuth();
  const [data, setData] = useState<TaskStatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTaskStatusData();
    }
  }, [user]);

  const fetchTaskStatusData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch tasks assigned to or by the current user
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('status')
        .or(`assigned_to.eq.${user.id},assigned_by.eq.${user.id}`);

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      // Count tasks by status
      const statusCounts = {
        pending: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0
      };

      tasks?.forEach(task => {
        if (task.status in statusCounts) {
          statusCounts[task.status as keyof typeof statusCounts]++;
        }
      });

      // Convert to chart data format
      const chartData = Object.entries(statusCounts)
        .filter(([_, count]) => count > 0) // Only show statuses with tasks
        .map(([status, count]) => ({
          name: STATUS_LABELS[status as keyof typeof STATUS_LABELS],
          value: count,
          color: COLORS[status as keyof typeof COLORS]
        }));

      setData(chartData);
    } catch (error) {
      console.error('Error fetching task status data:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            Tasks: <span className="font-medium">{data.value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-gray-500">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-gray-500">No tasks found</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
