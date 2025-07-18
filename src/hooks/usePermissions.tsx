
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
      // First, get user-specific permissions
      const { data: userPermissions, error: userError } = await supabase
        .from('module_permissions')
        .select('module_name, can_view, can_add, can_edit, can_delete, can_export')
        .eq('user_id', user.id);

      if (userError) throw userError;

      // Then, get role-based permissions
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const { data: rolePermissions, error: roleError } = await supabase
        .from('role_permissions')
        .select('module_name, can_view, can_add, can_edit, can_delete, can_export')
        .eq('role', userProfile?.role);

      if (roleError) throw roleError;

      // Combine permissions (user permissions override role permissions)
      const permissionsMap: Record<string, Record<string, boolean>> = {};

      // First apply role permissions
      rolePermissions?.forEach((perm) => {
        permissionsMap[perm.module_name] = {
          view: perm.can_view,
          add: perm.can_add,
          edit: perm.can_edit,
          delete: perm.can_delete,
          export: perm.can_export,
        };
      });

      // Then override with user-specific permissions
      userPermissions?.forEach((perm) => {
        permissionsMap[perm.module_name] = {
          view: perm.can_view,
          add: perm.can_add,
          edit: perm.can_edit,
          delete: perm.can_delete,
          export: perm.can_export,
        };
      });

      // Super admin has all permissions
      if (userProfile?.role === 'super_admin') {
        const modules = ['karyakars', 'tasks', 'communication', 'reports', 'admin'];
        modules.forEach(module => {
          permissionsMap[module] = {
            view: true,
            add: true,
            edit: true,
            delete: true,
            export: true,
          };
        });
      }

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

  const refreshPermissions = () => {
    if (user) {
      fetchPermissions();
    }
  };

  return { permissions, hasPermission, loading, refreshPermissions };
};
