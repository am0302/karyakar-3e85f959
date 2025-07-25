
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FirstTimeKaryakarFormProps {
  onComplete: () => void;
}

export const FirstTimeKaryakarForm = ({ onComplete }: FirstTimeKaryakarFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    full_name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    mobile_number: '',
    whatsapp_number: '',
    is_whatsapp_same_as_mobile: true,
    date_of_birth: '',
    age: '',
    profession_id: '',
    mandir_id: '',
    kshetra_id: '',
    village_id: '',
    mandal_id: '',
    seva_type_id: '',
    profile_photo_url: ''
  });

  const [locationData, setLocationData] = useState({
    mandirs: [],
    kshetras: [],
    villages: [],
    mandals: [],
    professions: [],
    sevaTypes: []
  });

  // Fetch location data
  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        const [mandirData, kshetraData, villageData, mandalData, professionData, sevaTypeData] = await Promise.all([
          supabase.from('mandirs').select('id, name').eq('is_active', true),
          supabase.from('kshetras').select('id, name').eq('is_active', true),
          supabase.from('villages').select('id, name').eq('is_active', true),
          supabase.from('mandals').select('id, name').eq('is_active', true),
          supabase.from('professions').select('id, name').eq('is_active', true),
          supabase.from('seva_types').select('id, name').eq('is_active', true)
        ]);

        setLocationData({
          mandirs: mandirData.data || [],
          kshetras: kshetraData.data || [],
          villages: villageData.data || [],
          mandals: mandalData.data || [],
          professions: professionData.data || [],
          sevaTypes: sevaTypeData.data || []
        });
      } catch (error) {
        console.error('Error fetching location data:', error);
      }
    };

    fetchLocationData();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user?.id,
        full_name: formData.full_name,
        email: formData.email,
        mobile_number: formData.mobile_number,
        whatsapp_number: formData.is_whatsapp_same_as_mobile ? formData.mobile_number : formData.whatsapp_number,
        is_whatsapp_same_as_mobile: formData.is_whatsapp_same_as_mobile,
        date_of_birth: formData.date_of_birth || null,
        age: formData.age ? parseInt(formData.age) : null,
        profession_id: formData.profession_id || null,
        mandir_id: formData.mandir_id || null,
        kshetra_id: formData.kshetra_id || null,
        village_id: formData.village_id || null,
        mandal_id: formData.mandal_id || null,
        seva_type_id: formData.seva_type_id || null,
        profile_photo_url: formData.profile_photo_url || null,
        role: 'sevak'
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile created successfully!',
      });

      onComplete();
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to create profile',
        variant: 'destructive',
      });
    }
  };

  const getFilteredOptions = (items: Array<{ id: string; name: string }>) => {
    return items
      .filter(item => item?.id && item?.name)
      .map(item => ({ 
        value: item.id, 
        label: item.name 
      }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-6 text-center">Complete Your Profile</h2>
        <p className="text-gray-600 mb-6 text-center">Please fill in your details to get started</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="mobile_number">Mobile Number *</Label>
                <Input
                  id="mobile_number"
                  value={formData.mobile_number}
                  onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_whatsapp_same_as_mobile"
                  checked={formData.is_whatsapp_same_as_mobile}
                  onCheckedChange={(checked) => handleInputChange('is_whatsapp_same_as_mobile', checked)}
                />
                <Label htmlFor="is_whatsapp_same_as_mobile">WhatsApp number is same as mobile</Label>
              </div>

              {!formData.is_whatsapp_same_as_mobile && (
                <div>
                  <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                  <Input
                    id="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
              <CardDescription>Select profession and seva type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Profession</Label>
                  <SearchableSelect
                    options={getFilteredOptions(locationData.professions)}
                    value={formData.profession_id}
                    onValueChange={(value) => handleInputChange('profession_id', value)}
                    placeholder="Select Profession"
                  />
                </div>
                
                <div>
                  <Label>Seva Type</Label>
                  <SearchableSelect
                    options={getFilteredOptions(locationData.sevaTypes)}
                    value={formData.seva_type_id}
                    onValueChange={(value) => handleInputChange('seva_type_id', value)}
                    placeholder="Select Seva Type"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle>Location Information</CardTitle>
              <CardDescription>Select mandir, kshetra, village, and mandal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Mandir</Label>
                  <SearchableSelect
                    options={getFilteredOptions(locationData.mandirs)}
                    value={formData.mandir_id}
                    onValueChange={(value) => handleInputChange('mandir_id', value)}
                    placeholder="Select Mandir"
                  />
                </div>
                
                <div>
                  <Label>Kshetra</Label>
                  <SearchableSelect
                    options={getFilteredOptions(locationData.kshetras)}
                    value={formData.kshetra_id}
                    onValueChange={(value) => handleInputChange('kshetra_id', value)}
                    placeholder="Select Kshetra"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Village</Label>
                  <SearchableSelect
                    options={getFilteredOptions(locationData.villages)}
                    value={formData.village_id}
                    onValueChange={(value) => handleInputChange('village_id', value)}
                    placeholder="Select Village"
                  />
                </div>
                
                <div>
                  <Label>Mandal</Label>
                  <SearchableSelect
                    options={getFilteredOptions(locationData.mandals)}
                    value={formData.mandal_id}
                    onValueChange={(value) => handleInputChange('mandal_id', value)}
                    placeholder="Select Mandal"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" className="w-full">
              Complete Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
