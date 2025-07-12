
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Plus, Filter, MoreVertical, Phone, Mail } from "lucide-react";

const Karyakars = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // Mock data - in real app this would come from Supabase
  const karyakars = [
    {
      id: 1,
      name: "Ramesh Kumar",
      email: "ramesh@example.com",
      phone: "+91 9876543210",
      role: "Sant Nirdeshak",
      mandir: "Central Mandir",
      village: "Anandpur",
      mandal: "Alpha",
      status: "active",
      joinDate: "2023-01-15",
      profilePhoto: null,
    },
    {
      id: 2,
      name: "Priya Sharma",
      email: "priya@example.com",
      phone: "+91 9876543211",
      role: "Sah Nirdeshak",
      mandir: "Central Mandir",
      village: "Anandpur",
      mandal: "Beta",
      status: "active",
      joinDate: "2023-02-20",
      profilePhoto: null,
    },
    {
      id: 3,
      name: "Suresh Patel",
      email: "suresh@example.com",
      phone: "+91 9876543212",
      role: "Mandal Sanchalak",
      mandir: "East Mandir",
      village: "Shanti Nagar",
      mandal: "Gamma",
      status: "inactive",
      joinDate: "2023-03-10",
      profilePhoto: null,
    },
  ];

  const filteredKaryakars = karyakars.filter(karyakar => {
    const matchesSearch = karyakar.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         karyakar.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || karyakar.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const roles = [...new Set(karyakars.map(k => k.role))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Karyakars & Sevaks</h1>
          <p className="text-gray-600 mt-2">
            Manage community members and their roles
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Karyakar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Karyakar</DialogTitle>
              <DialogDescription>
                Register a new community member with their role and details.
              </DialogDescription>
            </DialogHeader>
            {/* Registration form would go here */}
            <div className="text-center py-8 text-gray-500">
              Registration form coming soon...
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {karyakars.filter(k => k.status === 'active').length}
            </div>
            <p className="text-sm text-gray-600">Active Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {roles.length}
            </div>
            <p className="text-sm text-gray-600">Different Roles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {[...new Set(karyakars.map(k => k.mandir))].length}
            </div>
            <p className="text-sm text-gray-600">Mandirs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {karyakars.length}
            </div>
            <p className="text-sm text-gray-600">Total Members</p>
          </CardContent>
        </Card>
      </div>

      {/* Karyakars Table */}
      <Card>
        <CardHeader>
          <CardTitle>Community Members</CardTitle>
          <CardDescription>
            List of all registered karyakars and sevaks in the community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assignment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKaryakars.map((karyakar) => (
                <TableRow key={karyakar.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={karyakar.profilePhoto || undefined} />
                        <AvatarFallback className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                          {karyakar.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{karyakar.name}</div>
                        <div className="text-sm text-gray-500">{karyakar.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="w-3 h-3" />
                        {karyakar.phone}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Mail className="w-3 h-3" />
                        {karyakar.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{karyakar.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{karyakar.mandir}</div>
                      <div className="text-gray-500">{karyakar.village} • {karyakar.mandal}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={karyakar.status === 'active' ? 'default' : 'secondary'}
                      className={karyakar.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                    >
                      {karyakar.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(karyakar.joinDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Karyakars;
