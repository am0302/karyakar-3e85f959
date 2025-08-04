
-- Drop the existing policy and create a more comprehensive one
DROP POLICY IF EXISTS "Higher hierarchy users can manage location assignments" ON public.user_location_assignments;

-- Create a new policy that allows:
-- 1. Super admins to manage all location assignments
-- 2. Users to assign locations to themselves
-- 3. Higher hierarchy users to manage lower hierarchy users' locations
CREATE POLICY "Enhanced location assignment permissions" ON public.user_location_assignments
FOR ALL
USING (
  -- Super admins can do everything
  (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'super_admin'::user_role
  ))
  OR
  -- Users can manage their own location assignments
  (user_id = auth.uid())
  OR
  -- Higher hierarchy users can manage lower hierarchy users' locations
  (EXISTS (
    SELECT 1
    FROM profiles p1
    JOIN role_hierarchy rh1 ON p1.role = rh1.role
    JOIN profiles p2 ON user_location_assignments.user_id = p2.id
    JOIN role_hierarchy rh2 ON p2.role = rh2.role
    WHERE p1.id = auth.uid() 
    AND rh1.level < rh2.level
  ))
)
WITH CHECK (
  -- Same conditions for inserts/updates
  (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'super_admin'::user_role
  ))
  OR
  (user_id = auth.uid())
  OR
  (EXISTS (
    SELECT 1
    FROM profiles p1
    JOIN role_hierarchy rh1 ON p1.role = rh1.role
    JOIN profiles p2 ON user_location_assignments.user_id = p2.id
    JOIN role_hierarchy rh2 ON p2.role = rh2.role
    WHERE p1.id = auth.uid() 
    AND rh1.level < rh2.level
  ))
);
