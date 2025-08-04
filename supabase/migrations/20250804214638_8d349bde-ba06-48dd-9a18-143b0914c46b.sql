
-- First, let's get all the active role names from custom_roles and add them to the user_role enum
-- We need to alter the enum to include all roles that exist in custom_roles

-- Add the missing roles to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'nirikshak';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Bal_Sanyojak';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'bal_sanyojak';

-- Let's also add some other common roles that might be in custom_roles
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'coordinator';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'volunteer';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';

-- Update the sync function to properly sync all custom roles with the enum
CREATE OR REPLACE FUNCTION public.sync_custom_roles_with_enum()
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    role_record RECORD;
    enum_exists BOOLEAN;
BEGIN
    -- Insert system roles if they don't exist
    INSERT INTO custom_roles (role_name, display_name, is_system_role, is_active)
    SELECT 'super_admin', 'Super Admin', true, true
    WHERE NOT EXISTS (SELECT 1 FROM custom_roles WHERE role_name = 'super_admin');
    
    INSERT INTO custom_roles (role_name, display_name, is_system_role, is_active)
    SELECT 'sant_nirdeshak', 'Sant Nirdeshak', true, true
    WHERE NOT EXISTS (SELECT 1 FROM custom_roles WHERE role_name = 'sant_nirdeshak');
    
    INSERT INTO custom_roles (role_name, display_name, is_system_role, is_active)
    SELECT 'sah_nirdeshak', 'Sah Nirdeshak', true, true
    WHERE NOT EXISTS (SELECT 1 FROM custom_roles WHERE role_name = 'sah_nirdeshak');
    
    INSERT INTO custom_roles (role_name, display_name, is_system_role, is_active)
    SELECT 'mandal_sanchalak', 'Mandal Sanchalak', true, true
    WHERE NOT EXISTS (SELECT 1 FROM custom_roles WHERE role_name = 'mandal_sanchalak');
    
    INSERT INTO custom_roles (role_name, display_name, is_system_role, is_active)
    SELECT 'karyakar', 'Karyakar', true, true
    WHERE NOT EXISTS (SELECT 1 FROM custom_roles WHERE role_name = 'karyakar');
    
    INSERT INTO custom_roles (role_name, display_name, is_system_role, is_active)
    SELECT 'sevak', 'Sevak', true, true
    WHERE NOT EXISTS (SELECT 1 FROM custom_roles WHERE role_name = 'sevak');

    -- Note: PostgreSQL doesn't allow dynamic ALTER TYPE in functions
    -- So we'll log which roles need to be added manually
    FOR role_record IN 
        SELECT role_name FROM custom_roles 
        WHERE is_active = true 
        AND role_name NOT IN (
            SELECT enumlabel FROM pg_enum 
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
            WHERE pg_type.typname = 'user_role'
        )
    LOOP
        RAISE NOTICE 'Role % needs to be added to user_role enum manually', role_record.role_name;
    END LOOP;
END;
$function$;
