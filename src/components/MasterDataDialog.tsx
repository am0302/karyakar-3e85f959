import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { MasterDataForm } from "./MasterDataForm";
import { MasterDataTable } from "./MasterDataTable";
import { useForeignKeyOptions } from "@/hooks/useForeignKeyOptions";
import { useMasterData } from "@/hooks/useMasterData";

type TableName = 'mandirs' | 'kshetras' | 'villages' | 'mandals' | 'professions' | 'seva_types' | 'custom_roles';

interface MasterDataDialogProps {
  title: string;
  table: TableName;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'date' | 'number' | 'time';
    required?: boolean;
    options?: Array<{ value: string; label: string }>;
    foreignKey?: string;
  }>;
  onSuccess?: () => void;
  autoLoad?: boolean;
}

export const MasterDataDialog = ({ 
  title, 
  table, 
  fields, 
  onSuccess,
  autoLoad = false 
}: MasterDataDialogProps) => {
  const [open, setOpen] = useState(false);
  const { foreignKeyOptions, loadForeignKeyOptions } = useForeignKeyOptions(fields);
  const {
    existingData,
    editingItem,
    formData,
    loading,
    loadExistingData,
    handleSubmit,
    handleEdit,
    handleDelete,
    updateFormData,
    resetForm,
  } = useMasterData(table, title, onSuccess);

  // Auto-load existing data when component mounts if autoLoad is true
  useEffect(() => {
    if (autoLoad) {
      loadExistingData();
      loadForeignKeyOptions();
    }
  }, [autoLoad]);

  useEffect(() => {
    if (open) {
      if (!autoLoad) {
        loadForeignKeyOptions();
        loadExistingData();
      }
    }
  }, [open, autoLoad]);

  const getDisplayName = (item: any) => {
    if (table === 'custom_roles') {
      return item.display_name || item.role_name;
    }
    return item.name;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit(e);
    if (!autoLoad) {
      setOpen(false);
    }
  };

  const handleEditItem = (item: any) => {
    console.log('Editing item:', item);
    handleEdit(item);
    if (!autoLoad) {
      // Keep dialog open when editing
      setOpen(true);
    }
  };

  const handleDeleteItem = (id: string) => {
    console.log('Deleting item:', id);
    handleDelete(id);
  };

  const handleCancel = () => {
    resetForm();
    if (!autoLoad) {
      setOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Show existing data if autoLoad is true */}
      {autoLoad && (
        <div className="bg-white rounded-lg border">
          <div className="p-3 sm:p-4 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-base sm:text-lg font-semibold">Existing {title}s</h3>
              <Button size="sm" onClick={() => setOpen(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add {title}
              </Button>
            </div>
          </div>
          <div className="p-3 sm:p-4">
            <MasterDataTable
              title={title}
              data={existingData}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              getDisplayName={getDisplayName}
            />
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}>
        {!autoLoad && (
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add {title}
            </Button>
          </DialogTrigger>
        )}
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {editingItem ? 'Edit' : 'Add New'} {title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Form Section */}
            <div className="space-y-4">
              <MasterDataForm
                fields={fields}
                formData={formData}
                foreignKeyOptions={foreignKeyOptions}
                editingItem={editingItem}
                loading={loading}
                onFormDataChange={updateFormData}
                onSubmit={handleFormSubmit}
                onCancel={handleCancel}
              />
            </div>

            {/* Existing Data Section - only show if not autoLoad */}
            {!autoLoad && (
              <div className="space-y-4">
                <MasterDataTable
                  title={title}
                  data={existingData}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                  getDisplayName={getDisplayName}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog for autoLoad mode */}
      {autoLoad && editingItem && (
        <Dialog open={true} onOpenChange={() => resetForm()}>
          <DialogContent className="w-full max-w-md max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Edit {title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <MasterDataForm
                fields={fields}
                formData={formData}
                foreignKeyOptions={foreignKeyOptions}
                editingItem={editingItem}
                loading={loading}
                onFormDataChange={updateFormData}
                onSubmit={handleFormSubmit}
                onCancel={handleCancel}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
