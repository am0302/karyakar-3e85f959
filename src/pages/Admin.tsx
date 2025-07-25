
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionsManager } from "@/components/PermissionsManager";
import { RoleHierarchyManager } from "@/components/RoleHierarchyManager";
import { UserLocationAssignment } from "@/components/UserLocationAssignment";
import { MasterDataDialog } from "@/components/MasterDataDialog";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Shield, Network, MapPin, Users, Briefcase, Star, Building, Globe, Home } from "lucide-react";

const Admin = () => {
  const handleSuccess = () => {
    console.log("Operation successful");
  };

  return (
    <ProtectedRoute module="admin" action="view">
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage system settings, permissions, and user roles</p>
        </div>

        <Tabs defaultValue="permissions" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 gap-1 min-w-[800px] sm:min-w-0">
              <TabsTrigger value="permissions" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Permissions</span>
                <span className="sm:hidden">Perm</span>
              </TabsTrigger>
              <TabsTrigger value="hierarchy" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <Network className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Role Hierarchy</span>
                <span className="sm:hidden">Roles</span>
              </TabsTrigger>
              <TabsTrigger value="locations" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Location Assignments</span>
                <span className="sm:hidden">Locations</span>
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">User Roles</span>
                <span className="sm:hidden">Users</span>
              </TabsTrigger>
              <TabsTrigger value="mandirs" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <Building className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Mandirs</span>
                <span className="sm:hidden">Mandirs</span>
              </TabsTrigger>
              <TabsTrigger value="kshetras" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Kshetras</span>
                <span className="sm:hidden">Kshetras</span>
              </TabsTrigger>
              <TabsTrigger value="villages" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <Home className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Villages</span>
                <span className="sm:hidden">Villages</span>
              </TabsTrigger>
              <TabsTrigger value="mandals" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Mandals</span>
                <span className="sm:hidden">Mandals</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="permissions" className="space-y-4 sm:space-y-6">
            <PermissionsManager />
          </TabsContent>

          <TabsContent value="hierarchy" className="space-y-4 sm:space-y-6">
            <RoleHierarchyManager />
          </TabsContent>

          <TabsContent value="locations" className="space-y-4 sm:space-y-6">
            <UserLocationAssignment />
          </TabsContent>

          <TabsContent value="roles" className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 sm:p-6 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base sm:text-lg md:text-xl font-semibold">User Roles Management</h2>
                    <p className="text-sm sm:text-base text-gray-600">Manage custom user roles and permissions</p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <MasterDataDialog
                  title="User Role"
                  table="custom_roles"
                  fields={[
                    { name: 'role_name', label: 'Role Name', type: 'text', required: true },
                    { name: 'display_name', label: 'Display Name', type: 'text', required: true },
                    { name: 'description', label: 'Description', type: 'textarea' },
                    { 
                      name: 'type', 
                      label: 'Type', 
                      type: 'select', 
                      options: [
                        { value: 'system', label: 'System' },
                        { value: 'custom', label: 'Custom' }
                      ]
                    },
                    { 
                      name: 'status', 
                      label: 'Status', 
                      type: 'select', 
                      options: [
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' }
                      ]
                    },
                  ]}
                  onSuccess={handleSuccess}
                  autoLoad={true}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mandirs" className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 sm:p-6 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base sm:text-lg md:text-xl font-semibold">Mandirs Management</h2>
                    <p className="text-sm sm:text-base text-gray-600">Manage mandirs and their information</p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <MasterDataDialog
                  title="Mandir"
                  table="mandirs"
                  fields={[
                    { name: 'name', label: 'Mandir Name', type: 'text', required: true },
                    { name: 'description', label: 'Description', type: 'textarea' },
                    { name: 'address', label: 'Address', type: 'textarea' },
                    { name: 'contact_person', label: 'Contact Person', type: 'text' },
                    { name: 'contact_number', label: 'Contact Number', type: 'text' },
                    { name: 'email', label: 'Email', type: 'text' },
                    { name: 'established_date', label: 'Established Date', type: 'date' },
                  ]}
                  onSuccess={handleSuccess}
                  autoLoad={true}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="kshetras" className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 sm:p-6 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base sm:text-lg md:text-xl font-semibold">Kshetras Management</h2>
                    <p className="text-sm sm:text-base text-gray-600">Manage kshetras and associate them with mandirs</p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <MasterDataDialog
                  title="Kshetra"
                  table="kshetras"
                  fields={[
                    { name: 'name', label: 'Kshetra Name', type: 'text', required: true },
                    { name: 'mandir_id', label: 'Mandir', type: 'select', required: true, foreignKey: 'mandirs' },
                    { name: 'description', label: 'Description', type: 'textarea' },
                    { name: 'contact_person', label: 'Contact Person', type: 'text' },
                    { name: 'contact_number', label: 'Contact Number', type: 'text' },
                  ]}
                  onSuccess={handleSuccess}
                  autoLoad={true}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="villages" className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 sm:p-6 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base sm:text-lg md:text-xl font-semibold">Villages Management</h2>
                    <p className="text-sm sm:text-base text-gray-600">Manage villages and associate them with kshetras</p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <MasterDataDialog
                  title="Village"
                  table="villages"
                  fields={[
                    { name: 'name', label: 'Village Name', type: 'text', required: true },
                    { name: 'kshetra_id', label: 'Kshetra', type: 'select', required: true, foreignKey: 'kshetras' },
                    { name: 'district', label: 'District', type: 'text' },
                    { name: 'state', label: 'State', type: 'text' },
                    { name: 'pincode', label: 'Pincode', type: 'text' },
                    { name: 'population', label: 'Population', type: 'number' },
                    { name: 'contact_person', label: 'Contact Person', type: 'text' },
                    { name: 'contact_number', label: 'Contact Number', type: 'text' },
                  ]}
                  onSuccess={handleSuccess}
                  autoLoad={true}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mandals" className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 sm:p-6 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base sm:text-lg md:text-xl font-semibold">Mandals Management</h2>
                    <p className="text-sm sm:text-base text-gray-600">Manage mandals and associate them with villages</p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <MasterDataDialog
                  title="Mandal"
                  table="mandals"
                  fields={[
                    { name: 'name', label: 'Mandal Name', type: 'text', required: true },
                    { name: 'village_id', label: 'Village', type: 'select', required: true, foreignKey: 'villages' },
                    { name: 'description', label: 'Description', type: 'textarea' },
                    { name: 'meeting_day', label: 'Meeting Day', type: 'select', options: [
                      { value: 'monday', label: 'Monday' },
                      { value: 'tuesday', label: 'Tuesday' },
                      { value: 'wednesday', label: 'Wednesday' },
                      { value: 'thursday', label: 'Thursday' },
                      { value: 'friday', label: 'Friday' },
                      { value: 'saturday', label: 'Saturday' },
                      { value: 'sunday', label: 'Sunday' }
                    ]},
                    { name: 'meeting_time', label: 'Meeting Time', type: 'time' },
                    { name: 'contact_person', label: 'Contact Person', type: 'text' },
                    { name: 'contact_number', label: 'Contact Number', type: 'text' },
                  ]}
                  onSuccess={handleSuccess}
                  autoLoad={true}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
};

export default Admin;
