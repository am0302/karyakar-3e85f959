
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
  type: string;
  status: string;
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
        .order('role_name');

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
    return roles
      .filter(role => {
        // Ultra-strict filtering to prevent empty values
        if (!role || typeof role !== 'object') return false;
        
        if (!role.role_name || typeof role.role_name !== 'string' || role.role_name.trim() === '') {
          console.warn('useDynamicRoles: Filtering out role with invalid role_name:', role);
          return false;
        }
        
        if (!role.display_name || typeof role.display_name !== 'string' || role.display_name.trim() === '') {
          console.warn('useDynamicRoles: Filtering out role with invalid display_name:', role);
          return false;
        }
        
        return true;
      })
      .map(role => ({
        value: role.role_name.trim(),
        label: (role.display_name || role.role_name).trim()
      }))
      .filter(option => option.value.length > 0 && option.label.length > 0);
  };

  const getRoleDisplayName = (roleName: string) => {
    if (!roleName || typeof roleName !== 'string' || roleName.trim() === '') {
      return 'Unknown Role';
    }
    
    const role = roles.find(r => r.role_name === roleName.trim());
    return role?.display_name || roleName;
  };

  return {
    roles,
    loading,
    fetchRoles,
    getRoleOptions,
    getRoleDisplayName
  };
};
