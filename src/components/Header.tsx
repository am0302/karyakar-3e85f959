
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/AuthProvider';
import { SlideOutMenu } from '@/components/SlideOutMenu';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { LogOut, Settings, User, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Header = () => {
  const { user, signOut } = useAuth();
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const performGlobalSearch = async (searchTerm: string) => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = [];

      // Search in profiles (karyakars)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, mobile_number, role')
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,mobile_number.ilike.%${searchTerm}%`)
        .limit(5);

      if (profiles) {
        profiles.forEach(profile => {
          results.push({
            type: 'karyakar',
            id: profile.id,
            title: profile.full_name,
            subtitle: `${profile.email} • ${profile.role}`,
            url: '/karyakars'
          });
        });
      }

      // Search in tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, description, status')
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .limit(5);

      if (tasks) {
        tasks.forEach(task => {
          results.push({
            type: 'task',
            id: task.id,
            title: task.title,
            subtitle: `${task.description?.substring(0, 50)}... • ${task.status}`,
            url: '/tasks'
          });
        });
      }

      // Search in mandirs
      const { data: mandirs } = await supabase
        .from('mandirs')
        .select('id, name, address')
        .ilike('name', `%${searchTerm}%`)
        .limit(3);

      if (mandirs) {
        mandirs.forEach(mandir => {
          results.push({
            type: 'mandir',
            id: mandir.id,
            title: mandir.name,
            subtitle: mandir.address || 'No address',
            url: '/admin'
          });
        });
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to perform search',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGlobalSearch(value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      performGlobalSearch(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleResultClick = (result: any) => {
    navigate(result.url);
    setGlobalSearch('');
    setSearchResults([]);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 lg:h-14 items-center justify-between px-3 lg:px-4">
        <div className="flex items-center space-x-2 lg:space-x-4">
          <SlideOutMenu />
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-lg lg:text-xl font-bold">Karyakar Portal</h1>
          </Link>
        </div>
        <div className="flex items-center space-x-2 lg:space-x-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Global search..."
              value={globalSearch}
              onChange={handleSearchChange}
              className="pl-10"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto z-50">
                {searchResults.map((result: any, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600 capitalize">
                        {result.type}
                      </span>
                      <div>
                        <div className="font-medium text-sm">{result.title}</div>
                        <div className="text-xs text-gray-500">{result.subtitle}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {isSearching && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 z-50">
                <div className="text-center text-sm text-gray-500">Searching...</div>
              </div>
            )}
          </div>
          {user && <NotificationDropdown />}
        </div>
        {user && (
          <div className="flex items-center space-x-2 lg:space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profile_photo_url || ''} alt={user.email || ''} />
                    <AvatarFallback>
                      {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 z-50 bg-white" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.full_name || user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
