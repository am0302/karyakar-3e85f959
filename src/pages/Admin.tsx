
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionsManager } from "@/components/PermissionsManager";
import { RoleHierarchyManager } from "@/components/RoleHierarchyManager";
import { UserLocationAssignment } from "@/components/UserLocationAssignment";
import { MasterDataDialog } from "@/components/MasterDataDialog";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Shield, Network, MapPin, Users, Briefcase, Star } from "lucide-react";

const Admin = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    // Just refresh the component data, don't reload the page
    setRefreshKey(prev => prev + 1);
  };

  return (
    <ProtectedRoute module="admin" action="view">
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage system settings, permissions, and user roles</p>
        </div>

        <Tabs defaultValue="permissions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-1">
            <TabsTrigger value="permissions" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Shield className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Permissions</span>
              <span className="sm:hidden">Perms</span>
            </TabsTrigger>
            <TabsTrigger value="hierarchy" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Network className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Hierarchy</span>
              <span className="sm:hidden">Hier</span>
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <MapPin className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Locations</span>
              <span className="sm:hidden">Loc</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Users className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Roles</span>
              <span className="sm:hidden">Roles</span>
            </TabsTrigger>
            <TabsTrigger value="professions" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Briefcase className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Professions</span>
              <span className="sm:hidden">Prof</span>
            </TabsTrigger>
            <TabsTrigger value="seva-types" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Star className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Seva Types</span>
              <span className="sm:hidden">Seva</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="permissions" className="space-y-6">
            <PermissionsManager key={`permissions-${refreshKey}`} />
          </TabsContent>

          <TabsContent value="hierarchy" className="space-y-6">
            <RoleHierarchyManager key={`hierarchy-${refreshKey}`} />
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <UserLocationAssignment key={`locations-${refreshKey}`} />
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold">User Roles Management</h2>
                  <p className="text-gray-600 text-sm md:text-base">Manage custom user roles and permissions</p>
                </div>
                <MasterDataDialog
                  title="User Role"
                  table="custom_roles"
                  fields={[
                    { name: 'role_name', label: 'Role Name', type: 'text', required: true },
                    { name: 'display_name', label: 'Display Name', type: 'text', required: true },
                    { name: 'description', label: 'Description', type: 'textarea' },
                  ]}
                  onSuccess={handleSuccess}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="professions" className="space-y-6">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold">Professions Management</h2>
                  <p className="text-gray-600 text-sm md:text-base">Manage available professions for karyakars</p>
                </div>
                <MasterDataDialog
                  title="Profession"
                  table="professions"
                  fields={[
                    { name: 'name', label: 'Profession Name', type: 'text', required: true },
                    { name: 'description', label: 'Description', type: 'textarea' },
                  ]}
                  onSuccess={handleSuccess}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="seva-types" className="space-y-6">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold">Seva Types Management</h2>
                  <p className="text-gray-600 text-sm md:text-base">Manage available seva types for karyakars</p>
                </div>
                <MasterDataDialog
                  title="Seva Type"
                  table="seva_types"
                  fields={[
                    { name: 'name', label: 'Seva Type Name', type: 'text', required: true },
                    { name: 'description', label: 'Description', type: 'textarea' },
                  ]}
                  onSuccess={handleSuccess}
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
