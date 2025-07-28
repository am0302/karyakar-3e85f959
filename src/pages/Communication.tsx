import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Search, 
  Plus, 
  MessageCircle,
  Users,
  Phone,
  Video,
  MoreHorizontal,
  Paperclip
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

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
  is_deleted: boolean;
  profiles?: {
    full_name: string;
    profile_photo_url?: string;
  };
}

const Communication = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  const canView = hasPermission('communication', 'view');
  const canAdd = hasPermission('communication', 'add');

  useEffect(() => {
    if (canView) {
      fetchChatRooms();
    }
  }, [canView]);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
    }
  }, [selectedRoom]);

  const fetchChatRooms = async () => {
    try {
      setLoading(true);
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
      
      console.log('Fetched chat rooms:', data);
      
      // Filter out rooms with query errors and transform the data
      const validRooms = data?.filter(room => {
        // Check if chat_participants is valid
        if (room.chat_participants && typeof room.chat_participants === 'object' && 'error' in room.chat_participants) {
          return false;
        }
        return true;
      }).map(room => ({
        ...room,
        chat_participants: room.chat_participants && Array.isArray(room.chat_participants) 
          ? room.chat_participants.filter(participant => 
              participant && 
              typeof participant === 'object' && 
              'profiles' in participant &&
              participant.profiles &&
              typeof participant.profiles === 'object' &&
              'full_name' in participant.profiles
            )
          : []
      })) || [];

      setChatRooms(validRooms as ChatRoom[]);
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

  const getRoomName = (room: ChatRoom) => {
    if (room.name) return room.name;
    if (room.is_group) return 'Group Chat';
    
    // For direct messages, show the other participant's name
    const otherParticipant = room.chat_participants?.find(p => p.user_id !== user?.id);
    return otherParticipant?.profiles?.full_name || 'Unknown User';
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles(full_name, profile_photo_url)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      console.log('Fetched messages:', data);
      
      // Filter out messages with query errors and transform the data
      const validMessages = data?.filter(msg => {
        return !msg.profiles || (typeof msg.profiles === 'object' && !('error' in msg.profiles));
      }).map(msg => ({
        ...msg,
        profiles: msg.profiles && typeof msg.profiles === 'object' && 'full_name' in msg.profiles
          ? {
              full_name: (msg.profiles as any).full_name || 'Unknown User',
              profile_photo_url: (msg.profiles as any).profile_photo_url
            }
          : {
              full_name: 'Unknown User',
              profile_photo_url: undefined
            }
      })) || [];

      setMessages(validMessages as Message[]);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getMessageSenderName = (msg: Message) => {
    return msg.profiles?.full_name || 'Unknown User';
  };

  const getMessageSenderAvatar = (msg: Message) => {
    return msg.profiles?.profile_photo_url;
  };

  const filteredRooms = chatRooms.filter(room => 
    getRoomName(room).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading communication...</div>;
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You do not have permission to view communication.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communication</h1>
          <p className="text-gray-600">Connect with your team</p>
        </div>
        
        {canAdd && (
          <Button onClick={() => setShowCreateRoom(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Rooms Sidebar */}
        <div className="w-80 border-r bg-gray-50 flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {filteredRooms.map((room) => (
                <Card 
                  key={room.id} 
                  className={`cursor-pointer transition-colors hover:bg-gray-100 ${
                    selectedRoom?.id === room.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => setSelectedRoom(room)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {room.is_group ? (
                            <Users className="h-5 w-5" />
                          ) : (
                            getRoomName(room).charAt(0).toUpperCase()
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm truncate">
                            {getRoomName(room)}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {format(new Date(room.updated_at), 'MMM d')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          {room.last_message?.content || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                    <Avatar>
                      <AvatarFallback>
                        {selectedRoom.is_group ? (
                          <Users className="h-5 w-5" />
                        ) : (
                          getRoomName(selectedRoom).charAt(0).toUpperCase()
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="font-medium">{getRoomName(selectedRoom)}</h2>
                      <p className="text-sm text-gray-500">
                        {selectedRoom.is_group 
                          ? `${selectedRoom.chat_participants?.length || 0} participants`
                          : 'Active now'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${msg.sender_id === user?.id ? 'order-2' : 'order-1'}`}>
                        {msg.sender_id !== user?.id && (
                          <div className="flex items-center space-x-2 mb-1">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={getMessageSenderAvatar(msg)} />
                              <AvatarFallback className="text-xs">
                                {getMessageSenderName(msg).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-gray-500">
                              {getMessageSenderName(msg)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`rounded-lg p-3 ${
                            msg.sender_id === user?.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {format(new Date(msg.created_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t bg-white">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
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
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a chat</h3>
                <p className="text-gray-600">Choose a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Room Dialog */}
      <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Chat</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Chat creation feature coming soon</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Communication;
