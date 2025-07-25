
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { securityLogger, rateLimiter } from '@/utils/securityValidation';
import { useAuth } from '@/components/AuthProvider';

export const useEnhancedAuth = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const enhancedSignIn = async (email: string, password: string) => {
    const rateLimitKey = `login:${email}`;
    
    // Check rate limiting
    if (!rateLimiter.checkRateLimit(rateLimitKey, 5, 300000)) {
      await securityLogger.logFailedLogin(email, 'Rate limit exceeded');
      toast({
        title: 'Too Many Attempts',
        description: 'Please wait before trying again',
        variant: 'destructive',
      });
      return { success: false, error: 'Rate limit exceeded' };
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        await securityLogger.logFailedLogin(email, error.message);
        toast({
          title: 'Login Failed',
          description: error.message,
          variant: 'destructive',
        });
        return { success: false, error: error.message };
      }

      // Log successful login
      await securityLogger.logSecurityEvent('successful_login', {
        user_id: data.user?.id,
        email: data.user?.email
      });

      return { success: true, user: data.user };
    } catch (error: any) {
      await securityLogger.logFailedLogin(email, error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const enhancedSignOut = async () => {
    setIsLoading(true);
    
    try {
      await securityLogger.logSecurityEvent('logout', {
        user_id: user?.id
      });
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: 'Logout Failed',
          description: error.message,
          variant: 'destructive',
        });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const validateRoleChange = async (targetUserId: string, newRole: string) => {
    if (!user) {
      await securityLogger.logUnauthorizedAccess('user_management', 'role_change');
      return { authorized: false, error: 'User not authenticated' };
    }

    try {
      // Get current user's profile and role
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!currentUserProfile) {
        await securityLogger.logUnauthorizedAccess('user_management', 'role_change');
        return { authorized: false, error: 'User profile not found' };
      }

      // Super admin can change any role
      if (currentUserProfile.role === 'super_admin') {
        return { authorized: true };
      }

      // Get role hierarchy levels for validation
      const { data: currentRoleHierarchy } = await supabase
        .from('role_hierarchy')
        .select('level')
        .eq('role', currentUserProfile.role)
        .single();

      const { data: targetRoleHierarchy } = await supabase
        .from('role_hierarchy')
        .select('level')
        .eq('role', newRole)
        .single();

      if (!currentRoleHierarchy || !targetRoleHierarchy) {
        await securityLogger.logUnauthorizedAccess('user_management', 'role_change');
        return { authorized: false, error: 'Role hierarchy not found' };
      }

      // User can only assign roles with higher level (lower hierarchy)
      if (currentRoleHierarchy.level >= targetRoleHierarchy.level) {
        await securityLogger.logUnauthorizedAccess('user_management', 'role_change');
        return { authorized: false, error: 'Insufficient permissions' };
      }

      return { authorized: true };
    } catch (error: any) {
      await securityLogger.logUnauthorizedAccess('user_management', 'role_change');
      return { authorized: false, error: error.message };
    }
  };

  return {
    enhancedSignIn,
    enhancedSignOut,
    validateRoleChange,
    isLoading
  };
};
