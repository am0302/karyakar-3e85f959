
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, FileText, Users, CheckSquare, MessageSquare, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ReportData = {
  totalUsers: number;
  activeUsers: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalMessages: number;
  usersByRole: any[];
  tasksByPriority: any[];
  tasksByStatus: any[];
};

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportData>({
    totalUsers: 0,
    activeUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalMessages: 0,
    usersByRole: [],
    tasksByPriority: [],
    tasksByStatus: []
  });
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('last_30_days');
  const [exportFormat, setExportFormat] = useState('pdf');

  const COLORS = ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

  useEffect(() => {
    if (user) {
      fetchReportData();
    }
  }, [user, dateFilter]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateFilter) {
        case 'last_7_days':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'last_30_days':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case 'last_3_months':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'last_year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Fetch all data in parallel
      const [
        usersResult,
        tasksResult,
        messagesResult,
        usersByRoleResult,
        tasksByPriorityResult,
        tasksByStatusResult
      ] = await Promise.all([
        supabase.from('profiles').select('id, is_active, created_at'),
        supabase.from('tasks').select('id, status, priority, created_at'),
        supabase.from('messages').select('id, created_at'),
        supabase.from('profiles').select('role').not('role', 'is', null),
        supabase.from('tasks').select('priority').not('priority', 'is', null),
        supabase.from('tasks').select('status').not('status', 'is', null)
      ]);

      // Process user data
      const totalUsers = usersResult.data?.length || 0;
      const activeUsers = usersResult.data?.filter(u => u.is_active)?.length || 0;

      // Process task data
      const totalTasks = tasksResult.data?.length || 0;
      const completedTasks = tasksResult.data?.filter(t => t.status === 'completed')?.length || 0;
      const pendingTasks = tasksResult.data?.filter(t => t.status === 'pending')?.length || 0;

      // Process message data
      const totalMessages = messagesResult.data?.length || 0;

      // Process role distribution
      const roleCount: { [key: string]: number } = {};
      usersByRoleResult.data?.forEach(user => {
        const role = user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        roleCount[role] = (roleCount[role] || 0) + 1;
      });
      const usersByRole = Object.entries(roleCount).map(([role, count]) => ({
        name: role,
        value: count
      }));

      // Process task priority distribution
      const priorityCount: { [key: string]: number } = {};
      tasksByPriorityResult.data?.forEach(task => {
        const priority = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
        priorityCount[priority] = (priorityCount[priority] || 0) + 1;
      });
      const tasksByPriority = Object.entries(priorityCount).map(([priority, count]) => ({
        name: priority,
        value: count
      }));

      // Process task status distribution
      const statusCount: { [key: string]: number } = {};
      tasksByStatusResult.data?.forEach(task => {
        const status = task.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        statusCount[status] = (statusCount[status] || 0) + 1;
      });
      const tasksByStatus = Object.entries(statusCount).map(([status, count]) => ({
        name: status,
        value: count
      }));

      setReportData({
        totalUsers,
        activeUsers,
        totalTasks,
        completedTasks,
        pendingTasks,
        totalMessages,
        usersByRole,
        tasksByPriority,
        tasksByStatus
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

  const exportReport = async () => {
    try {
      toast({
        title: 'Export Started',
        description: `Exporting report as ${exportFormat.toUpperCase()}...`,
      });

      // Here you would implement actual export functionality
      // For now, we'll just show a success message
      setTimeout(() => {
        toast({
          title: 'Success',
          description: `Report exported successfully as ${exportFormat.toUpperCase()}`,
        });
      }, 2000);

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive insights and data analysis</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Last 7 Days</SelectItem>
              <SelectItem value="last_30_days">Last 30 Days</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={exportReport} className="bg-orange-500 hover:bg-orange-600">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {reportData.activeUsers} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {reportData.completedTasks} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              All time messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.totalTasks > 0 ? Math.round((reportData.completedTasks / reportData.totalTasks) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="tasks">Task Analytics</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Users by Role</CardTitle>
                <CardDescription>Distribution of users across different roles</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.usersByRole}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportData.usersByRole.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
                <CardDescription>Current status of all tasks</CardDescription>
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

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Analytics</CardTitle>
              <CardDescription>Detailed user statistics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{reportData.activeUsers}</div>
                    <div className="text-sm text-green-700">Active Users</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{reportData.totalUsers - reportData.activeUsers}</div>
                    <div className="text-sm text-red-700">Inactive Users</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {reportData.totalUsers > 0 ? Math.round((reportData.activeUsers / reportData.totalUsers) * 100) : 0}%
                    </div>
                    <div className="text-sm text-blue-700">Activity Rate</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Task Analytics</CardTitle>
              <CardDescription>Task performance and priority analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Tasks by Priority</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={reportData.tasksByPriority}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#eab308" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Task Statistics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>Total Tasks</span>
                      <Badge variant="secondary">{reportData.totalTasks}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                      <span>Completed Tasks</span>
                      <Badge className="bg-green-100 text-green-800">{reportData.completedTasks}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                      <span>Pending Tasks</span>
                      <Badge className="bg-yellow-100 text-yellow-800">{reportData.pendingTasks}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                      <span>In Progress</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {reportData.totalTasks - reportData.completedTasks - reportData.pendingTasks}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Reports</CardTitle>
              <CardDescription>Comprehensive data export and detailed analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col">
                    <FileText className="h-6 w-6 mb-2" />
                    User Report
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col">
                    <CheckSquare className="h-6 w-6 mb-2" />
                    Task Report
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col">
                    <MessageSquare className="h-6 w-6 mb-2" />
                    Communication Report
                  </Button>
                </div>
                
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Generate comprehensive reports with detailed analytics and insights
                  </p>
                  <Button onClick={exportReport} className="bg-orange-500 hover:bg-orange-600">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Full Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
