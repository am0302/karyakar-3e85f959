
-- Fix Database Function Security by adding proper search path isolation
-- This prevents potential security vulnerabilities in security definer functions

-- Update get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$;

-- Update is_user_participant_in_room function
CREATE OR REPLACE FUNCTION public.is_user_participant_in_room(room_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.chat_participants 
    WHERE chat_participants.room_id = is_user_participant_in_room.room_id 
    AND chat_participants.user_id = is_user_participant_in_room.user_id
  );
$function$;

-- Update get_user_hierarchy_level function
CREATE OR REPLACE FUNCTION public.get_user_hierarchy_level(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT rh.level
  FROM public.profiles p
  JOIN public.role_hierarchy rh ON p.role = rh.role
  WHERE p.id = _user_id;
$function$;

-- Update check_user_permission function
CREATE OR REPLACE FUNCTION public.check_user_permission(_user_id uuid, _module_name text, _permission_type text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
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

-- Update check_hierarchy_permission function
CREATE OR REPLACE FUNCTION public.check_hierarchy_permission(_user_id uuid, _target_user_id uuid, _permission_type text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT COALESCE(
    (
      SELECT 
        CASE 
          WHEN _permission_type = 'view' THEN hp.can_view
          WHEN _permission_type = 'edit' THEN hp.can_edit
          WHEN _permission_type = 'delete' THEN hp.can_delete
          WHEN _permission_type = 'export' THEN hp.can_export
          WHEN _permission_type = 'assign_locations' THEN hp.can_assign_locations
          ELSE false
        END
      FROM public.profiles p1
      JOIN public.role_hierarchy rh1 ON p1.role = rh1.role
      JOIN public.profiles p2 ON p2.id = _target_user_id
      JOIN public.role_hierarchy rh2 ON p2.role = rh2.role
      JOIN public.hierarchy_permissions hp ON hp.higher_role = rh1.role AND hp.lower_role = rh2.role
      WHERE p1.id = _user_id AND rh1.level < rh2.level
    ),
    -- Super admin has all permissions
    (
      SELECT role = 'super_admin'
      FROM public.profiles
      WHERE id = _user_id
    ),
    false
  );
$function$;

-- Update get_role_display_name function
CREATE OR REPLACE FUNCTION public.get_role_display_name(_role_name text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT display_name FROM public.custom_roles WHERE role_name = _role_name AND is_active = true;
$function$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, mobile_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'mobile_number', '')
  );
  RETURN NEW;
END;
$function$;

-- Create function to validate role assignments based on hierarchy
CREATE OR REPLACE FUNCTION public.validate_role_assignment(_assigner_id uuid, _target_role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT COALESCE(
    -- Super admin can assign any role
    (
      SELECT role = 'super_admin'
      FROM public.profiles
      WHERE id = _assigner_id
    ),
    -- Check if assigner has higher hierarchy level than target role
    (
      SELECT rh1.level < rh2.level
      FROM public.profiles p1
      JOIN public.role_hierarchy rh1 ON p1.role = rh1.role
      JOIN public.role_hierarchy rh2 ON rh2.role = _target_role
      WHERE p1.id = _assigner_id
    ),
    false
  );
$function$;

-- Add RLS policy to prevent unauthorized role changes
CREATE POLICY "Only authorized users can update roles" ON public.profiles
FOR UPDATE 
USING (
  -- User can update their own profile (but not role)
  (auth.uid() = id AND OLD.role = NEW.role) OR
  -- Or user has permission to update roles based on hierarchy
  (auth.uid() != id AND validate_role_assignment(auth.uid(), NEW.role))
);

-- Create audit table for role changes
CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  changed_by uuid REFERENCES auth.users(id) NOT NULL,
  target_user_id uuid REFERENCES public.profiles(id) NOT NULL,
  old_role user_role NOT NULL,
  new_role user_role NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

-- Create policy for audit table
CREATE POLICY "Super admins can view all role changes" ON public.role_change_audit
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Create trigger function for role change auditing
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Only audit if role actually changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.role_change_audit (
      changed_by,
      target_user_id,
      old_role,
      new_role,
      reason
    ) VALUES (
      auth.uid(),
      NEW.id,
      OLD.role,
      NEW.role,
      'Role updated via application'
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger for role change auditing
DROP TRIGGER IF EXISTS audit_role_changes_trigger ON public.profiles;
CREATE TRIGGER audit_role_changes_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_role_changes();
