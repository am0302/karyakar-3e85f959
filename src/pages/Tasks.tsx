
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Calendar, User, MessageSquare, Filter, Grid3X3, List, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import TaskCalendar from '@/components/TaskCalendar';

type TaskStatus = 'pending' | 'in_progress' | 'completed';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type TaskType = 'personal' | 'delegated' | 'broadcasted';

type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  task_type: TaskType;
  due_date: string;
  created_at: string;
  assigned_by: string;
  assigned_to: string;
  assigned_by_profile?: { full_name: string; role: string };
  assigned_to_profile?: { full_name: string; role: string };
};

type Profile = {
  id: string;
  full_name: string;
  role: string;
};

type Comment = {
  id: string;
  comment: string;
  created_at: string;
  profiles: { full_name: string };
};

const Tasks = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [view, setView] = useState<'list' | 'calendar' | 'table'>('list');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');

  // Form state with proper typing
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    assigned_to: string;
    priority: TaskPriority;
    task_type: TaskType;
    due_date: string;
  }>({
    title: '',
    description: '',
    assigned_to: 'self',
    priority: 'medium',
    task_type: 'delegated',
    due_date: ''
  });

  const [editFormData, setEditFormData] = useState<{
    title: string;
    description: string;
    assigned_to: string;
    priority: TaskPriority;
    task_type: TaskType;
    due_date: string;
  }>({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium',
    task_type: 'delegated',
    due_date: ''
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
      fetchTasks();
      fetchProfiles();
    }
  }, [user, statusFilter, priorityFilter, userFilter]);

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

  const fetchTasks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name, role),
          assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name, role)
        `);

      // Apply user-based filtering
      if (!isSuperAdmin) {
        query = query.or(`assigned_by.eq.${user.id},assigned_to.eq.${user.id}`);
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as TaskStatus);
      }

      // Apply priority filter
      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter as TaskPriority);
      }

      // Apply user filter (only for super admin)
      if (isSuperAdmin && userFilter !== 'all') {
        if (userFilter === 'assigned_by_me') {
          query = query.eq('assigned_by', user.id);
        } else if (userFilter === 'assigned_to_me') {
          query = query.eq('assigned_to', user.id);
        } else {
          query = query.or(`assigned_by.eq.${userFilter},assigned_to.eq.${userFilter}`);
        }
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      console.log('Fetched tasks:', data);
      setTasks(data || []);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!user || !formData.title.trim()) return;

    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        assigned_by: user.id,
        assigned_to: formData.assigned_to === 'self' ? user.id : formData.assigned_to,
        priority: formData.priority,
        task_type: formData.task_type,
        due_date: formData.due_date || null,
        status: 'pending' as TaskStatus
      };

      const { error } = await supabase
        .from('tasks')
        .insert(taskData);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task created successfully',
      });

      setShowCreateDialog(false);
      setFormData({
        title: '',
        description: '',
        assigned_to: 'self',
        priority: 'medium',
        task_type: 'delegated',
        due_date: ''
      });
      fetchTasks();
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
    }
  };

  const updateTask = async () => {
    if (!editingTask || !editFormData.title.trim()) return;

    try {
      const taskData = {
        title: editFormData.title,
        description: editFormData.description,
        assigned_to: editFormData.assigned_to,
        priority: editFormData.priority,
        task_type: editFormData.task_type,
        due_date: editFormData.due_date || null
      };

      const { error } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', editingTask.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });

      setShowEditDialog(false);
      setEditingTask(null);
      fetchTasks();
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task status updated',
      });

      fetchTasks();
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });

      fetchTasks();
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    }
  };

  const fetchComments = async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          id,
          comment,
          created_at,
          profiles(full_name)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
    }
  };

  const addComment = async () => {
    if (!user || !selectedTask || !newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('task_comments')
        .insert({
          task_id: selectedTask.id,
          user_id: user.id,
          comment: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      fetchComments(selectedTask.id);
      toast({
        title: 'Success',
        description: 'Comment added successfully',
      });
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
    }
  };

  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
    fetchComments(task.id);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setEditFormData({
      title: task.title,
      description: task.description || '',
      assigned_to: task.assigned_to,
      priority: task.priority,
      task_type: task.task_type,
      due_date: task.due_date ? task.due_date.slice(0, 16) : ''
    });
    setShowEditDialog(true);
  };

  const canUpdateTaskStatus = (task: Task) => {
    return isSuperAdmin || task.assigned_by === user?.id || task.assigned_to === user?.id;
  };

  const canDeleteTask = (task: Task) => {
    return isSuperAdmin || task.assigned_by === user?.id;
  };

  const canEditTask = (task: Task) => {
    if (isSuperAdmin) return true;
    if (task.assigned_by === user?.id) return true;
    
    // Check if current user has higher hierarchy than task creator
    const currentUserRole = user?.role || 'sevak';
    const taskCreatorRole = task.assigned_by_profile?.role || 'sevak';
    
    const currentUserLevel = roleHierarchy[currentUserRole] || 999;
    const taskCreatorLevel = roleHierarchy[taskCreatorRole] || 999;
    
    return currentUserLevel < taskCreatorLevel;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">Manage and track your tasks</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => setView('list')}
            size="sm"
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Grid</span>
          </Button>
          <Button
            variant={view === 'table' ? 'default' : 'outline'}
            onClick={() => setView('table')}
            size="sm"
          >
            <List className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Table</span>
          </Button>
          <Button
            variant={view === 'calendar' ? 'default' : 'outline'}
            onClick={() => setView('calendar')}
            size="sm"
          >
            <Calendar className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Calendar</span>
          </Button>
          {hasPermission('tasks', 'add') && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Create Task</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Create a new task and assign it to a team member
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter task title"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter task description"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Assign To</label>
                    <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self">Assign to myself</SelectItem>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.full_name} ({profile.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Priority</label>
                      <Select value={formData.priority} onValueChange={(value: TaskPriority) => setFormData({ ...formData, priority: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Type</label>
                      <Select value={formData.task_type} onValueChange={(value: TaskType) => setFormData({ ...formData, task_type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="delegated">Delegated</SelectItem>
                          <SelectItem value="broadcasted">Broadcasted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Due Date</label>
                    <Input
                      type="datetime-local"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                  <Button onClick={createTask} className="w-full">
                    Create Task
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <Filter className="h-4 w-4 text-gray-500" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        {isSuperAdmin && (
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="assigned_by_me">Assigned by me</SelectItem>
              <SelectItem value="assigned_to_me">Assigned to me</SelectItem>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Content */}
      {view === 'calendar' ? (
        <TaskCalendar />
      ) : view === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Assigned By</TableHead>
                    <TableHead className="hidden sm:table-cell">Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Priority</TableHead>
                    <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-48">
                            {task.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {task.assigned_by_profile?.full_name || 'Unknown'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {task.assigned_to_profile?.full_name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(task.status)} text-white`}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {task.due_date ? format(new Date(task.due_date), 'MMM dd, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openTaskDetails(task)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          {canEditTask(task) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(task)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canUpdateTaskStatus(task) && task.status !== 'completed' && (
                            <>
                              {task.status === 'pending' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateTaskStatus(task.id, 'in_progress')}
                                >
                                  Start
                                </Button>
                              )}
                              {task.status === 'in_progress' && (
                                <Button 
                                  size="sm"
                                  onClick={() => updateTaskStatus(task.id, 'completed')}
                                >
                                  Complete
                                </Button>
                              )}
                            </>
                          )}
                          {canDeleteTask(task) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTask(task.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => openTaskDetails(task)}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <div className="flex gap-1">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                    <Badge variant="outline" className={`text-xs ${getStatusColor(task.status)} text-white`}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">
                  {task.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-3 w-3" />
                  <span>By: {task.assigned_by_profile?.full_name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-3 w-3" />
                  <span>To: {task.assigned_to_profile?.full_name || 'Unknown'}</span>
                </div>
                {task.due_date && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-3 w-3" />
                    <span>Due: {format(new Date(task.due_date), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  {canEditTask(task) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => { e.stopPropagation(); openEditDialog(task); }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {canUpdateTaskStatus(task) && task.status !== 'completed' && (
                    <>
                      {task.status === 'pending' && (
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, 'in_progress'); }}>
                          Start
                        </Button>
                      )}
                      {task.status === 'in_progress' && (
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, 'completed'); }}>
                          Complete
                        </Button>
                      )}
                    </>
                  )}
                  {canDeleteTask(task) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600 mb-4">Create your first task or adjust your filters.</p>
        </div>
      )}

      {/* Edit Task Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update task details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Assign To</label>
              <Select value={editFormData.assigned_to} onValueChange={(value) => setEditFormData({ ...editFormData, assigned_to: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.full_name} ({profile.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select value={editFormData.priority} onValueChange={(value: TaskPriority) => setEditFormData({ ...editFormData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={editFormData.task_type} onValueChange={(value: TaskType) => setEditFormData({ ...editFormData, task_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="delegated">Delegated</SelectItem>
                    <SelectItem value="broadcasted">Broadcasted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Due Date</label>
              <Input
                type="datetime-local"
                value={editFormData.due_date}
                onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={updateTask} className="flex-1">
                Update Task
              </Button>
              <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Details Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            <DialogDescription>
              Task details and comments
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status:</span>
                  <Badge className={`ml-2 ${getStatusColor(selectedTask.status)} text-white`}>
                    {selectedTask.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Priority:</span>
                  <Badge className={`ml-2 ${getPriorityColor(selectedTask.priority)} text-white`}>
                    {selectedTask.priority}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Assigned By:</span>
                  <span className="ml-2">{selectedTask.assigned_by_profile?.full_name}</span>
                </div>
                <div>
                  <span className="font-medium">Assigned To:</span>
                  <span className="ml-2">{selectedTask.assigned_to_profile?.full_name}</span>
                </div>
              </div>
              
              {selectedTask.description && (
                <div>
                  <span className="font-medium">Description:</span>
                  <p className="mt-1 text-sm text-gray-600">{selectedTask.description}</p>
                </div>
              )}

              {selectedTask.due_date && (
                <div>
                  <span className="font-medium">Due Date:</span>
                  <span className="ml-2 text-sm">{format(new Date(selectedTask.due_date), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-medium">Comments</span>
                </div>
                <ScrollArea className="h-64 border rounded-lg p-3">
                  {comments.length > 0 ? (
                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 p-2 rounded">
                          <div className="text-xs text-gray-500 mb-1">
                            {comment.profiles.full_name} • {format(new Date(comment.created_at), 'MMM dd, HH:mm')}
                          </div>
                          <div className="text-sm">{comment.comment}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 text-sm">No comments yet</div>
                  )}
                </ScrollArea>
                <div className="flex gap-2 mt-3">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addComment()}
                  />
                  <Button onClick={addComment} size="sm">
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;
