
-- Create enum types for better data integrity
CREATE TYPE public.user_role AS ENUM ('super_admin', 'sant_nirdeshak', 'sah_nirdeshak', 'mandal_sanchalak', 'karyakar', 'sevak');
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE public.task_type AS ENUM ('personal', 'delegated', 'broadcasted');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create Mandirs table (top-level entity)
CREATE TABLE public.mandirs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  contact_person TEXT,
  contact_number TEXT,
  email TEXT,
  established_date DATE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Kshetras table (group of villages under a mandir)
CREATE TABLE public.kshetras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  mandir_id UUID REFERENCES public.mandirs(id) ON DELETE CASCADE NOT NULL,
  description TEXT,
  contact_person TEXT,
  contact_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Villages table (contains multiple mandals)
CREATE TABLE public.villages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  kshetra_id UUID REFERENCES public.kshetras(id) ON DELETE CASCADE NOT NULL,
  district TEXT,
  state TEXT,
  pincode TEXT,
  population INTEGER,
  contact_person TEXT,
  contact_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Mandals table (organizational unit in a village)
CREATE TABLE public.mandals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  village_id UUID REFERENCES public.villages(id) ON DELETE CASCADE NOT NULL,
  description TEXT,
  meeting_day TEXT,
  meeting_time TIME,
  contact_person TEXT,
  contact_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Professions table (master data)
CREATE TABLE public.professions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Seva Types table (master data)
CREATE TABLE public.seva_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create User Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  whatsapp_number TEXT,
  date_of_birth DATE,
  age INTEGER,
  profession_id UUID REFERENCES public.professions(id),
  mandir_id UUID REFERENCES public.mandirs(id),
  kshetra_id UUID REFERENCES public.kshetras(id),
  village_id UUID REFERENCES public.villages(id),
  mandal_id UUID REFERENCES public.mandals(id),
  seva_type_id UUID REFERENCES public.seva_types(id),
  role public.user_role NOT NULL DEFAULT 'sevak',
  profile_photo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_whatsapp_same_as_mobile BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create User Permissions table for granular access control
CREATE TABLE public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  module TEXT NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_add BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  scope_mandir_id UUID REFERENCES public.mandirs(id),
  scope_kshetra_id UUID REFERENCES public.kshetras(id),
  scope_village_id UUID REFERENCES public.villages(id),
  scope_mandal_id UUID REFERENCES public.mandals(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module)
);

-- Create Tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  task_type public.task_type NOT NULL DEFAULT 'personal',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  status public.task_status NOT NULL DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  assigned_by UUID REFERENCES public.profiles(id) NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id),
  mandir_id UUID REFERENCES public.mandirs(id),
  kshetra_id UUID REFERENCES public.kshetras(id),
  village_id UUID REFERENCES public.villages(id),
  mandal_id UUID REFERENCES public.mandals(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Task Comments table
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Chat Rooms table
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  is_group BOOLEAN NOT NULL DEFAULT false,
  mandir_id UUID REFERENCES public.mandirs(id),
  kshetra_id UUID REFERENCES public.kshetras(id),
  village_id UUID REFERENCES public.villages(id),
  mandal_id UUID REFERENCES public.mandals(id),
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Chat Participants table
CREATE TABLE public.chat_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create Messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text',
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default professions
INSERT INTO public.professions (name, description) VALUES
('Teacher', 'Education professional'),
('Engineer', 'Technical professional'),
('Doctor', 'Medical professional'),
('Business Owner', 'Entrepreneur'),
('Software Developer', 'IT professional'),
('Government Employee', 'Public sector employee'),
('Student', 'Currently studying'),
('Retired', 'Retired professional'),
('Homemaker', 'Managing household'),
('Other', 'Other profession');

-- Insert default seva types
INSERT INTO public.seva_types (name, description) VALUES
('Dharmik Seva', 'Religious services'),
('Sabha Seva', 'Assembly services'),
('Bal Seva', 'Children services'),
('Yuvak Seva', 'Youth services'),
('Mahila Seva', 'Women services'),
('Ghar Sabha', 'Home assembly'),
('Prasadam Seva', 'Food distribution'),
('Cleaning Seva', 'Maintenance services'),
('Technical Seva', 'Technical support'),
('Other', 'Other seva types');

-- Enable Row Level Security on all tables
ALTER TABLE public.mandirs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kshetras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mandals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seva_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles (users can see their own profile and admins can see all)
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Super admins can view all profiles" ON public.profiles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Create policies for master data (readable by all authenticated users)
CREATE POLICY "Authenticated users can view mandirs" ON public.mandirs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view kshetras" ON public.kshetras FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view villages" ON public.villages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view mandals" ON public.mandals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view professions" ON public.professions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view seva types" ON public.seva_types FOR SELECT TO authenticated USING (true);

-- Create policies for tasks (users can see tasks assigned to them or created by them)
CREATE POLICY "Users can view their tasks" ON public.tasks FOR SELECT USING (
  auth.uid() = assigned_to OR auth.uid() = assigned_by
);
CREATE POLICY "Users can create tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = assigned_by);
CREATE POLICY "Users can update their tasks" ON public.tasks FOR UPDATE USING (
  auth.uid() = assigned_to OR auth.uid() = assigned_by
);

-- Create policies for task comments
CREATE POLICY "Users can view task comments" ON public.task_comments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_id AND (t.assigned_to = auth.uid() OR t.assigned_by = auth.uid())
  )
);
CREATE POLICY "Users can add task comments" ON public.task_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for chat (users can only access chats they're part of)
CREATE POLICY "Users can view their chat rooms" ON public.chat_rooms FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants cp 
    WHERE cp.room_id = id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view chat participants" ON public.chat_participants FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.chat_participants cp 
    WHERE cp.room_id = room_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view messages in their rooms" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants cp 
    WHERE cp.room_id = room_id AND cp.user_id = auth.uid()
  )
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, mobile_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'mobile_number', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for chat functionality
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.task_comments REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
