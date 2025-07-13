
import React, { useState, useEffect } from "react";
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Plus, Filter, MoreVertical, Phone, Mail, Edit, Trash2, Eye } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

type Karyakar = {
  id: string;
  full_name: string;
  mobile_number: string;
  whatsapp_number?: string;
  role: UserRole;
  mandir_id?: string;
  village_id?: string;
  mandal_id?: string;
  profession_id?: string;
  seva_type_id?: string;
  is_active: boolean;
  created_at: string;
  profile_photo_url?: string;
  mandirs?: { name: string };
  villages?: { name: string };
  mandals?: { name: string };
  professions?: { name: string };
  seva_types?: { name: string };
};

type MasterData = {
  professions: any[];
  mandirs: any[];
  villages: any[];
  mandals: any[];
  seva_types: any[];
};

const Karyakars = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [karyakars, setKaryakars] = useState<Karyakar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [selectedKaryakar, setSelectedKaryakar] = useState<Karyakar | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [masterData, setMasterData] = useState<MasterData>({
    professions: [],
    mandirs: [],
    villages: [],
    mandals: [],
    seva_types: []
  });

  const [formData, setFormData] = useState({
    full_name: '',
    mobile_number: '',
    whatsapp_number: '',
    is_whatsapp_same_as_mobile: false,
    date_of_birth: '',
    profession_id: '',
    mandir_id: '',
    village_id: '',
    mandal_id: '',
    seva_type_id: '',
    role: 'sevak' as UserRole,
    profile_photo_url: ''
  });

  useEffect(() => {
    if (user) {
      fetchKaryakars();
      fetchMasterData();
    }
  }, [user]);

  const fetchMasterData = async () => {
    try {
      const [professions, mandirs, villages, mandals, seva_types] = await Promise.all([
        supabase.from('professions').select('*').eq('is_active', true),
        supabase.from('mandirs').select('*').eq('is_active', true),
        supabase.from('villages').select('*').eq('is_active', true),
        supabase.from('mandals').select('*').eq('is_active', true),
        supabase.from('seva_types').select('*').eq('is_active', true)
      ]);

      setMasterData({
        professions: professions.data || [],
        mandirs: mandirs.data || [],
        villages: villages.data || [],
        mandals: mandals.data || [],
        seva_types: seva_types.data || []
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch master data',
        variant: 'destructive',
      });
    }
  };

  const fetchKaryakars = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          mandirs(name),
          villages(name),
          mandals(name),
          professions(name),
          seva_types(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKaryakars(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch karyakars',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'is_whatsapp_same_as_mobile' && value) {
      setFormData(prev => ({
        ...prev,
        whatsapp_number: prev.mobile_number
      }));
    }
  };

  const registerKaryakar = async () => {
    if (!user || !formData.full_name.trim() || !formData.mobile_number.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const age = formData.date_of_birth ? calculateAge(formData.date_of_birth) : null;

      const { error } = await supabase.auth.signUp({
        email: `${formData.mobile_number}@sevasarthi.org`,
        password: formData.mobile_number + '123',
        options: {
          data: {
            full_name: formData.full_name,
            mobile_number: formData.mobile_number,
          }
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Karyakar registered successfully',
      });

      setShowRegistrationDialog(false);
      setFormData({
        full_name: '',
        mobile_number: '',
        whatsapp_number: '',
        is_whatsapp_same_as_mobile: false,
        date_of_birth: '',
        profession_id: '',
        mandir_id: '',
        village_id: '',
        mandal_id: '',
        seva_type_id: '',
        role: 'sevak',
        profile_photo_url: ''
      });
      fetchKaryakars();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const updateKaryakarStatus = async (karyakarId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', karyakarId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Karyakar ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
      
      fetchKaryakars();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteKaryakar = async (karyakarId: string) => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(karyakarId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Karyakar deleted successfully',
      });
      
      fetchKaryakars();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredKaryakars = karyakars.filter(karyakar => {
    const matchesSearch = karyakar.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         karyakar.mobile_number.includes(searchTerm);
    const matchesRole = filterRole === "all" || karyakar.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'sant_nirdeshak': return 'bg-purple-100 text-purple-800';
      case 'sah_nirdeshak': return 'bg-blue-100 text-blue-800';
      case 'mandal_sanchalak': return 'bg-green-100 text-green-800';
      case 'karyakar': return 'bg-yellow-100 text-yellow-800';
      case 'sevak': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeKaryakars = filteredKaryakars.filter(k => k.is_active).length;
  const totalRoles = [...new Set(karyakars.map(k => k.role))].length;
  const totalMandirs = [...new Set(karyakars.map(k => k.mandir_id).filter(Boolean))].length;

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading karyakars...</div>;
  }

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
        <Dialog open={showRegistrationDialog} onOpenChange={setShowRegistrationDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
              <Plus className="w-4 h-4 mr-2" />
              Register Karyakar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Register New Karyakar</DialogTitle>
              <DialogDescription>
                Register a new community member with their role and details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile_number">Mobile Number *</Label>
                  <Input
                    id="mobile_number"
                    type="tel"
                    value={formData.mobile_number}
                    onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                  <Input
                    id="whatsapp_number"
                    type="tel"
                    value={formData.whatsapp_number}
                    onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                    disabled={formData.is_whatsapp_same_as_mobile}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value: UserRole) => handleInputChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sevak">Sevak</SelectItem>
                      <SelectItem value="karyakar">Karyakar</SelectItem>
                      <SelectItem value="mandal_sanchalak">Mandal Sanchalak</SelectItem>
                      <SelectItem value="sah_nirdeshak">Sah Nirdeshak</SelectItem>
                      <SelectItem value="sant_nirdeshak">Sant Nirdeshak</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profession_id">Profession</Label>
                  <Select value={formData.profession_id} onValueChange={(value) => handleInputChange('profession_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select profession" />
                    </SelectTrigger>
                    <SelectContent>
                      {masterData.professions.map((profession) => (
                        <SelectItem key={profession.id} value={profession.id}>
                          {profession.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mandir_id">Mandir</Label>
                  <Select value={formData.mandir_id} onValueChange={(value) => handleInputChange('mandir_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mandir" />
                    </SelectTrigger>
                    <SelectContent>
                      {masterData.mandirs.map((mandir) => (
                        <SelectItem key={mandir.id} value={mandir.id}>
                          {mandir.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="village_id">Village</Label>
                  <Select value={formData.village_id} onValueChange={(value) => handleInputChange('village_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select village" />
                    </SelectTrigger>
                    <SelectContent>
                      {masterData.villages.map((village) => (
                        <SelectItem key={village.id} value={village.id}>
                          {village.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mandal_id">Mandal</Label>
                  <Select value={formData.mandal_id} onValueChange={(value) => handleInputChange('mandal_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mandal" />
                    </SelectTrigger>
                    <SelectContent>
                      {masterData.mandals.map((mandal) => (
                        <SelectItem key={mandal.id} value={mandal.id}>
                          {mandal.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seva_type_id">Seva Type</Label>
                  <Select value={formData.seva_type_id} onValueChange={(value) => handleInputChange('seva_type_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select seva type" />
                    </SelectTrigger>
                    <SelectContent>
                      {masterData.seva_types.map((seva_type) => (
                        <SelectItem key={seva_type.id} value={seva_type.id}>
                          {seva_type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={registerKaryakar} className="flex-1">
                  Register Karyakar
                </Button>
                <Button variant="outline" onClick={() => setShowRegistrationDialog(false)}>
                  Cancel
                </Button>
              </div>
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
                placeholder="Search by name or mobile..."
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
                <SelectItem value="sevak">Sevak</SelectItem>
                <SelectItem value="karyakar">Karyakar</SelectItem>
                <SelectItem value="mandal_sanchalak">Mandal Sanchalak</SelectItem>
                <SelectItem value="sah_nirdeshak">Sah Nirdeshak</SelectItem>
                <SelectItem value="sant_nirdeshak">Sant Nirdeshak</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{activeKaryakars}</div>
            <p className="text-sm text-gray-600">Active Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{totalRoles}</div>
            <p className="text-sm text-gray-600">Different Roles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{totalMandirs}</div>
            <p className="text-sm text-gray-600">Mandirs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{karyakars.length}</div>
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKaryakars.map((karyakar) => (
                <TableRow key={karyakar.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={karyakar.profile_photo_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                          {karyakar.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{karyakar.full_name}</div>
                        <div className="text-sm text-gray-500">{karyakar.mobile_number}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="w-3 h-3" />
                        {karyakar.mobile_number}
                      </div>
                      {karyakar.whatsapp_number && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Mail className="w-3 h-3" />
                          {karyakar.whatsapp_number}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(karyakar.role)}>
                      {karyakar.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{karyakar.mandirs?.name || 'Not assigned'}</div>
                      <div className="text-gray-500">
                        {karyakar.villages?.name || 'No village'} • {karyakar.mandals?.name || 'No mandal'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={karyakar.is_active ? 'default' : 'secondary'}
                      className={karyakar.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                    >
                      {karyakar.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setSelectedKaryakar(karyakar);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => updateKaryakarStatus(karyakar.id, !karyakar.is_active)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteKaryakar(karyakar.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedKaryakar?.full_name} Details
            </DialogTitle>
          </DialogHeader>
          {selectedKaryakar && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedKaryakar.profile_photo_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-lg">
                    {selectedKaryakar.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedKaryakar.full_name}</h3>
                  <Badge className={getRoleBadgeColor(selectedKaryakar.role)}>
                    {selectedKaryakar.role.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div><strong>Mobile:</strong> {selectedKaryakar.mobile_number}</div>
                {selectedKaryakar.whatsapp_number && (
                  <div><strong>WhatsApp:</strong> {selectedKaryakar.whatsapp_number}</div>
                )}
                <div><strong>Profession:</strong> {selectedKaryakar.professions?.name || 'Not specified'}</div>
                <div><strong>Mandir:</strong> {selectedKaryakar.mandirs?.name || 'Not assigned'}</div>
                <div><strong>Village:</strong> {selectedKaryakar.villages?.name || 'Not assigned'}</div>
                <div><strong>Mandal:</strong> {selectedKaryakar.mandals?.name || 'Not assigned'}</div>
                <div><strong>Seva Type:</strong> {selectedKaryakar.seva_types?.name || 'Not specified'}</div>
                <div><strong>Status:</strong> {selectedKaryakar.is_active ? 'Active' : 'Inactive'}</div>
                <div><strong>Joined:</strong> {new Date(selectedKaryakar.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Karyakars;
