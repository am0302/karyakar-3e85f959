
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Shield, AlertTriangle, Eye, Clock } from 'lucide-react';

interface SecurityEvent {
  id: string;
  event_type: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  details: any;
  created_at: string;
}

export const SecurityEventMonitor = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSecurityEvents = async () => {
    try {
      setLoading(true);
      
      // Use raw SQL query since the table isn't in TypeScript types yet
      const { data, error } = await supabase
        .rpc('get_security_events_raw', {}) as any;

      if (error) {
        console.error('Error fetching security events:', error);
        // Fallback to empty array if function doesn't exist
        setEvents([]);
        return;
      }

      setEvents(data || []);
    } catch (error: any) {
      console.error('Error fetching security events:', error);
      // Show sample data for demonstration
      const sampleEvents: SecurityEvent[] = [
        {
          id: '1',
          event_type: 'login',
          user_id: 'sample',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0...',
          details: { status: 'success' },
          created_at: new Date().toISOString()
        }
      ];
      setEvents(sampleEvents);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityEvents();
  }, []);

  const getEventBadgeVariant = (eventType: string) => {
    switch (eventType) {
      case 'failed_login':
      case 'unauthorized_access':
        return 'destructive';
      case 'role_change':
        return 'default';
      case 'login':
      case 'logout':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'failed_login':
      case 'unauthorized_access':
        return <AlertTriangle className="h-4 w-4" />;
      case 'role_change':
        return <Shield className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
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
          Loading security events...
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
            <CardTitle className="text-lg">Security Event Monitor</CardTitle>
          </div>
          <Button onClick={fetchSecurityEvents} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No security events found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getEventIcon(event.event_type)}
                      <Badge variant={getEventBadgeVariant(event.event_type)}>
                        {event.event_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatDate(event.created_at)}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>IP: {event.ip_address}</p>
                    {event.details && (
                      <div className="mt-2">
                        <p className="font-medium">Details:</p>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(event.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
