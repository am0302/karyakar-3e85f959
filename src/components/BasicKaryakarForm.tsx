
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Link } from 'lucide-react';

interface BasicKaryakarFormProps {
  formData: {
    full_name: string;
    email: string;
    mobile_number: string;
    whatsapp_number: string;
    is_whatsapp_same_as_mobile: boolean;
    date_of_birth: string;
    age: string;
    profile_photo_url: string;
    mandir_id: string;
    kshetra_id: string;
    village_id: string;
    mandal_id: string;
  };
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  mandirs: Array<{ id: string; name: string }>;
  kshetras: Array<{ id: string; name: string }>;
  villages: Array<{ id: string; name: string }>;
  mandals: Array<{ id: string; name: string }>;
  isEditing?: boolean;
}

export const BasicKaryakarForm = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  mandirs,
  kshetras,
  villages,
  mandals,
  isEditing = false
}: BasicKaryakarFormProps) => {
  const [photoMethod, setPhotoMethod] = useState<'upload' | 'url'>('url');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData({ ...formData, profile_photo_url: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Enter the karyakar's personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name || ''}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="example@email.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="mobile_number">Mobile Number *</Label>
            <Input
              id="mobile_number"
              value={formData.mobile_number || ''}
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
                value={formData.whatsapp_number || ''}
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
                value={formData.date_of_birth || ''}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age || ''}
                onChange={(e) => handleInputChange('age', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Photo */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>Upload a photo or provide a URL</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Button
              type="button"
              variant={photoMethod === 'upload' ? 'default' : 'outline'}
              onClick={() => setPhotoMethod('upload')}
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload File</span>
            </Button>
            <Button
              type="button"
              variant={photoMethod === 'url' ? 'default' : 'outline'}
              onClick={() => setPhotoMethod('url')}
              className="flex items-center space-x-2"
            >
              <Link className="w-4 h-4" />
              <span>Photo URL</span>
            </Button>
          </div>

          {photoMethod === 'upload' ? (
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
            </div>
          ) : (
            <div>
              <Input
                placeholder="https://example.com/photo.jpg"
                value={formData.profile_photo_url || ''}
                onChange={(e) => handleInputChange('profile_photo_url', e.target.value)}
              />
            </div>
          )}

          {formData.profile_photo_url && (
            <div className="flex justify-center">
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src={formData.profile_photo_url}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
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
                options={mandirs.map(m => ({ value: m.id, label: m.name }))}
                value={formData.mandir_id || ''}
                onValueChange={(value) => handleInputChange('mandir_id', value)}
                placeholder="Select Mandir"
              />
            </div>
            
            <div>
              <Label>Kshetra</Label>
              <SearchableSelect
                options={kshetras.map(k => ({ value: k.id, label: k.name }))}
                value={formData.kshetra_id || ''}
                onValueChange={(value) => handleInputChange('kshetra_id', value)}
                placeholder="Select Kshetra"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Village</Label>
              <SearchableSelect
                options={villages.map(v => ({ value: v.id, label: v.name }))}
                value={formData.village_id || ''}
                onValueChange={(value) => handleInputChange('village_id', value)}
                placeholder="Select Village"
              />
            </div>
            
            <div>
              <Label>Mandal</Label>
              <SearchableSelect
                options={mandals.map(m => ({ value: m.id, label: m.name }))}
                value={formData.mandal_id || ''}
                onValueChange={(value) => handleInputChange('mandal_id', value)}
                placeholder="Select Mandal"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditing ? 'Update' : 'Register'}
        </Button>
      </div>
    </form>
  );
};
