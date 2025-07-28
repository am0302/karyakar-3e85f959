
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const getItemDisplayName = (item: any) => {
    if (getDisplayName) {
      return getDisplayName(item);
    }
    return item.display_name || item.name || item.role_name || 'Unknown';
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Existing {title}s</h3>
      <div className="max-h-96 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                  No {title.toLowerCase()}s found
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{getItemDisplayName(item)}</div>
                      {item.description && (
                        <div className="text-sm text-gray-600 truncate max-w-xs">
                          {item.description}
                        </div>
                      )}
                      {item.type && (
                        <div className="text-xs text-gray-500 mt-1">
                          Type: {item.type}
                        </div>
                      )}
                    </div>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
