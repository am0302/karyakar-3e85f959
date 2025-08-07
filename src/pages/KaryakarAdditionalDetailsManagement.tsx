
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, User } from 'lucide-react';
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

export const KaryakarAdditionalDetailsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canView = hasPermission('karyakar_additional_details', 'view');
  const canEdit = hasPermission('karyakar_additional_details', 'edit');

  const { data: karyakars = [], isLoading } = useQuery({
    queryKey: ['karyakars', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          professions:profession_id(name),
          seva_types:seva_type_id(name),
          mandirs:mandir_id(name),
          kshetras:kshetra_id(name),
          villages:village_id(name),
          mandals:mandal_id(name)
        `)
        .eq('is_active', true)
        .order('full_name');

      if (searchTerm) {
        query = query.ilike('full_name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Profile[];
    },
    enabled: canView
  });

  const handleViewDetails = (karyakar: Profile) => {
    navigate(`/karyakars/${karyakar.id}/additional-details`);
  };

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-sm text-gray-600">You don't have permission to view Karyakar Additional Details.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading karyakars...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Karyakar Additional Details</h1>
        <p className="text-gray-600">Manage additional information for karyakars</p>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search karyakars..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Karyakars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {karyakars.map((karyakar) => (
          <Card key={karyakar.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-4">
                {karyakar.profile_photo_url ? (
                  <img
                    src={karyakar.profile_photo_url}
                    alt={karyakar.full_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-500" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-lg">{karyakar.full_name}</CardTitle>
                  <p className="text-sm text-gray-600">{karyakar.mobile_number}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 mb-4">
                {karyakar.professions?.name && (
                  <p className="text-sm"><span className="font-medium">Profession:</span> {karyakar.professions.name}</p>
                )}
                {karyakar.seva_types?.name && (
                  <p className="text-sm"><span className="font-medium">Seva Type:</span> {karyakar.seva_types.name}</p>
                )}
                {karyakar.villages?.name && (
                  <p className="text-sm"><span className="font-medium">Village:</span> {karyakar.villages.name}</p>
                )}
              </div>
              
              <Button
                onClick={() => handleViewDetails(karyakar)}
                className="w-full"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Manage Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {karyakars.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No karyakars found</p>
        </div>
      )}
    </div>
  );
};
