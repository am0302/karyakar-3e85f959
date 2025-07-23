
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

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    ...getRoleOptions()
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const handleRoleChange = (value: string) => {
    setSelectedRole(value === 'all' ? '' : value);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value === 'all' ? '' : value);
  };

  const getCurrentRoleValue = () => {
    return selectedRole || 'all';
  };

  const getCurrentStatusValue = () => {
    return selectedStatus || 'all';
  };

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
        value={getCurrentRoleValue()}
        onValueChange={handleRoleChange}
        placeholder="Filter by Role"
        className="w-48"
      />
      
      <SearchableSelect
        options={statusOptions}
        value={getCurrentStatusValue()}
        onValueChange={handleStatusChange}
        placeholder="Filter by Status"
        className="w-48"
      />
    </div>
  );
};
