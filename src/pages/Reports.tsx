import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  ListChecks, 
  MapPin, 
  TrendingUp, 
  Calendar,
  User,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { usePermissions } from '@/hooks/usePermissions';

interface Profile {
  id: string;
  full_name: string;
  mobile_number: string;
  whatsapp_number?: string;
  email?: string;
  role: string;
  age?: number;
  date_of_birth?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  mandir_id?: string;
  kshetra_id?: string;
  village_id?: string;
  mandal_id?: string;
  profession_id?: string;
  seva_type_id?: string;
  profile_photo_url?: string;
  is_whatsapp_same_as_mobile?: boolean;
  professions?: {
    name: string;
  } | null;
  seva_types?: {
    name: string;
  } | null;
  mandirs?: {
    name: string;
  } | null;
  kshetras?: {
    name: string;
  } | null;
  villages?: {
    name: string;
  } | null;
  mandals?: {
    name: string;
  } | null;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  assigned_to_profile?: {
    full_name: string;
  } | null;
  assigned_by_profile?: {
    full_name: string;
  } | null;
}

const Reports = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [karyakars, setKaryakars] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const canView = hasPermission('reports', 'view');

  useEffect(() => {
    if (canView) {
      fetchData();
    }
  }, [canView]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch karyakars
      const { data: karyakarsData, error: karyakarsError } = await supabase
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
        .eq('is_active', true);

      if (karyakarsError) throw karyakarsError;
      
      // Filter out profiles with query errors and transform data
      const validProfiles = karyakarsData?.filter(profile => {
        return (!profile.professions || (profile.professions && typeof profile.professions === 'object' && !('error' in profile.professions))) &&
               (!profile.seva_types || (profile.seva_types && typeof profile.seva_types === 'object' && !('error' in profile.seva_types))) &&
               (!profile.mandirs || (profile.mandirs && typeof profile.mandirs === 'object' && !('error' in profile.mandirs))) &&
               (!profile.kshetras || (profile.kshetras && typeof profile.kshetras === 'object' && !('error' in profile.kshetras))) &&
               (!profile.villages || (profile.villages && typeof profile.villages === 'object' && !('error' in profile.villages))) &&
               (!profile.mandals || (profile.mandals && typeof profile.mandals === 'object' && !('error' in profile.mandals)));
      }).map(profile => ({
        ...profile,
        professions: profile.professions && typeof profile.professions === 'object' && 'name' in profile.professions
          ? { name: (profile.professions as any).name }
          : null,
        seva_types: profile.seva_types && typeof profile.seva_types === 'object' && 'name' in profile.seva_types
          ? { name: (profile.seva_types as any).name }
          : null,
        mandirs: profile.mandirs && typeof profile.mandirs === 'object' && 'name' in profile.mandirs
          ? { name: (profile.mandirs as any).name }
          : null,
        kshetras: profile.kshetras && typeof profile.kshetras === 'object' && 'name' in profile.kshetras
          ? { name: (profile.kshetras as any).name }
          : null,
        villages: profile.villages && typeof profile.villages === 'object' && 'name' in profile.villages
          ? { name: (profile.villages as any).name }
          : null,
        mandals: profile.mandals && typeof profile.mandals === 'object' && 'name' in profile.mandals
          ? { name: (profile.mandals as any).name }
          : null
      })) || [];
      
      setKaryakars(validProfiles);

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name),
          assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      
      // Filter out tasks with query errors and transform data
      const validTasks = tasksData?.filter(task => {
        const hasValidAssignedTo = !task.assigned_to_profile || 
          (task.assigned_to_profile && typeof task.assigned_to_profile === 'object' && 
           !('error' in task.assigned_to_profile) &&
           'full_name' in task.assigned_to_profile);
        
        const hasValidAssignedBy = !task.assigned_by_profile || 
          (task.assigned_by_profile && typeof task.assigned_by_profile === 'object' && 
           !('error' in task.assigned_by_profile) &&
           'full_name' in task.assigned_by_profile);
        
        return hasValidAssignedTo && hasValidAssignedBy;
      }).map(task => ({
        ...task,
        assigned_to_profile: task.assigned_to_profile && typeof task.assigned_to_profile === 'object' && 'full_name' in task.assigned_to_profile
          ? { full_name: (task.assigned_to_profile as any).full_name || 'Unknown User' }
          : null,
        assigned_by_profile: task.assigned_by_profile && typeof task.assigned_by_profile === 'object' && 'full_name' in task.assigned_by_profile
          ? { full_name: (task.assigned_by_profile as any).full_name || 'Unknown User' }
          : null
      })) || [];
      
      setTasks(validTasks);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading reports...</div>;
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You do not have permission to view reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Overview of your organization</p>
        </div>
      </div>

      {/* Karyakars Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Karyakars
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-gray-500" />
              <div>
                <h3 className="text-lg font-semibold">{karyakars.length}</h3>
                <p className="text-sm text-gray-500">Total Karyakars</p>
              </div>
            </div>
            
            {karyakars.length > 0 && karyakars[0].mandir_id && (
              <div className="flex items-center gap-3">
                <MapPin className="h-8 w-8 text-gray-500" />
                <div>
                  <h3 className="text-lg font-semibold">{[...new Set(karyakars.map(k => k.mandir_id))].length}</h3>
                  <p className="text-sm text-gray-500">Total Mandirs</p>
                </div>
              </div>
            )}
            
            {karyakars.length > 0 && karyakars[0].kshetra_id && (
              <div className="flex items-center gap-3">
                <MapPin className="h-8 w-8 text-gray-500" />
                <div>
                  <h3 className="text-lg font-semibold">{[...new Set(karyakars.map(k => k.kshetra_id))].length}</h3>
                  <p className="text-sm text-gray-500">Total Kshetras</p>
                </div>
              </div>
            )}
            
            {karyakars.length > 0 && karyakars[0].village_id && (
              <div className="flex items-center gap-3">
                <MapPin className="h-8 w-8 text-gray-500" />
                <div>
                  <h3 className="text-lg font-semibold">{[...new Set(karyakars.map(k => k.village_id))].length}</h3>
                  <p className="text-sm text-gray-500">Total Villages</p>
                </div>
              </div>
            )}
            
            {karyakars.length > 0 && karyakars[0].mandal_id && (
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-gray-500" />
                <div>
                  <h3 className="text-lg font-semibold">{[...new Set(karyakars.map(k => k.mandal_id))].length}</h3>
                  <p className="text-sm text-gray-500">Total Mandals</p>
                </div>
              </div>
            )}
            
            {karyakars.length > 0 && karyakars[0].profession_id && (
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-gray-500" />
                <div>
                  <h3 className="text-lg font-semibold">{[...new Set(karyakars.map(k => k.profession_id))].length}</h3>
                  <p className="text-sm text-gray-500">Total Professions</p>
                </div>
              </div>
            )}
            
            {karyakars.length > 0 && karyakars[0].seva_type_id && (
              <div className="flex items-center gap-3">
                <ListChecks className="h-8 w-8 text-gray-500" />
                <div>
                  <h3 className="text-lg font-semibold">{[...new Set(karyakars.map(k => k.seva_type_id))].length}</h3>
                  <p className="text-sm text-gray-500">Total Seva Types</p>
                </div>
              </div>
            )}
          </div>
          
          {karyakars.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h4 className="text-md font-semibold mb-2">Sample Karyakars</h4>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {karyakars.slice(0, 5).map(profile => (
                  <li key={profile.id}>
                    {profile.full_name} - {profile.professions?.name || 'N/A'} - {profile.seva_types?.name || 'N/A'} - {profile.mandirs?.name || 'N/A'} - {profile.kshetras?.name || 'N/A'} - {profile.villages?.name || 'N/A'} - {profile.mandals?.name || 'N/A'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <ListChecks className="h-8 w-8 text-gray-500" />
              <div>
                <h3 className="text-lg font-semibold">{tasks.length}</h3>
                <p className="text-sm text-gray-500">Total Tasks</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-gray-500" />
              <div>
                <h3 className="text-lg font-semibold">{tasks.filter(task => task.due_date).length}</h3>
                <p className="text-sm text-gray-500">Tasks with Due Date</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-gray-500" />
              <div>
                <h3 className="text-lg font-semibold">{tasks.filter(task => task.status === 'completed').length}</h3>
                <p className="text-sm text-gray-500">Completed Tasks</p>
              </div>
            </div>
          </div>
          
          {tasks.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h4 className="text-md font-semibold mb-2">Sample Tasks</h4>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {tasks.slice(0, 5).map(task => (
                  <li key={task.id}>
                    {task.title} - Assigned to: {task.assigned_to_profile?.full_name || 'N/A'} - Assigned by: {task.assigned_by_profile?.full_name || 'N/A'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
