
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Filter, Users, Calendar, CheckCircle, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
  is_active: boolean;
  professions?: {
    name: string;
  };
  seva_types?: {
    name: string;
  };
  mandirs?: {
    name: string;
  };
  kshetras?: {
    name: string;
  };
  villages?: {
    name: string;
  };
  mandals?: {
    name: string;
  };
}

interface TaskReport {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  due_date: string;
  assigned_to_profile: {
    full_name: string;
  };
  assigned_by_profile: {
    full_name: string;
  };
}

const Reports = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<TaskReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles with related data
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          role,
          created_at,
          is_active,
          professions(name),
          seva_types(name),
          mandirs(name),
          kshetras(name),
          villages(name),
          mandals(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Filter out profiles with query errors
      const validProfiles = profilesData?.filter(profile => {
        return (!profile.professions || (typeof profile.professions === 'object' && !('error' in profile.professions))) &&
               (!profile.seva_types || (typeof profile.seva_types === 'object' && !('error' in profile.seva_types))) &&
               (!profile.mandirs || (typeof profile.mandirs === 'object' && !('error' in profile.mandirs))) &&
               (!profile.kshetras || (typeof profile.kshetras === 'object' && !('error' in profile.kshetras))) &&
               (!profile.villages || (typeof profile.villages === 'object' && !('error' in profile.villages))) &&
               (!profile.mandals || (typeof profile.mandals === 'object' && !('error' in profile.mandals)));
      }) || [];

      setProfiles(validProfiles as Profile[]);

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          priority,
          created_at,
          due_date,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name),
          assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Filter out tasks with query errors
      const validTasks = tasksData?.filter(task => {
        return task.assigned_to_profile && 
               typeof task.assigned_to_profile === 'object' && 
               !('error' in task.assigned_to_profile) &&
               task.assigned_by_profile && 
               typeof task.assigned_by_profile === 'object' && 
               !('error' in task.assigned_by_profile);
      }) || [];

      setTasks(validTasks as TaskReport[]);
    } catch (error: any) {
      console.error('Error fetching reports data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch reports data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getKaryakarsByRole = () => {
    const roleCount: { [key: string]: number } = {};
    profiles.forEach(profile => {
      const role = profile.role || 'Unknown';
      roleCount[role] = (roleCount[role] || 0) + 1;
    });
    
    return Object.entries(roleCount).map(([role, count]) => ({
      role,
      count
    }));
  };

  const getTasksByStatus = () => {
    const statusCount: { [key: string]: number } = {};
    tasks.forEach(task => {
      const status = task.status || 'Unknown';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    return Object.entries(statusCount).map(([status, count]) => ({
      status,
      count
    }));
  };

  const getTasksByPriority = () => {
    const priorityCount: { [key: string]: number } = {};
    tasks.forEach(task => {
      const priority = task.priority || 'Unknown';
      priorityCount[priority] = (priorityCount[priority] || 0) + 1;
    });
    
    return Object.entries(priorityCount).map(([priority, count]) => ({
      priority,
      count
    }));
  };

  const getMonthlyRegistrations = () => {
    const monthlyCount: { [key: string]: number } = {};
    profiles.forEach(profile => {
      const month = format(new Date(profile.created_at), 'MMM yyyy');
      monthlyCount[month] = (monthlyCount[month] || 0) + 1;
    });
    
    return Object.entries(monthlyCount).map(([month, count]) => ({
      month,
      count
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const filteredProfiles = profiles.filter(profile => {
    const matchesRole = selectedRole === 'all' || profile.role === selectedRole;
    const matchesDateRange = !dateRange.start || !dateRange.end || 
      (new Date(profile.created_at) >= new Date(dateRange.start) && 
       new Date(profile.created_at) <= new Date(dateRange.end));
    return matchesRole && matchesDateRange;
  });

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;
    const matchesDateRange = !dateRange.start || !dateRange.end || 
      (new Date(task.created_at) >= new Date(dateRange.start) && 
       new Date(task.created_at) <= new Date(dateRange.end));
    return matchesStatus && matchesDateRange;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Analytics and insights for your organization</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="role-filter">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role-filter">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="sant_nirdeshak">Sant Nirdeshak</SelectItem>
                  <SelectItem value="sah_nirdeshak">Sah Nirdeshak</SelectItem>
                  <SelectItem value="mandal_sanchalak">Mandal Sanchalak</SelectItem>
                  <SelectItem value="karyakar">Karyakar</SelectItem>
                  <SelectItem value="sevak">Sevak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-filter">Task Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Karyakars</p>
                <p className="text-2xl font-bold">{filteredProfiles.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold">{filteredTasks.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Tasks</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredTasks.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Task Completion Rate</p>
                <p className="text-2xl font-bold">
                  {filteredTasks.length > 0 ? 
                    Math.round((filteredTasks.filter(t => t.status === 'completed').length / filteredTasks.length) * 100) : 0
                  }%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="karyakars" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="karyakars">Karyakars</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="karyakars" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Karyakars by Role</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getKaryakarsByRole()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="role" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getKaryakarsByRole()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ role, percent }) => `${role} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {getKaryakarsByRole().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tasks by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getTasksByStatus()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tasks by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getTasksByPriority()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ priority, percent }) => `${priority} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {getTasksByPriority().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getMonthlyRegistrations()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
