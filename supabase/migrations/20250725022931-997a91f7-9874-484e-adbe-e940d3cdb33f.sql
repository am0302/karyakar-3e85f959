
-- Drop the existing enum constraint and convert to text
ALTER TABLE role_hierarchy 
  ALTER COLUMN role TYPE text,
  ALTER COLUMN parent_role TYPE text;

ALTER TABLE hierarchy_permissions 
  ALTER COLUMN higher_role TYPE text,
  ALTER COLUMN lower_role TYPE text;

ALTER TABLE role_permissions 
  ALTER COLUMN role TYPE text;

ALTER TABLE profiles 
  ALTER COLUMN role TYPE text;

-- Drop the enum type (this will cascade to remove it from all tables)
DROP TYPE IF EXISTS user_role CASCADE;

-- Update any existing data to use role names from custom_roles
UPDATE profiles SET role = 'super_admin' WHERE role = 'super_admin';
UPDATE profiles SET role = 'sant_nirdeshak' WHERE role = 'sant_nirdeshak';
UPDATE profiles SET role = 'sah_nirdeshak' WHERE role = 'sah_nirdeshak';
UPDATE profiles SET role = 'mandal_sanchalak' WHERE role = 'mandal_sanchalak';
UPDATE profiles SET role = 'karyakar' WHERE role = 'karyakar';
UPDATE profiles SET role = 'sevak' WHERE role = 'sevak';

-- Ensure custom_roles table has all the system roles
INSERT INTO custom_roles (role_name, display_name, is_system_role, type, status, is_active)
VALUES 
  ('super_admin', 'Super Admin', true, 'system', 'active', true),
  ('sant_nirdeshak', 'Sant Nirdeshak', true, 'system', 'active', true),
  ('sah_nirdeshak', 'Sah Nirdeshak', true, 'system', 'active', true),
  ('mandal_sanchalak', 'Mandal Sanchalak', true, 'system', 'active', true),
  ('karyakar', 'Karyakar', true, 'system', 'active', true),
  ('sevak', 'Sevak', true, 'system', 'active', true)
ON CONFLICT (role_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  is_system_role = EXCLUDED.is_system_role,
  type = EXCLUDED.type,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active;

-- Update the database functions to work with text instead of enum
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$;

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

-- Update RLS policies to work with text roles
DROP POLICY IF EXISTS "Super admins can manage custom roles" ON public.custom_roles;
CREATE POLICY "Super admins can manage custom roles" ON public.custom_roles
FOR ALL USING (get_current_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Super admins can manage role hierarchy" ON public.role_hierarchy;
CREATE POLICY "Super admins can manage role hierarchy" ON public.role_hierarchy
FOR ALL USING (get_current_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Super admins can manage hierarchy permissions" ON public.hierarchy_permissions;
CREATE POLICY "Super admins can manage hierarchy permissions" ON public.hierarchy_permissions
FOR ALL USING (get_current_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Users can view relevant hierarchy permissions" ON public.hierarchy_permissions;
CREATE POLICY "Users can view relevant hierarchy permissions" ON public.hierarchy_permissions
FOR SELECT USING ((higher_role = get_current_user_role()) OR (get_current_user_role() = 'super_admin'));

DROP POLICY IF EXISTS "Super admins can manage role permissions" ON public.role_permissions;
CREATE POLICY "Super admins can manage role permissions" ON public.role_permissions
FOR ALL USING (get_current_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Users can view their role permissions" ON public.role_permissions;
CREATE POLICY "Users can view their role permissions" ON public.role_permissions
FOR SELECT USING (role = get_current_user_role());

-- Update other policies that reference the enum
DROP POLICY IF EXISTS "Admins can manage kshetras" ON public.kshetras;
CREATE POLICY "Admins can manage kshetras" ON public.kshetras
FOR ALL USING (get_current_user_role() = ANY (ARRAY['super_admin', 'sant_nirdeshak', 'sah_nirdeshak']));

DROP POLICY IF EXISTS "Admins can manage mandals" ON public.mandals;
CREATE POLICY "Admins can manage mandals" ON public.mandals
FOR ALL USING (get_current_user_role() = ANY (ARRAY['super_admin', 'sant_nirdeshak', 'sah_nirdeshak']));

DROP POLICY IF EXISTS "Admins can manage mandirs" ON public.mandirs;
CREATE POLICY "Admins can manage mandirs" ON public.mandirs
FOR ALL USING (get_current_user_role() = ANY (ARRAY['super_admin', 'sant_nirdeshak', 'sah_nirdeshak']));

DROP POLICY IF EXISTS "Super admins can manage professions" ON public.professions;
CREATE POLICY "Super admins can manage professions" ON public.professions
FOR ALL USING (get_current_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Super admins can manage seva types" ON public.seva_types;
CREATE POLICY "Super admins can manage seva types" ON public.seva_types
FOR ALL USING (get_current_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Admins can manage user permissions" ON public.user_permissions;
CREATE POLICY "Admins can manage user permissions" ON public.user_permissions
FOR ALL USING (get_current_user_role() = ANY (ARRAY['super_admin', 'sant_nirdeshak', 'sah_nirdeshak']));

DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;
CREATE POLICY "Allow profile creation" ON public.profiles
FOR INSERT WITH CHECK ((auth.uid() = id) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['super_admin', 'sant_nirdeshak', 'sah_nirdeshak', 'mandal_sanchalak']))))));

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" ON public.profiles
FOR UPDATE USING (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['super_admin', 'sant_nirdeshak', 'sah_nirdeshak'])))));

DROP POLICY IF EXISTS "Users can delete their tasks" ON public.tasks;
CREATE POLICY "Users can delete their tasks" ON public.tasks
FOR DELETE USING ((auth.uid() = assigned_by) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['super_admin', 'sant_nirdeshak', 'sah_nirdeshak']))))));
