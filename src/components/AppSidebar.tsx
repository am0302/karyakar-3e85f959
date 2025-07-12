
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Home,
  Users,
  Building2,
  MapPin,
  Trees,
  UserCheck,
  CheckSquare,
  MessageSquare,
  Settings,
  FileText,
  Shield
} from "lucide-react";

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

const hierarchyItems = [
  {
    title: "Mandirs",
    url: "/mandirs",
    icon: Building2,
  },
  {
    title: "Kshetras",
    url: "/kshetras",
    icon: MapPin,
  },
  {
    title: "Villages",
    url: "/villages",
    icon: Trees,
  },
  {
    title: "Mandals",
    url: "/mandals",
    icon: UserCheck,
  },
];

const adminItems = [
  {
    title: "User Management",
    url: "/admin/users",
    icon: Shield,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: FileText,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { collapsed } = useSidebar();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  
  const getNavClass = (path: string) =>
    isActive(path) 
      ? "bg-orange-100 text-orange-900 font-medium border-r-2 border-orange-500" 
      : "hover:bg-orange-50 text-gray-700";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"}>
      <SidebarContent className="bg-white border-r">
        {/* Logo */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SS</span>
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg text-gray-900">Seva Sarthi</h1>
                <p className="text-xs text-gray-600">Connect</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClass(item.url)}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Hierarchy */}
        <SidebarGroup>
          <SidebarGroupLabel>Hierarchy</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {hierarchyItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClass(item.url)}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Administration */}
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClass(item.url)}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
