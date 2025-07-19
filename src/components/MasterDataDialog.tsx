
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

type TableName = 'mandirs' | 'kshetras' | 'villages' | 'mandals' | 'professions' | 'seva_types';

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
  onSuccess: () => void;
}

export const MasterDataDialog = ({ title, table, fields, onSuccess }: MasterDataDialogProps) => {
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

  useEffect(() => {
    if (open) {
      loadForeignKeyOptions();
      loadExistingData();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add {title}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Edit' : 'Add New'} {title}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div>
            <MasterDataForm
              fields={fields}
              formData={formData}
              foreignKeyOptions={foreignKeyOptions}
              editingItem={editingItem}
              loading={loading}
              onFormDataChange={updateFormData}
              onSubmit={handleSubmit}
              onCancel={() => setOpen(false)}
            />
          </div>

          {/* Existing Data Section */}
          <div>
            <MasterDataTable
              title={title}
              data={existingData}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
