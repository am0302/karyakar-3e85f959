
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Send, 
  Users, 
  MessageCircle, 
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

interface ChatRoom {
  id: string;
  name: string;
  is_group: boolean;
  created_at: string;
  chat_participants: Array<{
    user_id: string;
    profiles: {
      full_name: string;
    };
  }> | null;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  profiles: {
    full_name: string;
  } | null;
}

const Communication = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const canView = hasPermission('communication', 'view');
  const canAdd = hasPermission('communication', 'add');

  useEffect(() => {
    if (canView) {
      fetchRooms();
    }
  }, [canView]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          name,
          is_group,
          created_at,
          chat_participants(
            user_id,
            profiles(full_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter out rooms with query errors and transform data
      const validRooms = data?.filter(room => {
        return !room.chat_participants || (
          Array.isArray(room.chat_participants) &&
          room.chat_participants.every(participant => 
            participant && 
            participant.profiles && 
            typeof participant.profiles === 'object' &&
            !('error' in participant.profiles)
          )
        );
      }).map(room => ({
        ...room,
        chat_participants: room.chat_participants || []
      })) || [];

      setRooms(validRooms);
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
          id,
          content,
          created_at,
          sender_id,
          profiles(full_name)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Filter out messages with query errors and transform data
      const validMessages = data?.filter(msg => {
        return !msg.profiles || (
          typeof msg.profiles === 'object' &&
          !('error' in msg.profiles)
        );
      }).map(msg => ({
        ...msg,
        profiles: msg.profiles && typeof msg.profiles === 'object' && 'full_name' in msg.profiles
          ? { full_name: (msg.profiles as any).full_name || 'Unknown User' }
          : null
      })) || [];

      setMessages(validMessages);
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
    if (!newMessage.trim() || !selectedRoom) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage,
          room_id: selectedRoom.id,
          sender_id: user?.id
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

  const getRoomDisplayName = (room: ChatRoom) => {
    if (room.name) return room.name;
    
    if (room.chat_participants && room.chat_participants.length > 0) {
      return room.chat_participants
        .map(p => p.profiles?.full_name || 'Unknown')
        .join(', ');
    }
    
    return 'Unknown Room';
  };

  const filteredRooms = rooms.filter(room => 
    getRoomDisplayName(room).toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Communication</h1>
          <p className="text-gray-600">Chat with your team members</p>
        </div>
        
        {canAdd && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Chat Rooms List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chats
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 p-4">
                {filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedRoom?.id === room.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setSelectedRoom(room);
                      fetchMessages(room.id);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {room.is_group ? <Users className="h-4 w-4" /> : getRoomDisplayName(room)[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{getRoomDisplayName(room)}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {room.is_group && (
                            <Badge variant="secondary" className="text-xs">
                              Group
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {room.chat_participants?.length || 0} members
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredRooms.length === 0 && (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No chats found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedRoom ? getRoomDisplayName(selectedRoom) : 'Select a chat'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {selectedRoom ? (
              <div className="flex flex-col h-[400px]">
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
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.sender_id === user?.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="text-sm">
                            {message.profiles?.full_name || 'Unknown User'}
                          </div>
                          <div className="mt-1">{message.content}</div>
                          <div className="text-xs opacity-75 mt-1">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <Button onClick={sendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a chat to start messaging</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Communication;
