
-- Create custom_roles table for dynamic role management
CREATE TABLE public.custom_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on custom_roles
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- Insert existing system roles
INSERT INTO public.custom_roles (role_name, display_name, is_system_role) VALUES
  ('super_admin', 'Super Admin', true),
  ('sant_nirdeshak', 'Sant Nirdeshak', true),
  ('sah_nirdeshak', 'Sah Nirdeshak', true),
  ('mandal_sanchalak', 'Mandal Sanchalak', true),
  ('karyakar', 'Karyakar', true),
  ('sevak', 'Sevak', true);

-- RLS policies for custom_roles
CREATE POLICY "Super admins can manage custom roles" 
  ON public.custom_roles FOR ALL 
  USING (get_current_user_role() = 'super_admin'::user_role);

CREATE POLICY "All users can view active custom roles" 
  ON public.custom_roles FOR SELECT 
  USING (is_active = true);

-- Update professions table to allow management by super admin
DROP POLICY IF EXISTS "Authenticated users can view professions" ON public.professions;

CREATE POLICY "Super admins can manage professions" 
  ON public.professions FOR ALL 
  USING (get_current_user_role() = 'super_admin'::user_role);

CREATE POLICY "All users can view active professions" 
  ON public.professions FOR SELECT 
  USING (is_active = true);

-- Update seva_types table to allow management by super admin
DROP POLICY IF EXISTS "Authenticated users can view seva types" ON public.seva_types;

CREATE POLICY "Super admins can manage seva types" 
  ON public.seva_types FOR ALL 
  USING (get_current_user_role() = 'super_admin'::user_role);

CREATE POLICY "All users can view active seva types" 
  ON public.seva_types FOR SELECT 
  USING (is_active = true);

-- Function to get role display name
CREATE OR REPLACE FUNCTION public.get_role_display_name(_role_name text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT display_name FROM public.custom_roles WHERE role_name = _role_name AND is_active = true;
$$;
