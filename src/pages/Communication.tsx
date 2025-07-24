
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { Send, MessageCircle, Users, Plus, Search } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  room_id: string;
  created_at: string;
  message_type: string;
  profiles?: {
    full_name: string;
    profile_photo_url?: string;
  } | null;
}

interface ChatRoom {
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

const Communication = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchChatRooms();
      fetchProfiles();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages();
    }
  }, [selectedRoom]);

  const fetchChatRooms = async () => {
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

      const transformedRooms: ChatRoom[] = (data || []).map(room => ({
        ...room,
        chat_participants: Array.isArray(room.chat_participants) 
          ? room.chat_participants.filter(p => p && typeof p === 'object' && !('error' in p))
          : []
      }));

      setChatRooms(transformedRooms);
    } catch (error: any) {
      console.error('Error fetching chat rooms:', error);
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
        .eq('is_active', true)
        .neq('id', user?.id);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
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

      const transformedMessages: Message[] = (data || []).map(message => ({
        ...message,
        profiles: message.profiles && typeof message.profiles === 'object' && !('error' in message.profiles)
          ? message.profiles
          : null
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
    if (!newMessage.trim() || !selectedRoom || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage,
          sender_id: user.id,
          room_id: selectedRoom.id,
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

  const createChatRoom = async () => {
    if (!newRoomName.trim() || !user) return;

    try {
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: newRoomName,
          is_group: selectedParticipants.length > 1,
          created_by: user.id,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add participants including creator
      const participantData = [
        { room_id: roomData.id, user_id: user.id },
        ...selectedParticipants.map(userId => ({
          room_id: roomData.id,
          user_id: userId,
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

      setNewRoomName('');
      setSelectedParticipants([]);
      setShowCreateDialog(false);
      fetchChatRooms();
    } catch (error: any) {
      console.error('Error creating chat room:', error);
      toast({
        title: 'Error',
        description: 'Failed to create chat room',
        variant: 'destructive',
      });
    }
  };

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.sender_id === user?.id;
    const senderName = message.profiles?.full_name || 'Unknown User';
    const profilePhoto = message.profiles?.profile_photo_url;

    return (
      <div
        key={message.id}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwnMessage 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 text-gray-800'
        }`}>
          {!isOwnMessage && (
            <div className="text-xs font-semibold mb-1">{senderName}</div>
          )}
          <div>{message.content}</div>
          <div className={`text-xs mt-1 ${
            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {new Date(message.created_at).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading communication...</div>;
  }

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-1/3 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">Messages</h1>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Chat Room</DialogTitle>
                  <DialogDescription>
                    Create a new chat room and invite participants
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Room Name</Label>
                    <Input
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder="Enter room name"
                    />
                  </div>
                  <div>
                    <Label>Participants</Label>
                    <Select 
                      value={selectedParticipants.join(',')} 
                      onValueChange={(value) => setSelectedParticipants(value ? value.split(',') : [])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select participants" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map(profile => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={createChatRoom} className="flex-1">
                      Create Room
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Chat Room List */}
        <div className="flex-1 overflow-y-auto">
          {chatRooms.map(room => (
            <div
              key={room.id}
              className={`p-4 border-b cursor-pointer hover:bg-gray-100 ${
                selectedRoom?.id === room.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => setSelectedRoom(room)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  {room.is_group ? <Users className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{room.name}</div>
                  <div className="text-sm text-gray-500">
                    {room.chat_participants?.length || 0} participants
                  </div>
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
            <div className="p-4 border-b bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  {selectedRoom.is_group ? <Users className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
                </div>
                <div>
                  <div className="font-medium">{selectedRoom.name}</div>
                  <div className="text-sm text-gray-500">
                    {selectedRoom.chat_participants?.length || 0} participants
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.map(renderMessage)}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No chat selected</h3>
              <p className="text-gray-600">Choose a chat room to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Communication;
