
import React from 'react';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/SearchableSelect';
import { useDynamicRoles } from '@/hooks/useDynamicRoles';

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
  const { getRoleOptions } = useDynamicRoles();

  // Filter role options to ensure no empty values
  const validRoleOptions = getRoleOptions().filter(option => 
    option && 
    option.value && 
    typeof option.value === 'string' && 
    option.value.trim() !== '' &&
    option.label &&
    typeof option.label === 'string' &&
    option.label.trim() !== ''
  );

  const roleOptions = [
    { value: 'all_roles', label: 'All Roles' },
    ...validRoleOptions
  ];

  const statusOptions = [
    { value: 'all_status', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

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
        options={roleOptions}
        value={selectedRole || 'all_roles'}
        onValueChange={(value) => setSelectedRole(value === 'all_roles' ? '' : value)}
        placeholder="Filter by Role"
        className="w-48"
      />
      
      <SearchableSelect
        options={statusOptions}
        value={selectedStatus || 'all_status'}
        onValueChange={(value) => setSelectedStatus(value === 'all_status' ? '' : value)}
        placeholder="Filter by Status"
        className="w-48"
      />
    </div>
  );
};
