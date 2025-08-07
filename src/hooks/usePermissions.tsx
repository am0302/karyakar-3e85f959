
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
    } else {
      setPermissions({});
      setLoading(false);
    }
  }, [user]);

  const fetchPermissions = async () => {
    if (!user) return;

    try {
      console.log('Fetching permissions for user:', user.id);
      
      // Get user profile and role
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        throw profileError;
      }

      console.log('User profile:', userProfile);

      // Get user-specific permissions
      const { data: userPermissions, error: userError } = await supabase
        .from('user_permissions')
        .select('module, can_view, can_add, can_edit, can_delete, can_export')
        .eq('user_id', user.id);

      if (userError) {
        console.error('Error fetching user permissions:', userError);
        // Don't throw error, just log it and continue with empty array
      }

      // Get role-based permissions
      const { data: rolePermissions, error: roleError } = await supabase
        .from('role_permissions')
        .select('module_name, can_view, can_add, can_edit, can_delete, can_export')
        .eq('role', userProfile?.role);

      if (roleError) {
        console.error('Error fetching role permissions:', roleError);
        // Don't throw error, just log it and continue with empty array
      }

      console.log('User permissions:', userPermissions);
      console.log('Role permissions:', rolePermissions);

      // Combine permissions (user permissions override role permissions)
      const permissionsMap: Record<string, Record<string, boolean>> = {};

      // Default modules
      const modules = ['dashboard', 'karyakars', 'karyakar_additional_details', 'tasks', 'communication', 'reports', 'admin'];

      // Initialize all modules with false permissions
      modules.forEach(module => {
        permissionsMap[module] = {
          view: false,
          add: false,
          edit: false,
          delete: false,
          export: false,
        };
      });

      // Apply role permissions first
      rolePermissions?.forEach((perm) => {
        if (perm.module_name) {
          permissionsMap[perm.module_name] = {
            view: perm.can_view || false,
            add: perm.can_add || false,
            edit: perm.can_edit || false,
            delete: perm.can_delete || false,
            export: perm.can_export || false,
          };
        }
      });

      // Then override with user-specific permissions
      userPermissions?.forEach((perm) => {
        if (perm.module) {
          permissionsMap[perm.module] = {
            view: perm.can_view || false,
            add: perm.can_add || false,
            edit: perm.can_edit || false,
            delete: perm.can_delete || false,
            export: perm.can_export || false,
          };
        }
      });

      // Super admin has all permissions
      if (userProfile?.role === 'super_admin') {
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

      console.log('Final permissions map:', permissionsMap);
      setPermissions(permissionsMap);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      // Set empty permissions on error
      setPermissions({});
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (loading) return false;
    
    const modulePermissions = permissions[module];
    if (!modulePermissions) {
      console.log(`No permissions found for module: ${module}`);
      return false;
    }
    
    const hasAccess = modulePermissions[action] || false;
    console.log(`Permission check - Module: ${module}, Action: ${action}, Access: ${hasAccess}`);
    return hasAccess;
  };

  const refreshPermissions = () => {
    if (user) {
      fetchPermissions();
    }
  };

  return { permissions, hasPermission, loading, refreshPermissions };
};
