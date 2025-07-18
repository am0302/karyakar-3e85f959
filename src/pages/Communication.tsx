
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, MessageCircle, Send, Phone, Mail, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type Karyakar = {
  id: string;
  full_name: string;
  mobile_number: string;
  email?: string;
  role: string;
  mandirs?: { name: string };
  kshetras?: { name: string };
  villages?: { name: string };
  mandals?: { name: string };
  seva_types?: { name: string };
};

type Message = {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  profiles: {
    full_name: string;
  };
};

type ChatRoom = {
  id: string;
  name?: string;
  created_at: string;
  participants?: any[];
};

const Communication = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [karyakars, setKaryakars] = useState<Karyakar[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedKaryakar, setSelectedKaryakar] = useState<Karyakar | null>(null);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    fetchKaryakars();
  }, []);

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!currentRoom) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${currentRoom.id}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          fetchMessages(currentRoom.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentRoom]);

  const fetchKaryakars = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          mobile_number,
          email,
          role,
          mandirs(name),
          kshetras(name),
          villages(name),
          mandals(name),
          seva_types(name)
        `)
        .eq('is_active', true)
        .order('full_name');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Fetched karyakars:', data);
      setKaryakars(data || []);
    } catch (error: any) {
      console.error('Failed to fetch karyakars:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch karyakars',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openChat = async (karyakar: Karyakar) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoadingMessages(true);
      setSelectedKaryakar(karyakar);
      
      console.log('Opening chat for:', karyakar.full_name);
      console.log('Current user ID:', user.id);
      console.log('Target user ID:', karyakar.id);
      
      // Create a deterministic room name for private chats
      const roomName = [user.id, karyakar.id].sort().join('_');
      
      // Check if a private chat room already exists
      const { data: existingRoom, error: roomCheckError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('name', roomName)
        .eq('is_group', false)
        .maybeSingle();

      if (roomCheckError) {
        console.error('Error checking for existing room:', roomCheckError);
        throw roomCheckError;
      }

      let room = existingRoom;

      // If no existing room found, create a new one
      if (!room) {
        console.log('Creating new chat room');
        const { data: newRoom, error: createRoomError } = await supabase
          .from('chat_rooms')
          .insert({
            name: roomName,
            is_group: false,
            created_by: user.id
          })
          .select()
          .single();

        if (createRoomError) {
          console.error('Error creating room:', createRoomError);
          throw createRoomError;
        }

        room = newRoom;

        // Add participants using upsert to handle duplicates gracefully
        const participantsToAdd = [
          { room_id: room.id, user_id: user.id },
          { room_id: room.id, user_id: karyakar.id }
        ];

        for (const participant of participantsToAdd) {
          const { error: participantError } = await supabase
            .from('chat_participants')
            .upsert(participant, {
              onConflict: 'room_id,user_id'
            });

          if (participantError) {
            console.error('Error adding participant:', participantError);
            // Continue even if there's a duplicate key error
            if (participantError.code !== '23505') {
              throw participantError;
            }
          }
        }
      }

      console.log('Using room:', room);
      setCurrentRoom(room);
      await fetchMessages(room.id);
      setShowChatDialog(true);

    } catch (error: any) {
      console.error('Failed to open chat:', error);
      toast({
        title: 'Error',
        description: `Failed to open chat: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      console.log('Fetching messages for room:', roomId);
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
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }
      
      console.log('Fetched messages:', data);
      setMessages(data || []);
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
    if (!user || !currentRoom || !newMessage.trim()) return;

    try {
      console.log('Sending message:', newMessage);
      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: currentRoom.id,
          sender_id: user.id,
          content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      setNewMessage('');
      // Messages will be updated via real-time subscription
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const handleCall = (mobileNumber: string) => {
    window.open(`tel:${mobileNumber}`, '_self');
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, '_self');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredKaryakars = karyakars.filter(karyakar =>
    karyakar.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    karyakar.mobile_number.includes(searchTerm) ||
    karyakar.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading karyakars...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Communication</h1>
          <p className="text-gray-600">Connect and communicate with karyakars</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search karyakars..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Karyakars List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredKaryakars.map((karyakar) => (
          <Card key={karyakar.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{karyakar.full_name}</CardTitle>
                  <Badge variant="outline" className="mt-1">
                    {karyakar.role}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-gray-500" />
                  <button
                    onClick={() => handleCall(karyakar.mobile_number)}
                    className="text-blue-600 hover:underline"
                  >
                    {karyakar.mobile_number}
                  </button>
                </div>
                {karyakar.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-gray-500" />
                    <button
                      onClick={() => handleEmail(karyakar.email!)}
                      className="text-blue-600 hover:underline"
                    >
                      {karyakar.email}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                {karyakar.mandirs?.name && <div>Mandir: {karyakar.mandirs.name}</div>}
                {karyakar.kshetras?.name && <div>Kshetra: {karyakar.kshetras.name}</div>}
                {karyakar.villages?.name && <div>Village: {karyakar.villages.name}</div>}
                {karyakar.mandals?.name && <div>Mandal: {karyakar.mandals.name}</div>}
                {karyakar.seva_types?.name && <div>Seva: {karyakar.seva_types.name}</div>}
              </div>

              <Button 
                onClick={() => openChat(karyakar)}
                className="w-full"
                size="sm"
                disabled={loadingMessages}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {loadingMessages ? 'Opening...' : 'Open Chat'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredKaryakars.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No karyakars found</h3>
          <p className="text-gray-600">Try adjusting your search terms.</p>
        </div>
      )}

      {/* Chat Dialog */}
      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Chat with {selectedKaryakar?.full_name}
            </DialogTitle>
            <DialogDescription>
              Send messages and stay connected
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-4 border rounded-lg mb-4">
              {loadingMessages ? (
                <div className="text-center">Loading messages...</div>
              ) : messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.sender_id === user?.id
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {format(new Date(message.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
              )}
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                placeholder="Type your message... (Press Enter to send)"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={sendMessage} size="sm" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Communication;
