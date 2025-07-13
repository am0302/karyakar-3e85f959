
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  Download, 
  Filter, 
  Calendar, 
  Users, 
  CheckSquare, 
  TrendingUp, 
  Building,
  MapPin,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ReportData = {
  karyakarsByRole: any[];
  karyakarsByMandir: any[];
  tasksByStatus: any[];
  tasksByPriority: any[];
  monthlyRegistrations: any[];
  taskCompletionTrend: any[];
  villageDistribution: any[];
  sevaTypeDistribution: any[];
};

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportData>({
    karyakarsByRole: [],
    karyakarsByMandir: [],
    tasksByStatus: [],
    tasksByPriority: [],
    monthlyRegistrations: [],
    taskCompletionTrend: [],
    villageDistribution: [],
    sevaTypeDistribution: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedMandir, setSelectedMandir] = useState('all');
  const [mandirs, setMandirs] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchMandirs();
      fetchReportData();
    }
  }, [user, dateRange, selectedMandir]);

  const fetchMandirs = async () => {
    try {
      const { data, error } = await supabase
        .from('mandirs')
        .select('id, name')
        .eq('is_active', true);

      if (error) throw error;
      setMandirs(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch mandirs',
        variant: 'destructive',
      });
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Base query filters
      const dateFilter = `created_at.gte.${dateRange.startDate}T00:00:00Z,created_at.lte.${dateRange.endDate}T23:59:59Z`;
      const mandirFilter = selectedMandir !== 'all' ? `,mandir_id.eq.${selectedMandir}` : '';

      // Fetch profiles data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id, role, mandir_id, village_id, seva_type_id, created_at,
          mandirs(name),
          villages(name),
          seva_types(name)
        `)
        .gte('created_at', `${dateRange.startDate}T00:00:00Z`)
        .lte('created_at', `${dateRange.endDate}T23:59:59Z`);

      if (profilesError) throw profilesError;

      // Fetch tasks data
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, status, priority, created_at, updated_at, mandir_id')
        .gte('created_at', `${dateRange.startDate}T00:00:00Z`)
        .lte('created_at', `${dateRange.endDate}T23:59:59Z`);

      if (tasksError) throw tasksError;

      // Process karyakars by role
      const roleCount = (profiles || []).reduce((acc: any, profile) => {
        acc[profile.role] = (acc[profile.role] || 0) + 1;
        return acc;
      }, {});

      const karyakarsByRole = Object.entries(roleCount).map(([role, count]) => ({
        name: role.replace('_', ' ').toUpperCase(),
        value: count,
        fill: getRoleColor(role)
      }));

      // Process karyakars by mandir
      const mandirCount = (profiles || []).reduce((acc: any, profile) => {
        const mandirName = profile.mandirs?.name || 'Unassigned';
        acc[mandirName] = (acc[mandirName] || 0) + 1;
        return acc;
      }, {});

      const karyakarsByMandir = Object.entries(mandirCount).map(([mandir, count]) => ({
        name: mandir,
        value: count
      }));

      // Process tasks by status
      const statusCount = (tasks || []).reduce((acc: any, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {});

      const tasksByStatus = Object.entries(statusCount).map(([status, count]) => ({
        name: status.replace('_', ' ').toUpperCase(),
        value: count,
        fill: getStatusColor(status)
      }));

      // Process tasks by priority
      const priorityCount = (tasks || []).reduce((acc: any, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {});

      const tasksByPriority = Object.entries(priorityCount).map(([priority, count]) => ({
        name: priority.toUpperCase(),
        value: count,
        fill: getPriorityColor(priority)
      }));

      // Process monthly registrations
      const monthlyData = (profiles || []).reduce((acc: any, profile) => {
        const month = new Date(profile.created_at).toISOString().slice(0, 7);
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      const monthlyRegistrations = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({
          month: new Date(month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          registrations: count
        }));

      // Process task completion trend
      const completionData = (tasks || []).filter(t => t.status === 'completed').reduce((acc: any, task) => {
        const month = new Date(task.updated_at).toISOString().slice(0, 7);
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      const taskCompletionTrend = Object.entries(completionData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({
          month: new Date(month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          completed: count
        }));

      // Process village distribution
      const villageCount = (profiles || []).reduce((acc: any, profile) => {
        const villageName = profile.villages?.name || 'Unassigned';
        acc[villageName] = (acc[villageName] || 0) + 1;
        return acc;
      }, {});

      const villageDistribution = Object.entries(villageCount).map(([village, count]) => ({
        name: village,
        value: count
      }));

      // Process seva type distribution
      const sevaTypeCount = (profiles || []).reduce((acc: any, profile) => {
        const sevaTypeName = profile.seva_types?.name || 'Unassigned';
        acc[sevaTypeName] = (acc[sevaTypeName] || 0) + 1;
        return acc;
      }, {});

      const sevaTypeDistribution = Object.entries(sevaTypeCount).map(([sevaType, count]) => ({
        name: sevaType,
        value: count
      }));

      setReportData({
        karyakarsByRole,
        karyakarsByMandir,
        tasksByStatus,
        tasksByPriority,
        monthlyRegistrations,
        taskCompletionTrend,
        villageDistribution,
        sevaTypeDistribution
      });

    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch report data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'super_admin': '#dc2626',
      'sant_nirdeshak': '#7c3aed',
      'sah_nirdeshak': '#2563eb',
      'mandal_sanchalak': '#059669',
      'karyakar': '#d97706',
      'sevak': '#6b7280'
    };
    return colors[role as keyof typeof colors] || '#6b7280';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'completed': '#059669',
      'in_progress': '#2563eb',
      'pending': '#d97706'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'urgent': '#dc2626',
      'high': '#ea580c',
      'medium': '#d97706',
      'low': '#059669'
    };
    return colors[priority as keyof typeof colors] || '#6b7280';
  };

  const exportReport = async (format: 'csv' | 'pdf') => {
    try {
      const reportContent = {
        dateRange,
        selectedMandir,
        data: reportData,
        timestamp: new Date().toISOString()
      };

      if (format === 'csv') {
        // Simple CSV export for demonstration
        const csvContent = [
          'Report Type,Value,Count',
          ...reportData.karyakarsByRole.map(item => `Karyakars by Role,${item.name},${item.value}`),
          ...reportData.tasksByStatus.map(item => `Tasks by Status,${item.name},${item.value}`)
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `seva-sarthi-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: 'Success',
        description: `Report exported as ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to export report',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive insights and data analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportReport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mandir">Mandir</Label>
              <Select value={selectedMandir} onValueChange={setSelectedMandir}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Mandir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Mandirs</SelectItem>
                  {mandirs.map((mandir) => (
                    <SelectItem key={mandir.id} value={mandir.id}>
                      {mandir.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="karyakars">Karyakars</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Karyakars by Role</CardTitle>
                <CardDescription>Distribution of community members by their roles</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.karyakarsByRole}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {reportData.karyakarsByRole.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tasks by Status</CardTitle>
                <CardDescription>Current status distribution of all tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.tasksByStatus}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Karyakars Tab */}
        <TabsContent value="karyakars">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Karyakars by Mandir</CardTitle>
                <CardDescription>Distribution across different mandirs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.karyakarsByMandir}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#059669" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Village Distribution</CardTitle>
                <CardDescription>Karyakars across villages</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.villageDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seva Type Distribution</CardTitle>
                <CardDescription>Distribution by seva type preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.sevaTypeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#7c3aed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Registrations</CardTitle>
                <CardDescription>New karyakar registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={reportData.monthlyRegistrations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="registrations" stroke="#f97316" fill="#f97316" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tasks by Priority</CardTitle>
                <CardDescription>Task distribution by priority levels</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.tasksByPriority}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {reportData.tasksByPriority.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Completion Trend</CardTitle>
                <CardDescription>Monthly task completion progress</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.taskCompletionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="completed" stroke="#059669" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>Combined view of registrations and task completions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={reportData.monthlyRegistrations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="registrations" stroke="#f97316" strokeWidth={2} name="New Registrations" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Karyakars</p>
                      <p className="text-2xl font-bold">{reportData.karyakarsByRole.reduce((sum, item) => sum + item.value, 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Tasks</p>
                      <p className="text-2xl font-bold">{reportData.tasksByStatus.reduce((sum, item) => sum + item.value, 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Active Mandirs</p>
                      <p className="text-2xl font-bold">{reportData.karyakarsByMandir.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Villages</p>
                      <p className="text-2xl font-bold">{reportData.villageDistribution.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
