
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SearchableSelect } from '@/components/SearchableSelect';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Enums']['user_role'];

interface KaryakarFormProps {
  formData: {
    full_name: string;
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
    role: UserRole;
    profile_photo_url: string;
  };
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  editingKaryakar: Profile | null;
  mandirs: Array<{ id: string; name: string }>;
  kshetras: Array<{ id: string; name: string }>;
  villages: Array<{ id: string; name: string }>;
  mandals: Array<{ id: string; name: string }>;
  professions: Array<{ id: string; name: string }>;
  sevaTypes: Array<{ id: string; name: string }>;
}

export const KaryakarForm = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  editingKaryakar,
  mandirs,
  kshetras,
  villages,
  mandals,
  professions,
  sevaTypes
}: KaryakarFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="mobile_number">Mobile Number *</Label>
          <Input
            id="mobile_number"
            value={formData.mobile_number}
            onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_whatsapp_same_as_mobile"
          checked={formData.is_whatsapp_same_as_mobile}
          onCheckedChange={(checked) => setFormData({ ...formData, is_whatsapp_same_as_mobile: checked })}
        />
        <Label htmlFor="is_whatsapp_same_as_mobile">WhatsApp number is same as mobile</Label>
      </div>

      {!formData.is_whatsapp_same_as_mobile && (
        <div>
          <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
          <Input
            id="whatsapp_number"
            value={formData.whatsapp_number}
            onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
          />
        </div>
        
        <div>
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Profession</Label>
          <SearchableSelect
            options={professions.map(p => ({ value: p.id, label: p.name }))}
            value={formData.profession_id}
            onValueChange={(value) => setFormData({ ...formData, profession_id: value })}
            placeholder="Select Profession"
          />
        </div>
        
        <div>
          <Label>Seva Type</Label>
          <SearchableSelect
            options={sevaTypes.map(s => ({ value: s.id, label: s.name }))}
            value={formData.seva_type_id}
            onValueChange={(value) => setFormData({ ...formData, seva_type_id: value })}
            placeholder="Select Seva Type"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Mandir</Label>
          <SearchableSelect
            options={mandirs.map(m => ({ value: m.id, label: m.name }))}
            value={formData.mandir_id}
            onValueChange={(value) => setFormData({ ...formData, mandir_id: value })}
            placeholder="Select Mandir"
          />
        </div>
        
        <div>
          <Label>Kshetra</Label>
          <SearchableSelect
            options={kshetras.map(k => ({ value: k.id, label: k.name }))}
            value={formData.kshetra_id}
            onValueChange={(value) => setFormData({ ...formData, kshetra_id: value })}
            placeholder="Select Kshetra"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Village</Label>
          <SearchableSelect
            options={villages.map(v => ({ value: v.id, label: v.name }))}
            value={formData.village_id}
            onValueChange={(value) => setFormData({ ...formData, village_id: value })}
            placeholder="Select Village"
          />
        </div>
        
        <div>
          <Label>Mandal</Label>
          <SearchableSelect
            options={mandals.map(m => ({ value: m.id, label: m.name }))}
            value={formData.mandal_id}
            onValueChange={(value) => setFormData({ ...formData, mandal_id: value })}
            placeholder="Select Mandal"
          />
        </div>
      </div>

      <div>
        <Label>Role</Label>
        <SearchableSelect
          options={[
            { value: 'sevak', label: 'Sevak' },
            { value: 'karyakar', label: 'Karyakar' },
            { value: 'mandal_sanchalak', label: 'Mandal Sanchalak' },
            { value: 'sah_nirdeshak', label: 'Sah Nirdeshak' },
            { value: 'sant_nirdeshak', label: 'Sant Nirdeshak' },
            { value: 'super_admin', label: 'Super Admin' },
          ]}
          value={formData.role}
          onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
          placeholder="Select Role"
        />
      </div>

      <div>
        <Label htmlFor="profile_photo_url">Profile Photo URL</Label>
        <Input
          id="profile_photo_url"
          value={formData.profile_photo_url}
          onChange={(e) => setFormData({ ...formData, profile_photo_url: e.target.value })}
          placeholder="https://example.com/photo.jpg"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {editingKaryakar ? 'Update' : 'Register'}
        </Button>
      </div>
    </form>
  );
};
