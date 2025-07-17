
-- Create a security definer function to check if user is participant in a room
CREATE OR REPLACE FUNCTION public.is_user_participant_in_room(room_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.chat_participants 
    WHERE chat_participants.room_id = is_user_participant_in_room.room_id 
    AND chat_participants.user_id = is_user_participant_in_room.user_id
  );
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view chat participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can create chat participants" ON public.chat_participants;

-- Create new safe policies using the security definer function
CREATE POLICY "Users can view chat participants"
ON public.chat_participants
FOR SELECT
USING (
  user_id = auth.uid() OR 
  public.is_user_participant_in_room(room_id, auth.uid())
);

CREATE POLICY "Users can create chat participants"
ON public.chat_participants
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Fix chat_rooms policy as well
DROP POLICY IF EXISTS "Users can create and view chat rooms" ON public.chat_rooms;

CREATE POLICY "Users can view chat rooms"
ON public.chat_rooms
FOR SELECT
USING (
  created_by = auth.uid() OR 
  public.is_user_participant_in_room(id, auth.uid())
);

CREATE POLICY "Users can create chat rooms"
ON public.chat_rooms
FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update chat rooms"
ON public.chat_rooms
FOR UPDATE
USING (
  created_by = auth.uid() OR 
  public.is_user_participant_in_room(id, auth.uid())
);
