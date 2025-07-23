
import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Edit, Mail, Phone, Upload, Info, Save, LogOut } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const UserProfileDropdown = () => {
  const { user, signOut, refreshUser } = useAuth();
  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    mobile_number: user?.mobile_number || '',
    profile_photo_url: user?.profile_photo_url || '',
  });
  const [saving, setSaving] = useState(false);
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const { toast } = useToast();

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const updateProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          mobile_number: profile.mobile_number,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshUser();
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setShowPersonalInfo(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      {/* Profile Summary */}
      <Card className="w-80">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.profile_photo_url} />
              <AvatarFallback>
                {getInitials(profile.full_name || user.full_name || 'U')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-medium">{profile.full_name || user.full_name || 'User'}</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {user.role?.replace('_', ' ') || 'User'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {profile.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{profile.email}</span>
              </div>
            )}
            {profile.mobile_number && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{profile.mobile_number}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Dialog open={showPersonalInfo} onOpenChange={setShowPersonalInfo}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Personal Information</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile_number">Mobile Number</Label>
                    <Input
                      id="mobile_number"
                      value={profile.mobile_number}
                      onChange={(e) => setProfile({ ...profile, mobile_number: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowPersonalInfo(false)}>
                      Cancel
                    </Button>
                    <Button onClick={updateProfile} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAccountInfo} onOpenChange={setShowAccountInfo}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Info className="h-4 w-4 mr-2" />
                  Info
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Account Information</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Role</Label>
                    <p className="text-sm text-muted-foreground capitalize mt-1">
                      {user.role?.replace('_', ' ') || 'User'}
                    </p>
                  </div>
                  <div>
                    <Label>Member Since</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setShowAccountInfo(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Button variant="outline" onClick={handleSignOut} className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfileDropdown;
