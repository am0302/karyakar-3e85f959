
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Users,
  MoreVertical
} from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  profile_photo_url?: string;
}

interface Message {
  id: string;
  content: string | null;
  created_at: string;
  sender_id: string;
  room_id: string;
  profiles?: Profile | null;
}

interface ChatRoom {
  id: string;
  name: string | null;
  created_at: string;
  created_by: string;
  is_group: boolean;
}

const Communication = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChatRooms();
  }, []);

  useEffect(() => {
    if (activeRoom) {
      fetchMessages();
    }
  }, [activeRoom]);

  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setChatRooms(data || []);
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

  const fetchMessages = async () => {
    if (!activeRoom) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles(full_name, profile_photo_url)
        `)
        .eq('room_id', activeRoom.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const transformedMessages: Message[] = (data || []).map(message => ({
        ...message,
        profiles: message.profiles && typeof message.profiles === 'object' && !Array.isArray(message.profiles) && 'full_name' in message.profiles
          ? message.profiles as Profile
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !activeRoom) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            content: newMessage,
            sender_id: user.id,
            room_id: activeRoom.id,
            message_type: 'text',
          },
        ])
        .select('*');

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

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading chat rooms...</div>;
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <CardHeader className="p-4">
          <CardTitle className="text-xl font-bold">Chat Rooms</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <Input placeholder="Search chat rooms..." className="mb-4" />
          <div className="space-y-2">
            {chatRooms.map((room) => (
              <Button
                key={room.id}
                variant="ghost"
                className={`w-full justify-start ${activeRoom?.id === room.id ? 'bg-gray-100' : ''}`}
                onClick={() => setActiveRoom(room)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {room.name || 'Group Chat'}
              </Button>
            ))}
          </div>
        </CardContent>
        <div className="p-4 mt-auto">
          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create Chat Room
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeRoom ? (
          <>
            {/* Header */}
            <CardHeader className="p-4 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">{activeRoom.name || 'Group Chat'}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  <MoreVertical className="h-5 w-5 text-gray-500" />
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender_id === user?.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}>
                    {message.sender_id !== user?.id && (
                      <div className="text-xs font-semibold mb-1">
                        {message.profiles?.full_name || 'Unknown User'}
                      </div>
                    )}
                    <div>{message.content}</div>
                    <div className={`text-xs mt-1 ${
                      message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-center">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 mr-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                />
                <Button onClick={handleSendMessage}>Send</Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Select a chat room to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Communication;
