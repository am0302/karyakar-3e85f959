
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionsManager } from "@/components/PermissionsManager";
import { RoleHierarchyManager } from "@/components/RoleHierarchyManager";
import { UserLocationAssignment } from "@/components/UserLocationAssignment";
import { MasterDataDialog } from "@/components/MasterDataDialog";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Shield, Network, MapPin, Users, Briefcase, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const navigate = useNavigate();
const Admin = () => {
  const handleSuccess = () => {
    // Just show success message, don't reload the page
    console.log("Operation successful");
   navigate("/dashboard");  // ✅ Navigates to another page 
  };

  return (
    <ProtectedRoute module="admin" action="view">
      <div className="space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-1">Manage system settings, permissions, and user roles</p>
        </div>

        <Tabs defaultValue="permissions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1">
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
            <TabsTrigger value="roles" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">User Roles</span>
              <span className="sm:hidden">Users</span>
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
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 sm:p-6 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold">User Roles Management</h2>
                    <p className="text-gray-600 text-sm sm:text-base">Manage custom user roles and permissions</p>
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
        </Tabs>
      </div>
    </ProtectedRoute>
  );
};

export default Admin;
