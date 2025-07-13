
import React from 'react';
import { KaryakarCard } from '@/components/KaryakarCard';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  professions?: { name: string } | null;
  seva_types?: { name: string } | null;
  mandirs?: { name: string } | null;
  kshetras?: { name: string } | null;
  villages?: { name: string } | null;
  mandals?: { name: string } | null;
};

interface KaryakarGridViewProps {
  karyakars: Profile[];
  onEdit: (karyakar: Profile) => void;
  onDelete: (id: string) => void;
}

export const KaryakarGridView = ({ karyakars, onEdit, onDelete }: KaryakarGridViewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {karyakars.map((karyakar) => (
        <KaryakarCard
          key={karyakar.id}
          karyakar={karyakar}
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={true}
        />
      ))}
    </div>
  );
};
