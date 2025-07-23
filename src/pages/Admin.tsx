
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionsManager } from "@/components/PermissionsManager";
import { RoleHierarchyManager } from "@/components/RoleHierarchyManager";
import { UserLocationAssignment } from "@/components/UserLocationAssignment";
import { MasterDataDialog } from "@/components/MasterDataDialog";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Shield, Network, MapPin, Users, Briefcase, Star } from "lucide-react";

const Admin = () => {
  const handleSuccess = () => {
    // Just refresh the current data, don't reload the page
    console.log('Data updated successfully');
  };

  return (
    <ProtectedRoute module="admin" action="view">
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-2">
              Manage system settings, permissions, and user roles
            </p>
          </div>

          <Tabs defaultValue="permissions" className="space-y-6">
            <div className="w-full overflow-x-auto">
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto min-w-[600px] md:min-w-0">
                <TabsTrigger value="permissions" className="flex flex-col items-center gap-1 p-3 text-xs md:text-sm">
                  <Shield className="h-4 w-4" />
                  <span>Permissions</span>
                </TabsTrigger>
                <TabsTrigger value="hierarchy" className="flex flex-col items-center gap-1 p-3 text-xs md:text-sm">
                  <Network className="h-4 w-4" />
                  <span className="hidden sm:inline">Role Hierarchy</span>
                  <span className="sm:hidden">Hierarchy</span>
                </TabsTrigger>
                <TabsTrigger value="locations" className="flex flex-col items-center gap-1 p-3 text-xs md:text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>Locations</span>
                </TabsTrigger>
                <TabsTrigger value="roles" className="flex flex-col items-center gap-1 p-3 text-xs md:text-sm">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">User Roles</span>
                  <span className="sm:hidden">Roles</span>
                </TabsTrigger>
                <TabsTrigger value="professions" className="flex flex-col items-center gap-1 p-3 text-xs md:text-sm">
                  <Briefcase className="h-4 w-4" />
                  <span>Professions</span>
                </TabsTrigger>
                <TabsTrigger value="seva-types" className="flex flex-col items-center gap-1 p-3 text-xs md:text-sm">
                  <Star className="h-4 w-4" />
                  <span className="hidden sm:inline">Seva Types</span>
                  <span className="sm:hidden">Seva</span>
                </TabsTrigger>
              </TabsList>
            </div>

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
              <div className="bg-card p-4 md:p-6 rounded-lg shadow border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-foreground">User Roles Management</h2>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">
                      Manage custom user roles and permissions
                    </p>
                  </div>
                  <MasterDataDialog
                    title="User Role"
                    table="custom_roles"
                    fields={[
                      { name: 'role_name', label: 'Role Name', type: 'text', required: true },
                      { name: 'display_name', label: 'Display Name', type: 'text', required: true },
                      { name: 'description', label: 'Description', type: 'textarea' },
                      { name: 'is_active', label: 'Active Status', type: 'boolean' },
                    ]}
                    onSuccess={handleSuccess}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="professions" className="space-y-6">
              <div className="bg-card p-4 md:p-6 rounded-lg shadow border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-foreground">Professions Management</h2>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">
                      Manage available professions for karyakars
                    </p>
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
              <div className="bg-card p-4 md:p-6 rounded-lg shadow border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-foreground">Seva Types Management</h2>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">
                      Manage available seva types for karyakars
                    </p>
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
      </div>
    </ProtectedRoute>
  );
};

export default Admin;
