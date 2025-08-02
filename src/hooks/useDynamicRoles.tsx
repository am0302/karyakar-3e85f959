
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CustomRole {
  id: string;
  role_name: string;
  display_name: string;
  description?: string;
  is_system_role: boolean;
  is_active: boolean;
  level?: number;
  created_at: string;
  updated_at: string;
}

export const useDynamicRoles = () => {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*')
        .eq('is_active', true)
        .order('level', { nullsLast: true });

      if (error) throw error;
      setRoles(data || []);
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch roles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const getRoleOptions = () => {
    return roles.map(role => ({
      value: role.role_name,
      label: `${role.display_name}${role.level ? ` (Level ${role.level})` : ''}`
    }));
  };

  const getRoleDisplayName = (roleName: string) => {
    const role = roles.find(r => r.role_name === roleName);
    return role?.display_name || roleName;
  };

  const getRoleLevel = (roleName: string) => {
    const role = roles.find(r => r.role_name === roleName);
    return role?.level;
  };

  return {
    roles,
    loading,
    fetchRoles,
    getRoleOptions,
    getRoleDisplayName,
    getRoleLevel
  };
};
