
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, Bell, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RoleDisplay } from '@/components/RoleDisplay';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  full_name: string;
  profile_photo_url: string | null;
  role: string;
}

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, profile_photo_url, role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) return null;

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-800">
            Seva Sarthi Connect
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Home Button */}
          <Button variant="ghost" size="sm" onClick={handleHomeClick}>
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile?.profile_photo_url || ''} />
                  <AvatarFallback>
                    {getInitials(userProfile?.full_name || user.email || 'User')}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium">
                    {userProfile?.full_name || user.email}
                  </div>
                  <div className="text-xs text-gray-500">
                    <RoleDisplay role={userProfile?.role || 'sevak'} />
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileClick}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettingsClick}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
