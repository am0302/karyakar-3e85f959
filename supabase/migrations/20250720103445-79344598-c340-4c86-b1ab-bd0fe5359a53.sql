
-- Fix RLS policies for profiles table to allow proper insertion
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;

-- Create a more comprehensive policy for profile creation that allows super admins and higher roles to create profiles
CREATE POLICY "Allow profile creation" ON profiles
FOR INSERT 
WITH CHECK (
  auth.uid() = id OR  -- Users can create their own profile
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('super_admin', 'sant_nirdeshak', 'sah_nirdeshak', 'mandal_sanchalak')
  )
);

-- Allow super admins and higher roles to update any profile
CREATE POLICY "Admins can update profiles" ON profiles
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('super_admin', 'sant_nirdeshak', 'sah_nirdeshak')
  )
);

-- Fix chat_participants RLS to allow proper insertion
DROP POLICY IF EXISTS "Users can create chat participants" ON chat_participants;

CREATE POLICY "Users can create chat participants" ON chat_participants
FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT created_by FROM chat_rooms WHERE id = room_id
  ) OR
  user_id = auth.uid()
);

-- Add default permissions for role_permissions table
INSERT INTO role_permissions (role, module_name, can_view, can_add, can_edit, can_delete, can_export)
SELECT 
  role_enum.role,
  module_enum.module_name,
  CASE 
    WHEN role_enum.role = 'super_admin' THEN true
    WHEN role_enum.role = 'sant_nirdeshak' AND module_enum.module_name IN ('karyakars', 'tasks', 'communication', 'reports') THEN true
    WHEN role_enum.role = 'sah_nirdeshak' AND module_enum.module_name IN ('karyakars', 'tasks', 'communication') THEN true
    WHEN role_enum.role = 'mandal_sanchalak' AND module_enum.module_name IN ('karyakars', 'tasks') THEN true
    WHEN role_enum.role = 'karyakar' AND module_enum.module_name IN ('tasks', 'communication') THEN true
    WHEN role_enum.role = 'sevak' AND module_enum.module_name = 'communication' THEN true
    ELSE false
  END as can_view,
  CASE 
    WHEN role_enum.role = 'super_admin' THEN true
    WHEN role_enum.role = 'sant_nirdeshak' AND module_enum.module_name IN ('karyakars', 'tasks') THEN true
    WHEN role_enum.role = 'sah_nirdeshak' AND module_enum.module_name IN ('karyakars', 'tasks') THEN true
    WHEN role_enum.role = 'mandal_sanchalak' AND module_enum.module_name = 'tasks' THEN true
    ELSE false
  END as can_add,
  CASE 
    WHEN role_enum.role = 'super_admin' THEN true
    WHEN role_enum.role = 'sant_nirdeshak' AND module_enum.module_name IN ('karyakars', 'tasks') THEN true
    WHEN role_enum.role = 'sah_nirdeshak' AND module_enum.module_name IN ('karyakars', 'tasks') THEN true
    ELSE false
  END as can_edit,
  CASE 
    WHEN role_enum.role = 'super_admin' THEN true
    ELSE false
  END as can_delete,
  CASE 
    WHEN role_enum.role = 'super_admin' THEN true
    WHEN role_enum.role IN ('sant_nirdeshak', 'sah_nirdeshak') AND module_enum.module_name IN ('karyakars', 'reports') THEN true
    ELSE false
  END as can_export
FROM (
  VALUES 
    ('super_admin'::user_role),
    ('sant_nirdeshak'::user_role),
    ('sah_nirdeshak'::user_role),
    ('mandal_sanchalak'::user_role),
    ('karyakar'::user_role),
    ('sevak'::user_role)
) AS role_enum(role)
CROSS JOIN (
  VALUES 
    ('dashboard'),
    ('karyakars'),
    ('tasks'),
    ('communication'),
    ('reports'),
    ('admin')
) AS module_enum(module_name)
ON CONFLICT (role, module_name) DO NOTHING;

-- Set default values for existing records in module_permissions
UPDATE module_permissions 
SET 
  can_view = COALESCE(can_view, false),
  can_add = COALESCE(can_add, false),
  can_edit = COALESCE(can_edit, false),
  can_delete = COALESCE(can_delete, false),
  can_export = COALESCE(can_export, false)
WHERE can_view IS NULL OR can_add IS NULL OR can_edit IS NULL OR can_delete IS NULL OR can_export IS NULL;

-- Set default values for existing records in user_permissions
UPDATE user_permissions 
SET 
  can_view = COALESCE(can_view, false),
  can_add = COALESCE(can_add, false),
  can_edit = COALESCE(can_edit, false),
  can_delete = COALESCE(can_delete, false),
  can_export = COALESCE(can_export, false)
WHERE can_view IS NULL OR can_add IS NULL OR can_edit IS NULL OR can_delete IS NULL OR can_export IS NULL;

-- Update default values for columns to ensure new records have defaults
ALTER TABLE role_permissions 
  ALTER COLUMN can_view SET DEFAULT false,
  ALTER COLUMN can_add SET DEFAULT false,
  ALTER COLUMN can_edit SET DEFAULT false,
  ALTER COLUMN can_delete SET DEFAULT false,
  ALTER COLUMN can_export SET DEFAULT false;

ALTER TABLE module_permissions 
  ALTER COLUMN can_view SET DEFAULT false,
  ALTER COLUMN can_add SET DEFAULT false,
  ALTER COLUMN can_edit SET DEFAULT false,
  ALTER COLUMN can_delete SET DEFAULT false,
  ALTER COLUMN can_export SET DEFAULT false;

ALTER TABLE user_permissions 
  ALTER COLUMN can_view SET DEFAULT false,
  ALTER COLUMN can_add SET DEFAULT false,
  ALTER COLUMN can_edit SET DEFAULT false,
  ALTER COLUMN can_delete SET DEFAULT false,
  ALTER COLUMN can_export SET DEFAULT false;
