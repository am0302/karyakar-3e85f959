
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/components/AuthProvider';
import { NewUserRedirect } from '@/components/NewUserRedirect';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from 'next-themes';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Karyakars from '@/pages/Karyakars';
import Tasks from '@/pages/Tasks';
import Communication from '@/pages/Communication';
import Reports from '@/pages/Reports';
import Admin from '@/pages/Admin';
import NotFound from '@/pages/NotFound';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <NewUserRedirect />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute module="dashboard">
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/karyakars" element={
                  <ProtectedRoute module="karyakars">
                    <Layout>
                      <Karyakars />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/tasks" element={
                  <ProtectedRoute module="tasks">
                    <Layout>
                      <Tasks />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/communication" element={
                  <ProtectedRoute module="communication">
                    <Layout>
                      <Communication />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute module="reports">
                    <Layout>
                      <Reports />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute module="admin">
                    <Layout>
                      <Admin />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
