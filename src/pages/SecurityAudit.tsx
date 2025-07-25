
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SecurityAuditLog } from '@/components/SecurityAuditLog';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Shield, FileText, Activity, Users } from 'lucide-react';

const SecurityAudit = () => {
  return (
    <ProtectedRoute module="admin" action="view">
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Audit</h1>
          <p className="text-gray-600 mt-2">Monitor security events and system activities</p>
        </div>

        <Tabs defaultValue="role-changes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="role-changes" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Role Changes
            </TabsTrigger>
            <TabsTrigger value="login-attempts" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Login Attempts
            </TabsTrigger>
            <TabsTrigger value="system-events" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              System Events
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="role-changes">
            <SecurityAuditLog />
          </TabsContent>

          <TabsContent value="login-attempts">
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Login attempt monitoring will be available in a future update</p>
            </div>
          </TabsContent>

          <TabsContent value="system-events">
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>System event monitoring will be available in a future update</p>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Security reports will be available in a future update</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
};

export default SecurityAudit;
