
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { KaryakarForm } from '@/components/KaryakarForm';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

export const NewUserRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [mandirs, setMandirs] = useState<Array<{ id: string; name: string }>>([]);
  const [kshetras, setKshetras] = useState<Array<{ id: string; name: string }>>([]);
  const [villages, setVillages] = useState<Array<{ id: string; name: string }>>([]);
  const [mandals, setMandals] = useState<Array<{ id: string; name: string }>>([]);
  const [professions, setProfessions] = useState<Array<{ id: string; name: string }>>([]);
  const [sevaTypes, setSevaTypes] = useState<Array<{ id: string; name: string }>>([]);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    whatsapp_number: '',
    is_whatsapp_same_as_mobile: false,
    date_of_birth: '',
    age: '',
    profession_id: '',
    mandir_id: '',
    kshetra_id: '',
    village_id: '',
    mandal_id: '',
    seva_type_id: '',
    role: 'sevak' as UserRole,
    profile_photo_url: ''
  });

  useEffect(() => {
    if (user) {
      checkIfNewUser();
    }
  }, [user]);

  const checkIfNewUser = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking user profile:', error);
        return;
      }

      // Check if user has minimal profile data (just email, no name)
      if (profile && (!profile.full_name || profile.full_name.trim() === '')) {
        setIsNewUser(true);
        setFormData(prev => ({
          ...prev,
          email: profile.email || '',
          mobile_number: profile.mobile_number || ''
        }));
        setShowRegistrationForm(true);
        await fetchMasterData();
      }
    } catch (error) {
      console.error('Error in checkIfNewUser:', error);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [mandirsRes, kshetrasRes, villagesRes, mandalsRes, professionsRes, sevaTypesRes] = await Promise.all([
        supabase.from('mandirs').select('id, name').eq('is_active', true).order('name'),
        supabase.from('kshetras').select('id, name').eq('is_active', true).order('name'),
        supabase.from('villages').select('id, name').eq('is_active', true).order('name'),
        supabase.from('mandals').select('id, name').eq('is_active', true).order('name'),
        supabase.from('professions').select('id, name').eq('is_active', true).order('name'),
        supabase.from('seva_types').select('id, name').eq('is_active', true).order('name')
      ]);

      setMandirs(mandirsRes.data || []);
      setKshetras(kshetrasRes.data || []);
      setVillages(villagesRes.data || []);
      setMandals(mandalsRes.data || []);
      setProfessions(professionsRes.data || []);
      setSevaTypes(sevaTypesRes.data || []);
    } catch (error: any) {
      console.error('Error fetching master data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const age = formData.age ? parseInt(formData.age) : null;
      const dataToSubmit = {
        full_name: formData.full_name,
        email: formData.email || null,
        mobile_number: formData.mobile_number,
        whatsapp_number: formData.is_whatsapp_same_as_mobile ? formData.mobile_number : formData.whatsapp_number,
        is_whatsapp_same_as_mobile: formData.is_whatsapp_same_as_mobile,
        date_of_birth: formData.date_of_birth || null,
        age,
        profession_id: formData.profession_id || null,
        mandir_id: formData.mandir_id || null,
        kshetra_id: formData.kshetra_id || null,
        village_id: formData.village_id || null,
        mandal_id: formData.mandal_id || null,
        seva_type_id: formData.seva_type_id || null,
        role: formData.role,
        profile_photo_url: formData.profile_photo_url || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(dataToSubmit)
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile completed successfully! Welcome to the system.',
      });

      setShowRegistrationForm(false);
      setIsNewUser(false);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error completing profile:', error);
      toast({
        title: 'Error',
        description: `Failed to complete profile: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // For new users, they can't cancel as they need to complete their profile
    toast({
      title: 'Profile Required',
      description: 'Please complete your profile to continue using the system.',
      variant: 'destructive',
    });
  };

  if (!isNewUser || !showRegistrationForm) {
    return null;
  }

  return (
    <Dialog open={showRegistrationForm} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Welcome! Please complete your profile to get started.
          </DialogDescription>
        </DialogHeader>

        <KaryakarForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          editingKaryakar={null}
          mandirs={mandirs}
          kshetras={kshetras}
          villages={villages}
          mandals={mandals}
          professions={professions}
          sevaTypes={sevaTypes}
        />
      </DialogContent>
    </Dialog>
  );
};
