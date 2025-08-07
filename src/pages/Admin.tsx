
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { PermissionsManager } from "@/components/PermissionsManager";
import { RoleHierarchyManager } from "@/components/RoleHierarchyManager";
import { UserLocationAssignment } from "@/components/UserLocationAssignment";
import { MasterDataDialog } from "@/components/MasterDataDialog";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserManagement from "@/components/UserManagement";
import AppSettings from "@/components/AppSettings";
import RoleDebugger from "@/components/RoleDebugger";
import { Shield, Network, MapPin, Users, Briefcase, Star, Search, Building, TreePine, Home, Settings, Bug } from "lucide-react";
import { useState } from "react";

const Admin = () => {
  const [globalSearch, setGlobalSearch] = useState('');

  const handleSuccess = () => {
    // Just show success message, don't reload the page
    console.log("Operation successful");
  };

  return (
    <ProtectedRoute module="admin" action="view">
      <div className="space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-1">Manage system settings, permissions, and user roles</p>
        </div>

        {/* Global Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Global search..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="pl-10"
          />
        </div>

       <Tabs defaultValue="permissions" className="space-y-6">
  <TabsList className="flex flex-wrap gap-1 justify-center sm:justify-start">
    <TabsTrigger value="permissions" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
      <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
      <span className="hidden sm:inline">Permissions</span>
      <span className="sm:hidden">Perm</span>
    </TabsTrigger>

    <TabsTrigger value="hierarchy" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
      <Network className="h-3 w-3 sm:h-4 sm:w-4" />
      <span className="hidden sm:inline">Role Hierarchy</span>
      <span className="sm:hidden">Roles</span>
    </TabsTrigger>

    <TabsTrigger value="locations" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
      <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
      <span className="hidden sm:inline">Location Assignments</span>
      <span className="sm:hidden">Locations</span>
    </TabsTrigger>

    <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
      <Users className="h-3 w-3 sm:h-4 sm:w-4" />
      <span className="hidden sm:inline">User Management</span>
      <span className="sm:hidden">Users</span>
    </TabsTrigger>

    <TabsTrigger value="role-debug" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
      <Bug className="h-3 w-3 sm:h-4 sm:w-4" />
      <span className="hidden sm:inline">Role Debug</span>
      <span className="sm:hidden">Debug</span>
    </TabsTrigger>

    <TabsTrigger value="settings" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
      <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
      <span className="hidden sm:inline">App Settings</span>
      <span className="sm:hidden">Settings</span>
    </TabsTrigger>

    <TabsTrigger value="professions" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
      <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
      <span className="hidden sm:inline">Professions</span>
      <span className="sm:hidden">Prof</span>
    </TabsTrigger>

    <TabsTrigger value="seva-types" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
      <Star className="h-3 w-3 sm:h-4 sm:w-4" />
      <span className="hidden sm:inline">Seva Types</span>
      <span className="sm:hidden">Seva</span>
    </TabsTrigger>

    <TabsTrigger value="mandirs" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
      <Building className="h-3 w-3 sm:h-4 sm:w-4" />
      <span className="hidden sm:inline">Mandirs</span>
      <span className="sm:hidden">Mandirs</span>
    </TabsTrigger>

    <TabsTrigger value="kshetras" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
      <TreePine className="h-3 w-3 sm:h-4 sm:w-4" />
      <span className="hidden sm:inline">Kshetras</span>
      <span className="sm:hidden">Kshetras</span>
    </TabsTrigger>

    <TabsTrigger value="villages-mandals" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
      <Home className="h-3 w-3 sm:h-4 sm:w-4" />
      <span className="hidden sm:inline">Villages & Mandals</span>
      <span className="sm:hidden">V&M</span>
    </TabsTrigger>
  </TabsList>

          <TabsContent value="permissions" className="space-y-6">
            <PermissionsManager />
          </TabsContent>

          <TabsContent value="hierarchy" className="space-y-6">
            <RoleHierarchyManager />
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <UserLocationAssignment />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="role-debug" className="space-y-6">
            <RoleDebugger />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <AppSettings />
          </TabsContent>

          <TabsContent value="professions" className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 sm:p-6 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold">Professions Management</h2>
                    <p className="text-gray-600 text-sm sm:text-base">Manage available professions for karyakars</p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <MasterDataDialog
                  title="Profession"
                  table="professions"
                  fields={[
                    { name: 'name', label: 'Profession Name', type: 'text', required: true },
                    { name: 'description', label: 'Description', type: 'textarea' },
                  ]}
                  onSuccess={handleSuccess}
                  autoLoad={true}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="seva-types" className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 sm:p-6 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold">Seva Types Management</h2>
                    <p className="text-gray-600 text-sm sm:text-base">Manage available seva types for karyakars</p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <MasterDataDialog
                  title="Seva Type"
                  table="seva_types"
                  fields={[
                    { name: 'name', label: 'Seva Type Name', type: 'text', required: true },
                    { name: 'description', label: 'Description', type: 'textarea' },
                  ]}
                  onSuccess={handleSuccess}
                  autoLoad={true}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mandirs" className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 sm:p-6 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold">Mandirs Management</h2>
                    <p className="text-gray-600 text-sm sm:text-base">Manage temple locations and details</p>
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

          <TabsContent value="kshetras" className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 sm:p-6 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold">Kshetras Management</h2>
                    <p className="text-gray-600 text-sm sm:text-base">Manage regional areas under mandirs</p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <MasterDataDialog
                  title="Kshetra"
                  table="kshetras"
                  fields={[
                    { name: 'name', label: 'Kshetra Name', type: 'text', required: true },
                    { name: 'description', label: 'Description', type: 'textarea' },
                    { name: 'mandir_id', label: 'Mandir', type: 'select', foreignKey: 'mandirs', required: true },
                    { name: 'contact_person', label: 'Contact Person', type: 'text' },
                    { name: 'contact_number', label: 'Contact Number', type: 'text' },
                  ]}
                  onSuccess={handleSuccess}
                  autoLoad={true}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="villages-mandals" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Villages */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 sm:p-6 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold">Villages Management</h2>
                      <p className="text-gray-600 text-sm sm:text-base">Manage villages under kshetras</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <MasterDataDialog
                    title="Village"
                    table="villages"
                    fields={[
                      { name: 'name', label: 'Village Name', type: 'text', required: true },
                      { name: 'kshetra_id', label: 'Kshetra', type: 'select', foreignKey: 'kshetras', required: true },
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

              {/* Mandals */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 sm:p-6 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold">Mandals Management</h2>
                      <p className="text-gray-600 text-sm sm:text-base">Manage local groups within villages</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <MasterDataDialog
                    title="Mandal"
                    table="mandals"
                    fields={[
                      { name: 'name', label: 'Mandal Name', type: 'text', required: true },
                      { name: 'description', label: 'Description', type: 'textarea' },
                      { name: 'village_id', label: 'Village', type: 'select', foreignKey: 'villages', required: true },
                      { name: 'meeting_day', label: 'Meeting Day', type: 'text' },
                      { name: 'meeting_time', label: 'Meeting Time', type: 'time' },
                      { name: 'contact_person', label: 'Contact Person', type: 'text' },
                      { name: 'contact_number', label: 'Contact Number', type: 'text' },
                    ]}
                    onSuccess={handleSuccess}
                    autoLoad={true}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
};

export default Admin;
