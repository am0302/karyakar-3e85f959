
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { usePermissions } from "@/hooks/usePermissions";
import { Users, Calendar, MessageSquare, FileText, Settings, Home, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [stats, setStats] = useState({
    totalKaryakars: 0,
    activeTasks: 0,
    unreadMessages: 0,
    reportsCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch total karyakars
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_active', true);

      if (profilesError) throw profilesError;

      // Fetch active tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id')
        .eq('status', 'pending');

      if (tasksError) throw tasksError;

      // Fetch unread messages (simplified - you may want to implement a proper read status)
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (messagesError) throw messagesError;

      setStats({
        totalKaryakars: profiles?.length || 0,
        activeTasks: tasks?.length || 0,
        unreadMessages: messages?.length || 0,
        reportsCount: 0 // You can implement this based on your reporting needs
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Home Link */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Home Page
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* User Role Badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Your Role:</span>
        <Badge variant="secondary" className="capitalize">
          {user?.user_metadata?.role || 'User'}
        </Badge>
      </div>

      {/* Quick Stats */}
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
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTasks}</div>
            <p className="text-xs text-muted-foreground">Pending tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unreadMessages}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reportsCount}</div>
            <p className="text-xs text-muted-foreground">Available reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hasPermission('karyakars', 'view') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Karyakars
              </CardTitle>
              <CardDescription>
                Manage karyakar profiles and information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/karyakars">View Karyakars</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {hasPermission('tasks', 'view') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Tasks
              </CardTitle>
              <CardDescription>
                Manage tasks and assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/tasks">View Tasks</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {hasPermission('communication', 'view') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Communication
              </CardTitle>
              <CardDescription>
                Chat and messaging features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/communication">Open Chat</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {hasPermission('reports', 'view') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Reports
              </CardTitle>
              <CardDescription>
                Generate and view reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/reports">View Reports</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {hasPermission('admin', 'view') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Admin Panel
              </CardTitle>
              <CardDescription>
                System administration and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/admin">Open Admin</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
