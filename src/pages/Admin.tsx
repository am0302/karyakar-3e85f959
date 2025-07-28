
import React from 'react';
import { MasterDataDialog } from '@/components/MasterDataDialog';
import { RoleHierarchyManager } from '@/components/RoleHierarchyManager';
import { PermissionsManager } from '@/components/PermissionsManager';
import { UserLocationAssignment } from '@/components/UserLocationAssignment';
import { KaryakarRoleModule } from '@/components/KaryakarRoleModule';

const Admin = () => {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Panel</h1>
      <p className="text-gray-600 mb-8">Manage master data, roles, permissions, and user assignments</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Master Data Management</h2>
          <div className="space-y-4">
            <MasterDataDialog
              title="Mandir"
              fields={[
                { name: 'name', label: 'Mandir Name', type: 'text', required: true },
                { name: 'description', label: 'Description', type: 'textarea' },
                { name: 'address', label: 'Address', type: 'textarea' },
                { name: 'contact_person', label: 'Contact Person', type: 'text' },
                { name: 'contact_number', label: 'Contact Number', type: 'text' },
                { name: 'email', label: 'Email', type: 'email' },
                { name: 'established_date', label: 'Established Date', type: 'date' }
              ]}
              table="mandirs"
            />
            
            <MasterDataDialog
              title="Kshetra"
              fields={[
                { name: 'name', label: 'Kshetra Name', type: 'text', required: true },
                { name: 'description', label: 'Description', type: 'textarea' },
                { name: 'contact_person', label: 'Contact Person', type: 'text' },
                { name: 'contact_number', label: 'Contact Number', type: 'text' },
                { name: 'mandir_id', label: 'Mandir', type: 'select', options: 'mandirs' }
              ]}
              table="kshetras"
            />
            
            <MasterDataDialog
              title="Village"
              fields={[
                { name: 'name', label: 'Village Name', type: 'text', required: true },
                { name: 'district', label: 'District', type: 'text' },
                { name: 'state', label: 'State', type: 'text' },
                { name: 'pincode', label: 'Pincode', type: 'text' },
                { name: 'population', label: 'Population', type: 'number' },
                { name: 'contact_person', label: 'Contact Person', type: 'text' },
                { name: 'contact_number', label: 'Contact Number', type: 'text' },
                { name: 'kshetra_id', label: 'Kshetra', type: 'select', options: 'kshetras' }
              ]}
              table="villages"
            />
            
            <MasterDataDialog
              title="Mandal"
              fields={[
                { name: 'name', label: 'Mandal Name', type: 'text', required: true },
                { name: 'description', label: 'Description', type: 'textarea' },
                { name: 'meeting_day', label: 'Meeting Day', type: 'text' },
                { name: 'meeting_time', label: 'Meeting Time', type: 'time' },
                { name: 'contact_person', label: 'Contact Person', type: 'text' },
                { name: 'contact_number', label: 'Contact Number', type: 'text' },
                { name: 'village_id', label: 'Village', type: 'select', options: 'villages' }
              ]}
              table="villages"
            />
            
            <MasterDataDialog
              title="Profession"
              fields={[
                { name: 'name', label: 'Profession Name', type: 'text', required: true },
                { name: 'description', label: 'Description', type: 'textarea' }
              ]}
              table="professions"
            />
            
            <MasterDataDialog
              title="Seva Type"
              fields={[
                { name: 'name', label: 'Seva Type Name', type: 'text', required: true },
                { name: 'description', label: 'Description', type: 'textarea' }
              ]}
              table="seva_types"
            />

            <MasterDataDialog
              title="Karyakar Role"
              fields={[
                { name: 'role_name', label: 'Role Name', type: 'text', required: true },
                { name: 'display_name', label: 'Display Name', type: 'text', required: true },
                { name: 'description', label: 'Description', type: 'textarea' },
                { name: 'type', label: 'Type', type: 'select', options: [
                  { value: 'custom', label: 'Custom' },
                  { value: 'system', label: 'System' }
                ]},
                { name: 'status', label: 'Status', type: 'select', options: [
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
              ]}
              table="custom_roles"
            />
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4">System Management</h2>
          <div className="space-y-4">
            <RoleHierarchyManager />
            <PermissionsManager />
            <UserLocationAssignment />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
