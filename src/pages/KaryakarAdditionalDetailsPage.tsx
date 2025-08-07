
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { KaryakarAdditionalDetails } from '@/components/KaryakarAdditionalDetails';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const KaryakarAdditionalDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: karyakar, isLoading, error } = useQuery({
    queryKey: ['karyakar', id],
    queryFn: async () => {
      if (!id) throw new Error('No karyakar ID provided');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading karyakar details...</p>
        </div>
      </div>
    );
  }

  if (error || !karyakar) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Karyakar Not Found</h3>
          <p className="text-sm text-gray-600 mb-4">The requested karyakar could not be found.</p>
          <Button onClick={() => navigate('/karyakars')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Karyakars
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/karyakars')}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Additional Details</h1>
          <p className="text-gray-600">Manage additional information for {karyakar.full_name}</p>
        </div>
      </div>

      <div className="max-w-4xl">
        <KaryakarAdditionalDetails
          karyakarId={karyakar.id}
          karyakarName={karyakar.full_name}
        />
      </div>
    </div>
  );
};
