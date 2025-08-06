
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Mail, Phone, FileText, Plus } from 'lucide-react';
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
  onViewAdditionalDetails?: (karyakar: Profile) => void;
}

export const KaryakarCard = ({ karyakar, onEdit, onDelete, onViewAdditionalDetails }: KaryakarCardProps) => {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4 mb-4">
          {/* Big Rectangular Photo */}
          <div className="w-full max-w-xs">
            {/* Aspect ratio container */}
            <div className="relative w-full aspect-[3/4] rounded-lg bg-gray-200 overflow-hidden">
              {karyakar.profile_photo_url ? (
                <img
                  src={karyakar.profile_photo_url}
                  alt={karyakar.full_name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <span className="text-4xl font-medium">
                    {karyakar.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Name Below */}
            <div className="mt-2 text-center">
              <h3 className="text-lg font-semibold text-gray-900">{karyakar.full_name}</h3>
              <RoleDisplay role={karyakar.role} className="mt-1" />
            </div>
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
          {karyakar.notes && (
            <div className="flex items-start text-sm text-gray-600">
              <FileText className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <p className="line-clamp-2">{karyakar.notes}</p>
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

        <div className="flex items-center justify-between mb-4">
          <Badge variant={karyakar.is_active ? "default" : "secondary"}>
            {karyakar.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(karyakar)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          
          {onViewAdditionalDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewAdditionalDetails(karyakar)}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-1" />
              Details
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(karyakar.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
