
-- Update role_hierarchy table to support text-based roles instead of enum
ALTER TABLE public.role_hierarchy 
  ALTER COLUMN role TYPE TEXT,
  ALTER COLUMN parent_role TYPE TEXT;

-- Update hierarchy_permissions table to support text-based roles
ALTER TABLE public.hierarchy_permissions 
  ALTER COLUMN higher_role TYPE TEXT,
  ALTER COLUMN lower_role TYPE TEXT;

-- Add default hierarchy permissions for all role combinations
-- This will set all permissions to TRUE by default for higher to lower role relationships
INSERT INTO public.hierarchy_permissions (higher_role, lower_role, can_view, can_edit, can_delete, can_export, can_assign_locations)
SELECT 
  h.role_name as higher_role,
  l.role_name as lower_role,
  true as can_view,
  true as can_edit,
  true as can_delete,
  true as can_export,
  true as can_assign_locations
FROM public.custom_roles h
CROSS JOIN public.custom_roles l
WHERE h.role_name != l.role_name
ON CONFLICT (higher_role, lower_role) DO UPDATE SET
  can_view = true,
  can_edit = true,
  can_delete = true,
  can_export = true,
  can_assign_locations = true;

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Admins can create notifications for users" 
  ON public.notifications FOR INSERT 
  WITH CHECK (
    get_current_user_role() IN ('super_admin', 'sant_nirdeshak', 'sah_nirdeshak')
  );

CREATE POLICY "Admins can manage all notifications" 
  ON public.notifications FOR ALL 
  USING (
    get_current_user_role() IN ('super_admin', 'sant_nirdeshak', 'sah_nirdeshak')
  );
