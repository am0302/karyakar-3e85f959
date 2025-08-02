
-- Add RLS policy to allow users to delete chat rooms they created or participate in
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can delete chat rooms" ON chat_rooms
FOR DELETE
USING (
  created_by = auth.uid() OR 
  is_user_participant_in_room(id, auth.uid())
);
