
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, Users, CheckCircle, Clock, AlertCircle, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  professions?: { name: string } | null;
  seva_types?: { name: string } | null;
  mandirs?: { name: string } | null;
  kshetras?: { name: string } | null;
  villages?: { name: string } | null;
  mandals?: { name: string } | null;
};

type Task = Database['public']['Tables']['tasks']['Row'] & {
  assigned_to_profile?: {
    full_name: string;
  } | null;
  assigned_by_profile?: {
    full_name: string;
  } | null;
};

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [karyakars, setKaryakars] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string>('karyakars');
  const [dateRange, setDateRange] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchReportData();
  }, [selectedReport, dateRange, filterRole, filterStatus]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      if (selectedReport === 'karyakars') {
        await fetchKaryakarsReport();
      } else if (selectedReport === 'tasks') {
        await fetchTasksReport();
      }
    } catch (error: any) {
      console.error('Error fetching report data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load report data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchKaryakarsReport = async () => {
    let query = supabase
      .from('profiles')
      .select(`
        *,
        professions!left(name),
        seva_types!left(name),
        mandirs!left(name),
        kshetras!left(name),
        villages!left(name),
        mandals!left(name)
      `);

    // Apply role filter
    if (filterRole !== 'all') {
      query = query.eq('role', filterRole);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      query = query.eq('is_active', filterStatus === 'active');
    }

    // Apply date filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (dateRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      query = query.gte('created_at', startDate.toISOString());
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Filter out records with query errors
    const validProfiles = data?.filter((profile: any) => {
      const hasValidProfession = !profile.professions || 
                               (typeof profile.professions === 'object' && profile.professions.name);
      const hasValidSevaType = !profile.seva_types || 
                             (typeof profile.seva_types === 'object' && profile.seva_types.name);
      const hasValidMandir = !profile.mandirs || 
                           (typeof profile.mandirs === 'object' && profile.mandirs.name);
      const hasValidKshetra = !profile.kshetras || 
                            (typeof profile.kshetras === 'object' && profile.kshetras.name);
      const hasValidVillage = !profile.villages || 
                            (typeof profile.villages === 'object' && profile.villages.name);
      const hasValidMandal = !profile.mandals || 
                           (typeof profile.mandals === 'object' && profile.mandals.name);
      
      return hasValidProfession && hasValidSevaType && hasValidMandir && 
             hasValidKshetra && hasValidVillage && hasValidMandal;
    }) || [];

    setKaryakars(validProfiles);
  };

  const fetchTasksReport = async () => {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        assigned_to_profile:profiles!assigned_to(full_name),
        assigned_by_profile:profiles!assigned_by(full_name)
      `);

    // Apply status filter
    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    // Apply date filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (dateRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      query = query.gte('created_at', startDate.toISOString());
    }

    const { data, error } = await query.order('created_at', { ascending: false });

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
  };

  const exportReport = () => {
    if (selectedReport === 'karyakars') {
      exportKaryakarsReport();
    } else if (selectedReport === 'tasks') {
      exportTasksReport();
    }
  };

  const exportKaryakarsReport = () => {
    const csvContent = [
      ['Name', 'Mobile', 'Email', 'Role', 'Profession', 'Seva Type', 'Mandir', 'Kshetra', 'Village', 'Mandal', 'Status', 'Created Date'].join(','),
      ...karyakars.map(k => [
        k.full_name,
        k.mobile_number,
        k.email || '',
        k.role,
        k.professions?.name || '',
        k.seva_types?.name || '',
        k.mandirs?.name || '',
        k.kshetras?.name || '',
        k.villages?.name || '',
        k.mandals?.name || '',
        k.is_active ? 'Active' : 'Inactive',
        new Date(k.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    downloadCSV(csvContent, 'karyakars_report.csv');
  };

  const exportTasksReport = () => {
    const csvContent = [
      ['Title', 'Description', 'Status', 'Priority', 'Assigned To', 'Assigned By', 'Due Date', 'Created Date'].join(','),
      ...tasks.map(t => [
        t.title,
        t.description || '',
        t.status,
        t.priority,
        t.assigned_to_profile?.full_name || 'Unassigned',
        t.assigned_by_profile?.full_name || 'Unknown',
        t.due_date ? new Date(t.due_date).toLocaleDateString() : '',
        new Date(t.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    downloadCSV(csvContent, 'tasks_report.csv');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Report exported successfully',
    });
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

  const getKaryakarStats = () => {
    const total = karyakars.length;
    const active = karyakars.filter(k => k.is_active).length;
    const inactive = total - active;
    const byRole = karyakars.reduce((acc, k) => {
      acc[k.role] = (acc[k.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, active, inactive, byRole };
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const overdue = tasks.filter(t => 
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
    ).length;

    return { total, completed, pending, inProgress, overdue };
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading reports...</div>;
  }

  const karyakarStats = getKaryakarStats();
  const taskStats = getTaskStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and analyze system reports</p>
        </div>
        
        <Button onClick={exportReport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Report Type</label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="karyakars">Karyakars Report</SelectItem>
                  <SelectItem value="tasks">Tasks Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedReport === 'karyakars' && (
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="sevak">Sevak</SelectItem>
                    <SelectItem value="karyakar">Karyakar</SelectItem>
                    <SelectItem value="mandal_sanchalak">Mandal Sanchalak</SelectItem>
                    <SelectItem value="sah_nirdeshak">Sah Nirdeshak</SelectItem>
                    <SelectItem value="sant_nirdeshak">Sant Nirdeshak</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {selectedReport === 'karyakars' ? (
                    <>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {selectedReport === 'karyakars' ? (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Karyakars</p>
                    <p className="text-2xl font-bold text-gray-900">{karyakarStats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-green-600">{karyakarStats.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-gray-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Inactive</p>
                    <p className="text-2xl font-bold text-gray-600">{karyakarStats.inactive}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Most Common Role</p>
                    <p className="text-lg font-bold text-purple-600">
                      {Object.entries(karyakarStats.byRole).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{taskStats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">{taskStats.overdue}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Report Data */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedReport === 'karyakars' ? 'Karyakars Report' : 'Tasks Report'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedReport === 'karyakars' ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Mobile</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Role</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Profession</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Seva Type</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Mandir</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {karyakars.map((karyakar) => (
                    <tr key={karyakar.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{karyakar.full_name}</td>
                      <td className="border border-gray-300 px-4 py-2">{karyakar.mobile_number}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <Badge variant="secondary">{karyakar.role}</Badge>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {karyakar.professions?.name || 'N/A'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {karyakar.seva_types?.name || 'N/A'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {karyakar.mandirs?.name || 'N/A'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <Badge variant={karyakar.is_active ? "default" : "secondary"}>
                          {karyakar.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {formatDate(karyakar.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Title</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Priority</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Assigned To</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Assigned By</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Due Date</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-gray-600">{task.description}</div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {task.assigned_to_profile?.full_name || 'Unassigned'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {task.assigned_by_profile?.full_name || 'Unknown'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {task.due_date ? formatDate(task.due_date) : 'No due date'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {formatDate(task.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
