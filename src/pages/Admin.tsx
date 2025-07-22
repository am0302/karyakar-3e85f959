
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionsManager } from "@/components/PermissionsManager";
import { RoleHierarchyManager } from "@/components/RoleHierarchyManager";
import { UserLocationAssignment } from "@/components/UserLocationAssignment";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Shield, Network, MapPin } from "lucide-react";

const Admin = () => {
  return (
    <ProtectedRoute module="admin" action="view">
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Manage system settings, permissions, and user roles</p>
        </div>

        <Tabs defaultValue="permissions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
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
        </Tabs>
      </div>
    </ProtectedRoute>
  );
};

export default Admin;
