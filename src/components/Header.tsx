
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationPanel } from "./NotificationPanel";
import { useAuth } from "./AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import UserProfileDropdown from "./UserProfileDropdown";

interface HeaderProps {
  onMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

export const Header = ({ onMenuToggle, isMobileMenuOpen }: HeaderProps) => {
  const { user, loading } = useAuth();

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="md:hidden"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <h1 className="text-lg font-semibold md:hidden">Dashboard</h1>
          </div>
          <nav className="flex items-center space-x-2">
            <NotificationPanel />
            <ThemeToggle />
            {!loading && user && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-1 rounded-full hover:scale-105 transition"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profile_photo_url} />
                      <AvatarFallback className="text-sm">
                        {getInitials(user.full_name || user.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <UserProfileDropdown />
                </PopoverContent>
              </Popover>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
