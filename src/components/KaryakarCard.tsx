
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit, Phone, Trash2, Mail, MapPin, Building, Users } from "lucide-react";

interface KaryakarCardProps {
  karyakar: {
    id: string;
    full_name: string;
    email?: string;
    mobile_number: string;
    role: string;
    professions?: { name: string } | null;
    seva_types?: { name: string } | null;
    mandirs?: { name: string } | null;
    kshetras?: { name: string } | null;
    villages?: { name: string } | null;
    mandals?: { name: string } | null;
    profile_photo_url?: string;
    age?: number;
    whatsapp_number?: string;
    date_of_birth?: string;
    is_active?: boolean;
  };
  onEdit: (karyakar: any) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export const KaryakarCard = ({ karyakar, onEdit, onDelete, showActions = true }: KaryakarCardProps) => {
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
          <div className="flex gap-2 mt-1">
            <Badge variant={getRoleBadgeVariant(karyakar.role)} className="text-xs">
              {karyakar.role.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge variant={karyakar.is_active ? "default" : "secondary"} className="text-xs">
              {karyakar.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        {showActions && (
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(karyakar)}>
              <Edit className="h-4 w-4" />
            </Button>
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={() => onDelete(karyakar.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{karyakar.mobile_number}</span>
          </div>
          
          {karyakar.whatsapp_number && karyakar.whatsapp_number !== karyakar.mobile_number && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-green-500" />
              <span>WhatsApp: {karyakar.whatsapp_number}</span>
            </div>
          )}
          
          {karyakar.email && (
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="truncate">{karyakar.email}</span>
            </div>
          )}
          
          {karyakar.age && (
            <div className="text-muted-foreground">
              Age: {karyakar.age}
            </div>
          )}
          
          {karyakar.date_of_birth && (
            <div className="text-muted-foreground">
              DOB: {new Date(karyakar.date_of_birth).toLocaleDateString()}
            </div>
          )}
          
          {karyakar.professions && (
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Profession: {karyakar.professions.name}</span>
            </div>
          )}
          
          {karyakar.seva_types && (
            <div className="text-muted-foreground">
              Seva: {karyakar.seva_types.name}
            </div>
          )}
          
          {karyakar.mandirs && (
            <div className="flex items-center">
              <Building className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Mandir: {karyakar.mandirs.name}</span>
            </div>
          )}
          
          {karyakar.kshetras && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Kshetra: {karyakar.kshetras.name}</span>
            </div>
          )}
          
          {karyakar.villages && (
            <div className="text-muted-foreground">
              Village: {karyakar.villages.name}
            </div>
          )}
          
          {karyakar.mandals && (
            <div className="text-muted-foreground">
              Mandal: {karyakar.mandals.name}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
