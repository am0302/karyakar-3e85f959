
import React from 'react';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/SearchableSelect';

interface KaryakarFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
}

export const KaryakarFilters = ({
  searchTerm,
  setSearchTerm,
  selectedRole,
  setSelectedRole,
  selectedStatus,
  setSelectedStatus
}: KaryakarFiltersProps) => {
  return (
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
  );
};
