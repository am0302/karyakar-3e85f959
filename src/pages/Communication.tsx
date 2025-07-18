
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { 
  MessageCircle, 
  Send, 
  Plus, 
  Users,
  Search,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';

type ChatRoom = {
  id: string;
  name: string | null;
  is_group: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  participant_count?: number;
  last_message?: string;
  last_message_time?: string;
};

type Message = {
  id: string;
  content: string | null;
  sender_id: string;
  room_id: string;
  created_at: string;
  message_type: string;
  sender_name?: string;
  is_deleted: boolean;
};

type Profile = {
  id: string;
  full_name: string;
  email?: string;
};

const Communication = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      initializeCommunication();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
      subscribeToMessages(selectedRoom.id);
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeCommunication = async () => {
    await Promise.all([
      fetchRooms(),
      fetchProfiles()
    ]);
    setLoading(false);
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('is_active', true)
        .neq('id', user?.id);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchRooms = async () => {
    if (!user) return;

    try {
      // Get all rooms where user is a participant
      const { data: participantRooms, error: participantError } = await supabase
        .from('chat_participants')
        .select(`
          room_id,
          chat_rooms:room_id (
            id,
            name,
            is_group,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      const roomsData = participantRooms?.map(p => p.chat_rooms).filter(Boolean) || [];
      
      // Get participant counts and last messages for each room
      const enrichedRooms = await Promise.all(
        roomsData.map(async (room: any) => {
          // Get participant count
          const { count } = await supabase
            .from('chat_participants')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('room_id', room.id)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...room,
            participant_count: count || 0,
            last_message: lastMessage?.content || null,
            last_message_time: lastMessage?.created_at || null
          };
        })
      );

      setRooms(enrichedRooms);
    } catch (error: any) {
      console.error('Error fetching rooms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat rooms',
        variant: 'destructive',
      });
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:sender_id (
            full_name
          )
        `)
        .eq('room_id', roomId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const enrichedMessages = data?.map(msg => ({
        ...msg,
        sender_name: msg.profiles?.full_name || 'Unknown User'
      })) || [];

      setMessages(enrichedMessages);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    }
  };

  const subscribeToMessages = (roomId: string) => {
    const channel = supabase
      .channel(`messages-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          // Fetch the sender's profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', payload.new.sender_id)
            .single();

          const newMessage = {
            ...payload.new,
            sender_name: profile?.full_name || 'Unknown User'
          } as Message;

          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createOneOnOneChat = async (profileId: string) => {
    if (!user) return;

    try {
      // Check if a room already exists between these two users
      const { data: existingParticipants } = await supabase
        .from('chat_participants')
        .select(`
          room_id,
          chat_rooms:room_id (
            id,
            is_group
          )
        `)
        .eq('user_id', user.id);

      // Find a one-on-one room that includes both users
      let existingRoomId = null;
      if (existingParticipants) {
        for (const participant of existingParticipants) {
          if (participant.chat_rooms && !participant.chat_rooms.is_group) {
            const { count } = await supabase
              .from('chat_participants')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', participant.room_id)
              .in('user_id', [user.id, profileId]);

            if (count === 2) {
              existingRoomId = participant.room_id;
              break;
            }
          }
        }
      }

      if (existingRoomId) {
        // Room exists, select it
        const existingRoom = rooms.find(r => r.id === existingRoomId);
        if (existingRoom) {
          setSelectedRoom(existingRoom);
          return;
        }
      }

      // Create new room
      const { data: newRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: null,
          is_group: false,
          created_by: user.id
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add participants
      const participants = [
        { room_id: newRoom.id, user_id: user.id },
        { room_id: newRoom.id, user_id: profileId }
      ];

      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert(participants);

      if (participantError) throw participantError;

      // Refresh rooms and select the new one
      await fetchRooms();
      setSelectedRoom(newRoom);

      toast({
        title: 'Success',
        description: 'Chat created successfully',
      });
    } catch (error: any) {
      console.error('Error creating chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to create chat',
        variant: 'destructive',
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !user || sending) return;

    try {
      setSending(true);
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage.trim(),
          sender_id: user.id,
          room_id: selectedRoom.id,
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading communication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 h-[calc(100vh-8rem)]">
      <div className="flex gap-6 h-full">
        {/* Sidebar */}
        <div className="w-80 flex flex-col">
          {/* Header */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Communication
              </CardTitle>
              <CardDescription>
                Send messages and communicate with team members
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Start New Chat */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Start New Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <ScrollArea className="h-40">
                  <div className="space-y-2">
                    {filteredProfiles.map((profile) => (
                      <div
                        key={profile.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                        onClick={() => createOneOnOneChat(profile.id)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {profile.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {profile.full_name}
                          </p>
                          {profile.email && (
                            <p className="text-xs text-gray-500 truncate">
                              {profile.email}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          {/* Chat Rooms */}
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Recent Chats</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                        selectedRoom?.id === room.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50 border-transparent'
                      }`}
                      onClick={() => setSelectedRoom(room)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {room.name || `Chat ${room.id.slice(0, 8)}`}
                          </p>
                          <div className="flex items-center gap-2">
                            {room.is_group && (
                              <Badge variant="secondary" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                {room.participant_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {room.last_message && (
                        <p className="text-xs text-gray-500 truncate mb-1">
                          {room.last_message}
                        </p>
                      )}
                      {room.last_message_time && (
                        <p className="text-xs text-gray-400">
                          {format(new Date(room.last_message_time), 'MMM d, HH:mm')}
                        </p>
                      )}
                    </div>
                  ))}
                  {rooms.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No chats yet. Start a conversation!
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <Card className="flex-1 flex flex-col">
              {/* Chat Header */}
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {selectedRoom.name || `Chat ${selectedRoom.id.slice(0, 8)}`}
                    </CardTitle>
                    <CardDescription>
                      {selectedRoom.is_group 
                        ? `${selectedRoom.participant_count} participants`
                        : 'Direct message'
                      }
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full px-6 py-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div className={`max-w-xs lg:max-w-md ${
                          message.sender_id === user?.id ? 'order-2' : 'order-1'
                        }`}>
                          {message.sender_id !== user?.id && (
                            <p className="text-xs text-gray-500 mb-1 px-3">
                              {message.sender_name}
                            </p>
                          )}
                          <div className={`px-3 py-2 rounded-lg ${
                            message.sender_id === user?.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 px-3">
                            {format(new Date(message.created_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || sending}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="flex-1 flex items-center justify-center">
              <CardContent className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Chat
                </h3>
                <p className="text-gray-600">
                  Choose a conversation to start messaging or create a new chat
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Communication;
