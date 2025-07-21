
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";

const queryClient = new QueryClient();

// Lazy load components
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Karyakars = lazy(() => import("./pages/Karyakars"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Communication = lazy(() => import("./pages/Communication"));
const Reports = lazy(() => import("./pages/Reports"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
