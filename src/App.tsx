
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { Profile } from "@/pages/Profile";
import { Settings } from "@/pages/Settings";

const queryClient = new QueryClient();

// Lazy load components
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Karyakars = lazy(() => import("./pages/Karyakars"));
const KaryakarAdditionalDetailsPage = lazy(() => import("./pages/KaryakarAdditionalDetailsPage").then(module => ({ default: module.KaryakarAdditionalDetailsPage })));
const Tasks = lazy(() => import("./pages/Tasks"));
const Communication = lazy(() => import("./pages/Communication"));
const Reports = lazy(() => import("./pages/Reports"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Create a dedicated page component for Karyakar Additional Details management
const KaryakarAdditionalDetailsManagement = lazy(() => import("./components/KaryakarAdditionalDetails").then(module => ({
  default: () => (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Karyakar Additional Details</h1>
        <p className="text-gray-600 mt-1">Manage additional information for all karyakars</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">
          This section allows authorized users to manage additional details for karyakars.
          Use the individual karyakar detail pages to add or edit specific information.
        </p>
        <p className="text-sm text-gray-500">
          Navigate to the Karyakars section and click "Details" on any karyakar card to manage their additional information.
        </p>
      </div>
    </div>
  )
})));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
              <Routes>
                <Route path="/" element={<Navigate to="/auth" replace />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<Layout />}>
                  <Route path="dashboard" element={
                    <ProtectedRoute module="dashboard">
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="karyakars" element={
                    <ProtectedRoute module="karyakars">
                      <Karyakars />
                    </ProtectedRoute>
                  } />
                  <Route path="karyakars/:id/additional-details" element={
                    <ProtectedRoute module="karyakar_additional_details" action="view">
                      <KaryakarAdditionalDetailsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="karyakar-additional-details" element={
                    <ProtectedRoute module="karyakar_additional_details">
                      <KaryakarAdditionalDetailsManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="tasks" element={
                    <ProtectedRoute module="tasks">
                      <Tasks />
                    </ProtectedRoute>
                  } />
                  <Route path="communication" element={
                    <ProtectedRoute module="communication">
                      <Communication />
                    </ProtectedRoute>
                  } />
                  <Route path="reports" element={
                    <ProtectedRoute module="reports">
                      <Reports />
                    </ProtectedRoute>
                  } />
                  <Route path="admin" element={
                    <ProtectedRoute module="admin">
                      <Admin />
                    </ProtectedRoute>
                  } />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
