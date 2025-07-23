
import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useDynamicRoles } from "@/hooks/useDynamicRoles";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { FileText, Users, TrendingUp, Download } from 'lucide-react';

const Reports = () => {
  const { getRoleOptions, getRoleDisplayName } = useDynamicRoles();
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedMandir, setSelectedMandir] = useState('');
  const [selectedKshetra, setSelectedKshetra] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Sample data for charts
  const roleDistributionData = [
    { name: 'Super Admin', value: 2 },
    { name: 'Sant Nirdeshak', value: 5 },
    { name: 'Sah Nirdeshak', value: 12 },
    { name: 'Mandal Sanchalak', value: 25 },
    { name: 'Karyakar', value: 150 },
    { name: 'Sevak', value: 300 }
  ];

  const monthlyGrowthData = [
    { month: 'Jan', karyakars: 120, sevaks: 250 },
    { month: 'Feb', karyakars: 135, sevaks: 280 },
    { month: 'Mar', karyakars: 148, sevaks: 310 },
    { month: 'Apr', karyakars: 162, sevaks: 340 },
    { month: 'May', karyakars: 175, sevaks: 370 },
    { month: 'Jun', karyakars: 187, sevaks: 400 }
  ];

  const locationWiseData = [
    { location: 'Mandir A', count: 45 },
    { location: 'Mandir B', count: 38 },
    { location: 'Mandir C', count: 52 },
    { location: 'Mandir D', count: 31 },
    { location: 'Mandir E', count: 28 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const handleExportReport = () => {
    // Implementation for exporting reports
    console.log('Exporting report...');
  };

  return (
    <ProtectedRoute module="reports" action="view">
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Generate comprehensive reports and view analytics
            </p>
          </div>

          {/* Filter Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <SearchableSelect
                    options={[
                      { value: '', label: 'All Roles' },
                      ...getRoleOptions()
                    ]}
                    value={selectedRole}
                    onValueChange={setSelectedRole}
                    placeholder="Select Role"
                  />
                </div>
                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={handleExportReport} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Karyakars</p>
                    <p className="text-2xl font-bold">187</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sevaks</p>
                    <p className="text-2xl font-bold">400</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Mandirs</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Growth</p>
                    <p className="text-2xl font-bold">+12%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Role Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roleDistributionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {roleDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Growth Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="karyakars" stroke="#8884d8" name="Karyakars" />
                    <Line type="monotone" dataKey="sevaks" stroke="#82ca9d" name="Sevaks" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Location-wise Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Location-wise Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={locationWiseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Reports;
