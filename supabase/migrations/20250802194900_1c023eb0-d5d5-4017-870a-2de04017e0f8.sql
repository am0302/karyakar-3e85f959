
-- Add level column to custom_roles table to support hierarchy ordering
ALTER TABLE custom_roles ADD COLUMN level INTEGER;

-- Create unique constraint to ensure no two roles have the same level
ALTER TABLE custom_roles ADD CONSTRAINT unique_role_level UNIQUE (level);

-- Update existing system roles with default levels
UPDATE custom_roles SET level = 1 WHERE role_name = 'super_admin';
UPDATE custom_roles SET level = 2 WHERE role_name = 'sant_nirdeshak';
UPDATE custom_roles SET level = 3 WHERE role_name = 'sah_nirdeshak';
UPDATE custom_roles SET level = 4 WHERE role_name = 'mandal_sanchalak';
UPDATE custom_roles SET level = 5 WHERE role_name = 'karyakar';
UPDATE custom_roles SET level = 6 WHERE role_name = 'sevak';

-- Create notifications table for the header notification functionality
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);
