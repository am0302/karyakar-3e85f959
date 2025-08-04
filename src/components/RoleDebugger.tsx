
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface CustomRole {
  role_name: string;
  display_name: string;
  is_active: boolean;
}

const RoleDebugger = () => {
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const fetchRoleData = async () => {
    try {
      setLoading(true);

      // Fetch custom roles
      const { data: roles, error: rolesError } = await supabase
        .from('custom_roles')
        .select('role_name, display_name, is_active')
        .eq('is_active', true)
        .order('level', { nullsFirst: false });

      if (rolesError) throw rolesError;
      setCustomRoles(roles || []);

    } catch (error: any) {
      console.error('Error fetching role data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch role data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const syncRoles = async () => {
    try {
      setSyncing(true);
      
      // Call the existing sync function
      const { error } = await supabase.rpc('sync_custom_roles_with_enum');
      
      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Roles synchronized successfully',
      });

      // Refresh the data
      await fetchRoleData();
    } catch (error: any) {
      console.error('Error syncing roles:', error);
      toast({
        title: 'Error',
        description: `Failed to sync roles: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const testRoleAssignment = async (roleName: string) => {
    try {
      // Test if we can query profiles with this role - use a more generic approach
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .limit(1);

      if (error) {
        console.error(`Role query test failed:`, error);
        return false;
      }
      
      // Then try to filter by the specific role in a separate query
      const { data: roleData, error: roleError } = await supabase
        .from('profiles')
        .select('id')
        .filter('role', 'eq', roleName)
        .limit(1);
        
      if (roleError) {
        console.error(`Role ${roleName} filter test failed:`, roleError);
        return false;
      }
      
      console.log(`Role ${roleName} test passed`);
      return true;
    } catch (error) {
      console.error(`Role ${roleName} test error:`, error);
      return false;
    }
  };

  const testAllRoles = async () => {
    setLoading(true);
    const results = await Promise.all(
      customRoles.map(async (role) => ({
        role_name: role.role_name,
        valid: await testRoleAssignment(role.role_name)
      }))
    );
    
    console.log('Role validation results:', results);
    
    const invalidRoles = results.filter(r => !r.valid);
    if (invalidRoles.length > 0) {
      toast({
        title: 'Role Issues Found',
        description: `Invalid roles: ${invalidRoles.map(r => r.role_name).join(', ')}`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'All Roles Valid',
        description: 'All custom roles are properly synchronized',
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoleData();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Role Synchronization Debug Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={fetchRoleData} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button 
              onClick={syncRoles} 
              disabled={syncing}
              size="sm"
            >
              {syncing ? 'Syncing...' : 'Sync Roles'}
            </Button>
            <Button 
              onClick={testAllRoles} 
              disabled={loading}
              variant="secondary"
              size="sm"
            >
              Test All Roles
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-3">
                Active Custom Roles ({customRoles.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {customRoles.map(role => (
                  <div 
                    key={role.role_name} 
                    className="text-sm flex items-center gap-2 p-2 bg-muted rounded-md"
                  >
                    <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{role.display_name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {role.role_name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {customRoles.length === 0 && (
                <div className="text-sm text-muted-foreground flex items-center gap-2 p-4 border border-dashed rounded-md">
                  <XCircle className="h-4 w-4 text-red-500" />
                  No active custom roles found
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Debug Instructions:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Click "Refresh Data" to reload custom roles from database</li>
                <li>Click "Sync Roles" to synchronize custom_roles with user_role enum</li>
                <li>Click "Test All Roles" to validate if roles can be assigned to users</li>
                <li>Check browser console for detailed error messages</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleDebugger;
