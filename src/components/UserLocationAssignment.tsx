
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Save, RefreshCw, MapPin, Users } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
}

interface LocationOption {
  id: string;
  name: string;
}

interface UserLocationAssignment {
  id: string;
  user_id: string;
  assigned_by: string;
  mandir_ids: string[];
  kshetra_ids: string[];
  village_ids: string[];
  mandal_ids: string[];
  profiles?: { full_name: string; role: UserRole };
}

export const UserLocationAssignment = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [assignments, setAssignments] = useState<UserLocationAssignment[]>([]);
  const [mandirs, setMandirs] = useState<LocationOption[]>([]);
  const [kshetras, setKshetras] = useState<LocationOption[]>([]);
  const [villages, setVillages] = useState<LocationOption[]>([]);
  const [mandals, setMandals] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  // Form states
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedMandirs, setSelectedMandirs] = useState<string[]>([]);
  const [selectedKshetras, setSelectedKshetras] = useState<string[]>([]);
  const [selectedVillages, setSelectedVillages] = useState<string[]>([]);
  const [selectedMandals, setSelectedMandals] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchCurrentUser(),
        fetchProfiles(),
        fetchLocations(),
        fetchAssignments()
      ]);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch data: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setCurrentUser(profile);
      }
    }
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('is_active', true)
      .order('full_name');

    if (error) throw error;
    setProfiles(data || []);
  };

  const fetchLocations = async () => {
    const [mandirData, kshetraData, villageData, mandalData] = await Promise.all([
      supabase.from('mandirs').select('id, name').eq('is_active', true).order('name'),
      supabase.from('kshetras').select('id, name').eq('is_active', true).order('name'),
      supabase.from('villages').select('id, name').eq('is_active', true).order('name'),
      supabase.from('mandals').select('id, name').eq('is_active', true).order('name')
    ]);

    setMandirs(mandirData.data || []);
    setKshetras(kshetraData.data || []);
    setVillages(villageData.data || []);
    setMandals(mandalData.data || []);
  };

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from('user_location_assignments')
      .select(`
        *,
        profiles!user_location_assignments_user_id_fkey(full_name, role)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assignments:', error);
      setAssignments([]);
      return;
    }
    
    setAssignments(data || []);
  };

  const saveAssignment = async () => {
    if (!selectedUser || selectedUser === 'placeholder') {
      toast({
        title: 'Error',
        description: 'Please select a user',
        variant: 'destructive',
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'Unable to identify current user',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      const { data: existing, error: checkError } = await supabase
        .from('user_location_assignments')
        .select('id')
        .eq('user_id', selectedUser)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      const assignmentData = {
        user_id: selectedUser,
        assigned_by: currentUser.id,
        mandir_ids: selectedMandirs,
        kshetra_ids: selectedKshetras,
        village_ids: selectedVillages,
        mandal_ids: selectedMandals,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        const { error } = await supabase
          .from('user_location_assignments')
          .update(assignmentData)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_location_assignments')
          .insert(assignmentData);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Location assignment saved successfully',
      });

      // Reset form
      setSelectedUser('');
      setSelectedMandirs([]);
      setSelectedKshetras([]);
      setSelectedVillages([]);
      setSelectedMandals([]);

      await fetchAssignments();
    } catch (error: any) {
      console.error('Error saving assignment:', error);
      toast({
        title: 'Error',
        description: `Failed to save assignment: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUserChange = (value: string) => {
    setSelectedUser(value === 'placeholder' ? '' : value);
  };

  const getLocationNames = (ids: string[], locations: LocationOption[]) => {
    return ids.map(id => locations.find(loc => loc.id === id)?.name || 'Unknown').join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading location data...
        </div>
      </div>
    );
  }

  const userOptions = [
    { value: 'placeholder', label: 'Select User' },
    ...profiles.map(p => ({ 
      value: p.id, 
      label: `${p.full_name} (${p.role.replace('_', ' ')})` 
    }))
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Location Assignment</h2>
          <p className="text-gray-600">Assign multiple locations to users based on hierarchy</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Assignment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Assign Locations to User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select User</Label>
            <SearchableSelect
              options={userOptions}
              value={selectedUser || 'placeholder'}
              onValueChange={handleUserChange}
              placeholder="Select User"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mandirs</Label>
              <SearchableSelect
                options={mandirs.map(m => ({ value: m.id, label: m.name }))}
                value={selectedMandirs.join(',')}
                onValueChange={(value) => setSelectedMandirs(value ? value.split(',') : [])}
                placeholder="Select Mandirs"
                multiple
              />
            </div>
            <div className="space-y-2">
              <Label>Kshetras</Label>
              <SearchableSelect
                options={kshetras.map(k => ({ value: k.id, label: k.name }))}
                value={selectedKshetras.join(',')}
                onValueChange={(value) => setSelectedKshetras(value ? value.split(',') : [])}
                placeholder="Select Kshetras"
                multiple
              />
            </div>
            <div className="space-y-2">
              <Label>Villages</Label>
              <SearchableSelect
                options={villages.map(v => ({ value: v.id, label: v.name }))}
                value={selectedVillages.join(',')}
                onValueChange={(value) => setSelectedVillages(value ? value.split(',') : [])}
                placeholder="Select Villages"
                multiple
              />
            </div>
            <div className="space-y-2">
              <Label>Mandals</Label>
              <SearchableSelect
                options={mandals.map(m => ({ value: m.id, label: m.name }))}
                value={selectedMandals.join(',')}
                onValueChange={(value) => setSelectedMandals(value ? value.split(',') : [])}
                placeholder="Select Mandals"
                multiple
              />
            </div>
          </div>

          <Button onClick={saveAssignment} className="w-full" disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Location Assignment
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Location Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No location assignments configured</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="border rounded-lg p-4">
                  <div className="mb-3">
                    <h4 className="font-medium">
                      {assignment.profiles?.full_name || 'Unknown User'}
                    </h4>
                    <p className="text-sm text-gray-600 capitalize">
                      Role: {assignment.profiles?.role?.replace('_', ' ') || 'Unknown'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {assignment.mandir_ids.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Mandirs: </span>
                        <Badge variant="outline" className="ml-1">
                          {getLocationNames(assignment.mandir_ids, mandirs)}
                        </Badge>
                      </div>
                    )}
                    {assignment.kshetra_ids.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Kshetras: </span>
                        <Badge variant="outline" className="ml-1">
                          {getLocationNames(assignment.kshetra_ids, kshetras)}
                        </Badge>
                      </div>
                    )}
                    {assignment.village_ids.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Villages: </span>
                        <Badge variant="outline" className="ml-1">
                          {getLocationNames(assignment.village_ids, villages)}
                        </Badge>
                      </div>
                    )}
                    {assignment.mandal_ids.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Mandals: </span>
                        <Badge variant="outline" className="ml-1">
                          {getLocationNames(assignment.mandal_ids, mandals)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
