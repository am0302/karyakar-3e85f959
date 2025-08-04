
-- First, let's ensure all the roles mentioned are in the custom_roles table
INSERT INTO custom_roles (role_name, display_name, is_system_role, type, status, level)
VALUES 
  ('BalSanyojak', 'Bal Sanyojak', false, 'custom', 'active', 7),
  ('Nirdeshak', 'Nirdeshak', false, 'custom', 'active', 2),
  ('Nirikshak', 'Nirikshak', false, 'custom', 'active', 4),
  ('Sah_Nirikshak', 'Sah Nirikshak', false, 'custom', 'active', 5)
ON CONFLICT (role_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  is_active = true,
  level = EXCLUDED.level;

-- Update the user_role enum to include all possible roles from custom_roles
-- First, we need to add the new role values to the enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'BalSanyojak';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Nirdeshak';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Nirikshak';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Sah_Nirikshak';

-- Create a function to sync user_role enum with custom_roles table
CREATE OR REPLACE FUNCTION sync_user_role_enum()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    role_record RECORD;
    enum_values text[];
BEGIN
    -- Get current enum values
    SELECT array_agg(enumlabel ORDER BY enumsortorder) INTO enum_values
    FROM pg_enum
    WHERE enumtypid = 'user_role'::regtype;
    
    -- Add any missing roles from custom_roles to the enum
    FOR role_record IN 
        SELECT role_name 
        FROM custom_roles 
        WHERE is_active = true 
        AND role_name != ALL(enum_values)
    LOOP
        BEGIN
            EXECUTE format('ALTER TYPE user_role ADD VALUE IF NOT EXISTS %L', role_record.role_name);
        EXCEPTION
            WHEN duplicate_object THEN
                -- Role already exists, skip
                NULL;
        END;
    END LOOP;
END;
$$;

-- Create a trigger to automatically sync roles when custom_roles is updated
CREATE OR REPLACE FUNCTION trigger_sync_user_role_enum()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM sync_user_role_enum();
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS sync_enum_on_custom_roles_change ON custom_roles;
CREATE TRIGGER sync_enum_on_custom_roles_change
    AFTER INSERT OR UPDATE OR DELETE ON custom_roles
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_sync_user_role_enum();

-- Run the sync function once to ensure all current roles are in the enum
SELECT sync_user_role_enum();
