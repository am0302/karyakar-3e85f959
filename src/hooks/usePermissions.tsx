
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPermissions();
    }
  }, [user]);

  const fetchPermissions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('module_permissions')
        .select('module_name, can_view, can_add, can_edit, can_delete, can_export')
        .eq('user_id', user.id);

      if (error) throw error;

      const permissionsMap: Record<string, Record<string, boolean>> = {};
      data?.forEach((perm) => {
        permissionsMap[perm.module_name] = {
          view: perm.can_view,
          add: perm.can_add,
          edit: perm.can_edit,
          delete: perm.can_delete,
          export: perm.can_export,
        };
      });

      setPermissions(permissionsMap);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (module: string, action: string): boolean => {
    return permissions[module]?.[action] || false;
  };

  return { permissions, hasPermission, loading };
};
