
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  CheckSquare,
  MessageSquare,
  Building2,
  TrendingUp,
  Activity,
  Clock,
  AlertCircle
} from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Karyakars",
      value: "1,247",
      change: "+12%",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Tasks",
      value: "89",
      change: "+3%",
      icon: CheckSquare,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Messages Today",
      value: "156",
      change: "+23%",
      icon: MessageSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Mandirs",
      value: "12",
      change: "0%",
      icon: Building2,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  const recentTasks = [
    {
      title: "Monthly Seva Planning",
      assignee: "Ramesh Kumar",
      priority: "High",
      dueDate: "Tomorrow",
      status: "In Progress",
    },
    {
      title: "Youth Program Coordination",
      assignee: "Priya Sharma",
      priority: "Medium",
      dueDate: "Next Week",
      status: "Pending",
    },
    {
      title: "Festival Preparation",
      assignee: "Multiple Assignees",
      priority: "High",
      dueDate: "3 days",
      status: "In Progress",
    },
  ];

  const upcomingEvents = [
    {
      title: "Kshetra Meeting",
      date: "Dec 20, 2024",
      time: "10:00 AM",
      location: "Central Mandir",
    },
    {
      title: "Seva Coordination",
      date: "Dec 22, 2024",
      time: "2:00 PM",
      location: "Community Hall",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here's what's happening in your spiritual community.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              Recent Tasks
            </CardTitle>
            <CardDescription>
              Tasks that need your attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTasks.map((task, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-medium">{task.title}</h4>
                  <p className="text-sm text-gray-600">Assigned to: {task.assignee}</p>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={task.priority === 'High' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {task.priority}
                    </Badge>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Due {task.dueDate}
                    </span>
                  </div>
                </div>
                <Badge variant={task.status === 'In Progress' ? 'default' : 'secondary'}>
                  {task.status}
                </Badge>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              View All Tasks
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Upcoming Events
            </CardTitle>
            <CardDescription>
              Important events and meetings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <h4 className="font-medium">{event.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{event.location}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1 text-gray-500">
                    <Clock className="w-3 h-3" />
                    {event.date}
                  </span>
                  <span className="text-orange-600 font-medium">{event.time}</span>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              View Calendar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Activity Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Community Activity</CardTitle>
          <CardDescription>
            Overview of community engagement and participation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Task Completion Rate</span>
                <span className="font-medium">78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Participation</span>
                <span className="font-medium">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Communication Engagement</span>
                <span className="font-medium">65%</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
