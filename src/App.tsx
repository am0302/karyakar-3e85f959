
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Karyakars from "./pages/Karyakars";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="karyakars" element={<Karyakars />} />
              <Route path="tasks" element={<div className="p-8 text-center">Tasks module coming soon...</div>} />
              <Route path="communication" element={<div className="p-8 text-center">Communication module coming soon...</div>} />
              <Route path="mandirs" element={<div className="p-8 text-center">Mandirs management coming soon...</div>} />
              <Route path="kshetras" element={<div className="p-8 text-center">Kshetras management coming soon...</div>} />
              <Route path="villages" element={<div className="p-8 text-center">Villages management coming soon...</div>} />
              <Route path="mandals" element={<div className="p-8 text-center">Mandals management coming soon...</div>} />
              <Route path="admin/users" element={<div className="p-8 text-center">User management coming soon...</div>} />
              <Route path="reports" element={<div className="p-8 text-center">Reports coming soon...</div>} />
              <Route path="settings" element={<div className="p-8 text-center">Settings coming soon...</div>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
