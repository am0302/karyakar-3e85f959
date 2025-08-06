
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import type { Database } from '@/integrations/supabase/types';

type AdditionalDetails = Database['public']['Tables']['karyakar_additional_details']['Row'];
type AdditionalDetailsInsert = Database['public']['Tables']['karyakar_additional_details']['Insert'];

interface KaryakarAdditionalDetailsProps {
  karyakarId: string;
  karyakarName: string;
}

const EDUCATION_LEVELS = [
  'Primary',
  'Secondary', 
  'Higher Secondary',
  'Diploma',
  'Graduate',
  'Post Graduate',
  'PhD',
  'Other'
];

const VEHICLE_TYPES = [
  'Two Wheeler',
  'Four Wheeler',
  'Heavy Vehicle',
  'Bicycle',
  'Other'
];

const BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

const SATSANGI_CATEGORIES = [
  'Bal Satsangi',
  'Kishore/Kishori',
  'Yuvak/Yuvati',
  'Vadil',
  'Other'
];

const COMMON_SKILLS = [
  'Leadership',
  'Communication',
  'Event Management',
  'Teaching',
  'Music',
  'Art & Craft',
  'Photography',
  'Technology',
  'Cooking',
  'First Aid',
  'Driving',
  'Other'
];

export const KaryakarAdditionalDetails = ({ karyakarId, karyakarName }: KaryakarAdditionalDetailsProps) => {
  const [details, setDetails] = useState<AdditionalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [customSkill, setCustomSkill] = useState('');
  const [formData, setFormData] = useState<Partial<AdditionalDetailsInsert>>({
    karyakar_id: karyakarId,
    education_level: '',
    education_institution: '',
    education_field: '',
    vehicle_types: [],
    blood_group: '',
    marital_status: '',
    satsangi_category: '',
    skills: [],
    additional_info: {}
  });

  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('karyakars', 'edit');

  useEffect(() => {
    fetchAdditionalDetails();
  }, [karyakarId]);

  const fetchAdditionalDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('karyakar_additional_details')
        .select('*')
        .eq('karyakar_id', karyakarId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setDetails(data);
      if (data) {
        setFormData({
          ...data,
          karyakar_id: karyakarId
        });
      }
    } catch (error: any) {
      console.error('Error fetching additional details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load additional details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const dataToSubmit = {
        ...formData,
        karyakar_id: karyakarId,
        updated_at: new Date().toISOString()
      };

      if (details) {
        const { error } = await supabase
          .from('karyakar_additional_details')
          .update(dataToSubmit)
          .eq('id', details.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('karyakar_additional_details')
          .insert(dataToSubmit);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Additional details saved successfully'
      });

      setShowDialog(false);
      await fetchAdditionalDetails();
    } catch (error: any) {
      console.error('Error saving additional details:', error);
      toast({
        title: 'Error',
        description: 'Failed to save additional details',
        variant: 'destructive'
      });
    }
  };

  const handleSkillToggle = (skill: string, checked: boolean) => {
    const currentSkills = formData.skills || [];
    if (checked) {
      setFormData({
        ...formData,
        skills: [...currentSkills, skill]
      });
    } else {
      setFormData({
        ...formData,
        skills: currentSkills.filter(s => s !== skill)
      });
    }
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && formData.skills && !formData.skills.includes(customSkill)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, customSkill.trim()]
      });
      setCustomSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: (formData.skills || []).filter(skill => skill !== skillToRemove)
    });
  };

  const handleVehicleToggle = (vehicle: string, checked: boolean) => {
    const currentVehicles = formData.vehicle_types || [];
    if (checked) {
      setFormData({
        ...formData,
        vehicle_types: [...currentVehicles, vehicle]
      });
    } else {
      setFormData({
        ...formData,
        vehicle_types: currentVehicles.filter(v => v !== vehicle)
      });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading additional details...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Additional Details</CardTitle>
            <CardDescription>
              Optional additional information for {karyakarName}
            </CardDescription>
          </div>
          
          {canEdit && (
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  {details ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {details ? 'Edit Details' : 'Add Details'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {details ? 'Edit' : 'Add'} Additional Details
                  </DialogTitle>
                  <DialogDescription>
                    Manage additional information for {karyakarName}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Education Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Education</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Education Level</Label>
                        <Select
                          value={formData.education_level || ''}
                          onValueChange={(value) => setFormData({ ...formData, education_level: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select education level" />
                          </SelectTrigger>
                          <SelectContent>
                            {EDUCATION_LEVELS.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Institution</Label>
                        <Input
                          value={formData.education_institution || ''}
                          onChange={(e) => setFormData({ ...formData, education_institution: e.target.value })}
                          placeholder="School/College/University name"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label>Field of Study</Label>
                        <Input
                          value={formData.education_field || ''}
                          onChange={(e) => setFormData({ ...formData, education_field: e.target.value })}
                          placeholder="e.g., Computer Science, Commerce, Arts"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Personal Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Blood Group</Label>
                        <Select
                          value={formData.blood_group || ''}
                          onValueChange={(value) => setFormData({ ...formData, blood_group: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select blood group" />
                          </SelectTrigger>
                          <SelectContent>
                            {BLOOD_GROUPS.map((group) => (
                              <SelectItem key={group} value={group}>
                                {group}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Marital Status</Label>
                        <Select
                          value={formData.marital_status || ''}
                          onValueChange={(value) => setFormData({ ...formData, marital_status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="married">Married</SelectItem>
                            <SelectItem value="unmarried">Unmarried</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Satsangi Category</Label>
                        <Select
                          value={formData.satsangi_category || ''}
                          onValueChange={(value) => setFormData({ ...formData, satsangi_category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {SATSANGI_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Types */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Vehicle Types</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {VEHICLE_TYPES.map((vehicle) => (
                        <div key={vehicle} className="flex items-center space-x-2">
                          <Checkbox
                            id={`vehicle-${vehicle}`}
                            checked={(formData.vehicle_types || []).includes(vehicle)}
                            onCheckedChange={(checked) => handleVehicleToggle(vehicle, !!checked)}
                          />
                          <Label htmlFor={`vehicle-${vehicle}`} className="text-sm">
                            {vehicle}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Skills</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {COMMON_SKILLS.map((skill) => (
                        <div key={skill} className="flex items-center space-x-2">
                          <Checkbox
                            id={`skill-${skill}`}
                            checked={(formData.skills || []).includes(skill)}
                            onCheckedChange={(checked) => handleSkillToggle(skill, !!checked)}
                          />
                          <Label htmlFor={`skill-${skill}`} className="text-sm">
                            {skill}
                          </Label>
                        </div>
                      ))}
                    </div>
                    
                    {/* Custom skill input */}
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Add custom skill..."
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                      />
                      <Button type="button" onClick={addCustomSkill} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Selected skills */}
                    {formData.skills && formData.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                            <span>{skill}</span>
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeSkill(skill)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Save Details
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {details ? (
          <div className="space-y-4">
            {/* Education */}
            {(details.education_level || details.education_institution || details.education_field) && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Education</h4>
                <div className="text-sm space-y-1">
                  {details.education_level && <p><span className="font-medium">Level:</span> {details.education_level}</p>}
                  {details.education_institution && <p><span className="font-medium">Institution:</span> {details.education_institution}</p>}
                  {details.education_field && <p><span className="font-medium">Field:</span> {details.education_field}</p>}
                </div>
              </div>
            )}

            {/* Personal Info */}
            {(details.blood_group || details.marital_status || details.satsangi_category) && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Personal Information</h4>
                <div className="text-sm space-y-1">
                  {details.blood_group && <p><span className="font-medium">Blood Group:</span> {details.blood_group}</p>}
                  {details.marital_status && <p><span className="font-medium">Marital Status:</span> {details.marital_status}</p>}
                  {details.satsangi_category && <p><span className="font-medium">Category:</span> {details.satsangi_category}</p>}
                </div>
              </div>
            )}

            {/* Vehicle Types */}
            {details.vehicle_types && details.vehicle_types.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Vehicle Types</h4>
                <div className="flex flex-wrap gap-1">
                  {details.vehicle_types.map((vehicle, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {vehicle}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {details.skills && details.skills.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {details.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No additional details available. {canEdit && 'Click "Add Details" to add information.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
