
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KaryakarFilters } from '@/components/KaryakarFilters';
import { KaryakarStats } from '@/components/KaryakarStats';
import { KaryakarTableView } from '@/components/KaryakarTableView';
import { KaryakarGridView } from '@/components/KaryakarGridView';
import { KaryakarForm } from '@/components/KaryakarForm';
import { Plus, Grid, List, Download, Upload, RefreshCw, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDynamicRoles } from '@/hooks/useDynamicRoles';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  professions?: { name: string };
  seva_types?: { name: string };
  mandirs?: { name: string };
  kshetras?: { name: string };
  villages?: { name: string };
  mandals?: { name: string };
};

const Karyakars = () => {
  const { toast } = useToast();
  const { getRoleDisplayName } = useDynamicRoles();
  const [karyakars, setKaryakars] = useState<Profile[]>([]);
  const [filteredKaryakars, setFilteredKaryakars] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingKaryakar, setEditingKaryakar] = useState<Profile | null>(null);

  // Master data states
  const [mandirs, setMandirs] = useState<Array<{ id: string; name: string }>>([]);
  const [kshetras, setKshetras] = useState<Array<{ id: string; name: string }>>([]);
  const [villages, setVillages] = useState<Array<{ id: string; name: string }>>([]);
  const [mandals, setMandals] = useState<Array<{ id: string; name: string }>>([]);
  const [professions, setProfessions] = useState<Array<{ id: string; name: string }>>([]);
  const [sevaTypes, setSevaTypes] = useState<Array<{ id: string; name: string }>>([]);

  // Form data state
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
    role: 'sevak',
    profile_photo_url: ''
  });

  // Filter states
  const [filters, setFilters] = useState({
    role: '',
    mandir: '',
    kshetra: '',
    village: '',
    mandal: '',
    profession: '',
    sevaType: '',
    status: 'active'
  });

  useEffect(() => {
    fetchKaryakars();
    fetchMasterData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [karyakars, searchTerm, filters]);

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
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching karyakars:', error);
        setKaryakars([]);
        return;
      }

      // Filter out profiles with query errors
      const validKaryakars = (data || []).filter(karyakar => {
        return (!karyakar.professions || !('error' in karyakar.professions)) &&
               (!karyakar.seva_types || !('error' in karyakar.seva_types)) &&
               (!karyakar.mandirs || !('error' in karyakar.mandirs)) &&
               (!karyakar.kshetras || !('error' in karyakar.kshetras)) &&
               (!karyakar.villages || !('error' in karyakar.villages)) &&
               (!karyakar.mandals || !('error' in karyakar.mandals));
      }).map(karyakar => ({
        ...karyakar,
        professions: karyakar.professions || { name: 'Unknown' },
        seva_types: karyakar.seva_types || { name: 'Unknown' },
        mandirs: karyakar.mandirs || { name: 'Unknown' },
        kshetras: karyakar.kshetras || { name: 'Unknown' },
        villages: karyakar.villages || { name: 'Unknown' },
        mandals: karyakar.mandals || { name: 'Unknown' }
      }));

      setKaryakars(validKaryakars);
    } catch (error: any) {
      console.error('Error fetching karyakars:', error);
      toast({
        title: 'Error',
        description: 'Failed to load karyakars',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [mandirData, kshetraData, villageData, mandalData, professionData, sevaTypeData] = await Promise.all([
        supabase.from('mandirs').select('id, name').eq('is_active', true).order('name'),
        supabase.from('kshetras').select('id, name').eq('is_active', true).order('name'),
        supabase.from('villages').select('id, name').eq('is_active', true).order('name'),
        supabase.from('mandals').select('id, name').eq('is_active', true).order('name'),
        supabase.from('professions').select('id, name').eq('is_active', true).order('name'),
        supabase.from('seva_types').select('id, name').eq('is_active', true).order('name')
      ]);

      setMandirs(mandirData.data || []);
      setKshetras(kshetraData.data || []);
      setVillages(villageData.data || []);
      setMandals(mandalData.data || []);
      setProfessions(professionData.data || []);
      setSevaTypes(sevaTypeData.data || []);
    } catch (error: any) {
      console.error('Error fetching master data:', error);
    }
  };

  const applyFilters = () => {
    let filtered = karyakars;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(k => 
        k.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.mobile_number?.includes(searchTerm)
      );
    }

    // Apply other filters
    if (filters.role) {
      filtered = filtered.filter(k => k.role === filters.role);
    }
    if (filters.mandir) {
      filtered = filtered.filter(k => k.mandir_id === filters.mandir);
    }
    if (filters.kshetra) {
      filtered = filtered.filter(k => k.kshetra_id === filters.kshetra);
    }
    if (filters.village) {
      filtered = filtered.filter(k => k.village_id === filters.village);
    }
    if (filters.mandal) {
      filtered = filtered.filter(k => k.mandal_id === filters.mandal);
    }
    if (filters.profession) {
      filtered = filtered.filter(k => k.profession_id === filters.profession);
    }
    if (filters.sevaType) {
      filtered = filtered.filter(k => k.seva_type_id === filters.sevaType);
    }

    setFilteredKaryakars(filtered);
  };

  const handleAddKaryakar = () => {
    setEditingKaryakar(null);
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
    setShowForm(true);
  };

  const handleEditKaryakar = (karyakar: Profile) => {
    setEditingKaryakar(karyakar);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission - implementation would go here
    console.log('Form submitted:', formData);
    setShowForm(false);
    fetchKaryakars();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingKaryakar(null);
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

  const stats = useMemo(() => {
    const totalKaryakars = karyakars.length;
    const activeKaryakars = karyakars.filter(k => k.is_active).length;
    const byRole = karyakars.reduce((acc, k) => {
      acc[k.role] = (acc[k.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalKaryakars,
      activeKaryakars,
      byRole
    };
  }, [karyakars]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading karyakars...</p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {editingKaryakar ? 'Edit Karyakar' : 'Add New Karyakar'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KaryakarForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              editingKaryakar={editingKaryakar}
              mandirs={mandirs}
              kshetras={kshetras}
              villages={villages}
              mandals={mandals}
              professions={professions}
              sevaTypes={sevaTypes}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Karyakars</h1>
          <p className="text-gray-600">Manage your organization's members</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchKaryakars()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAddKaryakar}>
            <Plus className="h-4 w-4 mr-2" />
            Add Karyakar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <KaryakarStats totalKaryakars={stats.totalKaryakars} activeKaryakars={stats.activeKaryakars} byRole={stats.byRole} />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search karyakars..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <KaryakarFilters
              mandirs={mandirs}
              kshetras={kshetras}
              villages={villages}
              mandals={mandals}
              professions={professions}
              sevaTypes={sevaTypes}
              onFilterChange={setFilters}
            />
          </CardContent>
        </Card>
      )}

      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Showing {filteredKaryakars.length} of {karyakars.length} karyakars
          </span>
        </div>
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'table')}>
          <TabsList>
            <TabsTrigger value="grid" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Table
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <Tabs value={viewMode} className="space-y-4">
        <TabsContent value="grid" className="space-y-4">
          <KaryakarGridView
            karyakars={filteredKaryakars}
            onEdit={handleEditKaryakar}
          />
        </TabsContent>
        <TabsContent value="table" className="space-y-4">
          <KaryakarTableView
            karyakars={filteredKaryakars}
            onEdit={handleEditKaryakar}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Karyakars;
