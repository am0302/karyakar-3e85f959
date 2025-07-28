
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { 
  MessageCircle, 
  Send, 
  Users, 
  Plus, 
  Search,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ChatRoom = Database['public']['Tables']['chat_rooms']['Row'] & {
  chat_participants?: Array<{
    user_id: string;
    profiles: {
      full_name: string;
      profile_photo_url?: string;
    };
  }>;
  last_message?: {
    content: string;
    created_at: string;
    sender: {
      full_name: string;
    };
  };
};
type Message = Database['public']['Tables']['messages']['Row'] & {
  sender: {
    full_name: string;
    profile_photo_url?: string;
  };
};

// Simple profile type for chat participants
type ChatProfile = {
  id: string;
  full_name: string;
  profile_photo_url?: string;
  role: string;
};

const Communication = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [profiles, setProfiles] = useState<ChatProfile[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [newChatName, setNewChatName] = useState('');
  const [isGroupChat, setIsGroupChat] = useState(false);

  useEffect(() => {
    if (user) {
      fetchChatRooms();
      fetchProfiles();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
    }
  }, [selectedRoom]);

  const setupRealtimeSubscriptions = () => {
    console.log('Setting up realtime subscriptions');
    
    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Message change received:', payload);
          if (selectedRoom && payload.new && (payload.new as any).room_id === selectedRoom.id) {
            fetchMessages(selectedRoom.id);
          }
          fetchChatRooms(); // Refresh rooms to update last message
        }
      )
      .subscribe();

    // Subscribe to chat room changes
    const roomsChannel = supabase
      .channel('chat_rooms')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms'
        },
        (payload) => {
          console.log('Chat room change received:', payload);
          fetchChatRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(roomsChannel);
    };
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, profile_photo_url, role')
        .eq('is_active', true)
        .neq('id', user?.id);

      if (error) throw error;
      console.log('Fetched profiles:', data);
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch user profiles',
        variant: 'destructive',
      });
    }
  };

  const fetchChatRooms = async () => {
    try {
      console.log('Fetching chat rooms for user:', user?.id);
      setLoading(true);
      
      // Get rooms where user is a participant
      const { data: participantRooms, error: participantError } = await supabase
        .from('chat_participants')
        .select(`
          room_id,
          chat_rooms!inner(
            *
          )
        `)
        .eq('user_id', user?.id);

      if (participantError) throw participantError;

      console.log('Participant rooms:', participantRooms);

      const roomIds = participantRooms?.map(p => p.room_id) || [];
      
      if (roomIds.length === 0) {
        setChatRooms([]);
        setLoading(false);
        return;
      }

      // Get full room details with participants
      const { data: rooms, error: roomsError } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          chat_participants!inner(
            user_id,
            profiles!inner(
              full_name,
              profile_photo_url
            )
          )
        `)
        .in('id', roomIds)
        .order('updated_at', { ascending: false });

      if (roomsError) throw roomsError;

      console.log('Fetched chat rooms:', rooms);
      
      // Filter out rooms with query errors and properly type them
      const validRooms = rooms?.filter(room => {
        return room.chat_participants && 
               Array.isArray(room.chat_participants) && 
               room.chat_participants.every(participant => 
                 participant.profiles && 
                 typeof participant.profiles === 'object' && 
                 !('error' in participant.profiles) &&
                 'full_name' in participant.profiles
               );
      }) || [];

      // Transform to proper ChatRoom type
      const transformedRooms: ChatRoom[] = validRooms.map(room => ({
        ...room,
        chat_participants: room.chat_participants.map(participant => ({
          user_id: participant.user_id,
          profiles: {
            full_name: (participant.profiles as any).full_name,
            profile_photo_url: (participant.profiles as any).profile_photo_url
          }
        }))
      }));

      setChatRooms(transformedRooms);
    } catch (error: any) {
      console.error('Error fetching chat rooms:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch chat rooms: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      console.log('Fetching messages for room:', roomId);
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!messages_sender_id_fkey(
            full_name,
            profile_photo_url
          )
        `)
        .eq('room_id', roomId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('Fetched messages:', data);
      
      // Filter out messages with query errors and transform the data
      const validMessages = data?.filter(msg => {
        return msg.profiles && 
               typeof msg.profiles === 'object' && 
               !('error' in msg.profiles) &&
               'full_name' in msg.profiles;
      }) || [];

      const transformedMessages: Message[] = validMessages.map(msg => ({
        ...msg,
        sender: {
          full_name: (msg.profiles as any)?.full_name || 'Unknown User',
          profile_photo_url: (msg.profiles as any)?.profile_photo_url
        }
      }));

      setMessages(transformedMessages);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch messages: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const createNewChat = async () => {
    if (selectedParticipants.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one participant',
        variant: 'destructive',
      });
      return;
    }

    if (isGroupChat && !newChatName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a group name',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Creating new chat with participants:', selectedParticipants);
      
      // Create the chat room
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: isGroupChat ? newChatName : null,
          is_group: isGroupChat,
          created_by: user?.id,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      console.log('Created room:', roomData);

      // Add participants (including the creator)
      const participantsToAdd = [...selectedParticipants, user?.id].filter(Boolean);
      const participantInserts = participantsToAdd.map(userId => ({
        room_id: roomData.id,
        user_id: userId,
      }));

      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert(participantInserts);

      if (participantError) throw participantError;

      console.log('Added participants:', participantInserts);

      toast({
        title: 'Success',
        description: 'New chat created successfully',
      });

      // Reset form and close dialog
      setNewChatName('');
      setSelectedParticipants([]);
      setIsGroupChat(false);
      setShowNewChatDialog(false);

      // Refresh chat rooms
      await fetchChatRooms();
    } catch (error: any) {
      console.error('Error creating chat:', error);
      toast({
        title: 'Error',
        description: `Failed to create chat: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    try {
      console.log('Sending message to room:', selectedRoom.id);
      
      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: selectedRoom.id,
          sender_id: user?.id,
          content: newMessage.trim(),
          message_type: 'text',
        });

      if (error) throw error;

      // Update room's updated_at timestamp
      await supabase
        .from('chat_rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedRoom.id);

      setNewMessage('');
      console.log('Message sent successfully');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: `Failed to send message: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getRoomDisplayName = (room: ChatRoom) => {
    if (room.name) return room.name;
    
    const otherParticipants = room.chat_participants?.filter(p => p.user_id !== user?.id) || [];
    if (otherParticipants.length === 1) {
      return otherParticipants[0].profiles.full_name;
    }
    
    return `Group Chat (${otherParticipants.length + 1} members)`;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading chats...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm">
      {/* Chat List Sidebar */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Chat</DialogTitle>
                  <DialogDescription>
                    Select participants to start a new conversation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="group-chat"
                      checked={isGroupChat}
                      onCheckedChange={setIsGroupChat}
                    />
                    <Label htmlFor="group-chat">Group Chat</Label>
                  </div>
                  
                  {isGroupChat && (
                    <div>
                      <Label>Group Name</Label>
                      <Input
                        value={newChatName}
                        onChange={(e) => setNewChatName(e.target.value)}
                        placeholder="Enter group name"
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label>Select Participants</Label>
                    <SearchableSelect
                      options={profiles.map(p => ({ value: p.id, label: p.full_name }))}
                      value=""
                      onValueChange={(value) => {
                        if (value && !selectedParticipants.includes(value)) {
                          setSelectedParticipants([...selectedParticipants, value]);
                        }
                      }}
                      placeholder="Add participants"
                    />
                    
                    {selectedParticipants.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedParticipants.map(id => {
                          const profile = profiles.find(p => p.id === id);
                          return (
                            <Badge key={id} variant="secondary" className="cursor-pointer"
                              onClick={() => setSelectedParticipants(prev => prev.filter(p => p !== id))}>
                              {profile?.full_name} ×
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  <Button onClick={createNewChat} className="w-full">
                    Create Chat
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {chatRooms.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-sm">Start a new chat to begin messaging</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {chatRooms.map((room) => (
                <div
                  key={room.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedRoom?.id === room.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedRoom(room)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={room.chat_participants?.[0]?.profiles?.profile_photo_url} />
                      <AvatarFallback>
                        {room.is_group ? <Users className="h-4 w-4" /> : getRoomDisplayName(room)[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 truncate">
                          {getRoomDisplayName(room)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTime(room.updated_at)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {room.is_group && `${room.chat_participants?.length || 0} members`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={selectedRoom.chat_participants?.[0]?.profiles?.profile_photo_url} />
                    <AvatarFallback>
                      {selectedRoom.is_group ? <Users className="h-4 w-4" /> : getRoomDisplayName(selectedRoom)[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {getRoomDisplayName(selectedRoom)}
                    </h3>
                    {selectedRoom.is_group && (
                      <p className="text-sm text-gray-600">
                        {selectedRoom.chat_participants?.length || 0} members
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
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
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                      message.sender_id === user?.id ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      {message.sender_id !== user?.id && (
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={message.sender.profile_photo_url} />
                          <AvatarFallback className="text-xs">
                            {message.sender.full_name[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`px-3 py-2 rounded-lg ${
                          message.sender_id === user?.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="min-h-0 resize-none pr-12"
                    rows={1}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p>Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Communication;
