
-- Create role_permissions table for storing default permissions by role
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role user_role NOT NULL,
  module_name TEXT NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_add BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, module_name)
);

-- Enable RLS on role_permissions table
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Create policy for role_permissions - only super admins can manage
CREATE POLICY "Super admins can manage role permissions" 
  ON public.role_permissions 
  FOR ALL 
  USING (get_current_user_role() = 'super_admin'::user_role);

-- Create policy to allow users to view role permissions for their own role
CREATE POLICY "Users can view their role permissions" 
  ON public.role_permissions 
  FOR SELECT 
  USING (role = get_current_user_role());

-- Update the check_user_permission function to consider role-based permissions
CREATE OR REPLACE FUNCTION public.check_user_permission(_user_id uuid, _module_name text, _permission_type text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT COALESCE(
    -- First check user-specific permissions (highest priority)
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
    -- Then check role-based permissions
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
      FROM public.role_permissions rp
      JOIN public.profiles p ON p.role = rp.role
      WHERE p.id = _user_id AND rp.module_name = _module_name
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
$function$;
