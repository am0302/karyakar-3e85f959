
-- Fix infinite recursion in profiles RLS policy
-- The issue is that the policy is trying to query the same table it's protecting

-- First, create a security definer function to get user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can view profiles based on role hierarchy" ON profiles;

-- Create new policies without recursion
CREATE POLICY "Users can view their own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles" ON profiles
FOR SELECT USING (public.get_current_user_role() = 'super_admin');

CREATE POLICY "Sant nirdeshak can view subordinates" ON profiles
FOR SELECT USING (
  public.get_current_user_role() = 'sant_nirdeshak' AND 
  role IN ('sah_nirdeshak', 'mandal_sanchalak', 'karyakar', 'sevak')
);

CREATE POLICY "Sah nirdeshak can view their subordinates" ON profiles
FOR SELECT USING (
  public.get_current_user_role() = 'sah_nirdeshak' AND 
  role IN ('mandal_sanchalak', 'karyakar', 'sevak')
);

CREATE POLICY "Mandal sanchalak can view their subordinates" ON profiles
FOR SELECT USING (
  public.get_current_user_role() = 'mandal_sanchalak' AND 
  role IN ('karyakar', 'sevak')
);

-- Allow profile creation during signup
CREATE POLICY "Allow profile creation during signup" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Fix other policies that might have similar issues
DROP POLICY IF EXISTS "Admins can manage mandirs" ON mandirs;
CREATE POLICY "Admins can manage mandirs" ON mandirs
FOR ALL USING (
  public.get_current_user_role() IN ('super_admin', 'sant_nirdeshak', 'sah_nirdeshak')
);

DROP POLICY IF EXISTS "Admins can manage kshetras" ON kshetras;
CREATE POLICY "Admins can manage kshetras" ON kshetras
FOR ALL USING (
  public.get_current_user_role() IN ('super_admin', 'sant_nirdeshak', 'sah_nirdeshak')
);

DROP POLICY IF EXISTS "Admins can manage villages" ON villages;
CREATE POLICY "Admins can manage villages" ON villages
FOR ALL USING (
  public.get_current_user_role() IN ('super_admin', 'sant_nirdeshak', 'sah_nirdeshak')
);

DROP POLICY IF EXISTS "Admins can manage mandals" ON mandals;
CREATE POLICY "Admins can manage mandals" ON mandals
FOR ALL USING (
  public.get_current_user_role() IN ('super_admin', 'sant_nirdeshak', 'sah_nirdeshak')
);

DROP POLICY IF EXISTS "Admins can manage user permissions" ON user_permissions;
CREATE POLICY "Admins can manage user permissions" ON user_permissions
FOR ALL USING (
  public.get_current_user_role() IN ('super_admin', 'sant_nirdeshak', 'sah_nirdeshak')
);
