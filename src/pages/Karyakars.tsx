import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Download, 
  Grid3X3, 
  List,
  User,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { KaryakarForm } from '@/components/KaryakarForm';
import { KaryakarFilters } from '@/components/KaryakarFilters';
import { KaryakarStats } from '@/components/KaryakarStats';
import { KaryakarTableView } from '@/components/KaryakarTableView';
import { KaryakarGridView } from '@/components/KaryakarGridView';
import { useAuth } from '@/components/AuthProvider';
import { usePermissions } from '@/hooks/usePermissions';
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
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
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
    email: '',
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

  const canAdd = hasPermission('karyakars', 'add');
  const canEdit = hasPermission('karyakars', 'edit');
  const canDelete = hasPermission('karyakars', 'delete');
  const canView = hasPermission('karyakars', 'view');

  useEffect(() => {
    if (canView) {
      fetchKaryakars();
      fetchMasterData();
    }
  }, [canView]);

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
    
    if (!canAdd && !editingKaryakar) {
      toast({
        title: 'Error',
        description: 'You do not have permission to add karyakars',
        variant: 'destructive',
      });
      return;
    }

    if (!canEdit && editingKaryakar) {
      toast({
        title: 'Error',
        description: 'You do not have permission to edit karyakars',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      console.log('Submitting form data:', formData);
      
      const age = formData.age ? parseInt(formData.age) : null;
      const dataToSubmit = {
        full_name: formData.full_name,
        email: formData.email || null,
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
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      console.log('Data to submit:', dataToSubmit);

      let result;
      if (editingKaryakar) {
        console.log('Updating karyakar with ID:', editingKaryakar.id);
        result = await supabase
          .from('profiles')
          .update(dataToSubmit)
          .eq('id', editingKaryakar.id)
          .select();
        
        console.log('Update result:', result);
      } else {
        console.log('Creating new karyakar');
        result = await supabase
          .from('profiles')
          .insert([{
            ...dataToSubmit,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
          }])
          .select();
        
        console.log('Insert result:', result);
      }

      if (result.error) {
        console.error('Database operation error:', result.error);
        throw result.error;
      }

      toast({
        title: 'Success',
        description: `Karyakar ${editingKaryakar ? 'updated' : 'registered'} successfully`,
      });

      setShowRegistrationForm(false);
      setEditingKaryakar(null);
      resetForm();
      await fetchKaryakars(); // Refresh the list
    } catch (error: any) {
      console.error('Error saving karyakar:', error);
      toast({
        title: 'Error',
        description: `Failed to ${editingKaryakar ? 'update' : 'create'} karyakar: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
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
    if (!canEdit) {
      toast({
        title: 'Error',
        description: 'You do not have permission to edit karyakars',
        variant: 'destructive',
      });
      return;
    }

    console.log('Editing karyakar:', karyakar);
    setEditingKaryakar(karyakar);
    setShowRegistrationForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      toast({
        title: 'Error',
        description: 'You do not have permission to delete karyakars',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this karyakar?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Karyakar deactivated successfully',
      });

      fetchKaryakars();
    } catch (error: any) {
      console.error('Error deleting karyakar:', error);
      toast({
        title: 'Error',
        description: `Failed to delete karyakar: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const exportData = async () => {
    try {
      const csvContent = [
        ['Name', 'Mobile', 'Email', 'Role', 'Profession', 'Mandir', 'Status'].join(','),
        ...filteredKaryakars.map(k => [
          k.full_name,
          k.mobile_number,
          k.email || '',
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

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading karyakars...</div>;
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You do not have permission to view karyakars.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Karyakars</h1>
          <p className="text-gray-600">Manage karyakar registrations and profiles</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {canAdd && (
            <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  resetForm();
                  setEditingKaryakar(null);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Register Karyakar</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingKaryakar ? 'Edit Karyakar' : 'Register New Karyakar'}
                  </DialogTitle>
                  <DialogDescription>
                    Fill in the details to {editingKaryakar ? 'update' : 'register'} a karyakar
                  </DialogDescription>
                </DialogHeader>

                <KaryakarForm
                  formData={formData}
                  setFormData={setFormData}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setShowRegistrationForm(false);
                    setEditingKaryakar(null);
                    resetForm();
                  }}
                  editingKaryakar={editingKaryakar}
                  mandirs={mandirs}
                  kshetras={kshetras}
                  villages={villages}
                  mandals={mandals}
                  professions={professions}
                  sevaTypes={sevaTypes}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <KaryakarStats totalCount={filteredKaryakars.length} />
        
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                <span className="hidden sm:inline ml-2">
                  {viewMode === 'grid' ? 'List View' : 'Grid View'}
                </span>
              </Button>
              <Button variant="outline" size="sm" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>

            {/* Quick search */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search karyakars..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <KaryakarFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
          />

          {viewMode === 'grid' ? (
            <KaryakarGridView
              karyakars={filteredKaryakars}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
            <KaryakarTableView
              karyakars={filteredKaryakars}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}

          {filteredKaryakars.length === 0 && (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No karyakars found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedRole || selectedStatus
                  ? 'Try adjusting your search filters'
                  : canAdd 
                    ? 'Get started by registering your first karyakar'
                    : 'No karyakars available to view'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Karyakars;
