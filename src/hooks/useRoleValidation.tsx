
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { securityLogger } from '@/utils/securityValidation';

export const useRoleValidation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const validateRoleAssignment = async (targetRole: string): Promise<boolean> => {
    if (!user) {
      await securityLogger.logUnauthorizedAccess('user_management', 'role_assignment');
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setLoading(true);
      
      // Use the enhanced security function
      const { data, error } = await supabase
        .rpc('validate_role_assignment', {
          _assigner_id: user.id,
          _target_role: targetRole
        });

      if (error) {
        console.error('Role validation error:', error);
        await securityLogger.logUnauthorizedAccess('user_management', 'role_assignment');
        toast({
          title: 'Error',
          description: 'Failed to validate role assignment',
          variant: 'destructive',
        });
        return false;
      }

      if (!data) {
        await securityLogger.logUnauthorizedAccess('user_management', 'role_assignment');
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to assign this role',
          variant: 'destructive',
        });
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('Role validation error:', error);
      await securityLogger.logUnauthorizedAccess('user_management', 'role_assignment');
      toast({
        title: 'Error',
        description: 'Failed to validate role assignment',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getAssignableRoles = async (): Promise<string[]> => {
    if (!user) return [];

    try {
      // Get current user's role hierarchy level
      const { data: userHierarchy, error: hierarchyError } = await supabase
        .rpc('get_user_hierarchy_level', { _user_id: user.id });

      if (hierarchyError) {
        console.error('Error getting user hierarchy:', hierarchyError);
        return [];
      }

      // Get roles with lower hierarchy levels
      const { data: roles, error: rolesError } = await supabase
        .from('role_hierarchy')
        .select('role')
        .gt('level', userHierarchy || 99);

      if (rolesError) {
        console.error('Error getting assignable roles:', rolesError);
        return [];
      }

      return roles.map(r => r.role);
    } catch (error) {
      console.error('Error getting assignable roles:', error);
      return [];
    }
  };

  const logRoleChange = async (targetUserId: string, oldRole: string, newRole: string, reason?: string) => {
    await securityLogger.logRoleChange(targetUserId, oldRole, newRole, reason);
  };

  return {
    validateRoleAssignment,
    getAssignableRoles,
    logRoleChange,
    loading
  };
};
