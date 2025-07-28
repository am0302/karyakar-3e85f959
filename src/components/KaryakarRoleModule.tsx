
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDynamicRoles } from '@/hooks/useDynamicRoles';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface KaryakarRoleModuleProps {
  profileId: string;
  onSave?: () => void;
  onCancel?: () => void;
}

export const KaryakarRoleModule = ({ profileId, onSave, onCancel }: KaryakarRoleModuleProps) => {
  const { toast } = useToast();
  const { getRoleOptions } = useDynamicRoles();
  
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [professions, setProfessions] = useState<Array<{ id: string; name: string }>>([]);
  const [sevaTypes, setSevaTypes] = useState<Array<{ id: string; name: string }>>([]);
  
  const [formData, setFormData] = useState({
    profession_id: '',
    seva_type_id: '',
    role: 'sevak'
  });

  useEffect(() => {
    fetchProfile();
    fetchMasterData();
  }, [profileId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setFormData({
        profession_id: data.profession_id || '',
        seva_type_id: data.seva_type_id || '',
        role: data.role || 'sevak'
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch profile data',
        variant: 'destructive',
      });
    }
  };

  const fetchMasterData = async () => {
    try {
      const [professionsRes, sevaTypesRes] = await Promise.all([
        supabase.from('professions').select('id, name').eq('is_active', true).order('name'),
        supabase.from('seva_types').select('id, name').eq('is_active', true).order('name')
      ]);

      setProfessions(professionsRes.data || []);
      setSevaTypes(sevaTypesRes.data || []);
    } catch (error: any) {
      console.error('Error fetching master data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          profession_id: formData.profession_id || null,
          seva_type_id: formData.seva_type_id || null,
          role: formData.role as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Karyakar role updated successfully',
      });

      if (onSave) onSave();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: `Failed to update profile: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Information</CardTitle>
          <CardDescription>Select profession and seva type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Profession</Label>
              <SearchableSelect
                options={professions.map(p => ({ value: p.id, label: p.name }))}
                value={formData.profession_id}
                onValueChange={(value) => handleInputChange('profession_id', value)}
                placeholder="Select Profession"
              />
            </div>
            
            <div>
              <Label>Seva Type</Label>
              <SearchableSelect
                options={sevaTypes.map(s => ({ value: s.id, label: s.name }))}
                value={formData.seva_type_id}
                onValueChange={(value) => handleInputChange('seva_type_id', value)}
                placeholder="Select Seva Type"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Information */}
      <Card>
        <CardHeader>
          <CardTitle>Role Information</CardTitle>
          <CardDescription>Assign role to the karyakar</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Role</Label>
            <SearchableSelect
              options={getRoleOptions()}
              value={formData.role}
              onValueChange={(value) => handleInputChange('role', value)}
              placeholder="Select Role"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Role'}
        </Button>
      </div>
    </form>
  );
};
