
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Phone, Mail, User, MapPin, Building2, Users } from 'lucide-react';

interface KaryakarCardProps {
  karyakar: {
    id: string;
    full_name: string;
    mobile_number: string;
    email?: string;
    role: string;
    is_active: boolean;
    age?: number;
    date_of_birth?: string;
    whatsapp_number?: string;
    profile_photo_url?: string;
    professions?: { name: string } | null;
    seva_types?: { name: string } | null;
    mandirs?: { name: string } | null;
    kshetras?: { name: string } | null;
    villages?: { name: string } | null;
    mandals?: { name: string } | null;
  };
  onEdit: (karyakar: any) => void;
  onDelete: (id: string) => void;
}

const KaryakarCard: React.FC<KaryakarCardProps> = ({ karyakar, onEdit, onDelete }) => {
  const handleCall = (mobileNumber: string) => {
    window.open(`tel:${mobileNumber}`, '_self');
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, '_self');
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'super_admin': 'bg-red-100 text-red-800',
      'sant_nirdeshak': 'bg-purple-100 text-purple-800',
      'sah_nirdeshak': 'bg-blue-100 text-blue-800',
      'mandal_sanchalak': 'bg-green-100 text-green-800',
      'karyakar': 'bg-yellow-100 text-yellow-800',
      'sevak': 'bg-gray-100 text-gray-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      {/* Large Profile Picture at Top */}
      <div className="relative w-full h-32 bg-gradient-to-br from-orange-100 to-orange-200 rounded-t-lg">
        <div className="absolute inset-0 flex items-center justify-center">
          {karyakar.profile_photo_url ? (
            <img
              src={karyakar.profile_photo_url}
              alt={karyakar.full_name}
                className="w-24 h-32 bg-orange-500 rounded-xl flex items-center justify-center border-4 border-white shadow-lg"
           //   className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
          ) : (
           /* <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
              <User className="h-12 w-12 text-white" />
            </div> */
              <div className="w-48 h-32 bg-orange-500 rounded-xl flex items-center justify-center border-4 border-white shadow-lg">
              <User className="h-16 w-16 text-white" />
            </div>
          )}
        </div>
        <Badge 
          variant={karyakar.is_active ? 'default' : 'secondary'}
          className="absolute top-2 right-2"
        >
          {karyakar.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <CardHeader className="pt-4 pb-2 text-center">
        <CardTitle className="text-lg">{karyakar.full_name}</CardTitle>
        <Badge className={getRoleColor(karyakar.role)}>
          {karyakar.role.replace('_', ' ').toUpperCase()}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <button
              onClick={() => handleCall(karyakar.mobile_number)}
              className="text-blue-600 hover:underline text-sm"
            >
              {karyakar.mobile_number}
            </button>
          </div>
          
          {karyakar.whatsapp_number && karyakar.whatsapp_number !== karyakar.mobile_number && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-600">WhatsApp: {karyakar.whatsapp_number}</span>
            </div>
          )}
          
          {karyakar.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <button
                onClick={() => handleEmail(karyakar.email!)}
                className="text-blue-600 hover:underline text-sm"
              >
                {karyakar.email}
              </button>
            </div>
          )}
        </div>

        {/* Personal Information */}
        <div className="space-y-1 text-sm text-gray-600">
          {karyakar.age && (
            <div>Age: {karyakar.age} years</div>
          )}
          {karyakar.date_of_birth && (
            <div>DOB: {new Date(karyakar.date_of_birth).toLocaleDateString()}</div>
          )}
        </div>

        {/* Professional Information */}
        <div className="space-y-1 text-sm">
          {karyakar.professions?.name && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Profession:</span>
              <span className="text-gray-600">{karyakar.professions.name}</span>
            </div>
          )}
          {karyakar.seva_types?.name && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Seva Type:</span>
              <span className="text-gray-600">{karyakar.seva_types.name}</span>
            </div>
          )}
        </div>

        {/* Location Information */}
        <div className="space-y-1 text-sm">
          {karyakar.mandirs?.name && (
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3 text-gray-500" />
              <span className="font-medium">Mandir:</span>
              <span className="text-gray-600">{karyakar.mandirs.name}</span>
            </div>
          )}
          {karyakar.kshetras?.name && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-gray-500" />
              <span className="font-medium">Kshetra:</span>
              <span className="text-gray-600">{karyakar.kshetras.name}</span>
            </div>
          )}
          {karyakar.villages?.name && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-gray-500" />
              <span className="font-medium">Village:</span>
              <span className="text-gray-600">{karyakar.villages.name}</span>
            </div>
          )}
          {karyakar.mandals?.name && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-gray-500" />
              <span className="font-medium">Mandal:</span>
              <span className="text-gray-600">{karyakar.mandals.name}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(karyakar)} className="flex-1">
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(karyakar.id)} className="flex-1">
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default KaryakarCard;
