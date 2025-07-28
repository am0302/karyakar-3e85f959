import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, Users, MessageCircle, Phone, Video, MoreHorizontal } from 'lucide-react';

interface ChatParticipant {
  user_id: string;
  profiles: {
    full_name: string;
    profile_photo_url?: string;
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
  sender: {
    full_name: string;
    profile_photo_url?: string;
  };
}

interface ChatRoom {
  id: string;
  name: string;
  is_group: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  mandir_id: string;
  kshetra_id: string;
  village_id: string;
  mandal_id: string;
  chat_participants?: ChatParticipant[];
  last_message?: {
    content: string;
    created_at: string;
    sender: {
      full_name: string;
    };
  };
}

const Communication = () => {
  const { toast } = useToast();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser();
    fetchChatRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
    }
  }, [selectedRoom]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setCurrentUser(profile);
    }
  };

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

      if (error) {
        console.error('Error fetching chat rooms:', error);
        setChatRooms([]);
        return;
      }

      // Filter out rooms with query errors and transform the data
      const validRooms = (data || []).filter(room => {
        return room.chat_participants && !('error' in room.chat_participants);
      }).map(room => ({
        ...room,
        chat_participants: Array.isArray(room.chat_participants) ? room.chat_participants : []
      }));

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

  const fetchMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(full_name, profile_photo_url)
        `)
        .eq('room_id', roomId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
        return;
      }

      // Filter out messages with query errors and transform data
      const validMessages = (data || []).filter(message => {
        return message.sender && !('error' in message.sender);
      }).map(message => ({
        ...message,
        sender: message.sender || { full_name: 'Unknown', profile_photo_url: null }
      }));

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
    if (!newMessage.trim() || !selectedRoom || !currentUser) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage,
          sender_id: currentUser.id,
          room_id: selectedRoom.id,
          message_type: 'text'
        });

      if (error) throw error;

      // Update room's last activity
      await supabase
        .from('chat_rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedRoom.id);

      setNewMessage('');
      fetchMessages(selectedRoom.id);
      fetchChatRooms();
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

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getParticipantNames = (participants: ChatParticipant[]) => {
    if (!participants || participants.length === 0) return 'No participants';
    return participants.map(p => p.profiles?.full_name || 'Unknown').join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading communications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex h-[calc(100vh-120px)] bg-background rounded-lg border">
        {/* Chat Rooms Sidebar */}
        <div className="w-1/3 border-r border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Communications
            </h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {chatRooms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No chat rooms available</p>
                </div>
              ) : (
                chatRooms.map((room) => (
                  <Card
                    key={room.id}
                    className={`mb-2 cursor-pointer transition-colors hover:bg-accent/50 ${
                      selectedRoom?.id === room.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedRoom(room)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium truncate">{room.name}</h3>
                        <Badge variant={room.is_group ? 'default' : 'secondary'}>
                          {room.is_group ? 'Group' : 'Direct'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {getParticipantNames(room.chat_participants || [])}
                      </p>
                      {room.last_message && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <p className="truncate">{room.last_message.content}</p>
                          <p>{formatTime(room.last_message.created_at)}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{selectedRoom.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {getParticipantNames(selectedRoom.chat_participants || [])}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          message.sender_id === currentUser?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
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
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a chat room to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Communication;
