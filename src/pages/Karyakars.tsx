
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Grid3X3, 
  List,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SearchableSelect } from '@/components/SearchableSelect';
import { KaryakarCard } from '@/components/KaryakarCard';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  professions?: { name: string } | null;
  seva_types?: { name: string } | null;
  mandirs?: { name: string } | null;
  kshetras?: { name: string } | null;
  villages?: { name: string } | null;
  mandals?: { name: string } | null;
};

type UserRole = Database['public']['Enums']['user_role'];

const Karyakars = () => {
  const { toast } = useToast();
  const [karyakars, setKaryakars] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [editingKaryakar, setEditingKaryakar] = useState<Profile | null>(null);
  
  // Form states
  const [mandirs, setMandirs] = useState<Array<{ id: string; name: string }>>([]);
  const [kshetras, setKshetras] = useState<Array<{ id: string; name: string }>>([]);
  const [villages, setVillages] = useState<Array<{ id: string; name: string }>>([]);
  const [mandals, setMandals] = useState<Array<{ id: string; name: string }>>([]);
  const [professions, setProfessions] = useState<Array<{ id: string; name: string }>>([]);
  const [sevaTypes, setSevaTypes] = useState<Array<{ id: string; name: string }>>([]);

  const [formData, setFormData] = useState({
    full_name: '',
    mobile_number: '',
    whatsapp_number: '',
    is_whatsapp_same_as_mobile: false,
    date_of_birth: '',
    age: '',
    profession_id: '',
    mandir_id: '',
    kshetra_id: '',
    village_id: '',
    mandal_id: '',
    seva_type_id: '',
    role: 'sevak' as UserRole,
    profile_photo_url: ''
  });

  useEffect(() => {
    fetchKaryakars();
    fetchMasterData();
  }, []);

  const fetchKaryakars = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          professions(name),
          seva_types(name),
          mandirs(name),
          kshetras(name),
          villages(name),
          mandals(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching karyakars:', error);
        throw error;
      }

      console.log('Fetched karyakars:', data);
      setKaryakars(data || []);
    } catch (error: any) {
      console.error('Failed to fetch karyakars:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch karyakars: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [mandirsRes, kshetrasRes, villagesRes, mandalsRes, professionsRes, sevaTypesRes] = await Promise.all([
        supabase.from('mandirs').select('id, name').eq('is_active', true).order('name'),
        supabase.from('kshetras').select('id, name').eq('is_active', true).order('name'),
        supabase.from('villages').select('id, name').eq('is_active', true).order('name'),
        supabase.from('mandals').select('id, name').eq('is_active', true).order('name'),
        supabase.from('professions').select('id, name').eq('is_active', true).order('name'),
        supabase.from('seva_types').select('id, name').eq('is_active', true).order('name')
      ]);

      setMandirs(mandirsRes.data || []);
      setKshetras(kshetrasRes.data || []);
      setVillages(villagesRes.data || []);
      setMandals(mandalsRes.data || []);
      setProfessions(professionsRes.data || []);
      setSevaTypes(sevaTypesRes.data || []);
    } catch (error: any) {
      console.error('Error fetching master data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const age = formData.age ? parseInt(formData.age) : null;
      const dataToSubmit = {
        full_name: formData.full_name,
        mobile_number: formData.mobile_number,
        whatsapp_number: formData.is_whatsapp_same_as_mobile ? formData.mobile_number : formData.whatsapp_number,
        is_whatsapp_same_as_mobile: formData.is_whatsapp_same_as_mobile,
        date_of_birth: formData.date_of_birth || null,
        age,
        profession_id: formData.profession_id || null,
        mandir_id: formData.mandir_id || null,
        kshetra_id: formData.kshetra_id || null,
        village_id: formData.village_id || null,
        mandal_id: formData.mandal_id || null,
        seva_type_id: formData.seva_type_id || null,
        role: formData.role,
        profile_photo_url: formData.profile_photo_url || null,
      };

      let error;
      if (editingKaryakar) {
        const result = await supabase
          .from('profiles')
          .update(dataToSubmit)
          .eq('id', editingKaryakar.id);
        error = result.error;
      } else {
        // For new karyakar, we need to create an auth user first or use a UUID
        // Since we don't have auth integration, we'll generate a UUID
        const { data: insertData, error: insertError } = await supabase
          .from('profiles')
          .insert([{
            ...dataToSubmit,
            id: crypto.randomUUID(), // Generate a UUID for new profiles
          }]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Karyakar ${editingKaryakar ? 'updated' : 'registered'} successfully`,
      });

      setShowRegistrationForm(false);
      setEditingKaryakar(null);
      resetForm();
      fetchKaryakars();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      mobile_number: '',
      whatsapp_number: '',
      is_whatsapp_same_as_mobile: false,
      date_of_birth: '',
      age: '',
      profession_id: '',
      mandir_id: '',
      kshetra_id: '',
      village_id: '',
      mandal_id: '',
      seva_type_id: '',
      role: 'sevak',
      profile_photo_url: ''
    });
  };

  const handleEdit = (karyakar: Profile) => {
    setFormData({
      full_name: karyakar.full_name,
      mobile_number: karyakar.mobile_number,
      whatsapp_number: karyakar.whatsapp_number || '',
      is_whatsapp_same_as_mobile: karyakar.is_whatsapp_same_as_mobile || false,
      date_of_birth: karyakar.date_of_birth || '',
      age: karyakar.age?.toString() || '',
      profession_id: karyakar.profession_id || '',
      mandir_id: karyakar.mandir_id || '',
      kshetra_id: karyakar.kshetra_id || '',
      village_id: karyakar.village_id || '',
      mandal_id: karyakar.mandal_id || '',
      seva_type_id: karyakar.seva_type_id || '',
      role: karyakar.role,
      profile_photo_url: karyakar.profile_photo_url || ''
    });
    setEditingKaryakar(karyakar);
    setShowRegistrationForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this karyakar?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

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

  const exportData = async () => {
    try {
      const csvContent = [
        ['Name', 'Mobile', 'Role', 'Profession', 'Mandir', 'Status'].join(','),
        ...filteredKaryakars.map(k => [
          k.full_name,
          k.mobile_number,
          k.role,
          k.professions?.name || '',
          k.mandirs?.name || '',
          k.is_active ? 'Active' : 'Inactive'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'karyakars.csv';
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Data exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    }
  };

  const filteredKaryakars = karyakars.filter(karyakar => {
    const matchesSearch = karyakar.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         karyakar.mobile_number.includes(searchTerm);
    const matchesRole = !selectedRole || karyakar.role === selectedRole;
    const matchesStatus = !selectedStatus || 
                         (selectedStatus === 'active' && karyakar.is_active) ||
                         (selectedStatus === 'inactive' && !karyakar.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: UserRole) => {
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

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading karyakars...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Karyakars</h1>
          <p className="text-gray-600">Manage karyakar registrations and profiles</p>
        </div>
        
        <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
              setEditingKaryakar(null);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Register Karyakar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingKaryakar ? 'Edit Karyakar' : 'Register New Karyakar'}
              </DialogTitle>
              <DialogDescription>
                Fill in the details to {editingKaryakar ? 'update' : 'register'} a karyakar
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="mobile_number">Mobile Number *</Label>
                  <Input
                    id="mobile_number"
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_whatsapp_same_as_mobile"
                  checked={formData.is_whatsapp_same_as_mobile}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_whatsapp_same_as_mobile: checked })}
                />
                <Label htmlFor="is_whatsapp_same_as_mobile">WhatsApp number is same as mobile</Label>
              </div>

              {!formData.is_whatsapp_same_as_mobile && (
                <div>
                  <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                  <Input
                    id="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Profession</Label>
                  <SearchableSelect
                    options={professions.map(p => ({ value: p.id, label: p.name }))}
                    value={formData.profession_id}
                    onValueChange={(value) => setFormData({ ...formData, profession_id: value })}
                    placeholder="Select Profession"
                  />
                </div>
                
                <div>
                  <Label>Seva Type</Label>
                  <SearchableSelect
                    options={sevaTypes.map(s => ({ value: s.id, label: s.name }))}
                    value={formData.seva_type_id}
                    onValueChange={(value) => setFormData({ ...formData, seva_type_id: value })}
                    placeholder="Select Seva Type"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mandir</Label>
                  <SearchableSelect
                    options={mandirs.map(m => ({ value: m.id, label: m.name }))}
                    value={formData.mandir_id}
                    onValueChange={(value) => setFormData({ ...formData, mandir_id: value })}
                    placeholder="Select Mandir"
                  />
                </div>
                
                <div>
                  <Label>Kshetra</Label>
                  <SearchableSelect
                    options={kshetras.map(k => ({ value: k.id, label: k.name }))}
                    value={formData.kshetra_id}
                    onValueChange={(value) => setFormData({ ...formData, kshetra_id: value })}
                    placeholder="Select Kshetra"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Village</Label>
                  <SearchableSelect
                    options={villages.map(v => ({ value: v.id, label: v.name }))}
                    value={formData.village_id}
                    onValueChange={(value) => setFormData({ ...formData, village_id: value })}
                    placeholder="Select Village"
                  />
                </div>
                
                <div>
                  <Label>Mandal</Label>
                  <SearchableSelect
                    options={mandals.map(m => ({ value: m.id, label: m.name }))}
                    value={formData.mandal_id}
                    onValueChange={(value) => setFormData({ ...formData, mandal_id: value })}
                    placeholder="Select Mandal"
                  />
                </div>
              </div>

              <div>
                <Label>Role</Label>
                <SearchableSelect
                  options={[
                    { value: 'sevak', label: 'Sevak' },
                    { value: 'karyakar', label: 'Karyakar' },
                    { value: 'mandal_sanchalak', label: 'Mandal Sanchalak' },
                    { value: 'sah_nirdeshak', label: 'Sah Nirdeshak' },
                    { value: 'sant_nirdeshak', label: 'Sant Nirdeshak' },
                    { value: 'super_admin', label: 'Super Admin' },
                  ]}
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                  placeholder="Select Role"
                />
              </div>

              <div>
                <Label htmlFor="profile_photo_url">Profile Photo URL</Label>
                <Input
                  id="profile_photo_url"
                  value={formData.profile_photo_url}
                  onChange={(e) => setFormData({ ...formData, profile_photo_url: e.target.value })}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowRegistrationForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingKaryakar ? 'Update' : 'Register'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Karyakars ({filteredKaryakars.length})
              </CardTitle>
              <CardDescription>
                Manage and view all registered karyakars
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search karyakars..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <SearchableSelect
              options={[
                { value: '', label: 'All Roles' },
                { value: 'sevak', label: 'Sevak' },
                { value: 'karyakar', label: 'Karyakar' },
                { value: 'mandal_sanchalak', label: 'Mandal Sanchalak' },
                { value: 'sah_nirdeshak', label: 'Sah Nirdeshak' },
                { value: 'sant_nirdeshak', label: 'Sant Nirdeshak' },
                { value: 'super_admin', label: 'Super Admin' },
              ]}
              value={selectedRole}
              onValueChange={setSelectedRole}
              placeholder="Filter by Role"
              className="w-48"
            />
            
            <SearchableSelect
              options={[
                { value: '', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              placeholder="Filter by Status"
              className="w-48"
            />
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredKaryakars.map((karyakar) => (
                <KaryakarCard
                  key={karyakar.id}
                  karyakar={karyakar}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  showActions={true}
                />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Profession</TableHead>
                  <TableHead>Mandir</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKaryakars.map((karyakar) => (
                  <TableRow key={karyakar.id}>
                    <TableCell className="font-medium">{karyakar.full_name}</TableCell>
                    <TableCell>{karyakar.mobile_number}</TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(karyakar.role)}>
                        {karyakar.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{karyakar.professions?.name || 'N/A'}</TableCell>
                    <TableCell>{karyakar.mandirs?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={karyakar.is_active ? "default" : "secondary"}>
                        {karyakar.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(karyakar)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(karyakar.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredKaryakars.length === 0 && (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No karyakars found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedRole || selectedStatus
                  ? 'Try adjusting your search filters'
                  : 'Get started by registering your first karyakar'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Karyakars;
