
-- First, let's check what user_role enum values exist and add missing ones
DO $$ 
BEGIN
    -- Add missing enum values if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin' AND enumtypid = 'user_role'::regtype) THEN
        ALTER TYPE user_role ADD VALUE 'admin';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'moderator' AND enumtypid = 'user_role'::regtype) THEN
        ALTER TYPE user_role ADD VALUE 'moderator';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'user' AND enumtypid = 'user_role'::regtype) THEN
        ALTER TYPE user_role ADD VALUE 'user';
    END IF;
END $$;

-- Update custom_roles table to include type and status columns
ALTER TABLE custom_roles 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Create a function to sync custom roles with user_role enum
CREATE OR REPLACE FUNCTION sync_custom_roles_with_enum()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    role_record RECORD;
BEGIN
    -- Insert system roles if they don't exist
    INSERT INTO custom_roles (role_name, display_name, is_system_role, type, status)
    SELECT 'super_admin', 'Super Admin', true, 'system', 'active'
    WHERE NOT EXISTS (SELECT 1 FROM custom_roles WHERE role_name = 'super_admin');
    
    INSERT INTO custom_roles (role_name, display_name, is_system_role, type, status)
    SELECT 'sant_nirdeshak', 'Sant Nirdeshak', true, 'system', 'active'
    WHERE NOT EXISTS (SELECT 1 FROM custom_roles WHERE role_name = 'sant_nirdeshak');
    
    INSERT INTO custom_roles (role_name, display_name, is_system_role, type, status)
    SELECT 'sah_nirdeshak', 'Sah Nirdeshak', true, 'system', 'active'
    WHERE NOT EXISTS (SELECT 1 FROM custom_roles WHERE role_name = 'sah_nirdeshak');
    
    INSERT INTO custom_roles (role_name, display_name, is_system_role, type, status)
    SELECT 'mandal_sanchalak', 'Mandal Sanchalak', true, 'system', 'active'
    WHERE NOT EXISTS (SELECT 1 FROM custom_roles WHERE role_name = 'mandal_sanchalak');
    
    INSERT INTO custom_roles (role_name, display_name, is_system_role, type, status)
    SELECT 'karyakar', 'Karyakar', true, 'system', 'active'
    WHERE NOT EXISTS (SELECT 1 FROM custom_roles WHERE role_name = 'karyakar');
    
    INSERT INTO custom_roles (role_name, display_name, is_system_role, type, status)
    SELECT 'sevak', 'Sevak', true, 'system', 'active'
    WHERE NOT EXISTS (SELECT 1 FROM custom_roles WHERE role_name = 'sevak');
END;
$$;

-- Run the sync function
SELECT sync_custom_roles_with_enum();

-- Update role_hierarchy table to use existing roles
INSERT INTO role_hierarchy (role, level, parent_role)
SELECT 'super_admin', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM role_hierarchy WHERE role = 'super_admin');

INSERT INTO role_hierarchy (role, level, parent_role)
SELECT 'sant_nirdeshak', 2, 'super_admin'
WHERE NOT EXISTS (SELECT 1 FROM role_hierarchy WHERE role = 'sant_nirdeshak');

INSERT INTO role_hierarchy (role, level, parent_role)
SELECT 'sah_nirdeshak', 3, 'sant_nirdeshak'
WHERE NOT EXISTS (SELECT 1 FROM role_hierarchy WHERE role = 'sah_nirdeshak');

INSERT INTO role_hierarchy (role, level, parent_role)
SELECT 'mandal_sanchalak', 4, 'sah_nirdeshak'
WHERE NOT EXISTS (SELECT 1 FROM role_hierarchy WHERE role = 'mandal_sanchalak');

INSERT INTO role_hierarchy (role, level, parent_role)
SELECT 'karyakar', 5, 'mandal_sanchalak'
WHERE NOT EXISTS (SELECT 1 FROM role_hierarchy WHERE role = 'karyakar');

INSERT INTO role_hierarchy (role, level, parent_role)
SELECT 'sevak', 6, 'karyakar'
WHERE NOT EXISTS (SELECT 1 FROM role_hierarchy WHERE role = 'sevak');
