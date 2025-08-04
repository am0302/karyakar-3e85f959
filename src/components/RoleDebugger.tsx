
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface CustomRole {
  role_name: string;
  display_name: string;
  is_active: boolean;
}

interface EnumValue {
  enumlabel: string;
}

const RoleDebugger = () => {
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [enumValues, setEnumValues] = useState<EnumValue[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchRoleData = async () => {
    try {
      setLoading(true);

      // Fetch custom roles
      const { data: roles, error: rolesError } = await supabase
        .from('custom_roles')
        .select('role_name, display_name, is_active')
        .eq('is_active', true);

      if (rolesError) throw rolesError;
      setCustomRoles(roles || []);

      // Fetch enum values
      const { data: enumData, error: enumError } = await supabase
        .rpc('get_enum_values', { enum_name: 'user_role' });

      if (enumError) {
        console.error('Could not fetch enum values:', enumError);
        // Fallback: try direct query
        const { data: fallbackEnum } = await supabase
          .from('information_schema.columns')
          .select('*')
          .eq('table_name', 'profiles')
          .eq('column_name', 'role');
        
        console.log('Fallback enum query result:', fallbackEnum);
      } else {
        setEnumValues(enumData || []);
      }

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
      const { error } = await supabase.rpc('sync_user_role_enum');
      
      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Roles synchronized successfully',
      });

      fetchRoleData();
    } catch (error: any) {
      console.error('Error syncing roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync roles',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchRoleData();
  }, []);

  const enumLabels = enumValues.map(e => e.enumlabel);
  const missingInEnum = customRoles.filter(role => !enumLabels.includes(role.role_name));
  const extraInEnum = enumLabels.filter(label => !customRoles.find(role => role.role_name === label));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Role Synchronization Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={fetchRoleData} disabled={loading}>
              Refresh Data
            </Button>
            <Button onClick={syncRoles} disabled={loading}>
              Sync Roles
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Custom Roles ({customRoles.length})</h4>
              <div className="space-y-1">
                {customRoles.map(role => (
                  <div key={role.role_name} className="text-sm flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {role.role_name} ({role.display_name})
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Enum Values ({enumValues.length})</h4>
              <div className="space-y-1">
                {enumValues.map(enumVal => (
                  <div key={enumVal.enumlabel} className="text-sm flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-blue-500" />
                    {enumVal.enumlabel}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Issues</h4>
              <div className="space-y-1">
                {missingInEnum.map(role => (
                  <div key={role.role_name} className="text-sm flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-red-500" />
                    Missing in enum: {role.role_name}
                  </div>
                ))}
                {extraInEnum.map(label => (
                  <div key={label} className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    Extra in enum: {label}
                  </div>
                ))}
                {missingInEnum.length === 0 && extraInEnum.length === 0 && (
                  <div className="text-sm flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    All roles synchronized
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleDebugger;
