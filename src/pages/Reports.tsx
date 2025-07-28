
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  Filter,
  Calendar,
  TrendingUp,
  FileText
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  professions?: { name: string };
  seva_types?: { name: string };
  mandirs?: { name: string };
  kshetras?: { name: string };
  villages?: { name: string };
  mandals?: { name: string };
}

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  due_date: string;
  assigned_to_profile?: {
    full_name: string;
  };
  assigned_by_profile?: {
    full_name: string;
  };
}

interface ReportData {
  karyakarsByRole: Array<{ role: string; count: number }>;
  karyakarsByLocation: Array<{ location: string; count: number }>;
  tasksByStatus: Array<{ status: string; count: number }>;
  tasksByPriority: Array<{ priority: string; count: number }>;
  monthlyGrowth: Array<{ month: string; karyakars: number; tasks: number }>;
  completionRate: number;
  averageTaskTime: number;
}

const Reports = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1),
    to: new Date()
  });
  const [reportType, setReportType] = useState<'overview' | 'karyakars' | 'tasks' | 'performance'>('overview');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reportData, setReportData] = useState<ReportData>({
    karyakarsByRole: [],
    karyakarsByLocation: [],
    tasksByStatus: [],
    tasksByPriority: [],
    monthlyGrowth: [],
    completionRate: 0,
    averageTaskTime: 0
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchProfiles(),
        fetchTasks()
      ]);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load report data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        professions(name),
        seva_types(name),
        mandirs(name),
        kshetras(name),
        villages(name),
        mandals(name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching profiles:', error);
      setProfiles([]);
      return;
    }

    // Filter out profiles with query errors
    const validProfiles = (data || []).filter(profile => {
      return (!profile.professions || !('error' in profile.professions)) &&
             (!profile.seva_types || !('error' in profile.seva_types)) &&
             (!profile.mandirs || !('error' in profile.mandirs)) &&
             (!profile.kshetras || !('error' in profile.kshetras)) &&
             (!profile.villages || !('error' in profile.villages)) &&
             (!profile.mandals || !('error' in profile.mandals));
    });

    setProfiles(validProfiles);
    generateKaryakarReports(validProfiles);
  };

  const fetchTasks = async () => {
    const query = supabase
      .from('tasks')
      .select(`
        *,
        assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name),
        assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    if (dateRange?.from) {
      query.gte('created_at', dateRange.from.toISOString());
    }
    if (dateRange?.to) {
      query.lte('created_at', dateRange.to.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
      return;
    }

    // Filter out tasks with query errors
    const validTasks = (data || []).filter(task => {
      return task.assigned_to_profile && !('error' in task.assigned_to_profile) &&
             task.assigned_by_profile && !('error' in task.assigned_by_profile);
    });

    setTasks(validTasks);
    generateTaskReports(validTasks);
  };

  const generateKaryakarReports = (karyakarData: Profile[]) => {
    // Group by role
    const byRole = karyakarData.reduce((acc, k) => {
      acc[k.role] = (acc[k.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const karyakarsByRole = Object.entries(byRole).map(([role, count]) => ({
      role: role.replace('_', ' ').toUpperCase(),
      count
    }));

    // Group by location (mandir)
    const byLocation = karyakarData.reduce((acc, k) => {
      const location = k.mandirs?.name || 'Unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const karyakarsByLocation = Object.entries(byLocation).map(([location, count]) => ({
      location,
      count
    }));

    setReportData(prev => ({
      ...prev,
      karyakarsByRole,
      karyakarsByLocation
    }));
  };

  const generateTaskReports = (taskData: Task[]) => {
    // Group by status
    const byStatus = taskData.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tasksByStatus = Object.entries(byStatus).map(([status, count]) => ({
      status: status.replace('_', ' ').toUpperCase(),
      count
    }));

    // Group by priority
    const byPriority = taskData.reduce((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tasksByPriority = Object.entries(byPriority).map(([priority, count]) => ({
      priority: priority.toUpperCase(),
      count
    }));

    // Calculate completion rate
    const completedTasks = taskData.filter(t => t.status === 'completed').length;
    const completionRate = taskData.length > 0 ? (completedTasks / taskData.length) * 100 : 0;

    setReportData(prev => ({
      ...prev,
      tasksByStatus,
      tasksByPriority,
      completionRate
    }));
  };

  const exportReport = () => {
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `report_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-500';
      case 'in progress': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into your organization</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={fetchData} variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Report Type</label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="karyakars">Karyakars</SelectItem>
                  <SelectItem value="tasks">Tasks</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Karyakars</p>
                <p className="text-2xl font-bold">{profiles.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold">{tasks.length}</p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">{reportData.completionRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                <p className="text-2xl font-bold">
                  {tasks.filter(t => t.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Karyakars by Role */}
        <Card>
          <CardHeader>
            <CardTitle>Karyakars by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.karyakarsByRole}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="role" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tasks by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.tasksByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {reportData.tasksByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Karyakars by Location */}
        <Card>
          <CardHeader>
            <CardTitle>Karyakars by Location</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.karyakarsByLocation}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="location" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tasks by Priority */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.tasksByPriority}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {reportData.tasksByPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.slice(0, 10).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{task.title}</h4>
                    <p className="text-sm text-gray-600">
                      Assigned to: {task.assigned_to_profile?.full_name || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.karyakarsByRole.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium">{item.role}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${(item.count / profiles.length) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
