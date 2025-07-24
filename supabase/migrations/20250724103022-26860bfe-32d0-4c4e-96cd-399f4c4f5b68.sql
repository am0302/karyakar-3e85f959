
-- First, we need to alter the existing tables that use the user_role enum to use text instead
-- This will allow us to reference roles from the custom_roles table

-- Update profiles table to use text for role column
ALTER TABLE public.profiles 
ALTER COLUMN role TYPE text;

-- Update role_hierarchy table to use text for role and parent_role columns
ALTER TABLE public.role_hierarchy 
ALTER COLUMN role TYPE text,
ALTER COLUMN parent_role TYPE text;

-- Update hierarchy_permissions table to use text for higher_role and lower_role columns
ALTER TABLE public.hierarchy_permissions 
ALTER COLUMN higher_role TYPE text,
ALTER COLUMN lower_role TYPE text;

-- Update role_permissions table to use text for role column
ALTER TABLE public.role_permissions 
ALTER COLUMN role TYPE text;

-- Add foreign key constraints to ensure data integrity
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_fkey 
FOREIGN KEY (role) REFERENCES public.custom_roles(role_name);

ALTER TABLE public.role_hierarchy 
ADD CONSTRAINT role_hierarchy_role_fkey 
FOREIGN KEY (role) REFERENCES public.custom_roles(role_name);

ALTER TABLE public.role_hierarchy 
ADD CONSTRAINT role_hierarchy_parent_role_fkey 
FOREIGN KEY (parent_role) REFERENCES public.custom_roles(role_name);

ALTER TABLE public.hierarchy_permissions 
ADD CONSTRAINT hierarchy_permissions_higher_role_fkey 
FOREIGN KEY (higher_role) REFERENCES public.custom_roles(role_name);

ALTER TABLE public.hierarchy_permissions 
ADD CONSTRAINT hierarchy_permissions_lower_role_fkey 
FOREIGN KEY (lower_role) REFERENCES public.custom_roles(role_name);

ALTER TABLE public.role_permissions 
ADD CONSTRAINT role_permissions_role_fkey 
FOREIGN KEY (role) REFERENCES public.custom_roles(role_name);

-- Update the get_current_user_role function to return text instead of user_role enum
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$;

-- Update other database functions to use text instead of user_role enum
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

CREATE OR REPLACE FUNCTION public.check_hierarchy_permission(_user_id uuid, _target_user_id uuid, _permission_type text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
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

-- Update RLS policies to work with text-based roles
DROP POLICY IF EXISTS "Super admins can manage custom roles" ON public.custom_roles;
CREATE POLICY "Super admins can manage custom roles"
ON public.custom_roles
FOR ALL
TO authenticated
USING (get_current_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Super admins can manage hierarchy permissions" ON public.hierarchy_permissions;
CREATE POLICY "Super admins can manage hierarchy permissions"
ON public.hierarchy_permissions
FOR ALL
TO authenticated
USING (get_current_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Users can view relevant hierarchy permissions" ON public.hierarchy_permissions;
CREATE POLICY "Users can view relevant hierarchy permissions"
ON public.hierarchy_permissions
FOR SELECT
TO authenticated
USING (higher_role = get_current_user_role() OR get_current_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Super admins can manage role hierarchy" ON public.role_hierarchy;
CREATE POLICY "Super admins can manage role hierarchy"
ON public.role_hierarchy
FOR ALL
TO authenticated
USING (get_current_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Super admins can manage role permissions" ON public.role_permissions;
CREATE POLICY "Super admins can manage role permissions"
ON public.role_permissions
FOR ALL
TO authenticated
USING (get_current_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Users can view their role permissions" ON public.role_permissions;
CREATE POLICY "Users can view their role permissions"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (role = get_current_user_role());

DROP POLICY IF EXISTS "Super admins can manage professions" ON public.professions;
CREATE POLICY "Super admins can manage professions"
ON public.professions
FOR ALL
TO authenticated
USING (get_current_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Super admins can manage seva types" ON public.seva_types;
CREATE POLICY "Super admins can manage seva types"
ON public.seva_types
FOR ALL
TO authenticated
USING (get_current_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Admins can manage mandirs" ON public.mandirs;
CREATE POLICY "Admins can manage mandirs"
ON public.mandirs
FOR ALL
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin', 'sant_nirdeshak', 'sah_nirdeshak']));

DROP POLICY IF EXISTS "Admins can manage kshetras" ON public.kshetras;
CREATE POLICY "Admins can manage kshetras"
ON public.kshetras
FOR ALL
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin', 'sant_nirdeshak', 'sah_nirdeshak']));

DROP POLICY IF EXISTS "Admins can manage villages" ON public.villages;
CREATE POLICY "Admins can manage villages"
ON public.villages
FOR ALL
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin', 'sant_nirdeshak', 'sah_nirdeshak']));

DROP POLICY IF EXISTS "Admins can manage mandals" ON public.mandals;
CREATE POLICY "Admins can manage mandals"
ON public.mandals
FOR ALL
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin', 'sant_nirdeshak', 'sah_nirdeshak']));

DROP POLICY IF EXISTS "Admins can manage user permissions" ON public.user_permissions;
CREATE POLICY "Admins can manage user permissions"
ON public.user_permissions
FOR ALL
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin', 'sant_nirdeshak', 'sah_nirdeshak']));

-- Now we can drop the user_role enum since it's no longer needed
DROP TYPE IF EXISTS public.user_role;
