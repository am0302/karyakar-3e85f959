
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2 } from 'lucide-react';
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
  const getRoleColor = (role: UserRole) => {
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Mobile</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Profession</TableHead>
          <TableHead>Mandir</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {karyakars.map((karyakar) => (
          <TableRow key={karyakar.id}>
            <TableCell className="font-medium">{karyakar.full_name}</TableCell>
            <TableCell>{karyakar.mobile_number}</TableCell>
            <TableCell>
              <Badge className={getRoleColor(karyakar.role)}>
                {karyakar.role.replace('_', ' ').toUpperCase()}
              </Badge>
            </TableCell>
            <TableCell>{karyakar.professions?.name || 'N/A'}</TableCell>
            <TableCell>{karyakar.mandirs?.name || 'N/A'}</TableCell>
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
};
