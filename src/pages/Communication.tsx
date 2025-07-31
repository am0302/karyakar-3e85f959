
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  MessageCircle, 
  Users, 
  Calendar, 
  Edit, 
  Trash2,
  Send,
  Paperclip,
  Phone,
  Video
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type ChatRoom = {
  id: string;
  name: string;
  is_group: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  mandir_id?: string;
  kshetra_id?: string;
  village_id?: string;
  mandal_id?: string;
  creator_profile?: { full_name: string; role: string };
  participants?: any[];
};

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  message_type: string;
  file_url?: string;
  file_name?: string;
  sender_profile?: { full_name: string };
};

type Profile = {
  id: string;
  full_name: string;
  role: string;
  profile_photo_url?: string;
};

const Communication = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state for creating/editing rooms
  const [roomForm, setRoomForm] = useState({
    name: '',
    is_group: true,
    selectedParticipants: [] as string[]
  });

  const isSuperAdmin = user?.role === 'super_admin';

  // Role hierarchy levels for permission checking
  const roleHierarchy: Record<string, number> = {
    'super_admin': 0,
    'sant_nirdeshak': 1,
    'sah_nirdeshak': 2,
    'mandal_sanchalak': 3,
    'sevak': 4
  };

  useEffect(() => {
    if (user) {
      fetchRooms();
      fetchProfiles();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
    }
  }, [selectedRoom]);

  const fetchProfiles = async () => {
    try {
      console.log('Fetching profiles for user:', user?.id);
      
      // For super admin, get all active profiles
      if (user?.role === 'super_admin') {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role, profile_photo_url')
          .eq('is_active', true)
          .order('full_name');

        if (error) {
          console.error('Error fetching profiles for super admin:', error);
          throw error;
        }
        setProfiles(data || []);
      } else {
        // For non-super admin users, get profiles they can see
        // First try to get all profiles - RLS will filter based on permissions
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role, profile_photo_url')
          .eq('is_active', true)
          .order('full_name');

        if (error) {
          console.error('Error fetching profiles:', error);
          // If RLS blocks access, create a fallback with current user
          const fallbackProfiles = user ? [{
            id: user.id,
            full_name: user.full_name || 'You',
            role: user.role || 'sevak',
            profile_photo_url: user.profile_photo_url
          }] : [];
          setProfiles(fallbackProfiles);
        } else {
          // Filter profiles based on role hierarchy if needed
          const currentUserRole = user?.role || 'sevak';
          const currentUserLevel = roleHierarchy[currentUserRole] || 999;
          
          const filteredProfiles = (data || []).filter(profile => {
            const profileLevel = roleHierarchy[profile.role] || 999;
            // Can see profiles at same level or lower, plus always include self
            return profile.id === user?.id || profileLevel >= currentUserLevel;
          });
          
          // Always include current user if not in the list
          const hasCurrentUser = filteredProfiles.some(p => p.id === user?.id);
          if (!hasCurrentUser && user) {
            filteredProfiles.unshift({
              id: user.id,
              full_name: user.full_name || 'You',
              role: user.role || 'sevak',
              profile_photo_url: user.profile_photo_url
            });
          }
          
          setProfiles(filteredProfiles);
        }
      }
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      // Fallback to at least show current user
      if (user) {
        setProfiles([{
          id: user.id,
          full_name: user.full_name || 'You',
          role: user.role || 'sevak',
          profile_photo_url: user.profile_photo_url
        }]);
      }
    }
  };

  const fetchRooms = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          creator_profile:profiles!chat_rooms_created_by_fkey(full_name, role)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (error: any) {
      console.error('Error fetching rooms:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch chat rooms',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(full_name)
        `)
        .eq('room_id', roomId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    }
  };

  const createRoom = async () => {
    if (!user || !roomForm.name.trim()) return;

    try {
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: roomForm.name,
          is_group: roomForm.is_group,
          created_by: user.id
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add participants
      const participantData = [
        { room_id: roomData.id, user_id: user.id },
        ...roomForm.selectedParticipants.map(participantId => ({
          room_id: roomData.id,
          user_id: participantId
        }))
      ];

      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert(participantData);

      if (participantError) throw participantError;

      toast({
        title: 'Success',
        description: 'Chat room created successfully',
      });

      setShowCreateDialog(false);
      setRoomForm({ name: '', is_group: true, selectedParticipants: [] });
      fetchRooms();
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast({
        title: 'Error',
        description: 'Failed to create chat room',
        variant: 'destructive',
      });
    }
  };

  const updateRoom = async () => {
    if (!editingRoom || !roomForm.name.trim()) return;

    try {
      const { error } = await supabase
        .from('chat_rooms')
        .update({
          name: roomForm.name,
          is_group: roomForm.is_group
        })
        .eq('id', editingRoom.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Chat room updated successfully',
      });

      setShowEditDialog(false);
      setEditingRoom(null);
      fetchRooms();
    } catch (error: any) {
      console.error('Error updating room:', error);
      toast({
        title: 'Error',
        description: 'Failed to update chat room',
        variant: 'destructive',
      });
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this chat room? This action cannot be undone.')) return;

    try {
      console.log('Attempting to delete room:', roomId);
      
      // Step 1: Delete all participants for this room
      console.log('Deleting participants for room:', roomId);
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .delete()
        .eq('room_id', roomId);

      if (participantsError) {
        console.error('Error deleting participants:', participantsError);
        throw new Error(`Failed to delete participants: ${participantsError.message}`);
      }

      // Step 2: Delete all messages for this room
      console.log('Deleting messages for room:', roomId);
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('room_id', roomId);

      if (messagesError) {
        console.error('Error deleting messages:', messagesError);
        throw new Error(`Failed to delete messages: ${messagesError.message}`);
      }

      // Step 3: Finally delete the room itself
      console.log('Deleting room:', roomId);
      const { error: roomError } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', roomId);

      if (roomError) {
        console.error('Error deleting room:', roomError);
        throw new Error(`Failed to delete room: ${roomError.message}`);
      }

      toast({
        title: 'Success',
        description: 'Chat room deleted successfully',
      });

      // Clear selected room if it was deleted
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(null);
        setMessages([]);
      }

      // Refresh rooms list
      await fetchRooms();
    } catch (error: any) {
      console.error('Error deleting room:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete chat room. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedRoom || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: selectedRoom.id,
          sender_id: user.id,
          content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');
      fetchMessages(selectedRoom.id);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const canEditRoom = (room: ChatRoom) => {
    if (isSuperAdmin) return true;
    if (room.created_by === user?.id) return true;
    
    // Check if current user has higher hierarchy than room creator
    const currentUserRole = user?.role || 'sevak';
    const roomCreatorRole = room.creator_profile?.role || 'sevak';
    
    const currentUserLevel = roleHierarchy[currentUserRole] || 999;
    const roomCreatorLevel = roleHierarchy[roomCreatorRole] || 999;
    
    return currentUserLevel < roomCreatorLevel;
  };

  const canDeleteRoom = (room: ChatRoom) => {
    return canEditRoom(room); // Same logic for delete as edit
  };

  const openEditDialog = (room: ChatRoom) => {
    setEditingRoom(room);
    setRoomForm({
      name: room.name || '',
      is_group: room.is_group,
      selectedParticipants: []
    });
    setShowEditDialog(true);
  };

  const handleParticipantToggle = (participantId: string) => {
    setRoomForm(prev => ({
      ...prev,
      selectedParticipants: prev.selectedParticipants.includes(participantId)
        ? prev.selectedParticipants.filter(id => id !== participantId)
        : [...prev.selectedParticipants, participantId]
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading communications...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Chat Rooms List */}
      <div className="w-1/3 border-r">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Chat Rooms</h2>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Chat Room</DialogTitle>
                <DialogDescription>
                  Create a new chat room and add participants
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Room Name</label>
                  <Input
                    value={roomForm.name}
                    onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                    placeholder="Enter room name"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={roomForm.is_group}
                    onCheckedChange={(checked) => setRoomForm({ ...roomForm, is_group: !!checked })}
                  />
                  <label className="text-sm">Group Chat</label>
                </div>
                <div>
                  <label className="text-sm font-medium">Participants ({profiles.length} available)</label>
                  <ScrollArea className="h-32 border rounded-lg p-2">
                    {profiles.length === 0 ? (
                      <div className="text-sm text-gray-500 p-2">No participants available</div>
                    ) : (
                      profiles.map((profile) => (
                        <div key={profile.id} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            checked={roomForm.selectedParticipants.includes(profile.id)}
                            onCheckedChange={() => handleParticipantToggle(profile.id)}
                          />
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={profile.profile_photo_url || ''} />
                            <AvatarFallback className="text-xs">
                              {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{profile.full_name}</span>
                          <Badge variant="outline" className="text-xs">{profile.role}</Badge>
                        </div>
                      ))
                    )}
                  </ScrollArea>
                </div>
                <Button onClick={createRoom} className="w-full" disabled={!roomForm.name.trim()}>
                  Create Room
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="h-full">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                selectedRoom?.id === room.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => setSelectedRoom(room)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {room.is_group ? (
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-green-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {room.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      by {room.creator_profile?.full_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(room.updated_at), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {canEditRoom(room) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(room);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                  {canDeleteRoom(room) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRoom(room.id);
                      }}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {room.is_group ? 'Group' : 'Direct'}
                </Badge>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {selectedRoom.is_group ? (
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="h-6 w-6 text-green-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{selectedRoom.name}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedRoom.is_group ? 'Group Chat' : 'Direct Message'}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_id === user?.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.sender_id !== user?.id && (
                        <p className="text-xs font-medium mb-1">
                          {message.sender_profile?.full_name}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender_id === user?.id
                            ? 'text-blue-100'
                            : 'text-gray-500'
                        }`}
                      >
                        {format(new Date(message.created_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a chat room
              </h3>
              <p className="text-gray-500">
                Choose a chat room from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Room Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Chat Room</DialogTitle>
            <DialogDescription>
              Update chat room details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Room Name</label>
              <Input
                value={roomForm.name}
                onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                placeholder="Enter room name"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={roomForm.is_group}
                onCheckedChange={(checked) => setRoomForm({ ...roomForm, is_group: !!checked })}
              />
              <label className="text-sm">Group Chat</label>
            </div>
            <div className="flex gap-2">
              <Button onClick={updateRoom} className="flex-1">
                Update Room
              </Button>
              <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Communication;
