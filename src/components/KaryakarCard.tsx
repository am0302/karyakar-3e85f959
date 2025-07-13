
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit, Phone, Mail } from "lucide-react";

interface KaryakarCardProps {
  karyakar: {
    id: string;
    full_name: string;
    mobile_number: string;
    role: string;
    profession?: { name: string };
    seva_type?: { name: string };
    mandir?: { name: string };
    village?: { name: string };
    profile_photo_url?: string;
    age?: number;
  };
  onEdit: (karyakar: any) => void;
}

export const KaryakarCard = ({ karyakar, onEdit }: KaryakarCardProps) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'sant_nirdeshak':
        return 'default';
      case 'sah_nirdeshak':
        return 'secondary';
      case 'mandal_sanchalak':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <Avatar className="h-12 w-12 mr-4">
          <AvatarImage src={karyakar.profile_photo_url} />
          <AvatarFallback>{getInitials(karyakar.full_name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-lg">{karyakar.full_name}</CardTitle>
          <Badge variant={getRoleBadgeVariant(karyakar.role)} className="mt-1">
            {karyakar.role.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onEdit(karyakar)}>
          <Edit className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{karyakar.mobile_number}</span>
          </div>
          {karyakar.age && (
            <div className="text-muted-foreground">
              Age: {karyakar.age}
            </div>
          )}
          {karyakar.profession && (
            <div className="text-muted-foreground">
              Profession: {karyakar.profession.name}
            </div>
          )}
          {karyakar.seva_type && (
            <div className="text-muted-foreground">
              Seva: {karyakar.seva_type.name}
            </div>
          )}
          {karyakar.mandir && (
            <div className="text-muted-foreground">
              Mandir: {karyakar.mandir.name}
            </div>
          )}
          {karyakar.village && (
            <div className="text-muted-foreground">
              Village: {karyakar.village.name}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
