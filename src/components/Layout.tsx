
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { FirstTimeKaryakarForm } from "@/components/FirstTimeKaryakarForm";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Layout = () => {
  const { user } = useAuth();
  const [showFirstTimeForm, setShowFirstTimeForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // Profile doesn't exist, show first-time form
          setShowFirstTimeForm(true);
        } else if (profile && !profile.mobile_number) {
          // Profile exists but is incomplete
          setShowFirstTimeForm(true);
        }
      } catch (error) {
        console.error('Error checking user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-3 lg:p-6 overflow-x-hidden">
            <div className="max-w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      
      {showFirstTimeForm && (
        <FirstTimeKaryakarForm onComplete={() => setShowFirstTimeForm(false)} />
      )}
    </SidebarProvider>
  );
};
