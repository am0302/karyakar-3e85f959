
-- Add table to store app settings
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for super admins to manage app settings
CREATE POLICY "Super admins can manage app settings" ON public.app_settings
FOR ALL USING (get_current_user_role() = 'super_admin'::user_role);

-- Insert default setting for Google sign-in
INSERT INTO public.app_settings (key, value, description) 
VALUES ('google_signin_enabled', 'true'::jsonb, 'Enable/disable Google sign-in option');

-- Add password reset functionality columns to profiles if needed (they might already exist)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password_reset_token uuid,
ADD COLUMN IF NOT EXISTS password_reset_expires_at timestamp with time zone;
