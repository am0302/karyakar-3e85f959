
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageCircle, Users, Edit, Trash2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type ChatRoom = {
  id: string;
  name: string;
  is_group: boolean;
  created_by: string;
  created_at: string;
  mandir_id?: string;
  kshetra_id?: string;
  village_id?: string;
  mandal_id?: string;
  created_by_profile?: { full_name: string; role: string };
  participant_count?: number;
};

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  profiles: { full_name: string };
};

type Profile = {
  id: string;
  full_name: string;
  role: string;
};

const Communication = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [editingRoom, setEditingRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    is_group: true,
    participants: [] as string[]
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    is_group: true
  });

  const isSuperAdmin = user?.role === 'super_admin';

  // Role hierarchy levels for permission checking
  const roleHierarchy: Record<string, number> = {
    'super_admin': 0,
    'sant_nirdeshak': 1,
    'sah_nirdeshak': 2,
    'mandal_sanchalak': 3,
    'sevak': 4
  };

  useEffect(() => {
    if (user) {
      fetchChatRooms();
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchChatRooms = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          created_by_profile:profiles!chat_rooms_created_by_fkey(full_name, role)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get participant counts for each room
      const roomsWithCounts = await Promise.all((data || []).map(async (room) => {
        const { count } = await supabase
          .from('chat_participants')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', room.id);
        
        return { ...room, participant_count: count || 0 };
      }));

      setChatRooms(roomsWithCounts);
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

  const createChatRoom = async () => {
    if (!user || !formData.name.trim()) return;

    try {
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: formData.name,
          is_group: formData.is_group,
          created_by: user.id
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add participants
      const participants = [user.id, ...formData.participants];
      const participantInserts = participants.map(userId => ({
        room_id: room.id,
        user_id: userId
      }));

      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert(participantInserts);

      if (participantError) throw participantError;

      toast({
        title: 'Success',
        description: 'Chat room created successfully',
      });

      setShowCreateDialog(false);
      setFormData({ name: '', is_group: true, participants: [] });
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

  const updateChatRoom = async () => {
    if (!editingRoom || !editFormData.name.trim()) return;

    try {
      const { error } = await supabase
        .from('chat_rooms')
        .update({
          name: editFormData.name,
          is_group: editFormData.is_group
        })
        .eq('id', editingRoom.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Chat room updated successfully',
      });

      setShowEditDialog(false);
      setEditingRoom(null);
      fetchChatRooms();
    } catch (error: any) {
      console.error('Error updating chat room:', error);
      toast({
        title: 'Error',
        description: 'Failed to update chat room',
        variant: 'destructive',
      });
    }
  };

  const deleteChatRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this chat room? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Chat room deleted successfully',
      });

      fetchChatRooms();
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(null);
      }
    } catch (error: any) {
      console.error('Error deleting chat room:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete chat room',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (room: ChatRoom) => {
    setEditingRoom(room);
    setEditFormData({
      name: room.name || '',
      is_group: room.is_group
    });
    setShowEditDialog(true);
  };

  const canEditChatRoom = (room: ChatRoom) => {
    if (isSuperAdmin) return true;
    if (room.created_by === user?.id) return true;
    
    // Check if current user has higher hierarchy than chat creator
    const currentUserRole = user?.role || 'sevak';
    const chatCreatorRole = room.created_by_profile?.role || 'sevak';
    
    const currentUserLevel = roleHierarchy[currentUserRole] || 999;
    const chatCreatorLevel = roleHierarchy[chatCreatorRole] || 999;
    
    return currentUserLevel < chatCreatorLevel;
  };

  const canDeleteChatRoom = (room: ChatRoom) => {
    return canEditChatRoom(room);
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
          profiles(full_name)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
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
          content: newMessage.trim()
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

  const openChatRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    fetchMessages(room.id);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading chat rooms...</div>;
  }

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* Chat Rooms List */}
      <div className="w-1/3 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Communication</h1>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Chat Room</DialogTitle>
                <DialogDescription>
                  Create a new chat room and invite participants
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Room Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter room name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Room Type</label>
                  <Select 
                    value={formData.is_group.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, is_group: value === 'true' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Group Chat</SelectItem>
                      <SelectItem value="false">Direct Message</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Add Participants</label>
                  <Select 
                    value="" 
                    onValueChange={(value) => {
                      if (!formData.participants.includes(value)) {
                        setFormData({ 
                          ...formData, 
                          participants: [...formData.participants, value] 
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select participants" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.filter(p => p.id !== user?.id).map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name} ({profile.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.participants.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {formData.participants.map(participantId => {
                        const profile = profiles.find(p => p.id === participantId);
                        return (
                          <Badge 
                            key={participantId} 
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                participants: formData.participants.filter(id => id !== participantId)
                              });
                            }}
                          >
                            {profile?.full_name} ×
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
                <Button onClick={createChatRoom} className="w-full">
                  Create Chat Room
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {chatRooms.map((room) => (
              <Card 
                key={room.id} 
                className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedRoom?.id === room.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => openChatRoom(room)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {room.is_group ? <Users className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                        {room.name || 'Unnamed Chat'}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Created by {room.created_by_profile?.full_name} • {room.participant_count} participants
                      </CardDescription>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {canEditChatRoom(room) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(room)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      {canDeleteChatRoom(room) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteChatRoom(room.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            <div className="border-b pb-4 mb-4">
              <h2 className="text-lg font-semibold">{selectedRoom.name || 'Unnamed Chat'}</h2>
              <p className="text-sm text-gray-500">
                {selectedRoom.is_group ? 'Group Chat' : 'Direct Message'} • {selectedRoom.participant_count} participants
              </p>
            </div>

            <ScrollArea className="flex-1 mb-4">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === user?.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {message.sender_id !== user?.id && (
                        <div className="text-xs font-medium mb-1 opacity-70">
                          {message.profiles.full_name}
                        </div>
                      )}
                      <div className="text-sm">{message.content}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {format(new Date(message.created_at), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
              />
              <Button onClick={sendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Chat Selected</h3>
              <p className="text-gray-500">Choose a chat room to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Chat Room Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Chat Room</DialogTitle>
            <DialogDescription>
              Update chat room details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Room Name</label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Enter room name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Room Type</label>
              <Select 
                value={editFormData.is_group.toString()} 
                onValueChange={(value) => setEditFormData({ ...editFormData, is_group: value === 'true' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Group Chat</SelectItem>
                  <SelectItem value="false">Direct Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={updateChatRoom} className="flex-1">
                Update Chat Room
              </Button>
              <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Communication;
