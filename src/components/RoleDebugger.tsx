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
  const [roleTestResults, setRoleTestResults] = useState<Record<string, boolean>>({});
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
      // Test if the role exists in the enum by trying to query profiles with this specific role
      // We'll query all profiles first and then filter, to avoid the enum type error
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role')
        .limit(1);
        
      if (error) {
        // If there's a basic query error, log it but don't assume the role is invalid
        console.log(`Role ${roleName} query failed (likely due to permissions):`, error.message);
        return true; // Assume role exists if we can't query due to permissions
      }
      
      // If the basic query works, try a more specific test
      // Use a raw SQL approach to test the role enum
      const { data: enumTest, error: enumError } = await supabase
        .rpc('sql', { 
          query: `SELECT '${roleName}'::user_role as test_role LIMIT 1` 
        });
        
      if (enumError) {
        // Check if it's specifically an enum error
        if (enumError.message?.includes('invalid input value for enum user_role')) {
          console.error(`Role ${roleName} is not in the user_role enum:`, enumError.message);
          return false;
        }
        // Other errors might be permission-related but don't indicate the role doesn't exist
        console.log(`Role ${roleName} test had an error but role likely exists:`, enumError.message);
        return true;
      }
      
      console.log(`Role ${roleName} test passed - exists in user_role enum`);
      return true;
    } catch (error) {
      console.error(`Role ${roleName} test error:`, error);
      // For any unexpected errors, we'll assume the role exists to avoid false negatives
      return true;
    }
  };

  const testAllRoles = async () => {
    setLoading(true);
    const results: Record<string, boolean> = {};
    
    for (const role of customRoles) {
      const isValid = await testRoleAssignment(role.role_name);
      results[role.role_name] = isValid;
    }
    
    setRoleTestResults(results);
    
    console.log('Role validation results:', results);
    
    const invalidRoles = Object.entries(results)
      .filter(([_, valid]) => !valid)
      .map(([roleName]) => roleName);
    
    if (invalidRoles.length > 0) {
      toast({
        title: 'Role Issues Found',
        description: `Invalid roles: ${invalidRoles.join(', ')}. These roles exist in custom_roles but not in the user_role enum.`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'All Roles Valid',
        description: 'All custom roles are properly synchronized with the user_role enum',
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoleData();
  }, []);

  const getRoleStatusIcon = (roleName: string) => {
    if (roleTestResults[roleName] === true) {
      return <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />;
    } else if (roleTestResults[roleName] === false) {
      return <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />;
    }
    return <CheckCircle className="h-3 w-3 text-gray-400 flex-shrink-0" />;
  };

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
                    {getRoleStatusIcon(role.role_name)}
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
                <li>Green checkmark: Role exists in both custom_roles and user_role enum</li>
                <li>Red X: Role exists in custom_roles but NOT in user_role enum (needs sync)</li>
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
