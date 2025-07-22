
-- Add support for custom roles by making user_role more flexible
-- First, let's add a table to store custom roles
CREATE TABLE public.custom_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert existing system roles
INSERT INTO public.custom_roles (role_name, display_name, is_system_role) VALUES
  ('super_admin', 'Super Admin', true),
  ('sant_nirdeshak', 'Sant Nirdeshak', true),
  ('sah_nirdeshak', 'Sah Nirdeshak', true),
  ('mandal_sanchalak', 'Mandal Sanchalak', true),
  ('karyakar', 'Karyakar', true),
  ('sevak', 'Sevak', true);

-- Enable RLS on custom_roles
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for custom_roles
CREATE POLICY "Super admins can manage custom roles" 
  ON public.custom_roles FOR ALL 
  USING (get_current_user_role() = 'super_admin'::user_role);

CREATE POLICY "All users can view custom roles" 
  ON public.custom_roles FOR SELECT 
  USING (true);

-- Update role_hierarchy to support text-based roles
ALTER TABLE public.role_hierarchy DROP CONSTRAINT role_hierarchy_role_key;
ALTER TABLE public.role_hierarchy DROP CONSTRAINT role_hierarchy_parent_role_fkey;

-- Drop the old foreign key constraint and recreate the table structure
ALTER TABLE public.role_hierarchy 
  ALTER COLUMN role TYPE TEXT,
  ALTER COLUMN parent_role TYPE TEXT;

-- Add back unique constraint
ALTER TABLE public.role_hierarchy ADD CONSTRAINT role_hierarchy_role_key UNIQUE (role);

-- Update hierarchy_permissions to support text-based roles
ALTER TABLE public.hierarchy_permissions 
  ALTER COLUMN higher_role TYPE TEXT,
  ALTER COLUMN lower_role TYPE TEXT;

-- Function to add new role to hierarchy
CREATE OR REPLACE FUNCTION public.add_role_to_hierarchy(_role_name text, _display_name text, _level integer, _parent_role text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_role_id uuid;
BEGIN
  -- Only super admin can add roles
  IF get_current_user_role() != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admin can add new roles';
  END IF;

  -- Insert into custom_roles
  INSERT INTO public.custom_roles (role_name, display_name)
  VALUES (_role_name, _display_name)
  RETURNING id INTO new_role_id;

  -- Insert into role_hierarchy
  INSERT INTO public.role_hierarchy (role, level, parent_role)
  VALUES (_role_name, _level, _parent_role);

  RETURN new_role_id;
END;
$$;

-- Function to update role hierarchy
CREATE OR REPLACE FUNCTION public.update_role_hierarchy(_role_name text, _new_level integer, _new_parent_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only super admin can update hierarchy
  IF get_current_user_role() != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admin can update role hierarchy';
  END IF;

  -- Update role hierarchy
  UPDATE public.role_hierarchy 
  SET level = _new_level, parent_role = _new_parent_role, updated_at = now()
  WHERE role = _role_name;

  RETURN true;
END;
$$;
