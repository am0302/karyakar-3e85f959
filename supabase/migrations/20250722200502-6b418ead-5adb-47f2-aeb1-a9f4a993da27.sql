
-- Create role hierarchy table
CREATE TABLE public.role_hierarchy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role user_role NOT NULL UNIQUE,
  level INTEGER NOT NULL UNIQUE,
  parent_role user_role NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (parent_role) REFERENCES public.role_hierarchy(role)
);

-- Insert default hierarchy levels
INSERT INTO public.role_hierarchy (role, level, parent_role) VALUES
  ('super_admin', 1, NULL),
  ('sant_nirdeshak', 2, 'super_admin'),
  ('sah_nirdeshak', 3, 'sant_nirdeshak'),
  ('mandal_sanchalak', 4, 'sah_nirdeshak'),
  ('karyakar', 5, 'mandal_sanchalak'),
  ('sevak', 6, 'karyakar');

-- Create table for user location assignments (assigned by higher hierarchy users)
CREATE TABLE public.user_location_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mandir_ids UUID[] DEFAULT '{}',
  kshetra_ids UUID[] DEFAULT '{}',
  village_ids UUID[] DEFAULT '{}',
  mandal_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create table for hierarchy permissions (what actions higher roles can perform on lower roles)
CREATE TABLE public.hierarchy_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  higher_role user_role NOT NULL,
  lower_role user_role NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  can_assign_locations BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(higher_role, lower_role)
);

-- Enable RLS on new tables
ALTER TABLE public.role_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_location_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hierarchy_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for role_hierarchy
CREATE POLICY "Super admins can manage role hierarchy" 
  ON public.role_hierarchy FOR ALL 
  USING (get_current_user_role() = 'super_admin'::user_role);

CREATE POLICY "All users can view role hierarchy" 
  ON public.role_hierarchy FOR SELECT 
  USING (true);

-- RLS policies for user_location_assignments
CREATE POLICY "Users can view their location assignments" 
  ON public.user_location_assignments FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Higher hierarchy users can manage location assignments" 
  ON public.user_location_assignments FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p1
      JOIN public.role_hierarchy rh1 ON p1.role = rh1.role
      JOIN public.profiles p2 ON user_location_assignments.user_id = p2.id
      JOIN public.role_hierarchy rh2 ON p2.role = rh2.role
      WHERE p1.id = auth.uid() AND rh1.level < rh2.level
    )
  );

-- RLS policies for hierarchy_permissions
CREATE POLICY "Super admins can manage hierarchy permissions" 
  ON public.hierarchy_permissions FOR ALL 
  USING (get_current_user_role() = 'super_admin'::user_role);

CREATE POLICY "Users can view relevant hierarchy permissions" 
  ON public.hierarchy_permissions FOR SELECT 
  USING (
    higher_role = get_current_user_role() OR 
    get_current_user_role() = 'super_admin'::user_role
  );

-- Function to get user hierarchy level
CREATE OR REPLACE FUNCTION public.get_user_hierarchy_level(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT rh.level
  FROM public.profiles p
  JOIN public.role_hierarchy rh ON p.role = rh.role
  WHERE p.id = _user_id;
$$;

-- Function to check hierarchy permission
CREATE OR REPLACE FUNCTION public.check_hierarchy_permission(_user_id uuid, _target_user_id uuid, _permission_type text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
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
$$;

-- Update profiles RLS policies to use hierarchy permissions
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Sant nirdeshak can view subordinates" ON profiles;
DROP POLICY IF EXISTS "Sah nirdeshak can view their subordinates" ON profiles;
DROP POLICY IF EXISTS "Mandal sanchalak can view their subordinates" ON profiles;

-- New consolidated policies based on hierarchy
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view profiles based on hierarchy permissions" ON profiles
  FOR SELECT USING (
    auth.uid() != id AND 
    check_hierarchy_permission(auth.uid(), id, 'view')
  );

CREATE POLICY "Users can edit profiles based on hierarchy permissions" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR 
    check_hierarchy_permission(auth.uid(), id, 'edit')
  );
