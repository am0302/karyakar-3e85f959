
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Mail, Phone } from 'lucide-react';
import { RoleDisplay } from '@/components/RoleDisplay';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  professions?: { name: string } | null;
  seva_types?: { name: string } | null;
  mandirs?: { name: string } | null;
  kshetras?: { name: string } | null;
  villages?: { name: string } | null;
  mandals?: { name: string } | null;
};

interface KaryakarCardProps {
  karyakar: Profile;
  onEdit: (karyakar: Profile) => void;
  onDelete: (id: string) => void;
}

export const KaryakarCard = ({ karyakar, onEdit, onDelete }: KaryakarCardProps) => {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-4">
         
          <div className="w-full h-48 rounded-lg bg-gray-200 overflow-hidden">
  {karyakar.profile_photo_url ? (
    <img 
      src={karyakar.profile_photo_url} 
      alt={karyakar.full_name}
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="flex items-center justify-center w-full h-full">
      <span className="text-xl font-semibold text-gray-600">
        {karyakar.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
      </span>
    </div>
  )}
</div>
 
          
          {/*        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {karyakar.profile_photo_url ? (
              <img 
                src={karyakar.profile_photo_url} 
                alt={karyakar.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-medium text-gray-600">
                {karyakar.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            )}
          </div> */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{karyakar.full_name}</h3>
            <RoleDisplay role={karyakar.role} className="mt-1" />
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-4 h-4 mr-2" />
            {karyakar.mobile_number}
          </div>
          {karyakar.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2" />
              {karyakar.email}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <span className="font-medium text-gray-700">Profession:</span>
            <p className="text-gray-600">{karyakar.professions?.name || 'N/A'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Seva:</span>
            <p className="text-gray-600">{karyakar.seva_types?.name || 'N/A'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Mandir:</span>
            <p className="text-gray-600">{karyakar.mandirs?.name || 'N/A'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Kshetra:</span>
            <p className="text-gray-600">{karyakar.kshetras?.name || 'N/A'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Village:</span>
            <p className="text-gray-600">{karyakar.villages?.name || 'N/A'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Mandal:</span>
            <p className="text-gray-600">{karyakar.mandals?.name || 'N/A'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant={karyakar.is_active ? "default" : "secondary"}>
            {karyakar.is_active ? "Active" : "Inactive"}
          </Badge>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(karyakar)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(karyakar.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
