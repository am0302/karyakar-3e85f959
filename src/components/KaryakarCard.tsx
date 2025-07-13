
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, Mail, MapPin, Edit, Trash2, Calendar } from 'lucide-react';
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
  onEdit?: (karyakar: Profile) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export const KaryakarCard = ({ karyakar, onEdit, onDelete, showActions = true }: KaryakarCardProps) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'sant_nirdeshak': return 'bg-purple-100 text-purple-800';
      case 'sah_nirdeshak': return 'bg-blue-100 text-blue-800';
      case 'mandal_sanchalak': return 'bg-green-100 text-green-800';
      case 'karyakar': return 'bg-yellow-100 text-yellow-800';
      case 'sevak': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAge = (age: number | null, dateOfBirth: string | null) => {
    if (age) return `${age} years`;
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      const calculatedAge = today.getFullYear() - birthDate.getFullYear();
      return `${calculatedAge} years`;
    }
    return 'N/A';
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={karyakar.profile_photo_url || undefined} />
              <AvatarFallback>
                {karyakar.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{karyakar.full_name}</h3>
              <Badge className={getRoleColor(karyakar.role)}>
                {karyakar.role.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
          {showActions && (
            <div className="flex space-x-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(karyakar)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(karyakar.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex items-center text-gray-600">
            <Phone className="h-4 w-4 mr-2" />
            {karyakar.mobile_number}
          </div>
          
          {karyakar.whatsapp_number && (
            <div className="flex items-center text-green-600">
              <Phone className="h-4 w-4 mr-2" />
              WhatsApp: {karyakar.whatsapp_number}
            </div>
          )}
          
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            Age: {formatAge(karyakar.age, karyakar.date_of_birth)}
          </div>
        </div>

        {karyakar.professions && (
          <div>
            <span className="text-sm font-medium">Profession: </span>
            <span className="text-sm text-gray-600">{karyakar.professions.name}</span>
          </div>
        )}

        {karyakar.seva_types && (
          <div>
            <span className="text-sm font-medium">Seva Type: </span>
            <span className="text-sm text-gray-600">{karyakar.seva_types.name}</span>
          </div>
        )}

        <div className="space-y-1 text-sm">
          {karyakar.mandirs && (
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              Mandir: {karyakar.mandirs.name}
            </div>
          )}
          
          {karyakar.kshetras && (
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              Kshetra: {karyakar.kshetras.name}
            </div>
          )}
          
          {karyakar.villages && (
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              Village: {karyakar.villages.name}
            </div>
          )}
          
          {karyakar.mandals && (
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              Mandal: {karyakar.mandals.name}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-2">
          <Badge variant={karyakar.is_active ? "default" : "secondary"}>
            {karyakar.is_active ? "Active" : "Inactive"}
          </Badge>
          <span className="text-xs text-gray-500">
            Joined: {new Date(karyakar.created_at).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
