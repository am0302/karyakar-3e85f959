
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
import { usePermissions } from '@/hooks/usePermissions';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    module: "dashboard",
  },
  {
    title: "Karyakars",
    url: "/karyakars",
    icon: Users,
    module: "karyakars",
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: CheckSquare,
    module: "tasks",
  },
  {
    title: "Communication",
    url: "/communication",
    icon: MessageSquare,
    module: "communication",
  },
];

const managementItems = [
  {
    title: "Reports",
    url: "/reports",
    icon: FileText,
    module: "reports",
  },
];

const adminItems = [
  {
    title: "Admin Panel",
    url: "/admin",
    icon: Settings,
    module: "admin",
  },
];

export function AppSidebar() {
  const { state, isMobile, setOpen } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
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
    window.scrollTo(0, 0);
  };

  // Filter navigation items based on permissions
  const getVisibleItems = (items: typeof navigationItems) => {
    if (permissionsLoading) return [];
    return items.filter(item => hasPermission(item.module, 'view'));
  };

  const visibleNavigationItems = getVisibleItems(navigationItems);
  const visibleManagementItems = getVisibleItems(managementItems);
  const visibleAdminItems = userRole === 'super_admin' && hasPermission('admin', 'view') ? adminItems : [];

  return (
    <Sidebar 
      className={`${isCollapsed && !isMobile ? "w-14" : "w-64"} ${isMobile ? "fixed z-50" : ""}`}
      collapsible="icon"
    >
      <SidebarContent className="bg-white border-r">
        
        {/* Logo - removed duplicate close button */}
        <div className="p-4 lg:p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SS</span>
            </div>
            {(!isCollapsed || isMobile) && (
              <div>
                <h1 className="font-bold text-base lg:text-lg text-gray-900">Seva Sarthi</h1>
                <p className="text-xs text-gray-600">Connect</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        {visibleNavigationItems.length > 0 && (
          <div className="p-3 lg:p-4">
            <SidebarMenu>
              {visibleNavigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClass(item.url)}
                      onClick={handleNavClick}
                    >
                      <item.icon className="h-4 w-4" />
                      {(!isCollapsed || isMobile) && <span className="text-sm lg:text-base">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        )}

        {/* Management Section */}
        {visibleManagementItems.length > 0 && (
          <div className="px-3 lg:px-4 pb-4">
            {(!isCollapsed || isMobile) && (
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Management</p>
            )}
            <SidebarMenu>
              {visibleManagementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClass(item.url)}
                      onClick={handleNavClick}
                    >
                      <item.icon className="h-4 w-4" />
                      {(!isCollapsed || isMobile) && <span className="text-sm lg:text-base">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        )}

        {/* Admin Section */}
        {visibleAdminItems.length > 0 && (
          <div className="px-3 lg:px-4 pb-4">
            {(!isCollapsed || isMobile) && (
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Administration</p>
            )}
            <SidebarMenu>
              {visibleAdminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClass(item.url)}
                      onClick={handleNavClick}
                    >
                      <item.icon className="h-4 w-4" />
                      {(!isCollapsed || isMobile) && <span className="text-sm lg:text-base">{item.title}</span>}
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
