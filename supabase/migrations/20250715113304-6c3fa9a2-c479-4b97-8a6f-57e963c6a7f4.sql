
-- Create a more comprehensive user permissions system
CREATE TABLE IF NOT EXISTS public.module_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  module_name TEXT NOT NULL, -- 'karyakars', 'tasks', 'communication', 'reports', 'admin'
  can_view BOOLEAN DEFAULT false,
  can_add BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  scope_type TEXT DEFAULT 'all', -- 'all', 'mandir', 'kshetra', 'village', 'mandal'
  scope_mandir_id UUID REFERENCES public.mandirs(id),
  scope_kshetra_id UUID REFERENCES public.kshetras(id),
  scope_village_id UUID REFERENCES public.villages(id),
  scope_mandal_id UUID REFERENCES public.mandals(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_name, scope_type, scope_mandir_id, scope_kshetra_id, scope_village_id, scope_mandal_id)
);

-- Enable RLS
ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all permissions
CREATE POLICY "Super admins can manage module permissions" 
  ON public.module_permissions 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Users can view their own permissions
CREATE POLICY "Users can view their own module permissions" 
  ON public.module_permissions 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Function to check user permissions
CREATE OR REPLACE FUNCTION public.check_user_permission(
  _user_id UUID,
  _module_name TEXT,
  _permission_type TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (
      SELECT 
        CASE 
          WHEN _permission_type = 'view' THEN can_view
          WHEN _permission_type = 'add' THEN can_add
          WHEN _permission_type = 'edit' THEN can_edit
          WHEN _permission_type = 'delete' THEN can_delete
          WHEN _permission_type = 'export' THEN can_export
          ELSE false
        END
      FROM public.module_permissions
      WHERE user_id = _user_id AND module_name = _module_name
      LIMIT 1
    ),
    -- Default permissions for super_admin
    (
      SELECT role = 'super_admin'
      FROM public.profiles
      WHERE id = _user_id
    ),
    false
  );
$$;

-- Insert default permissions for existing super_admin users
INSERT INTO public.module_permissions (user_id, module_name, can_view, can_add, can_edit, can_delete, can_export)
SELECT 
  p.id,
  module.name,
  true,
  true,
  true,
  true,
  true
FROM public.profiles p
CROSS JOIN (
  VALUES 
    ('karyakars'),
    ('tasks'),
    ('communication'),
    ('reports'),
    ('admin')
) AS module(name)
WHERE p.role = 'super_admin'
ON CONFLICT (user_id, module_name, scope_type, scope_mandir_id, scope_kshetra_id, scope_village_id, scope_mandal_id) 
DO NOTHING;

-- Fix chat_participants and chat_rooms RLS policies for better access
DROP POLICY IF EXISTS "Users can view chat participants" ON public.chat_participants;
CREATE POLICY "Users can view chat participants" 
  ON public.chat_participants 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.chat_participants cp 
      WHERE cp.room_id = chat_participants.room_id AND cp.user_id = auth.uid()
    )
  );

-- Allow users to create chat participants
CREATE POLICY "Users can create chat participants" 
  ON public.chat_participants 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Allow users to create chat rooms
DROP POLICY IF EXISTS "Users can view their chat rooms" ON public.chat_rooms;
CREATE POLICY "Users can create and view chat rooms" 
  ON public.chat_rooms 
  FOR ALL 
  USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.chat_participants cp 
      WHERE cp.room_id = id AND cp.user_id = auth.uid()
    )
  )
  WITH CHECK (created_by = auth.uid());

-- Fix messages RLS policy
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.messages;
CREATE POLICY "Users can view messages in their rooms" 
  ON public.messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp 
      WHERE cp.room_id = messages.room_id AND cp.user_id = auth.uid()
    )
  );
