
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface KaryakarStatsProps {
  totalCount: number;
}

export const KaryakarStats = ({ totalCount }: KaryakarStatsProps) => {
  return (
    <CardHeader>
      <div className="flex justify-between items-center">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Karyakars ({totalCount})
          </CardTitle>
          <CardDescription>
            Manage and view all registered karyakars
          </CardDescription>
        </div>
      </div>
    </CardHeader>
  );
};
