
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash, Eye } from "lucide-react";

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

  const handleEdit = (item: any) => {
    console.log('Edit button clicked for:', item);
    onEdit(item);
  };

  const handleDelete = (id: string, itemName: string) => {
    console.log('Delete button clicked for:', id, itemName);
    
    if (window.confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base sm:text-lg font-semibold">Existing {title}s</h3>
      <div className="max-h-72 sm:max-h-96 overflow-y-auto border rounded-lg">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-10">
            <TableRow>
              <TableHead className="text-xs sm:text-sm">Name</TableHead>
              <TableHead className="w-20 sm:w-24 text-xs sm:text-sm">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                  <div className="flex flex-col items-center space-y-2">
                    <Eye className="h-8 w-8 opacity-50" />
                    <p className="text-sm">No {title.toLowerCase()}s found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="p-2 sm:p-4">
                    <div className="min-w-0">
                      <div className="font-medium text-sm sm:text-base truncate">{getItemDisplayName(item)}</div>
                      {item.description && (
                        <div className="text-xs sm:text-sm text-gray-600 truncate max-w-xs sm:max-w-sm">
                          {item.description}
                        </div>
                      )}
                      {item.type && (
                        <div className="text-xs text-gray-500 mt-1">
                          Type: {item.type}
                        </div>
                      )}
                      {item.status && (
                        <div className="text-xs text-gray-500 mt-1">
                          Status: {item.status}
                        </div>
                      )}
                      {item.is_system_role && (
                        <div className="text-xs text-blue-600 mt-1">
                          System Role
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="p-2 sm:p-4">
                    <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                        disabled={item.is_system_role}
                        className="w-full sm:w-auto text-xs px-2 py-1"
                        title={item.is_system_role ? "System roles cannot be edited" : "Edit item"}
                      >
                        <Pencil className="h-3 w-3 mr-1 sm:mr-0" />
                        <span className="sm:hidden">Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(item.id, getItemDisplayName(item))}
                        disabled={item.is_system_role}
                        className="w-full sm:w-auto text-xs px-2 py-1 text-red-600 hover:text-red-800"
                        title={item.is_system_role ? "System roles cannot be deleted" : "Delete item"}
                      >
                        <Trash className="h-3 w-3 mr-1 sm:mr-0" />
                        <span className="sm:hidden">Delete</span>
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
