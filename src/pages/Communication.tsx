
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Search, 
  Users,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile
} from 'lucide-react';

interface ChatRoom {
  id: string;
  name: string;
  is_group: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  chat_participants?: {
    user_id: string;
    profiles: {
      full_name: string;
      profile_photo_url?: string;
    };
  }[];
  last_message?: {
    content: string;
    created_at: string;
    sender: {
      full_name: string;
    };
  };
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  room_id: string;
  created_at: string;
  message_type: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  sender?: {
    full_name: string;
    profile_photo_url?: string;
  };
}

interface Profile {
  id: string;
  full_name: string;
  profile_photo_url?: string;
}

const Communication = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchRooms();
      fetchProfiles();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages();
    }
  }, [selectedRoom]);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          chat_participants(
            user_id,
            profiles(full_name, profile_photo_url)
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Transform the data to handle potential query errors
      const transformedRooms = (data || []).map(room => ({
        ...room,
        chat_participants: Array.isArray(room.chat_participants) 
          ? room.chat_participants.filter(p => p.profiles && typeof p.profiles === 'object' && !p.profiles.error)
          : []
      }));

      setRooms(transformedRooms);
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

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, profile_photo_url')
        .eq('is_active', true);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch profiles',
        variant: 'destructive',
      });
    }
  };

  const fetchMessages = async () => {
    if (!selectedRoom) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles(full_name, profile_photo_url)
        `)
        .eq('room_id', selectedRoom.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform the data to handle potential query errors
      const transformedMessages = (data || []).map(message => ({
        ...message,
        sender: message.profiles && typeof message.profiles === 'object' && !message.profiles.error
          ? {
              full_name: message.profiles.full_name || 'Unknown',
              profile_photo_url: message.profiles.profile_photo_url || undefined
            }
          : {
              full_name: 'Unknown',
              profile_photo_url: undefined
            }
      }));

      setMessages(transformedMessages);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch messages',
        variant: 'destructive',
      });
    }
  };

  const sendMessage = async () => {
    if (!selectedRoom || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage,
          sender_id: user?.id,
          room_id: selectedRoom.id,
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');
      fetchMessages();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim() || selectedParticipants.length === 0) return;

    try {
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: newRoomName,
          is_group: selectedParticipants.length > 1,
          created_by: user?.id
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add participants including the creator
      const participants = [
        { room_id: room.id, user_id: user?.id },
        ...selectedParticipants.map(userId => ({
          room_id: room.id,
          user_id: userId
        }))
      ];

      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert(participants);

      if (participantError) throw participantError;

      toast({
        title: 'Success',
        description: 'Chat room created successfully',
      });

      setNewRoomName('');
      setSelectedParticipants([]);
      setShowCreateRoom(false);
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

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoomDisplayName = (room: ChatRoom) => {
    if (room.is_group) {
      return room.name;
    }
    
    const otherParticipant = room.chat_participants?.find(p => p.user_id !== user?.id);
    return otherParticipant?.profiles?.full_name || 'Unknown User';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading communication...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* Sidebar */}
      <div className="w-1/3 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Messages</h1>
            <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Chat Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Input
                      placeholder="Room name"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Participants</label>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {profiles.filter(p => p.id !== user?.id).map(profile => (
                        <div key={profile.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={profile.id}
                            checked={selectedParticipants.includes(profile.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedParticipants([...selectedParticipants, profile.id]);
                              } else {
                                setSelectedParticipants(selectedParticipants.filter(id => id !== profile.id));
                              }
                            }}
                          />
                          <label htmlFor={profile.id} className="text-sm">
                            {profile.full_name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={createRoom} className="flex-1">
                      Create Room
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateRoom(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredRooms.map(room => (
            <div
              key={room.id}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                selectedRoom?.id === room.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => setSelectedRoom(room)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {room.is_group ? (
                    <Users className="h-5 w-5 text-gray-600" />
                  ) : (
                    <MessageSquare className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{getRoomDisplayName(room)}</h3>
                  <p className="text-sm text-gray-600 truncate">
                    {room.last_message?.content || 'No messages yet'}
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  {room.last_message?.created_at && new Date(room.last_message.created_at).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {selectedRoom.is_group ? (
                    <Users className="h-5 w-5 text-gray-600" />
                  ) : (
                    <MessageSquare className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <h2 className="font-medium">{getRoomDisplayName(selectedRoom)}</h2>
                  <p className="text-sm text-gray-600">
                    {selectedRoom.is_group ? 
                      `${selectedRoom.chat_participants?.length || 0} members` : 
                      'Online'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === user?.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    {message.sender_id !== user?.id && (
                      <p className="text-xs font-medium mb-1">
                        {message.sender?.full_name || 'Unknown'}
                      </p>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button variant="ghost" size="sm">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button onClick={sendMessage} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-600">Choose a chat room to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Communication;
