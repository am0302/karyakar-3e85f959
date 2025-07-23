import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { User, Edit, Mail, Phone, Upload, Info, Save } from "lucide-react";

const UserProfile = ({ user, profile, canEdit, setProfile, updateProfile, saving }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [showAccountInfo, setShowAccountInfo] = useState(false);

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <>
      {/* Floating Avatar Icon */}
      {!showProfile && (
        <div className="fixed top-4 right-4 z-50">
          <Button
            variant="ghost"
            className="p-1 rounded-full shadow-md hover:scale-105 transition"
            onClick={() => setShowProfile(true)}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile.profile_photo_url} />
              <AvatarFallback>{getInitials(profile.full_name || user?.full_name || 'U')}</AvatarFallback>
            </Avatar>
          </Button>
        </div>
      )}

      {/* Profile View */}
      {showProfile && (
        <div className="relative space-y-6 p-4">
          {/* Close Button */}
          <div className="absolute top-4 right-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowProfile(false)}
            >
              Close
            </Button>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600">Manage your personal information</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Summary */}
            <Card>
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
                  <p className="mt-1 text-gray-500 capitalize">{user?.role?.replace('_', ' ') || 'User'}</p>
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
                  <Button variant="outline" size="sm" className="w-full" onClick={() => alert('Upload flow')}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Personal Info */}
                  <Dialog open={showPersonalInfo} onOpenChange={setShowPersonalInfo}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                        <Edit className="h-6 w-6" />
                        <div className="text-center">
                          <div className="font-medium">Personal Info</div>
                          <div className="text-sm text-gray-500">Update your personal details</div>
                        </div>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Personal Information</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Fields here... */}
                        <div className="flex justify-end pt-4">
                          <Button variant="outline" onClick={() => setShowPersonalInfo(false)}>
                            Cancel
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

                  {/* Account Info */}
                  <Dialog open={showAccountInfo} onOpenChange={setShowAccountInfo}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                        <Info className="h-6 w-6" />
                        <div className="text-center">
                          <div className="font-medium">Account Info</div>
                          <div className="text-sm text-gray-500">View account details</div>
                        </div>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Account Info</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="capitalize">Role: {user?.role?.replace('_', ' ')}</p>
                        <p>Created At: {new Date(user?.created_at).toLocaleDateString()}</p>
                        <Button variant="outline" onClick={() => setShowAccountInfo(false)}>
                          Close
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
};

export default UserProfile;
