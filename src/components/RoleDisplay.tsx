
import React from 'react';
import { useDynamicRoles } from '@/hooks/useDynamicRoles';
import { Badge } from '@/components/ui/badge';

interface RoleDisplayProps {
  role: string;
  className?: string;
}

export const RoleDisplay = ({ role, className }: RoleDisplayProps) => {
  const { getRoleDisplayName } = useDynamicRoles();

  return (
    <Badge variant="secondary" className={className}>
      {getRoleDisplayName(role)}
    </Badge>
  );
};
