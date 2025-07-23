
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionsManager } from "@/components/PermissionsManager";
import { RoleHierarchyManager } from "@/components/RoleHierarchyManager";
import { UserLocationAssignment } from "@/components/UserLocationAssignment";
import { MasterDataDialog } from "@/components/MasterDataDialog";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Shield, Network, MapPin, Users, Briefcase, Star, Database } from "lucide-react";

const Admin = () => {
  const handleSuccess = () => {
    // Refresh data after successful operations
    window.location.reload();
  };

  return (
    <ProtectedRoute module="admin" action="view">
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Manage system settings, permissions, and user roles</p>
        </div>

        <Tabs defaultValue="permissions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Permissions</span>
            </TabsTrigger>
            <TabsTrigger value="hierarchy" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">Role Hierarchy</span>
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Location Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">User Roles</span>
            </TabsTrigger>
            <TabsTrigger value="professions" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Professions</span>
            </TabsTrigger>
            <TabsTrigger value="seva-types" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Seva Types</span>
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

          <TabsContent value="roles" className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">User Roles Management</h2>
                  <p className="text-gray-600">Manage custom user roles and permissions</p>
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
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Professions Management</h2>
                  <p className="text-gray-600">Manage available professions for karyakars</p>
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
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Seva Types Management</h2>
                  <p className="text-gray-600">Manage available seva types for karyakars</p>
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
