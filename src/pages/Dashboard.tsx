import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Users,
  CheckSquare,
  MessageSquare,
  Calendar,
  TrendingUp,
  AlertCircle,
  Activity,
  Building
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { KaryakarForm } from '@/components/KaryakarForm';

type DashboardStats = {
  totalKaryakars: number;
  activeKaryakars: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalMandirs: number;
  totalVillages: number;
  recentTasks: any[];
  tasksByPriority: any[];
  karyakarsByRole: any[];
};

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [showKaryakarForm, setShowKaryakarForm] = useState(false);
  const [userRole, setUserRole] = useState('');
  
  const [stats, setStats] = useState<DashboardStats>({
    totalKaryakars: 0,
    activeKaryakars: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalMandirs: 0,
    totalVillages: 0,
    recentTasks: [],
    tasksByPriority: [],
    karyakarsByRole: []
  });
  const [loading, setLoading] = useState(true);

  const [mandirs, setMandirs] = useState<Array<{ id: string; name: string }>>([]);
  const [kshetras, setKshetras] = useState<Array<{ id: string; name: string }>>([]);
  const [villages, setVillages] = useState<Array<{ id: string; name: string }>>([]);
  const [mandals, setMandals] = useState<Array<{ id: string; name: string }>>([]);
  const [professions, setProfessions] = useState<Array<{ id: string; name: string }>>([]);
  const [sevaTypes, setSevaTypes] = useState<Array<{ id: string; name: string }>>([]);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    whatsapp_number: '',
    is_whatsapp_same_as_mobile: false,
    date_of_birth: '',
    age: '',
    profession_id: '',
    mandir_id: '',
    kshetra_id: '',
    village_id: '',
    mandal_id: '',
    seva_type_id: '',
    role: 'sevak' as const,
    profile_photo_url: ''
  });

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
      fetchUserRole();
      fetchMasterData();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      // Fetch basic counts
      const [
        karyakarsRes,
        tasksRes,
        mandirsRes,
        villagesRes,
        recentTasksRes
      ] = await Promise.all([
        supabase.from('profiles').select('id, is_active, role'),
        supabase.from('tasks').select('id, status, priority'),
        supabase.from('mandirs').select('id'),
        supabase.from('villages').select('id'),
        supabase.from('tasks').select(`
          id, title, status, priority, due_date, created_at,
          profiles!tasks_assigned_to_fkey(full_name)
        `).order('created_at', { ascending: false }).limit(5)
      ]);

      const karyakars = karyakarsRes.data || [];
      const tasks = tasksRes.data || [];
      const mandirs = mandirsRes.data || [];
      const villages = villagesRes.data || [];
      const recentTasks = recentTasksRes.data || [];

      // Calculate stats
      const totalKaryakars = karyakars.length;
      const activeKaryakars = karyakars.filter(k => k.is_active).length;
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const pendingTasks = tasks.filter(t => t.status === 'pending').length;

      // Tasks by priority
      const tasksByPriority = [
        { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: '#22c55e' },
        { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: '#f59e0b' },
        { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: '#ef4444' },
        { name: 'Urgent', value: tasks.filter(t => t.priority === 'urgent').length, color: '#dc2626' }
      ];

      // Karyakars by role
      const roleCount = karyakars.reduce((acc: any, k) => {
        acc[k.role] = (acc[k.role] || 0) + 1;
        return acc;
      }, {});

      const karyakarsByRole = Object.entries(roleCount).map(([role, count]) => ({
        name: role.replace('_', ' ').toUpperCase(),
        value: count
      }));

      setStats({
        totalKaryakars,
        activeKaryakars,
        totalTasks,
        completedTasks,
        pendingTasks,
        totalMandirs: mandirs.length,
        totalVillages: villages.length,
        recentTasks,
        tasksByPriority,
        karyakarsByRole
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      setUserRole(data?.role || '');
    } catch (error: any) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [mandirsRes, kshetrasRes, villagesRes, mandalsRes, professionsRes, sevaTypesRes] = await Promise.all([
        supabase.from('mandirs').select('id, name').eq('is_active', true).order('name'),
        supabase.from('kshetras').select('id, name').eq('is_active', true).order('name'),
        supabase.from('villages').select('id, name').eq('is_active', true).order('name'),
        supabase.from('mandals').select('id, name').eq('is_active', true).order('name'),
        supabase.from('professions').select('id, name').eq('is_active', true).order('name'),
        supabase.from('seva_types').select('id, name').eq('is_active', true).order('name')
      ]);

      setMandirs(mandirsRes.data || []);
      setKshetras(kshetrasRes.data || []);
      setVillages(villagesRes.data || []);
      setMandals(mandalsRes.data || []);
      setProfessions(professionsRes.data || []);
      setSevaTypes(sevaTypesRes.data || []);
    } catch (error: any) {
      console.error('Error fetching master data:', error);
    }
  };

  const handleKaryakarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const age = formData.age ? parseInt(formData.age) : null;
      const dataToSubmit = {
        full_name: formData.full_name,
        email: formData.email || null,
        mobile_number: formData.mobile_number,
        whatsapp_number: formData.is_whatsapp_same_as_mobile ? formData.mobile_number : formData.whatsapp_number,
        is_whatsapp_same_as_mobile: formData.is_whatsapp_same_as_mobile,
        date_of_birth: formData.date_of_birth || null,
        age,
        profession_id: formData.profession_id || null,
        mandir_id: formData.mandir_id || null,
        kshetra_id: formData.kshetra_id || null,
        village_id: formData.village_id || null,
        mandal_id: formData.mandal_id || null,
        seva_type_id: formData.seva_type_id || null,
        role: formData.role,
        profile_photo_url: formData.profile_photo_url || null,
        id: crypto.randomUUID(),
      };

      const { error } = await supabase
        .from('profiles')
        .insert([dataToSubmit]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Karyakar registered successfully',
      });

      setShowKaryakarForm(false);
      setFormData({
        full_name: '',
        email: '',
        mobile_number: '',
        whatsapp_number: '',
        is_whatsapp_same_as_mobile: false,
        date_of_birth: '',
        age: '',
        profession_id: '',
        mandir_id: '',
        kshetra_id: '',
        village_id: '',
        mandal_id: '',
        seva_type_id: '',
        role: 'sevak',
        profile_photo_url: ''
      });
      fetchDashboardStats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
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
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to Seva Sarthi Connect</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Karyakars</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalKaryakars}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeKaryakars} active members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTasks} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mandirs</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMandirs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalVillages} villages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Priority</CardTitle>
            <CardDescription>Distribution of tasks by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.tasksByPriority}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {stats.tasksByPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Karyakars by Role</CardTitle>
            <CardDescription>Distribution of community members by role</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.karyakarsByRole}>
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

      {/* Recent Tasks and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>Latest tasks in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentTasks.length > 0 ? stats.recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-gray-500">
                        Assigned to: {task.profiles?.full_name || 'Unassigned'}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(task.status)}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              )) : (
                <p className="text-gray-500 text-center py-4">No tasks available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Completion Progress</CardTitle>
            <CardDescription>Overall task completion rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Completed Tasks</span>
                  <span className="text-sm text-gray-500">
                    {stats.completedTasks} / {stats.totalTasks}
                  </span>
                </div>
                <Progress 
                  value={stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0} 
                  className="h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Active Members</span>
                  <span className="text-sm text-gray-500">
                    {stats.activeKaryakars} / {stats.totalKaryakars}
                  </span>
                </div>
                <Progress 
                  value={stats.totalKaryakars > 0 ? (stats.activeKaryakars / stats.totalKaryakars) * 100 : 0} 
                  className="h-2"
                />
              </div>

              <div className="pt-4">
                <h4 className="font-medium mb-2">Quick Stats</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Completion Rate:</span>
                    <span className="font-medium">
                      {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Rate:</span>
                    <span className="font-medium">
                      {stats.totalKaryakars > 0 ? Math.round((stats.activeKaryakars / stats.totalKaryakars) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            {userRole === 'super_admin' && (
              <Button 
                className="bg-orange-500 hover:bg-orange-600"
                onClick={() => setShowKaryakarForm(true)}
              >
                <Users className="w-4 h-4 mr-2" />
                Register Karyakar
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => navigate('/tasks')}
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Create Task
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/communication')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Start Chat
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/reports')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              View Reports
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Karyakar Registration Dialog */}
      <Dialog open={showKaryakarForm} onOpenChange={setShowKaryakarForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Karyakar</DialogTitle>
            <DialogDescription>
              Fill in the details to register a new karyakar
            </DialogDescription>
          </DialogHeader>

          <KaryakarForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleKaryakarSubmit}
            onCancel={() => setShowKaryakarForm(false)}
            editingKaryakar={null}
            mandirs={mandirs}
            kshetras={kshetras}
            villages={villages}
            mandals={mandals}
            professions={professions}
            sevaTypes={sevaTypes}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
