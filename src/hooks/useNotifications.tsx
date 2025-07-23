
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
  expires_at?: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // Use direct query with proper error handling
      const { data: notificationData, error } = await supabase
        .from('notifications' as any)
        .select('*')
        .eq('user_id', user.id)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      
      // Convert to proper type with proper handling
      const notificationsData = (notificationData as unknown as Notification[]) || [];
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.is_read).length);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications' as any)
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications' as any)
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const createNotification = async (notification: {
    user_id: string;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    expires_at?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('notifications' as any)
        .insert({
          ...notification,
          type: notification.type || 'info'
        });

      if (error) {
        console.error('Error creating notification:', error);
        toast({
          title: 'Error',
          description: 'Failed to create notification',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Success',
        description: 'Notification created successfully',
      });
    } catch (error: any) {
      console.error('Error creating notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to create notification',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
  };
};
