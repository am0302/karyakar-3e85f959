
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Settings } from 'lucide-react';

const AppSettings = () => {
  const { toast } = useToast();
  const [googleSigninEnabled, setGoogleSigninEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .eq('key', 'google_signin_enabled')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setGoogleSigninEnabled(data.value === true);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch app settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateGoogleSigninSetting = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'google_signin_enabled',
          value: enabled,
          description: 'Enable/disable Google sign-in option'
        });

      if (error) throw error;

      setGoogleSigninEnabled(enabled);
      toast({
        title: 'Success',
        description: `Google sign-in ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error: any) {
      console.error('Error updating setting:', error);
      toast({
        title: 'Error',
        description: 'Failed to update setting',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-32">Loading settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Application Settings
        </CardTitle>
        <CardDescription>
          Configure global application settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="google-signin">Google Sign-in</Label>
            <p className="text-sm text-gray-600">
              Enable or disable Google sign-in option on the authentication page
            </p>
          </div>
          <Switch
            id="google-signin"
            checked={googleSigninEnabled}
            onCheckedChange={updateGoogleSigninSetting}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AppSettings;
