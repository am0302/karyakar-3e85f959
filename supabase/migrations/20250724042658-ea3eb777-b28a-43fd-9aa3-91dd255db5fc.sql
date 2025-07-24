
-- First, let's ensure we have proper data in the custom_roles table and role_hierarchy
-- Insert missing system roles if they don't exist
INSERT INTO public.custom_roles (role_name, display_name, is_system_role, is_active) VALUES
  ('super_admin', 'Super Admin', true, true),
  ('sant_nirdeshak', 'Sant Nirdeshak', true, true),
  ('sah_nirdeshak', 'Sah Nirdeshak', true, true),
  ('mandal_sanchalak', 'Mandal Sanchalak', true, true),
  ('karyakar', 'Karyakar', true, true),
  ('sevak', 'Sevak', true, true)
ON CONFLICT (role_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  is_active = EXCLUDED.is_active;

-- Insert role hierarchy if not exists
INSERT INTO public.role_hierarchy (role, level, parent_role) VALUES
  ('super_admin', 1, NULL),
  ('sant_nirdeshak', 2, 'super_admin'),
  ('sah_nirdeshak', 3, 'sant_nirdeshak'),
  ('mandal_sanchalak', 4, 'sah_nirdeshak'),
  ('karyakar', 5, 'mandal_sanchalak'),
  ('sevak', 6, 'karyakar')
ON CONFLICT (role) DO UPDATE SET
  level = EXCLUDED.level,
  parent_role = EXCLUDED.parent_role;

-- Set default hierarchy permissions (everything TRUE as requested)
INSERT INTO public.hierarchy_permissions (higher_role, lower_role, can_view, can_edit, can_delete, can_export, can_assign_locations)
SELECT 
  h1.role as higher_role,
  h2.role as lower_role,
  true as can_view,
  true as can_edit,
  true as can_delete,
  true as can_export,
  true as can_assign_locations
FROM public.role_hierarchy h1
CROSS JOIN public.role_hierarchy h2
WHERE h1.level < h2.level
ON CONFLICT (higher_role, lower_role) DO UPDATE SET
  can_view = EXCLUDED.can_view,
  can_edit = EXCLUDED.can_edit,
  can_delete = EXCLUDED.can_delete,
  can_export = EXCLUDED.can_export,
  can_assign_locations = EXCLUDED.can_assign_locations;

-- Add some sample professions if none exist
INSERT INTO public.professions (name, description, is_active) VALUES
  ('Teacher', 'Teaching profession', true),
  ('Doctor', 'Medical profession', true),
  ('Engineer', 'Engineering profession', true),
  ('Business', 'Business profession', true),
  ('Student', 'Student', true)
ON CONFLICT (name) DO NOTHING;

-- Add some sample seva types if none exist
INSERT INTO public.seva_types (name, description, is_active) VALUES
  ('Bhajan', 'Leading bhajan sessions', true),
  ('Seva', 'General seva activities', true),
  ('Teaching', 'Teaching activities', true),
  ('Administration', 'Administrative tasks', true),
  ('Event Management', 'Managing events', true)
ON CONFLICT (name) DO NOTHING;
