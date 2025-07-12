
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type FormData = {
  full_name: string;
  mobile_number: string;
  whatsapp_number: string;
  is_whatsapp_same_as_mobile: boolean;
  date_of_birth: string;
  profession_id: string;
  mandir_id: string;
  kshetra_id: string;
  village_id: string;
  mandal_id: string;
  seva_type_id: string;
  profile_photo_url: string;
};

type MasterData = {
  professions: any[];
  mandirs: any[];
  kshetras: any[];
  villages: any[];
  mandals: any[];
  seva_types: any[];
};

const Registration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [masterData, setMasterData] = useState<MasterData>({
    professions: [],
    mandirs: [],
    kshetras: [],
    villages: [],
    mandals: [],
    seva_types: []
  });

  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    mobile_number: '',
    whatsapp_number: '',
    is_whatsapp_same_as_mobile: false,
    date_of_birth: '',
    profession_id: '',
    mandir_id: '',
    kshetra_id: '',
    village_id: '',
    mandal_id: '',
    seva_type_id: '',
    profile_photo_url: ''
  });

  useEffect(() => {
    if (user) {
      fetchMasterData();
      fetchProfile();
    }
  }, [user]);

  const fetchMasterData = async () => {
    try {
      const [professions, mandirs, kshetras, villages, mandals, seva_types] = await Promise.all([
        supabase.from('professions').select('*').eq('is_active', true),
        supabase.from('mandirs').select('*').eq('is_active', true),
        supabase.from('kshetras').select('*').eq('is_active', true),
        supabase.from('villages').select('*').eq('is_active', true),
        supabase.from('mandals').select('*').eq('is_active', true),
        supabase.from('seva_types').select('*').eq('is_active', true)
      ]);

      setMasterData({
        professions: professions.data || [],
        mandirs: mandirs.data || [],
        kshetras: kshetras.data || [],
        villages: villages.data || [],
        mandals: mandals.data || [],
        seva_types: seva_types.data || []
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch master data',
        variant: 'destructive',
      });
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setFormData({
          full_name: data.full_name || '',
          mobile_number: data.mobile_number || '',
          whatsapp_number: data.whatsapp_number || '',
          is_whatsapp_same_as_mobile: data.is_whatsapp_same_as_mobile || false,
          date_of_birth: data.date_of_birth || '',
          profession_id: data.profession_id || '',
          mandir_id: data.mandir_id || '',
          kshetra_id: data.kshetra_id || '',
          village_id: data.village_id || '',
          mandal_id: data.mandal_id || '',
          seva_type_id: data.seva_type_id || '',
          profile_photo_url: data.profile_photo_url || ''
        });
      }
    } catch (error: any) {
      console.log('Profile not found or error:', error);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'is_whatsapp_same_as_mobile' && value) {
      setFormData(prev => ({
        ...prev,
        whatsapp_number: prev.mobile_number
      }));
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Check file size (1MB limit)
    if (file.size > 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 1MB',
        variant: 'destructive',
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      setFormData(prev => ({
        ...prev,
        profile_photo_url: data.publicUrl
      }));

      toast({
        title: 'Success',
        description: 'Profile photo uploaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      const age = formData.date_of_birth ? calculateAge(formData.date_of_birth) : null;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...formData,
          age,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Registration</h1>
        <p className="text-gray-600">Complete your profile information</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Provide your personal details and profile photo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Photo */}
            <div className="flex items-center space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={formData.profile_photo_url} />
                <AvatarFallback className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                  {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Label htmlFor="profile_photo">Profile Photo</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <label htmlFor="profile_photo" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </label>
                  </Button>
                  <Button type="button" variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                </div>
                <p className="text-xs text-gray-500">JPG/PNG, max 1MB</p>
                <input
                  id="profile_photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile_number">Mobile Number *</Label>
                <Input
                  id="mobile_number"
                  type="tel"
                  value={formData.mobile_number}
                  onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                <Input
                  id="whatsapp_number"
                  type="tel"
                  value={formData.whatsapp_number}
                  onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                  disabled={formData.is_whatsapp_same_as_mobile}
                />
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="same_as_mobile"
                    checked={formData.is_whatsapp_same_as_mobile}
                    onCheckedChange={(checked) => handleInputChange('is_whatsapp_same_as_mobile', checked as boolean)}
                  />
                  <Label htmlFor="same_as_mobile" className="text-sm">
                    Same as mobile number
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profession_id">Profession</Label>
                <Select value={formData.profession_id} onValueChange={(value) => handleInputChange('profession_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select profession" />
                  </SelectTrigger>
                  <SelectContent>
                    {masterData.professions.map((profession) => (
                      <SelectItem key={profession.id} value={profession.id}>
                        {profession.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Organizational Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Organizational Affiliation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="mandir_id">Mandir</Label>
                  <Select value={formData.mandir_id} onValueChange={(value) => handleInputChange('mandir_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mandir" />
                    </SelectTrigger>
                    <SelectContent>
                      {masterData.mandirs.map((mandir) => (
                        <SelectItem key={mandir.id} value={mandir.id}>
                          {mandir.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kshetra_id">Kshetra</Label>
                  <Select value={formData.kshetra_id} onValueChange={(value) => handleInputChange('kshetra_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select kshetra" />
                    </SelectTrigger>
                    <SelectContent>
                      {masterData.kshetras.map((kshetra) => (
                        <SelectItem key={kshetra.id} value={kshetra.id}>
                          {kshetra.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="village_id">Village</Label>
                  <Select value={formData.village_id} onValueChange={(value) => handleInputChange('village_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select village" />
                    </SelectTrigger>
                    <SelectContent>
                      {masterData.villages.map((village) => (
                        <SelectItem key={village.id} value={village.id}>
                          {village.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mandal_id">Mandal</Label>
                  <Select value={formData.mandal_id} onValueChange={(value) => handleInputChange('mandal_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mandal" />
                    </SelectTrigger>
                    <SelectContent>
                      {masterData.mandals.map((mandal) => (
                        <SelectItem key={mandal.id} value={mandal.id}>
                          {mandal.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seva_type_id">Seva Type</Label>
                  <Select value={formData.seva_type_id} onValueChange={(value) => handleInputChange('seva_type_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select seva type" />
                    </SelectTrigger>
                    <SelectContent>
                      {masterData.seva_types.map((seva_type) => (
                        <SelectItem key={seva_type.id} value={seva_type.id}>
                          {seva_type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600">
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default Registration;
