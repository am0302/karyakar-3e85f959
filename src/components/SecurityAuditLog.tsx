
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Shield, AlertTriangle, User } from 'lucide-react';
import { sanitizeInput } from '@/utils/security';

interface AuditLogEntry {
  id: string;
  changed_by: string;
  target_user_id: string;
  old_role: string;
  new_role: string;
  reason: string;
  created_at: string;
  changer_name?: string;
  target_name?: string;
}

export const SecurityAuditLog = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('role_change_audit')
        .select(`
          *,
          changer:changed_by(full_name),
          target:target_user_id(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching audit logs:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch audit logs',
          variant: 'destructive',
        });
        return;
      }

      // Transform and sanitize data
      const sanitizedLogs = (data || []).map(log => ({
        ...log,
        changer_name: sanitizeInput.displayName(log.changer?.full_name || 'Unknown'),
        target_name: sanitizeInput.displayName(log.target?.full_name || 'Unknown'),
        reason: sanitizeInput.text(log.reason || 'No reason provided')
      }));

      setAuditLogs(sanitizedLogs);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch audit logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'sant_nirdeshak':
      case 'sah_nirdeshak':
        return 'default';
      case 'mandal_sanchalak':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading audit logs...
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle className="text-lg">Security Audit Log</CardTitle>
          </div>
          <Button onClick={fetchAuditLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {auditLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{log.changer_name}</span>
                      <span className="text-sm text-gray-500">changed role for</span>
                      <span className="font-medium">{log.target_name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(log.old_role)}>
                      {log.old_role.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-gray-500">→</span>
                    <Badge variant={getRoleBadgeVariant(log.new_role)}>
                      {log.new_role.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  {log.reason && (
                    <p className="text-sm text-gray-600 italic">
                      Reason: {log.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
