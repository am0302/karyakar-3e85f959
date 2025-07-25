
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
      
      // Get current user profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userProfile) {
        await securityLogger.logUnauthorizedAccess('user_management', 'role_assignment');
        toast({
          title: 'Error',
          description: 'User profile not found',
          variant: 'destructive',
        });
        return false;
      }

      // Super admin can assign any role
      if (userProfile.role === 'super_admin') {
        return true;
      }

      // Get role hierarchy levels
      const { data: currentRoleHierarchy } = await supabase
        .from('role_hierarchy')
        .select('level')
        .eq('role', userProfile.role)
        .single();

      const { data: targetRoleHierarchy } = await supabase
        .from('role_hierarchy')
        .select('level')
        .eq('role', targetRole)
        .single();

      if (!currentRoleHierarchy || !targetRoleHierarchy) {
        await securityLogger.logUnauthorizedAccess('user_management', 'role_assignment');
        toast({
          title: 'Error',
          description: 'Role hierarchy not found',
          variant: 'destructive',
        });
        return false;
      }

      // User can only assign roles with higher level (lower hierarchy)
      if (currentRoleHierarchy.level >= targetRoleHierarchy.level) {
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
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userProfile) return [];

      const { data: userHierarchy } = await supabase
        .from('role_hierarchy')
        .select('level')
        .eq('role', userProfile.role)
        .single();

      if (!userHierarchy) return [];

      // Get roles with higher hierarchy levels (lower permissions)
      const { data: roles } = await supabase
        .from('role_hierarchy')
        .select('role')
        .gt('level', userHierarchy.level);

      return roles?.map(r => r.role) || [];
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
