
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { 
  Users, 
  Plus, 
  Search, 
  Grid, 
  List, 
  Download,
  Filter,
  MoreVertical
} from 'lucide-react';
import { KaryakarForm } from '@/components/KaryakarForm';
import { KaryakarFilters } from '@/components/KaryakarFilters';
import { KaryakarStats } from '@/components/KaryakarStats';
import { KaryakarTableView } from '@/components/KaryakarTableView';
import { KaryakarGridView } from '@/components/KaryakarGridView';

interface Profile {
  id: string;
  full_name: string;
  mobile_number: string;
  email?: string;
  role: string;
  age?: number;
  profession_id?: string;
  seva_type_id?: string;
  mandir_id?: string;
  kshetra_id?: string;
  village_id?: string;
  mandal_id?: string;
  is_active: boolean;
  created_at: string;
  professions?: {
    name: string;
  } | null;
  seva_types?: {
    name: string;
  } | null;
  mandirs?: {
    name: string;
  } | null;
  kshetras?: {
    name: string;
  } | null;
  villages?: {
    name: string;
  } | null;
  mandals?: {
    name: string;
  } | null;
}

const Karyakars = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    filterProfiles();
  }, [profiles, searchTerm]);

  const fetchProfiles = async () => {
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

      if (error) throw error;

      // Transform the data to handle potential query errors
      const transformedProfiles: Profile[] = (data || []).map(profile => ({
        ...profile,
        professions: profile.professions && typeof profile.professions === 'object' && !profile.professions.error 
          ? profile.professions 
          : null,
        seva_types: profile.seva_types && typeof profile.seva_types === 'object' && !profile.seva_types.error 
          ? profile.seva_types 
          : null,
        mandirs: profile.mandirs && typeof profile.mandirs === 'object' && !profile.mandirs.error 
          ? profile.mandirs 
          : null,
        kshetras: profile.kshetras && typeof profile.kshetras === 'object' && !profile.kshetras.error 
          ? profile.kshetras 
          : null,
        villages: profile.villages && typeof profile.villages === 'object' && !profile.villages.error 
          ? profile.villages 
          : null,
        mandals: profile.mandals && typeof profile.mandals === 'object' && !profile.mandals.error 
          ? profile.mandals 
          : null
      }));

      setProfiles(transformedProfiles);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch karyakar profiles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProfiles = () => {
    let filtered = profiles;

    if (searchTerm) {
      filtered = filtered.filter(profile =>
        profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.mobile_number.includes(searchTerm) ||
        profile.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProfiles(filtered);
  };

  const handleProfileSaved = () => {
    fetchProfiles();
    setShowForm(false);
    setSelectedProfile(null);
  };

  const handleEdit = (profile: Profile) => {
    setSelectedProfile(profile);
    setShowForm(true);
  };

  const handleDelete = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile deleted successfully',
      });

      fetchProfiles();
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete profile',
        variant: 'destructive',
      });
    }
  };

  const exportData = () => {
    const csv = [
      ['Name', 'Mobile', 'Email', 'Role', 'Profession', 'Seva Type'].join(','),
      ...filteredProfiles.map(profile => [
        profile.full_name,
        profile.mobile_number,
        profile.email || '',
        profile.role,
        profile.professions?.name || '',
        profile.seva_types?.name || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'karyakars.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading karyakars...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Karyakars</h1>
          <Badge variant="secondary">{filteredProfiles.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Karyakar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <KaryakarStats profiles={profiles} />

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <KaryakarFilters onFilter={(filters) => {
              // Apply filters logic here
              console.log('Filters applied:', filters);
            }} />
          </CardContent>
        </Card>
      )}

      {/* Search and View Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search karyakars..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <KaryakarTableView
          profiles={filteredProfiles}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <KaryakarGridView
          profiles={filteredProfiles}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {selectedProfile ? 'Edit Karyakar' : 'Add New Karyakar'}
            </h2>
            <KaryakarForm
              profile={selectedProfile}
              onSave={handleProfileSaved}
              onCancel={() => {
                setShowForm(false);
                setSelectedProfile(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Karyakars;
