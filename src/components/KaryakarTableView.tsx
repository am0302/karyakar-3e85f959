
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2 } from 'lucide-react';
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

type UserRole = Database['public']['Enums']['user_role'];

interface KaryakarTableViewProps {
  karyakars: Profile[];
  onEdit: (karyakar: Profile) => void;
  onDelete: (id: string) => void;
}

export const KaryakarTableView = ({ karyakars, onEdit, onDelete }: KaryakarTableViewProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Photo</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Mobile</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Profession</TableHead>
          <TableHead>Mandir</TableHead>
          <TableHead>Kshetra</TableHead>
          <TableHead>Mandal</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {karyakars.map((karyakar) => (
          <TableRow key={karyakar.id}>
            <TableCell>
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {karyakar.profile_photo_url ? (
                  <img 
                    src={karyakar.profile_photo_url} 
                    alt={karyakar.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium text-gray-600">
                    {karyakar.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell className="font-medium">{karyakar.full_name}</TableCell>
            <TableCell>{karyakar.mobile_number}</TableCell>
            <TableCell>
              <RoleDisplay role={karyakar.role} />
            </TableCell>
            <TableCell>{karyakar.professions?.name || 'N/A'}</TableCell>
            <TableCell>{karyakar.mandirs?.name || 'N/A'}</TableCell>
            <TableCell>{karyakar.kshetras?.name || 'N/A'}</TableCell>
            <TableCell>{karyakar.mandals?.name || 'N/A'}</TableCell>
            <TableCell>
              <Badge variant={karyakar.is_active ? "default" : "secondary"}>
                {karyakar.is_active ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
            <TableCell>
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
