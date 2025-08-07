
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const KaryakarAdditionalDetailsManagement = () => {
  const navigate = useNavigate();

  const handleNavigateToKaryakars = () => {
    navigate('/karyakars');
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Karyakar Additional Details</h1>
        <p className="text-gray-600 mt-1">Manage additional information for all karyakars</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">
          This section allows authorized users to manage additional details for karyakars.
          Use the individual karyakar detail pages to add or edit specific information.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Navigate to the Karyakars section and click "Details" on any karyakar card to manage their additional information.
        </p>
        <Button
          variant="outline"
          onClick={handleViewAdditionalDetails}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Additional Details of Karyakars
        </Button>
      </div>
    </div>
  );
};

export default KaryakarAdditionalDetailsManagement;
