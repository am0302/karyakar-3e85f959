
-- Update RLS policies to allow proper data access for different user roles

-- Allow users to view other profiles based on their role hierarchy
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;

CREATE POLICY "Users can view profiles based on role hierarchy" ON profiles
FOR SELECT USING (
  auth.uid() = id OR  -- Users can see their own profile
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND (
      p.role = 'super_admin' OR  -- Super admins see all
      (p.role = 'sant_nirdeshak' AND profiles.role IN ('sah_nirdeshak', 'mandal_sanchalak', 'karyakar', 'sevak')) OR
      (p.role = 'sah_nirdeshak' AND profiles.role IN ('mandal_sanchalak', 'karyakar', 'sevak')) OR
      (p.role = 'mandal_sanchalak' AND profiles.role IN ('karyakar', 'sevak'))
    )
  )
);

-- Allow admin operations on master data tables
CREATE POLICY "Admins can manage mandirs" ON mandirs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('super_admin', 'sant_nirdeshak', 'sah_nirdeshak')
  )
);

CREATE POLICY "Admins can manage kshetras" ON kshetras
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('super_admin', 'sant_nirdeshak', 'sah_nirdeshak')
  )
);

CREATE POLICY "Admins can manage villages" ON villages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('super_admin', 'sant_nirdeshak', 'sah_nirdeshak')
  )
);

CREATE POLICY "Admins can manage mandals" ON mandals
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('super_admin', 'sant_nirdeshak', 'sah_nirdeshak')
  )
);

-- Allow admin users to manage user permissions
CREATE POLICY "Admins can manage user permissions" ON user_permissions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('super_admin', 'sant_nirdeshak', 'sah_nirdeshak')
  )
);

-- Allow users to view and update their own tasks
CREATE POLICY "Users can delete their tasks" ON tasks
FOR DELETE USING (
  auth.uid() = assigned_by OR 
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('super_admin', 'sant_nirdeshak', 'sah_nirdeshak')
  )
);
