
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { usePermissions } from '@/hooks/usePermissions';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  CheckSquare, 
  MessageCircle, 
  BarChart3, 
  Settings 
} from 'lucide-react';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: Home, module: 'dashboard' },
  { path: '/karyakars', label: 'Karyakars', icon: Users, module: 'karyakars' },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare, module: 'tasks' },
  { path: '/communication', label: 'Communication', icon: MessageCircle, module: 'communication' },
  { path: '/reports', label: 'Reports', icon: BarChart3, module: 'reports' },
  { path: '/admin', label: 'Admin', icon: Settings, module: 'admin' },
];

export const SlideOutMenu = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { hasPermission, loading } = usePermissions();

  if (!user || loading) return null;

  const visibleMenuItems = menuItems.filter(item => 
    hasPermission(item.module, 'view')
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Menu</h2>
            {/*}  <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button> */}
          </div>
          
          <nav className="flex-1 py-4">
            <div className="space-y-1 px-3">
              {visibleMenuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`
                  }
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>
          
          <div className="p-4 border-t">
            <p className="text-xs text-muted-foreground">
              Signed in as {user.email}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
