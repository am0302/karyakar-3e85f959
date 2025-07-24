
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash } from "lucide-react";

interface MasterDataTableProps {
  title: string;
  data: any[];
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  getDisplayName?: (item: any) => string;
}

export const MasterDataTable = ({
  title,
  data,
  onEdit,
  onDelete,
  getDisplayName,
}: MasterDataTableProps) => {
  const isRoleTable = title.toLowerCase().includes('role');

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Existing {title}s</h3>
      <div className="max-h-96 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              {isRoleTable && <TableHead>Type</TableHead>}
              {isRoleTable && <TableHead>Status</TableHead>}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {getDisplayName ? getDisplayName(item) : item.name}
                </TableCell>
                {isRoleTable && (
                  <TableCell>
                    <Badge variant={item.is_system_role ? "secondary" : "default"}>
                      {item.is_system_role ? 'System' : 'Custom'}
                    </Badge>
                  </TableCell>
                )}
                {isRoleTable && (
                  <TableCell>
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(item)}
                      disabled={isRoleTable && item.is_system_role}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(item.id)}
                      disabled={isRoleTable && item.is_system_role}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
