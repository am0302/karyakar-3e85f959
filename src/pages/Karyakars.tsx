
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter, Download, Grid, List, Search, MapPin, Users, TrendingUp, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { usePermissions } from '@/hooks/usePermissions';
import { KaryakarFilters } from '@/components/KaryakarFilters';
import { KaryakarForm } from '@/components/KaryakarForm';
import { KaryakarGridView } from '@/components/KaryakarGridView';
import { KaryakarTableView } from '@/components/KaryakarTableView';
import { KaryakarStats } from '@/components/KaryakarStats';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Database } from '@/integrations/supabase/types';

// Fix the user_role type by using the correct enum from Database
type UserRole = Database['public']['Enums']['user_role'];

interface Profile {
  id: string;
  full_name: string;
  mobile_number: string;
  whatsapp_number?: string;
  email?: string;
  role: UserRole;
  age?: number;
  date_of_birth?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  mandir_id?: string;
  kshetra_id?: string;
  village_id?: string;
  mandal_id?: string;
  profession_id?: string;
  seva_type_id?: string;
  profile_photo_url?: string;
  is_whatsapp_same_as_mobile?: boolean;
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
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [karyakars, setKaryakars] = useState<Profile[]>([]);
  const [filteredKaryakars, setFilteredKaryakars] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showForm, setShowForm] = useState(false);
  const [selectedKaryakar, setSelectedKaryakar] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    location: '',
    profession: '',
    sevaType: '',
    status: 'active'
  });

  const canView = hasPermission('karyakars', 'view');
  const canAdd = hasPermission('karyakars', 'add');
  const canEdit = hasPermission('karyakars', 'edit');
  const canDelete = hasPermission('karyakars', 'delete');
  const canExport = hasPermission('karyakars', 'export');

  useEffect(() => {
    if (canView) {
      fetchKaryakars();
    }
  }, [canView]);

  useEffect(() => {
    filterKaryakars();
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

      if (error) throw error;
      
      console.log('Fetched karyakars:', data);
      // Filter out records with query errors and transform the data
      const validKaryakars = data?.filter(record => {
        return (!record.professions || (typeof record.professions === 'object' && !('error' in record.professions))) &&
               (!record.seva_types || (typeof record.seva_types === 'object' && !('error' in record.seva_types))) &&
               (!record.mandirs || (typeof record.mandirs === 'object' && !('error' in record.mandirs))) &&
               (!record.kshetras || (typeof record.kshetras === 'object' && !('error' in record.kshetras))) &&
               (!record.villages || (typeof record.villages === 'object' && !('error' in record.villages))) &&
               (!record.mandals || (typeof record.mandals === 'object' && !('error' in record.mandals)));
      }).map(record => ({
        ...record,
        professions: record.professions && typeof record.professions === 'object' && 'name' in record.professions
          ? { name: (record.professions as any).name }
          : null,
        seva_types: record.seva_types && typeof record.seva_types === 'object' && 'name' in record.seva_types
          ? { name: (record.seva_types as any).name }
          : null,
        mandirs: record.mandirs && typeof record.mandirs === 'object' && 'name' in record.mandirs
          ? { name: (record.mandirs as any).name }
          : null,
        kshetras: record.kshetras && typeof record.kshetras === 'object' && 'name' in record.kshetras
          ? { name: (record.kshetras as any).name }
          : null,
        villages: record.villages && typeof record.villages === 'object' && 'name' in record.villages
          ? { name: (record.villages as any).name }
          : null,
        mandals: record.mandals && typeof record.mandals === 'object' && 'name' in record.mandals
          ? { name: (record.mandals as any).name }
          : null
      })) || [];
      
      setKaryakars(validKaryakars as Profile[]);
    } catch (error: any) {
      console.error('Error fetching karyakars:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch karyakars',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterKaryakars = () => {
    let filtered = karyakars;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(k => 
        k.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.mobile_number.includes(searchTerm) ||
        k.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (filters.role) {
      filtered = filtered.filter(k => k.role === filters.role);
    }

    // Status filter
    if (filters.status === 'active') {
      filtered = filtered.filter(k => k.is_active);
    } else if (filters.status === 'inactive') {
      filtered = filtered.filter(k => !k.is_active);
    }

    setFilteredKaryakars(filtered);
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
    setSelectedKaryakar(karyakar);
    setShowForm(true);
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
      toast({
        title: 'Error',
        description: 'Failed to deactivate karyakar',
        variant: 'destructive',
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedKaryakar(null);
    fetchKaryakars();
  };

  const handleExport = () => {
    if (!canExport) {
      toast({
        title: 'Error',
        description: 'You do not have permission to export data',
        variant: 'destructive',
      });
      return;
    }

    // TODO: Implement export functionality
    toast({
      title: 'Info',
      description: 'Export functionality will be implemented soon',
    });
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Karyakars</h1>
          <p className="text-gray-600">Manage your organization's karyakars</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {canAdd && (
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedKaryakar(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Add Karyakar</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {selectedKaryakar ? 'Edit Karyakar' : 'Add New Karyakar'}
                  </DialogTitle>
                </DialogHeader>
                <KaryakarForm
                  onCancel={() => setShowForm(false)}
                />
              </DialogContent>
            </Dialog>
          )}
          
          <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, role: '' }))}>
            <Filter className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
          
          {canExport && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <KaryakarStats totalCount={karyakars.length} />

      {/* Filters */}
      <KaryakarFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedRole={filters.role}
        setSelectedRole={(role) => setFilters(prev => ({ ...prev, role }))}
        selectedStatus={filters.status}
        setSelectedStatus={(status) => setFilters(prev => ({ ...prev, status }))}
      />

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4 mr-2" />
            Grid
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4 mr-2" />
            Table
          </Button>
        </div>
        
        <div className="text-sm text-gray-600">
          Showing {filteredKaryakars.length} of {karyakars.length} karyakars
        </div>
      </div>

      {/* Content */}
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
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No karyakars found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || Object.values(filters).some(f => f) 
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first karyakar'
            }
          </p>
          {canAdd && !searchTerm && !Object.values(filters).some(f => f) && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Karyakar
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Karyakars;
