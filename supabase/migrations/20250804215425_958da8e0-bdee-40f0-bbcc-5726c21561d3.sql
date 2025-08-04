
-- Create a function to test if a role name exists in the user_role enum
CREATE OR REPLACE FUNCTION public.test_role_exists(_role_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
    -- Try to cast the role name to user_role enum
    -- If it fails, the role doesn't exist in the enum
    PERFORM _role_name::user_role;
    RETURN true;
EXCEPTION
    WHEN invalid_text_representation THEN
        RETURN false;
END;
$$;
