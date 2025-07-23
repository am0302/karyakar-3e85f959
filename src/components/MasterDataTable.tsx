
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
}

export const MasterDataTable = ({
  title,
  data,
  onEdit,
  onDelete,
}: MasterDataTableProps) => {
  const renderTableContent = () => {
    if (title === "User Role") {
      return (
        <>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">{item.role_name}</TableCell>
                <TableCell className="font-medium">{item.display_name}</TableCell>
                <TableCell>
                  <Badge variant={item.is_system_role ? "secondary" : "default"}>
                    {item.is_system_role ? 'System' : 'Custom'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={item.is_active ? "default" : "secondary"}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(item)}
                      disabled={item.is_system_role}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(item.id)}
                      disabled={item.is_system_role}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </>
      );
    }

    // Default table for other data types
    return (
      <>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{item.name || item.display_name}</div>
                  {item.description && (
                    <div className="text-sm text-gray-600">{item.description}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(item)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </>
    );
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Existing {title}s</h3>
      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No {title.toLowerCase()}s found</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <Table>
            {renderTableContent()}
          </Table>
        </div>
      )}
    </div>
  );
};
