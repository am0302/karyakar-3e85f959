
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus } from 'lucide-react';
import { RoleDisplay } from '@/components/RoleDisplay';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  professions?: { name: string } | null;
  seva_types?: { name: string } | null;
  mandirs?: { name: string } | null;
  kshetras?: { name: string } | null;
  villages?: { name: string } | null;
  mandals?: { name: string } | null;
};

interface KaryakarTableViewProps {
  karyakars: Profile[];
  onEdit: (karyakar: Profile) => void;
  onDelete: (id: string) => void;
  onViewAdditionalDetails?: (karyakar: Profile) => void;
}

export const KaryakarTableView = ({ karyakars, onEdit, onDelete, onViewAdditionalDetails }: KaryakarTableViewProps) => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canView = hasPermission('karyakars', 'view');

  const handleViewAdditionalDetails = (karyakar: Profile) => {
    navigate(`/karyakars/${karyakar.id}/additional-details`);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Photo</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Mobile</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Profession</TableHead>
            <TableHead>Seva Type</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {karyakars.map((karyakar) => (
            <TableRow key={karyakar.id}>
              <TableCell>
                {karyakar.profile_photo_url ? (
                  <img
                    src={karyakar.profile_photo_url}
                    alt={karyakar.full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                    {karyakar.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{karyakar.full_name}</TableCell>
              <TableCell>{karyakar.mobile_number}</TableCell>
              <TableCell>{karyakar.email || 'N/A'}</TableCell>
              <TableCell>
                <RoleDisplay role={karyakar.role} />
              </TableCell>
              <TableCell>{karyakar.professions?.name || 'N/A'}</TableCell>
              <TableCell>{karyakar.seva_types?.name || 'N/A'}</TableCell>
              <TableCell>
                <div className="text-xs space-y-1">
                  <div>{karyakar.mandirs?.name || 'N/A'}</div>
                  <div className="text-gray-500">
                    {karyakar.villages?.name || 'N/A'} • {karyakar.mandals?.name || 'N/A'}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={karyakar.is_active ? "default" : "secondary"}>
                  {karyakar.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(karyakar)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  {canView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewAdditionalDetails(karyakar)}
                    >
                      <Plus className="h-4 w-4" />
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
