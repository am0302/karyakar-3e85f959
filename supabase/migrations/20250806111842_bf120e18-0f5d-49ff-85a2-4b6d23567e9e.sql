
-- Add notes field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN notes TEXT;

-- Create table for additional karyakar details
CREATE TABLE public.karyakar_additional_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  karyakar_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  education_level TEXT,
  education_institution TEXT,
  education_field TEXT,
  vehicle_types TEXT[], -- Array of vehicle types
  blood_group TEXT,
  marital_status TEXT CHECK (marital_status IN ('married', 'unmarried')),
  satsangi_category TEXT,
  skills TEXT[], -- Array of skills
  additional_info JSONB, -- For any other custom fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(karyakar_id)
);

-- Enable RLS on the new table
ALTER TABLE public.karyakar_additional_details ENABLE ROW LEVEL SECURITY;

-- Create policies for additional details
CREATE POLICY "Users can view additional details based on hierarchy permissions" 
  ON public.karyakar_additional_details 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = karyakar_id 
      AND (
        karyakar_id = auth.uid() OR 
        check_hierarchy_permission(auth.uid(), karyakar_id, 'view')
      )
    )
  );

CREATE POLICY "Users can create additional details based on hierarchy permissions" 
  ON public.karyakar_additional_details 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = karyakar_id 
      AND (
        karyakar_id = auth.uid() OR 
        check_hierarchy_permission(auth.uid(), karyakar_id, 'edit')
      )
    )
  );

CREATE POLICY "Users can update additional details based on hierarchy permissions" 
  ON public.karyakar_additional_details 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = karyakar_id 
      AND (
        karyakar_id = auth.uid() OR 
        check_hierarchy_permission(auth.uid(), karyakar_id, 'edit')
      )
    )
  );

CREATE POLICY "Users can delete additional details based on hierarchy permissions" 
  ON public.karyakar_additional_details 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = karyakar_id 
      AND (
        karyakar_id = auth.uid() OR 
        check_hierarchy_permission(auth.uid(), karyakar_id, 'delete')
      )
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_karyakar_additional_details_karyakar_id ON public.karyakar_additional_details(karyakar_id);
CREATE INDEX idx_profiles_notes ON public.profiles USING gin(to_tsvector('english', notes));
