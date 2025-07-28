
import React, { useEffect } from 'react';
import { BasicKaryakarForm } from '@/components/BasicKaryakarForm';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface KaryakarFormProps {
  formData: {
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
  
  // Update form data when editing karyakar changes
  useEffect(() => {
    if (editingKaryakar) {
      console.log('Setting form data for editing:', editingKaryakar);
      setFormData({
        full_name: editingKaryakar.full_name || '',
        email: editingKaryakar.email || '',
        mobile_number: editingKaryakar.mobile_number || '',
        whatsapp_number: editingKaryakar.whatsapp_number || '',
        is_whatsapp_same_as_mobile: editingKaryakar.is_whatsapp_same_as_mobile || false,
        date_of_birth: editingKaryakar.date_of_birth || '',
        age: editingKaryakar.age?.toString() || '',
        profession_id: editingKaryakar.profession_id || '',
        mandir_id: editingKaryakar.mandir_id || '',
        kshetra_id: editingKaryakar.kshetra_id || '',
        village_id: editingKaryakar.village_id || '',
        mandal_id: editingKaryakar.mandal_id || '',
        seva_type_id: editingKaryakar.seva_type_id || '',
        role: editingKaryakar.role,
        profile_photo_url: editingKaryakar.profile_photo_url || ''
      });
    }
  }, [editingKaryakar, setFormData]);

  return (
    <BasicKaryakarForm
      formData={formData}
      setFormData={setFormData}
      onSubmit={onSubmit}
      onCancel={onCancel}
      mandirs={mandirs}
      kshetras={kshetras}
      villages={villages}
      mandals={mandals}
      isEditing={!!editingKaryakar}
    />
  );
};
