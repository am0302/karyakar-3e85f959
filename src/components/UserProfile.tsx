
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, Calendar, MapPin, Save, Upload, Edit, Info } from 'lucide-react';

const UserProfile = () => {
  const { user, refreshUser } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    whatsapp_number: '',
    date_of_birth: '',
    age: '',
    profile_photo_url: ''
  });

  const canEdit = hasPermission('admin', 'edit') || user?.role === 'super_admin';

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile({
        full_name: data.full_name || '',
        email: data.email || '',
        mobile_number: data.mobile_number || '',
        whatsapp_number: data.whatsapp_number || '',
        date_of_birth: data.date_of_birth || '',
        age: data.age?.toString() || '',
        profile_photo_url: data.profile_photo_url || ''
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch profile data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!user || !canEdit) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          email: profile.email,
          mobile_number: profile.mobile_number,
          whatsapp_number: profile.whatsapp_number,
          date_of_birth: profile.date_of_birth || null,
          age: profile.age ? parseInt(profile.age) : null,
          profile_photo_url: profile.profile_photo_url
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      // Refresh user data and close dialog
      await refreshUser();
      setShowPersonalInfo(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = () => {
    // For now, just show a toast - photo upload functionality would need to be implemented
    toast({
      title: 'Info',
      description: 'Photo upload functionality coming soon',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading profile...</div>;
  }

  {/* return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600">Manage your personal information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary */}
  /*      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Avatar className="h-24 w-24 mx-auto">
              <AvatarImage src={profile.profile_photo_url} />
              <AvatarFallback className="text-lg">
                {getInitials(profile.full_name || user?.full_name || 'U')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-medium">{profile.full_name || user?.full_name}</h3>
              <Badge variant="outline" className="mt-1">
                {user?.role?.replace('_', ' ') || 'User'}
              </Badge>
            </div>
            {profile.email && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{profile.email}</span>
              </div>
            )}
            {profile.mobile_number && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{profile.mobile_number}</span>
              </div>
            )}
            {canEdit && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handlePhotoUpload}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
  /*      <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Access your profile information and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Personal Information Dialog */}
  /*            <Dialog open={showPersonalInfo} onOpenChange={setShowPersonalInfo}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                    <Edit className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium">Personal Information</div>
                      <div className="text-sm text-gray-500">Update your personal details</div>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Personal Information</DialogTitle>
                    <DialogDescription>
                      {canEdit ? 'Update your personal details' : 'View your personal details'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Full Name</label>
                        <Input
                          value={profile.full_name}
                          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                          disabled={!canEdit}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          disabled={!canEdit}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Mobile Number</label>
                        <Input
                          value={profile.mobile_number}
                          onChange={(e) => setProfile({ ...profile, mobile_number: e.target.value })}
                          disabled={!canEdit}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">WhatsApp Number</label>
                        <Input
                          value={profile.whatsapp_number}
                          onChange={(e) => setProfile({ ...profile, whatsapp_number: e.target.value })}
                          disabled={!canEdit}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Date of Birth</label>
                        <Input
                          type="date"
                          value={profile.date_of_birth}
                          onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                          disabled={!canEdit}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Age</label>
                        <Input
                          type="number"
                          value={profile.age}
                          onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                          disabled={!canEdit}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowPersonalInfo(false)}
                      >
                        {canEdit ? 'Cancel' : 'Close'}
                      </Button>
                      {canEdit && (
                        <Button onClick={updateProfile} disabled={saving}>
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Account Information Dialog */}
  /*            <Dialog open={showAccountInfo} onOpenChange={setShowAccountInfo}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                    <Info className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium">Account Information</div>
                      <div className="text-sm text-gray-500">View account details and permissions</div>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Account Information</DialogTitle>
                    <DialogDescription>
                      View your account details and permissions
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-medium text-sm text-gray-500">User Role</h4>
                        <p className="mt-1 capitalize">{user?.role?.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-500">Account Status</h4>
                        <Badge variant="outline" className="mt-1 bg-green-50 text-green-700">
                          Active
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-500">Member Since</h4>
                        <p className="mt-1">
                          {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAccountInfo(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {!canEdit && (
        <Card>
          <CardContent className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Limited Access</h3>
            <p className="text-gray-600">
              You don't have permission to edit your profile. Contact your administrator for assistance.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserProfile;
