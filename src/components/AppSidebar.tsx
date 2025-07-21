
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Home,
  Users,
  CheckSquare,
  MessageSquare,
  FileText,
  Settings,
} from "lucide-react";
import { useAuth } from './AuthProvider';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Karyakars",
    url: "/karyakars",
    icon: Users,
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: CheckSquare,
  },
  {
    title: "Communication",
    url: "/communication",
    icon: MessageSquare,
  },
];

const managementItems = [
  {
    title: "Reports",
    url: "/reports",
    icon: FileText,
  },
];

const adminItems = [
  {
    title: "Admin Panel",
    url: "/admin",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { state, isMobile, setOpen } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const isCollapsed = state === "collapsed";
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserRole();
    }
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      setUserRole(data?.role || '');
    } catch (error: any) {
      console.error('Error fetching user role:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;
  
  const getNavClass = (path: string) => 
    isActive(path) 
      ? "bg-orange-500 text-white hover:bg-orange-600" 
      : "hover:bg-orange-50 text-gray-700";

  const handleNavClick = () => {
    if (isMobile) {
      setOpen(false);
    }
  };

  return (
  <Sidebar 
    className={`${isCollapsed && !isMobile ? "w-14" : "w-64"} ${isMobile ? "fixed z-50" : ""}`}
  collapsible={false} // Avoid default toggle logic
  hideCloseButton={true}
  showHeader={false} // For header-based buttons

   >
    <SidebarContent className="bg-white border-r">
      
      {/* Logo */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SS</span>
          </div>
          {(!isCollapsed || isMobile) && (
            <div>
              <h1 className="font-bold text-lg text-gray-900">Seva Sarthi</h1>
              <p className="text-xs text-gray-600">Connect</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <div className="p-4">
        <SidebarMenu>
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink 
                  to={item.url} 
                  className={getNavClass(item.url)}
                  onClick={() => {
                    if (isMobile) setOpen(false);
                    window.scrollTo(0, 0);
                  }}
                >
                  <item.icon className="h-4 w-4" />
                  {(!isCollapsed || isMobile) && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </div>

      {/* Management Section */}
      <div className="px-4 pb-4">
        {(!isCollapsed || isMobile) && (
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Management</p>
        )}
        <SidebarMenu>
          {managementItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink 
                  to={item.url} 
                  className={getNavClass(item.url)}
                  onClick={() => {
                    if (isMobile) setOpen(false);
                    window.scrollTo(0, 0);
                  }}
                >
                  <item.icon className="h-4 w-4" />
                  {(!isCollapsed || isMobile) && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </div>

      {/* Admin Section */}
      {userRole === 'super_admin' && (
        <div className="px-4 pb-4">
          {(!isCollapsed || isMobile) && (
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Administration</p>
          )}
          <SidebarMenu>
            {adminItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to={item.url} 
                    className={getNavClass(item.url)}
                    onClick={() => {
                    if (isMobile) setOpen(false);
                    window.scrollTo(0, 0);
                    }}
                  >
                    <item.icon className="h-4 w-4" />
                    {(!isCollapsed || isMobile) && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      )}

    </SidebarContent>
  </Sidebar>
);
}
