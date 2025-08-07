
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Karyakars from "./pages/Karyakars";
import Tasks from "./pages/Tasks";
import Communication from "./pages/Communication";
import Reports from "./pages/Reports";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { KaryakarAdditionalDetailsPage } from "./pages/KaryakarAdditionalDetailsPage";
import { KaryakarAdditionalDetailsManagement } from "./pages/KaryakarAdditionalDetailsManagement";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/karyakars" 
                element={
                  <ProtectedRoute>
                    <Karyakars />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/karyakars/:id/additional-details" 
                element={
                  <ProtectedRoute>
                    <KaryakarAdditionalDetailsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/karyakar-additional-details" 
                element={
                  <ProtectedRoute>
                    <KaryakarAdditionalDetailsManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tasks" 
                element={
                  <ProtectedRoute>
                    <Tasks />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/communication" 
                element={
                  <ProtectedRoute>
                    <Communication />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
