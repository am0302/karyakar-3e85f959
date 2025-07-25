
-- Phase 1: Critical Database Security Fixes

-- Fix all security definer functions to prevent search_path attacks
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$;

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

CREATE OR REPLACE FUNCTION public.get_role_display_name(_role_name text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT display_name FROM public.custom_roles WHERE role_name = _role_name AND is_active = true;
$function$;

CREATE OR REPLACE FUNCTION public.sync_custom_roles_with_enum()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    role_record RECORD;
BEGIN
    -- Insert system roles if they don't exist
    INSERT INTO public.custom_roles (role_name, display_name, is_system_role, type, status)
    SELECT 'super_admin', 'Super Admin', true, 'system', 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.custom_roles WHERE role_name = 'super_admin');
    
    INSERT INTO public.custom_roles (role_name, display_name, is_system_role, type, status)
    SELECT 'sant_nirdeshak', 'Sant Nirdeshak', true, 'system', 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.custom_roles WHERE role_name = 'sant_nirdeshak');
    
    INSERT INTO public.custom_roles (role_name, display_name, is_system_role, type, status)
    SELECT 'sah_nirdeshak', 'Sah Nirdeshak', true, 'system', 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.custom_roles WHERE role_name = 'sah_nirdeshak');
    
    INSERT INTO public.custom_roles (role_name, display_name, is_system_role, type, status)
    SELECT 'mandal_sanchalak', 'Mandal Sanchalak', true, 'system', 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.custom_roles WHERE role_name = 'mandal_sanchalak');
    
    INSERT INTO public.custom_roles (role_name, display_name, is_system_role, type, status)
    SELECT 'karyakar', 'Karyakar', true, 'system', 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.custom_roles WHERE role_name = 'karyakar');
    
    INSERT INTO public.custom_roles (role_name, display_name, is_system_role, type, status)
    SELECT 'sevak', 'Sevak', true, 'system', 'active'
    WHERE NOT EXISTS (SELECT 1 FROM public.custom_roles WHERE role_name = 'sevak');
END;
$function$;

-- Phase 2: Create role change audit table and functions for security
CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  changed_by UUID NOT NULL,
  target_user_id UUID NOT NULL,
  old_role user_role NOT NULL,
  new_role user_role NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit table
ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit table
CREATE POLICY "Super admins can view all audit logs"
ON public.role_change_audit
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "System can insert audit logs"
ON public.role_change_audit
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create function to validate role assignment authorization
CREATE OR REPLACE FUNCTION public.validate_role_assignment(_assigner_id uuid, _target_role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p1
    JOIN public.role_hierarchy rh1 ON p1.role = rh1.role
    JOIN public.role_hierarchy rh2 ON rh2.role = _target_role::user_role
    WHERE p1.id = _assigner_id 
    AND rh1.level < rh2.level
  ) OR EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = _assigner_id AND role = 'super_admin'
  );
$function$;

-- Create trigger function for role change auditing
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
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
      'Role changed via system'
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger for role changes
DROP TRIGGER IF EXISTS audit_role_changes_trigger ON public.profiles;
CREATE TRIGGER audit_role_changes_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_role_changes();

-- Add RLS policy to prevent unauthorized role changes
CREATE POLICY "Prevent unauthorized role changes"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  -- Users can update their own profile (except role)
  (auth.uid() = id AND OLD.role = NEW.role) OR
  -- Only authorized users can change roles
  (OLD.role IS DISTINCT FROM NEW.role AND public.validate_role_assignment(auth.uid(), NEW.role::text)) OR
  -- Super admins can change any role
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'))
);

-- Create security event logging table
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on security events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for security events
CREATE POLICY "Super admins can view security events"
ON public.security_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "System can insert security events"
ON public.security_events
FOR INSERT
TO authenticated
WITH CHECK (true);
