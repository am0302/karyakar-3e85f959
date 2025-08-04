
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, Users, Filter, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useDynamicRoles } from '@/hooks/useDynamicRoles';
import { RoleDisplay } from '@/components/RoleDisplay';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ChatRoom = Database['public']['Tables']['chat_rooms']['Row'];
type Message = Database['public']['Tables']['messages']['Row'] & {
  sender: Profile;
};

const Communication = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getRoleOptions, loading: rolesLoading } = useDynamicRoles();
  const [activeTab, setActiveTab] = useState('messages');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [newMessage, setNewMessage] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchChatRooms();
      fetchMessages();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id || '');

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    }
  };

  const fetchChatRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setChatRooms(data || []);
    } catch (error: any) {
      console.error('Error fetching chat rooms:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch chat rooms',
        variant: 'destructive',
      });
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || selectedRecipients.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter a message and select recipients',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create a new chat room if needed
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: `Group Chat - ${new Date().toLocaleDateString()}`,
          is_group: selectedRecipients.length > 1,
          created_by: user?.id || ''
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add participants to the room
      const participants = selectedRecipients.map(userId => ({
        room_id: roomData.id,
        user_id: userId
      }));

      // Add the current user as a participant
      participants.push({
        room_id: roomData.id,
        user_id: user?.id || ''
      });

      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      // Send the message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          content: newMessage,
          sender_id: user?.id || '',
          room_id: roomData.id,
          message_type: 'text'
        });

      if (messageError) throw messageError;

      toast({
        title: 'Success',
        description: 'Message sent successfully',
      });

      setNewMessage('');
      setSelectedRecipients([]);
      fetchMessages();
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const roleOptions = getRoleOptions();

  if (loading || rolesLoading) {
    return <div className="flex items-center justify-center h-64">Loading communication...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Communication</h2>
          <p className="text-gray-600">Send messages and manage communications</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('messages')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'messages'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MessageCircle className="inline-block w-5 h-5 mr-2" />
            Send Message
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="inline-block w-5 h-5 mr-2" />
            Message History
          </button>
        </nav>
      </div>

      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message Compose */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Compose Message</CardTitle>
                <CardDescription>Send a message to selected users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <Textarea
                    placeholder="Type your message here..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selected Recipients ({selectedRecipients.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecipients.map(userId => {
                      const user = users.find(u => u.id === userId);
                      return user ? (
                        <Badge key={userId} variant="secondary" className="cursor-pointer">
                          {user.full_name}
                          <button
                            onClick={() => setSelectedRecipients(prev => prev.filter(id => id !== userId))}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
                <Button onClick={sendMessage} disabled={!newMessage.trim() || selectedRecipients.length === 0}>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Users List */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Select Recipients</CardTitle>
                <CardDescription>Choose users to send message to</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Filter */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Users List */}
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedRecipients.includes(user.id)
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSelectedRecipients(prev =>
                          prev.includes(user.id)
                            ? prev.filter(id => id !== user.id)
                            : [...prev, user.id]
                        );
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{user.full_name}</p>
                          <RoleDisplay role={user.role} className="text-xs" />
                        </div>
                        {selectedRecipients.includes(user.id) && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Message History</CardTitle>
            <CardDescription>Recent messages and conversations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No messages yet</p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="border-l-4 border-blue-200 pl-4 py-2">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{message.sender?.full_name}</span>
                        <RoleDisplay role={message.sender?.role || 'sevak'} className="text-xs" />
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{message.content}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Communication;
