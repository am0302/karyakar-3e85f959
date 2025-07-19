
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users, Plus, Send, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type Profile = {
  id: string;
  full_name: string;
  profile_photo_url?: string;
  role: string;
};

type ChatRoom = {
  id: string;
  name?: string;
  is_group: boolean;
  created_at: string;
  created_by: string;
  participants?: Profile[];
  lastMessage?: {
    content: string;
    created_at: string;
    sender_name: string;
  };
};

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_name: string;
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
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [chatName, setChatName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchChatRooms();
      fetchAllUsers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
      
      // Set up real-time subscription for messages
      const channel = supabase
        .channel(`room-${selectedRoom.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `room_id=eq.${selectedRoom.id}`,
          },
          (payload) => {
            const newMessage = payload.new as any;
            fetchMessages(selectedRoom.id); // Refresh messages to get sender info
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedRoom]);

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, profile_photo_url, role')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setAllUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchChatRooms = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // First get all rooms where user is a participant
      const { data: participantRooms, error: participantError } = await supabase
        .from('chat_participants')
        .select(`
          room_id,
          chat_rooms (
            id,
            name,
            is_group,
            created_at,
            created_by
          )
        `)
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      const roomIds = participantRooms?.map(p => p.room_id) || [];
      
      if (roomIds.length === 0) {
        setChatRooms([]);
        setLoading(false);
        return;
      }

      // Get room details with participants
      const rooms: ChatRoom[] = [];
      
      for (const roomData of participantRooms || []) {
        if (!roomData.chat_rooms) continue;
        
        const room = roomData.chat_rooms as any;
        
        // Get participants for this room
        const { data: participants } = await supabase
          .from('chat_participants')
          .select(`
            profiles (
              id,
              full_name,
              profile_photo_url,
              role
            )
          `)
          .eq('room_id', room.id);

        // Get last message
        const { data: lastMsg } = await supabase
          .from('messages')
          .select(`
            content,
            created_at,
            profiles:sender_id (full_name)
          `)
          .eq('room_id', room.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        rooms.push({
          ...room,
          participants: participants?.map(p => p.profiles).filter(Boolean) || [],
          lastMessage: lastMsg ? {
            content: lastMsg.content || '',
            created_at: lastMsg.created_at,
            sender_name: (lastMsg.profiles as any)?.full_name || 'Unknown'
          } : undefined
        });
      }

      setChatRooms(rooms);
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

  const fetchMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          created_at,
          profiles:sender_id (full_name)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages = data?.map(msg => ({
        id: msg.id,
        content: msg.content || '',
        sender_id: msg.sender_id,
        created_at: msg.created_at,
        sender_name: (msg.profiles as any)?.full_name || 'Unknown'
      })) || [];

      setMessages(formattedMessages);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    }
  };

  const createNewChat = async () => {
    if (!user || selectedUsers.length === 0) return;

    try {
      const isGroup = selectedUsers.length > 1;
      const roomName = isGroup ? chatName || 'Group Chat' : null;

      // Create chat room
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: roomName,
          is_group: isGroup,
          created_by: user.id,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add creator as participant
      const participants = [user.id, ...selectedUsers];
      const participantData = participants.map(userId => ({
        room_id: roomData.id,
        user_id: userId,
      }));

      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert(participantData);

      if (participantError) throw participantError;

      toast({
        title: 'Success',
        description: 'Chat created successfully',
      });

      setShowNewChatDialog(false);
      setSelectedUsers([]);
      setChatName('');
      fetchChatRooms();
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
    if (!user || !selectedRoom || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: selectedRoom.id,
          sender_id: user.id,
          content: newMessage.trim(),
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
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getRoomDisplayName = (room: ChatRoom) => {
    if (room.name) return room.name;
    if (room.is_group) return 'Group Chat';
    
    const otherParticipant = room.participants?.find(p => p.id !== user?.id);
    return otherParticipant?.full_name || 'Unknown User';
  };

  const filteredUsers = allUsers.filter(u => 
    u.id !== user?.id && 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading chats...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Communication</h1>
          <p className="text-gray-600">Chat with team members</p>
        </div>
        
        <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">New Chat</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Start New Chat</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center space-x-3 p-2 rounded cursor-pointer hover:bg-gray-100 ${
                        selectedUsers.includes(user.id) ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => {
                        setSelectedUsers(prev => 
                          prev.includes(user.id) 
                            ? prev.filter(id => id !== user.id)
                            : [...prev, user.id]
                        );
                      }}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profile_photo_url} />
                        <AvatarFallback>
                          {user.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {selectedUsers.length > 1 && (
                <Input
                  placeholder="Group name (optional)"
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
                />
              )}

              <Button 
                onClick={createNewChat} 
                disabled={selectedUsers.length === 0}
                className="w-full"
              >
                Create Chat
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
        {/* Chat List */}
        <Card className="lg:col-span-4 h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chats
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100%-4rem)]">
              {chatRooms.length > 0 ? (
                <div className="space-y-1 p-3">
                  {chatRooms.map((room) => (
                    <div
                      key={room.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedRoom?.id === room.id 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedRoom(room)}
                    >
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {room.is_group ? (
                              <Users className="h-5 w-5" />
                            ) : (
                              getRoomDisplayName(room).charAt(0).toUpperCase()
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium truncate">
                              {getRoomDisplayName(room)}
                            </h4>
                            {room.lastMessage && (
                              <span className="text-xs text-gray-500">
                                {format(new Date(room.lastMessage.created_at), 'HH:mm')}
                              </span>
                            )}
                          </div>
                          {room.lastMessage && (
                            <p className="text-sm text-gray-600 truncate">
                              {room.lastMessage.sender_name}: {room.lastMessage.content}
                            </p>
                          )}
                          {room.is_group && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              Group
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No chats yet</h3>
                  <p className="text-gray-600">Start a new conversation</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="lg:col-span-8 h-full">
          {selectedRoom ? (
            <>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {selectedRoom.is_group ? (
                        <Users className="h-4 w-4" />
                      ) : (
                        getRoomDisplayName(selectedRoom).charAt(0).toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {getRoomDisplayName(selectedRoom)}
                  {selectedRoom.is_group && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedRoom.participants?.length || 0} members
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col h-[calc(100%-5rem)] p-0">
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
                          {selectedRoom.is_group && message.sender_id !== user?.id && (
                            <p className="text-xs font-medium mb-1 opacity-70">
                              {message.sender_name}
                            </p>
                          )}
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {format(new Date(message.created_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex items-center space-x-2">
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
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a chat to start messaging
                </h3>
                <p className="text-gray-600">
                  Choose a conversation from the sidebar or start a new one
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Communication;
