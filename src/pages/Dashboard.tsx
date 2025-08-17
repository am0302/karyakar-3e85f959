
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";  
import { supabase } from "@/integrations/supabase/client";
import { Users, CheckSquare, Calendar, TrendingUp, Building, MapPin, TreePine, Home, UserCheck, Briefcase } from "lucide-react";
import { TaskStatusChart } from "@/components/TaskStatusChart";

interface DashboardStats {
  totalKaryakars: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalMandirs: number;
  totalKshetras: number;
  totalVillages: number;
  totalMandals: number;
}

interface RecentTask {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string | null;
  assigned_to_name?: string;
  assigned_by_name?: string;
}

interface RoleStats {
  role: string;
  display_name: string;
  count: number;
}

interface SevaTypeStats {
  seva_type: string;
  count: number;
}

interface ProfessionStats {
  profession: string;
  count: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalKaryakars: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalMandirs: 0,
    totalKshetras: 0,
    totalVillages: 0,
    totalMandals: 0,
  });
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [roleStats, setRoleStats] = useState<RoleStats[]>([]);
  const [sevaTypeStats, setSevaTypeStats] = useState<SevaTypeStats[]>([]);
  const [professionStats, setProfessionStats] = useState<ProfessionStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch total karyakars count
      const { count: karyakarsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch location counts
      const { count: mandirsCount } = await supabase
        .from('mandirs')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: kshetrasCount } = await supabase
        .from('kshetras')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: villagesCount } = await supabase
        .from('villages')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: mandalsCount } = await supabase
        .from('mandals')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch tasks data
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          due_date,
          assigned_to,
          assigned_by,
          created_at,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name),
          assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name)
        `)
        .or(`assigned_to.eq.${user.id},assigned_by.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
      }

      // Fetch role-wise user stats
      const { data: roleData, error: roleError } = await supabase
        .from('profiles')
        .select('role')
        .eq('is_active', true);

      if (roleError) {
        console.error('Error fetching role stats:', roleError);
      }

      // Fetch custom roles for display names
      const { data: customRoles, error: customRolesError } = await supabase
        .from('custom_roles')
        .select('role_name, display_name')
        .eq('is_active', true);

      if (customRolesError) {
        console.error('Error fetching custom roles:', customRolesError);
      }

      // Fetch seva type stats
      const { data: sevaData, error: sevaError } = await supabase
        .from('profiles')
        .select(`
          seva_types(name)
        `)
        .eq('is_active', true)
        .not('seva_type_id', 'is', null);

      if (sevaError) {
        console.error('Error fetching seva type stats:', sevaError);
      }

      // Fetch profession stats
      const { data: professionData, error: professionError } = await supabase
        .from('profiles')
        .select(`
          professions(name)
        `)
        .eq('is_active', true)
        .not('profession_id', 'is', null);

      if (professionError) {
        console.error('Error fetching profession stats:', professionError);
      }

      // Calculate task stats
      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(task => task.status === 'completed').length || 0;
      const pendingTasks = tasks?.filter(task => task.status === 'pending').length || 0;

      setStats({
        totalKaryakars: karyakarsCount || 0,
        totalTasks,
        completedTasks,
        pendingTasks,
        totalMandirs: mandirsCount || 0,
        totalKshetras: kshetrasCount || 0,
        totalVillages: villagesCount || 0,
        totalMandals: mandalsCount || 0,
      });

      // Process role stats
      if (roleData && customRoles) {
        const roleCounts = roleData.reduce((acc: Record<string, number>, profile) => {
          acc[profile.role] = (acc[profile.role] || 0) + 1;
          return acc;
        }, {});

        const roleStatsData = Object.entries(roleCounts).map(([role, count]) => {
          const customRole = customRoles.find(cr => cr.role_name === role);
          return {
            role,
            display_name: customRole?.display_name || role,
            count: count as number,
          };
        });

        setRoleStats(roleStatsData);
      }

      // Process seva type stats
      if (sevaData) {
        const sevaCounts = sevaData.reduce((acc: Record<string, number>, profile) => {
          if (profile.seva_types?.name) {
            acc[profile.seva_types.name] = (acc[profile.seva_types.name] || 0) + 1;
          }
          return acc;
        }, {});

        const sevaStatsData = Object.entries(sevaCounts).map(([seva_type, count]) => ({
          seva_type,
          count: count as number,
        }));

        setSevaTypeStats(sevaStatsData);
      }

      // Process profession stats
      if (professionData) {
        const professionCounts = professionData.reduce((acc: Record<string, number>, profile) => {
          if (profile.professions?.name) {
            acc[profile.professions.name] = (acc[profile.professions.name] || 0) + 1;
          }
          return acc;
        }, {});

        const professionStatsData = Object.entries(professionCounts).map(([profession, count]) => ({
          profession,
          count: count as number,
        }));

        setProfessionStats(professionStatsData);
      }

      // Format recent tasks
      const formattedTasks: RecentTask[] = tasks?.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        due_date: task.due_date,
        assigned_to_name: task.assigned_to_profile?.full_name,
        assigned_by_name: task.assigned_by_profile?.full_name,
      })) || [];

      setRecentTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to your seva management dashboard</p>
        </div>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your seva management dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Karyakars</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalKaryakars}</div>
            <p className="text-xs text-muted-foreground">Active seva team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mandirs</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMandirs}</div>
            <p className="text-xs text-muted-foreground">Active mandirs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kshetras</CardTitle>
            <TreePine className="h-4 w-4 text-muted-foreground" />
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mandals</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMandals}</div>
            <p className="text-xs text-muted-foreground">Active mandals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">Tasks assigned to/by you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        
        {/* Role-wise Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Role-wise Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {roleStats.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No data available</p>
              ) : (
                roleStats.map((role) => (
                  <div key={role.role} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-medium">{role.display_name}</span>
                    <Badge variant="outline">{role.count}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Seva Type-wise Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Seva Type-wise Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sevaTypeStats.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No data available</p>
              ) : (
                sevaTypeStats.map((seva) => (
                  <div key={seva.seva_type} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-medium">{seva.seva_type}</span>
                    <Badge variant="outline">{seva.count}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profession-wise Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Profession-wise Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {professionStats.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No data available</p>
              ) : (
                professionStats.map((profession) => (
                  <div key={profession.profession} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-medium">{profession.profession}</span>
                    <Badge variant="outline">{profession.count}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Chart */}
        <TaskStatusChart />

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent tasks</p>
              ) : (
                recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      <p className="text-sm text-gray-600">
                        Due: {formatDate(task.due_date)}
                      </p>
                      {task.assigned_to_name && (
                        <p className="text-xs text-gray-500">
                          Assigned to: {task.assigned_to_name}
                        </p>
                      )}
                    </div>
                    <Badge variant={getStatusBadgeVariant(task.status)}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))
              )}
            </div>
            {recentTasks.length > 0 && (
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  View All Tasks
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
