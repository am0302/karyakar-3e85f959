
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageCircle, Plus, Send, Users, Search, Phone, Video, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatParticipant {
  user_id: string;
  profiles: {
    full_name: string;
    profile_photo_url?: string;
  };
}

interface LastMessage {
  content: string;
  created_at: string;
  sender: {
    full_name: string;
  };
}

interface ChatRoom {
  id: string;
  name?: string;
  is_group: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  mandir_id?: string;
  kshetra_id?: string;
  village_id?: string;
  mandal_id?: string;
  chat_participants?: ChatParticipant[];
  last_message?: LastMessage;
}

interface Message {
  id: string;
  content?: string;
  sender_id: string;
  room_id: string;
  created_at: string;
  message_type: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  is_deleted: boolean;
  sender?: {
    full_name: string;
    profile_photo_url?: string;
  };
}

const Communication = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [isGroupChat, setIsGroupChat] = useState(false);

  useEffect(() => {
    if (user) {
      fetchChatRooms();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages();
      // Set up real-time subscription for messages
      const channel = supabase
        .channel(`room-${selectedRoom.id}`)
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${selectedRoom.id}` },
          (payload) => {
            console.log('New message received:', payload.new);
            fetchMessages(); // Refresh messages when new ones arrive
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedRoom]);

  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      
      // First get rooms where user is a participant
      const { data: participantRooms, error: participantError } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', user?.id);

      if (participantError) throw participantError;

      const roomIds = participantRooms?.map(p => p.room_id) || [];
      
      if (roomIds.length === 0) {
        setChatRooms([]);
        return;
      }

      // Get room details with participants
      const { data: rooms, error: roomsError } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          name,
          is_group,
          created_by,
          created_at,
          updated_at,
          mandir_id,
          kshetra_id,
          village_id,
          mandal_id,
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

      // Filter out rooms with query errors and validate data structure
      const validRooms = rooms?.filter((room: any) => {
        return room.chat_participants && 
               Array.isArray(room.chat_participants) &&
               room.chat_participants.every((participant: any) => 
                 participant.profiles && 
                 typeof participant.profiles === 'object' &&
                 participant.profiles.full_name
               );
      }) || [];

      setChatRooms(validRooms);
    } catch (error: any) {
      console.error('Error fetching chat rooms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat rooms',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedRoom) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          room_id,
          created_at,
          message_type,
          file_url,
          file_name,
          file_size,
          is_deleted,
          sender:profiles!inner(
            full_name,
            profile_photo_url
          )
        `)
        .eq('room_id', selectedRoom.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Filter out messages with query errors
      const validMessages = data?.filter((msg: any) => {
        return msg.sender && 
               typeof msg.sender === 'object' &&
               msg.sender.full_name;
      }) || [];

      setMessages(validMessages);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            content: newMessage.trim(),
            sender_id: user.id,
            room_id: selectedRoom.id,
            message_type: 'text',
          },
        ]);

      if (error) throw error;

      setNewMessage('');
      // Messages will be refreshed via real-time subscription
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
    if (!user || (!newChatName.trim() && isGroupChat)) return;

    try {
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert([
          {
            name: isGroupChat ? newChatName.trim() : null,
            is_group: isGroupChat,
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (roomError) throw roomError;

      // Add creator as participant
      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert([
          {
            room_id: room.id,
            user_id: user.id,
          },
        ]);

      if (participantError) throw participantError;

      toast({
        title: 'Success',
        description: `${isGroupChat ? 'Group' : 'Chat'} created successfully`,
      });

      setShowNewChatDialog(false);
      setNewChatName('');
      setIsGroupChat(false);
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

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getRoomDisplayName = (room: ChatRoom) => {
    if (room.is_group) {
      return room.name || 'Group Chat';
    }
    
    // For direct messages, show the other participant's name
    const otherParticipant = room.chat_participants?.find(p => p.user_id !== user?.id);
    return otherParticipant?.profiles?.full_name || 'Direct Message';
  };

  const filteredRooms = chatRooms.filter(room =>
    getRoomDisplayName(room).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading communications...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* Chat List Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
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
                  <DialogTitle>Create New Chat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isGroup"
                      checked={isGroupChat}
                      onChange={(e) => setIsGroupChat(e.target.checked)}
                    />
                    <label htmlFor="isGroup">Group Chat</label>
                  </div>
                  {isGroupChat && (
                    <Input
                      placeholder="Group name"
                      value={newChatName}
                      onChange={(e) => setNewChatName(e.target.value)}
                    />
                  )}
                  <Button onClick={createChatRoom} className="w-full">
                    Create Chat
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedRoom?.id === room.id
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedRoom(room)}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={room.chat_participants?.[0]?.profiles?.profile_photo_url} />
                    <AvatarFallback>
                      {room.is_group ? <Users className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">
                        {getRoomDisplayName(room)}
                      </p>
                      {room.is_group && (
                        <Badge variant="secondary" className="text-xs">
                          Group
                        </Badge>
                      )}
                    </div>
                    {room.last_message && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 truncate">
                          {room.last_message.content}
                        </p>
                        <span className="text-xs text-gray-400">
                          {formatTime(room.last_message.created_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedRoom.chat_participants?.[0]?.profiles?.profile_photo_url} />
                    <AvatarFallback>
                      {selectedRoom.is_group ? <Users className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{getRoomDisplayName(selectedRoom)}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedRoom.is_group ? 
                        `${selectedRoom.chat_participants?.length || 0} participants` : 
                        'Direct message'
                      }
                    </p>
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
                    <MoreHorizontal className="h-4 w-4" />
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
                      {message.sender_id !== user?.id && selectedRoom.is_group && (
                        <p className="text-xs font-medium mb-1">
                          {message.sender?.full_name || 'Unknown User'}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center space-x-2">
                <Textarea
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                  rows={1}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No chat selected</h3>
              <p className="text-gray-600">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Communication;
