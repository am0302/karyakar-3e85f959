
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar';
import moment from 'moment';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Clock, User, AlertCircle } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface Task {
  id: string;
  title: string;
  description: string;
  task_type: 'personal' | 'general' | 'delegated' | 'broadcasted';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string;
  assigned_by: string;
  assigned_to: string;
  created_at: string;
  profiles?: {
    full_name: string;
  } | null;
  assigned_by_profile?: {
    full_name: string;
  } | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Task;
}

const TaskCalendar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [user]);

  useEffect(() => {
    const calendarEvents = tasks
      .filter(task => task.due_date)
      .map(task => ({
        id: task.id,
        title: task.title,
        start: new Date(task.due_date),
        end: new Date(task.due_date),
        resource: task,
      }));
    setEvents(calendarEvents);
  }, [tasks]);

  const fetchTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles!tasks_assigned_to_fkey(full_name),
          assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name)
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;
      
      // Transform the data to handle potential query errors
      const transformedTasks = (data || []).map((task: any) => ({
        ...task,
        profiles: task.profiles && !task.profiles.error ? task.profiles : null,
        assigned_by_profile: task.assigned_by_profile && !task.assigned_by_profile.error ? task.assigned_by_profile : null,
        // Map database task_type values to expected values
        task_type: task.task_type === 'general' ? 'personal' : task.task_type,
        // Ensure priority is within expected range
        priority: task.priority === 'urgent' ? 'high' : task.priority
      }));
      
      setTasks(transformedTasks);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedTask(event.resource);
    setShowTaskDialog(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = getPriorityColor(event.resource.priority);
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading calendar...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          <h2 className="text-2xl font-bold">Task Calendar</h2>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={currentView === Views.MONTH ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView(Views.MONTH)}
          >
            Month
          </Button>
          <Button 
            variant={currentView === Views.WEEK ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView(Views.WEEK)}
          >
            Week
          </Button>
          <Button 
            variant={currentView === Views.DAY ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView(Views.DAY)}
          >
            Day
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={currentView}
              onView={setCurrentView}
              date={currentDate}
              onNavigate={setCurrentDate}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              popup
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Task Details Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {selectedTask?.title}
            </DialogTitle>
            <DialogDescription>
              Task details and information
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-gray-600">{selectedTask.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Priority</h4>
                  <Badge 
                    style={{ backgroundColor: getPriorityColor(selectedTask.priority) }}
                    className="text-white"
                  >
                    {selectedTask.priority.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Status</h4>
                  <Badge className={getStatusColor(selectedTask.status)}>
                    {selectedTask.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1 flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Assigned To
                  </h4>
                  <p className="text-gray-600">{selectedTask.profiles?.full_name || 'Unknown'}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1 flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Assigned By
                  </h4>
                  <p className="text-gray-600">{selectedTask.assigned_by_profile?.full_name || 'Unknown'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-1 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Due Date
                </h4>
                <p className="text-gray-600">
                  {selectedTask.due_date ? moment(selectedTask.due_date).format('MMMM Do YYYY, h:mm A') : 'No due date'}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1">Task Type</h4>
                <p className="text-gray-600 capitalize">{selectedTask.task_type}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskCalendar;
