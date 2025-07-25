
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/SearchableSelect';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { usePermissions } from '@/hooks/usePermissions';

interface KaryakarFormData {
  full_name: string;
  email: string;
  mobile_number: string;
  whatsapp_number: string;
  is_whatsapp_same_as_mobile: boolean;
  date_of_birth: string;
  age: string;
  profession_id: string;
  mandir_id: string;
  kshetra_id: string;
  village_id: string;
  mandal_id: string;
  seva_type_id: string;
  role: string;
  profile_photo_url: string;
}

interface KaryakarFormProps {
  formData: KaryakarFormData;
  setFormData: (data: KaryakarFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  editingKaryakar?: any;
  mandirs: any[];
  kshetras: any[];
  villages: any[];
  mandals: any[];
  professions: any[];
  sevaTypes: any[];
}

export const KaryakarForm: React.FC<KaryakarFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  editingKaryakar
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({
    mandirs: [],
    kshetras: [],
    villages: [],
    mandals: [],
    professions: [],
    sevaTypes: []
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const [mandirs, kshetras, villages, mandals, professions, sevaTypes] = await Promise.all([
        supabase.from('mandirs').select('id, name').eq('is_active', true).order('name'),
        supabase.from('kshetras').select('id, name').eq('is_active', true).order('name'),
        supabase.from('villages').select('id, name').eq('is_active', true).order('name'),
        supabase.from('mandals').select('id, name').eq('is_active', true).order('name'),
        supabase.from('professions').select('id, name').eq('is_active', true).order('name'),
        supabase.from('seva_types').select('id, name').eq('is_active', true).order('name')
      ]);

      setOptions({
        mandirs: mandirs.data || [],
        kshetras: kshetras.data || [],
        villages: villages.data || [],
        mandals: mandals.data || [],
        professions: professions.data || [],
        sevaTypes: sevaTypes.data || []
      });
    } catch (error) {
      console.error('Error fetching options:', error);
      toast({
        title: 'Error',
        description: 'Failed to load form options',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (field: keyof KaryakarFormData, value: string | boolean) => {
    // Handle boolean fields separately
    if (field === 'is_whatsapp_same_as_mobile') {
      const updatedData = {
        ...formData,
        [field]: value as boolean
      };
      
      // Auto-populate WhatsApp number if checkbox is checked
      if (value === true) {
        updatedData.whatsapp_number = formData.mobile_number;
      }
      
      setFormData(updatedData);
      return;
    }

    // Handle string fields
    const stringValue = value as string;
    let updatedData = {
      ...formData,
      [field]: stringValue
    };

    // Auto-populate WhatsApp number when mobile number changes and checkbox is checked
    if (field === 'mobile_number' && formData.is_whatsapp_same_as_mobile) {
      updatedData.whatsapp_number = stringValue;
    }

    // Calculate age from date of birth
    if (field === 'date_of_birth' && stringValue) {
      const birthDate = new Date(stringValue);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      updatedData.age = age.toString();
    }

    setFormData(updatedData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSubmit = {
        full_name: formData.full_name,
        email: formData.email || null,
        mobile_number: formData.mobile_number,
        whatsapp_number: formData.is_whatsapp_same_as_mobile ? formData.mobile_number : formData.whatsapp_number || null,
        is_whatsapp_same_as_mobile: formData.is_whatsapp_same_as_mobile,
        date_of_birth: formData.date_of_birth || null,
        age: formData.age ? parseInt(formData.age) : null,
        profession_id: formData.profession_id || null,
        mandir_id: formData.mandir_id || null,
        kshetra_id: formData.kshetra_id || null,
        village_id: formData.village_id || null,
        mandal_id: formData.mandal_id || null,
        seva_type_id: formData.seva_type_id || null,
        role: formData.role as any, // Cast to any to handle enum types
        profile_photo_url: formData.profile_photo_url || null
      };

      if (editingKaryakar) {
        const { error } = await supabase
          .from('profiles')
          .update(dataToSubmit)
          .eq('id', editingKaryakar.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Karyakar updated successfully',
        });
      } else {
        // For new records, include the user ID
        const insertData = {
          ...dataToSubmit,
          id: user?.id || ''
        };

        const { error } = await supabase
          .from('profiles')
          .insert([insertData]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Karyakar added successfully',
        });
      }

      onSubmit();
    } catch (error: any) {
      console.error('Error saving karyakar:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save karyakar',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if user can edit roles
  const canEditRoles = hasPermission('admin', 'edit') || 
                      (user?.user_metadata?.role && 
                       ['super_admin', 'sant_nirdeshak', 'sah_nirdeshak'].includes(user.user_metadata.role));

  // Check if editing own profile
  const isEditingOwnProfile = editingKaryakar?.id === user?.id;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            type="text"
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
          />
        </div>

        <div>
          <Label htmlFor="mobile_number">Mobile Number *</Label>
          <Input
            id="mobile_number"
            type="tel"
            value={formData.mobile_number}
            onChange={(e) => handleInputChange('mobile_number', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
          <Input
            id="whatsapp_number"
            type="tel"
            value={formData.whatsapp_number}
            onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
            disabled={formData.is_whatsapp_same_as_mobile}
          />
          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              id="is_whatsapp_same_as_mobile"
              checked={formData.is_whatsapp_same_as_mobile}
              onCheckedChange={(checked) => handleInputChange('is_whatsapp_same_as_mobile', checked)}
            />
            <Label htmlFor="is_whatsapp_same_as_mobile" className="text-sm">
              Same as mobile number
            </Label>
          </div>
        </div>

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
            readOnly
          />
        </div>

        <div>
          <Label htmlFor="profession_id">Profession</Label>
          <SearchableSelect
            options={options.professions.map(p => ({ value: p.id, label: p.name }))}
            value={formData.profession_id}
            onValueChange={(value) => handleInputChange('profession_id', value)}
            placeholder="Select Profession"
          />
        </div>

        <div>
          <Label htmlFor="seva_type_id">Seva Type</Label>
          <SearchableSelect
            options={options.sevaTypes.map(s => ({ value: s.id, label: s.name }))}
            value={formData.seva_type_id}
            onValueChange={(value) => handleInputChange('seva_type_id', value)}
            placeholder="Select Seva Type"
          />
        </div>

        <div>
          <Label htmlFor="mandir_id">Mandir</Label>
          <SearchableSelect
            options={options.mandirs.map(m => ({ value: m.id, label: m.name }))}
            value={formData.mandir_id}
            onValueChange={(value) => handleInputChange('mandir_id', value)}
            placeholder="Select Mandir"
          />
        </div>

        <div>
          <Label htmlFor="kshetra_id">Kshetra</Label>
          <SearchableSelect
            options={options.kshetras.map(k => ({ value: k.id, label: k.name }))}
            value={formData.kshetra_id}
            onValueChange={(value) => handleInputChange('kshetra_id', value)}
            placeholder="Select Kshetra"
          />
        </div>

        <div>
          <Label htmlFor="village_id">Village</Label>
          <SearchableSelect
            options={options.villages.map(v => ({ value: v.id, label: v.name }))}
            value={formData.village_id}
            onValueChange={(value) => handleInputChange('village_id', value)}
            placeholder="Select Village"
          />
        </div>

        <div>
          <Label htmlFor="mandal_id">Mandal</Label>
          <SearchableSelect
            options={options.mandals.map(m => ({ value: m.id, label: m.name }))}
            value={formData.mandal_id}
            onValueChange={(value) => handleInputChange('mandal_id', value)}
            placeholder="Select Mandal"
          />
        </div>

        {/* Role field - only show if user has permission and is not editing their own profile */}
        {canEditRoles && !isEditingOwnProfile && (
          <div>
            <Label htmlFor="role">Role</Label>
            <SearchableSelect
              options={[
                { value: 'super_admin', label: 'Super Admin' },
                { value: 'sant_nirdeshak', label: 'Sant Nirdeshak' },
                { value: 'sah_nirdeshak', label: 'Sah Nirdeshak' },
                { value: 'mandal_sanchalak', label: 'Mandal Sanchalak' },
                { value: 'karyakar', label: 'Karyakar' },
                { value: 'sevak', label: 'Sevak' }
              ]}
              value={formData.role}
              onValueChange={(value) => handleInputChange('role', value)}
              placeholder="Select Role"
            />
          </div>
        )}

        <div>
          <Label htmlFor="profile_photo_url">Profile Photo URL</Label>
          <Input
            id="profile_photo_url"
            type="url"
            value={formData.profile_photo_url}
            onChange={(e) => handleInputChange('profile_photo_url', e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : (editingKaryakar ? 'Update' : 'Add')} Karyakar
        </Button>
      </div>
    </form>
  );
};
