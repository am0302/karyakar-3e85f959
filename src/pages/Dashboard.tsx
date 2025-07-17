
import { useAuth } from '@/components/AuthProvider';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Building2, Calendar, CheckCircle, Clock, AlertCircle, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, LineChart, Line } from 'recharts';

type DashboardStats = {
  totalKaryakars: number;
  totalMandirs: number;
  totalKshetras: number;
  totalVillages: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
};

type RecentTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string;
  assigned_to_profile: { full_name: string };
};

const Dashboard = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalKaryakars: 0,
    totalMandirs: 0,
    totalKshetras: 0,
    totalVillages: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
  });
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Chart data
  const [taskStatusData, setTaskStatusData] = useState([
    { name: 'Pending', value: 0, color: '#ef4444' },
    { name: 'In Progress', value: 0, color: '#3b82f6' },
    { name: 'Completed', value: 0, color: '#22c55e' }
  ]);

  const [monthlyTaskData, setMonthlyTaskData] = useState([
    { month: 'Jan', created: 0, completed: 0 },
    { month: 'Feb', created: 0, completed: 0 },
    { month: 'Mar', created: 0, completed: 0 },
    { month: 'Apr', created: 0, completed: 0 },
    { month: 'May', created: 0, completed: 0 },
    { month: 'Jun', created: 0, completed: 0 }
  ]);

  const [roleDistributionData, setRoleDistributionData] = useState([
    { role: 'Super Admin', count: 0, color: '#8b5cf6' },
    { role: 'Sant Nirdeshak', count: 0, color: '#06b6d4' },
    { role: 'Sah Nirdeshak', count: 0, color: '#10b981' },
    { role: 'Mandal Sanchalak', count: 0, color: '#f59e0b' },
    { role: 'Karyakar', count: 0, color: '#ef4444' },
    { role: 'Sevak', count: 0, color: '#6b7280' }
  ]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchRecentTasks(),
        fetchChartData()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch basic counts
      const [karyakars, mandirs, kshetras, villages, tasks] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('mandirs').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('kshetras').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('villages').select('id', { count: 'exact' }).eq('is_active', true),
        user?.role === 'super_admin' 
          ? supabase.from('tasks').select('id, status', { count: 'exact' })
          : supabase.from('tasks').select('id, status', { count: 'exact' }).or(`assigned_by.eq.${user?.id},assigned_to.eq.${user?.id}`)
      ]);

      const tasksByStatus = {
        pending: tasks.data?.filter(t => t.status === 'pending').length || 0,
        in_progress: tasks.data?.filter(t => t.status === 'in_progress').length || 0,
        completed: tasks.data?.filter(t => t.status === 'completed').length || 0,
      };

      setStats({
        totalKaryakars: karyakars.count || 0,
        totalMandirs: mandirs.count || 0,
        totalKshetras: kshetras.count || 0,
        totalVillages: villages.count || 0,
        totalTasks: tasks.count || 0,
        pendingTasks: tasksByStatus.pending,
        inProgressTasks: tasksByStatus.in_progress,
        completedTasks: tasksByStatus.completed,
      });

      // Update task status chart data
      setTaskStatusData([
        { name: 'Pending', value: tasksByStatus.pending, color: '#ef4444' },
        { name: 'In Progress', value: tasksByStatus.in_progress, color: '#3b82f6' },
        { name: 'Completed', value: tasksByStatus.completed, color: '#22c55e' }
      ]);

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentTasks = async () => {
    try {
      let query = supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          priority,
          due_date,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (user?.role !== 'super_admin') {
        query = query.or(`assigned_by.eq.${user?.id},assigned_to.eq.${user?.id}`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setRecentTasks(data || []);
    } catch (error) {
      console.error('Error fetching recent tasks:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      // Fetch role distribution
      const { data: roleData, error: roleError } = await supabase
        .from('profiles')
        .select('role')
        .eq('is_active', true);

      if (!roleError && roleData) {
        const roleCounts = roleData.reduce((acc, profile) => {
          acc[profile.role] = (acc[profile.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        setRoleDistributionData([
          { role: 'Super Admin', count: roleCounts.super_admin || 0, color: '#8b5cf6' },
          { role: 'Sant Nirdeshak', count: roleCounts.sant_nirdeshak || 0, color: '#06b6d4' },
          { role: 'Sah Nirdeshak', count: roleCounts.sah_nirdeshak || 0, color: '#10b981' },
          { role: 'Mandal Sanchalak', count: roleCounts.mandal_sanchalak || 0, color: '#f59e0b' },
          { role: 'Karyakar', count: roleCounts.karyakar || 0, color: '#ef4444' },
          { role: 'Sevak', count: roleCounts.sevak || 0, color: '#6b7280' }
        ]);
      }

      // Fetch monthly task data (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      let taskQuery = supabase
        .from('tasks')
        .select('created_at, status')
        .gte('created_at', sixMonthsAgo.toISOString());

      if (user?.role !== 'super_admin') {
        taskQuery = taskQuery.or(`assigned_by.eq.${user?.id},assigned_to.eq.${user?.id}`);
      }

      const { data: monthlyTasks, error: monthlyError } = await taskQuery;

      if (!monthlyError && monthlyTasks) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = months.map(month => ({ month, created: 0, completed: 0 }));

        monthlyTasks.forEach(task => {
          const taskDate = new Date(task.created_at);
          const monthIndex = taskDate.getMonth();
          const monthName = months[monthIndex];
          
          const monthData = monthlyData.find(m => m.month === monthName);
          if (monthData) {
            monthData.created++;
            if (task.status === 'completed') {
              monthData.completed++;
            }
          }
        });

        setMonthlyTaskData(monthlyData.slice(-6)); // Last 6 months
      }

    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'pending': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.full_name}</p>
      </div>

      {/* Quick Actions - Moved to top */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {hasPermission('karyakars', 'view') && (
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
                onClick={() => navigate('/karyakars')}
              >
                <Users className="h-6 w-6" />
                <span className="text-sm">Karyakars</span>
              </Button>
            )}
            {hasPermission('tasks', 'view') && (
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
                onClick={() => navigate('/tasks')}
              >
                <CheckCircle className="h-6 w-6" />
                <span className="text-sm">Tasks</span>
              </Button>
            )}
            {hasPermission('communication', 'view') && (
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
                onClick={() => navigate('/communication')}
              >
                <MapPin className="h-6 w-6" />
                <span className="text-sm">Communication</span>
              </Button>
            )}
            {hasPermission('reports', 'view') && (
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
                onClick={() => navigate('/reports')}
              >
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">Reports</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">Total Mandirs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMandirs}</div>
            <p className="text-xs text-muted-foreground">Active mandirs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kshetras</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalKshetras}</div>
            <p className="text-xs text-muted-foreground">Active kshetras</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Villages</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVillages}</div>
            <p className="text-xs text-muted-foreground">Active villages</p>
          </CardContent>
        </Card>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">Waiting to start</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">Currently working</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">Finished tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
          <CardDescription>Latest task updates</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTasks.length > 0 ? (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-gray-600">
                      Assigned to: {task.assigned_to_profile?.full_name}
                    </div>
                    {task.due_date && (
                      <div className="text-xs text-gray-500">
                        Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                    <Badge variant="outline" className={getStatusColor(task.status)}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recent tasks found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Graphical Data Views */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Task Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <RechartsPieChart data={taskStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </RechartsPieChart>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {taskStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Role Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roleDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="role" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Task Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Task Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTaskData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="created" stroke="#3b82f6" name="Created" />
                <Line type="monotone" dataKey="completed" stroke="#22c55e" name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
