import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Plus, Pencil, Trash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TableName = 'mandirs' | 'kshetras' | 'villages' | 'mandals' | 'professions' | 'seva_types';

interface MasterDataDialogProps {
  title: string;
  table: TableName;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select';
    required?: boolean;
    options?: Array<{ value: string; label: string }>;
    foreignKey?: string;
  }>;
  onSuccess: () => void;
}

type TableInsertTypes = {
  mandirs: Database['public']['Tables']['mandirs']['Insert'];
  kshetras: Database['public']['Tables']['kshetras']['Insert'];
  villages: Database['public']['Tables']['villages']['Insert'];
  mandals: Database['public']['Tables']['mandals']['Insert'];
  professions: Database['public']['Tables']['professions']['Insert'];
  seva_types: Database['public']['Tables']['seva_types']['Insert'];
};

export const MasterDataDialog = ({ title, table, fields, onSuccess }: MasterDataDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<TableInsertTypes[TableName]>>({});
  const [loading, setLoading] = useState(false);
  const [foreignKeyOptions, setForeignKeyOptions] = useState<Record<string, Array<{ value: string; label: string }>>>({});
  const [existingData, setExistingData] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadForeignKeyOptions();
      loadExistingData();
    }
  }, [open]);

  const loadExistingData = async () => {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExistingData(data || []);
    } catch (error: any) {
      console.error(`Error loading existing ${table} data:`, error);
    }
  };

  const loadForeignKeyOptions = async () => {
    const foreignKeyFields = fields.filter(field => field.foreignKey);
    const options: Record<string, Array<{ value: string; label: string }>> = {};

    for (const field of foreignKeyFields) {
      if (field.foreignKey) {
        try {
          let data: any[] = [];
          let error: any = null;

          // Handle different table queries based on the foreign key
          if (field.foreignKey === 'mandirs') {
            const result = await supabase
              .from('mandirs')
              .select('id, name')
              .eq('is_active', true)
              .order('name');
            data = result.data || [];
            error = result.error;
          } else if (field.foreignKey === 'kshetras') {
            const result = await supabase
              .from('kshetras')
              .select('id, name')
              .eq('is_active', true)
              .order('name');
            data = result.data || [];
            error = result.error;
          } else if (field.foreignKey === 'villages') {
            const result = await supabase
              .from('villages')
              .select('id, name')
              .eq('is_active', true)
              .order('name');
            data = result.data || [];
            error = result.error;
          } else if (field.foreignKey === 'mandals') {
            const result = await supabase
              .from('mandals')
              .select('id, name')
              .eq('is_active', true)
              .order('name');
            data = result.data || [];
            error = result.error;
          } else if (field.foreignKey === 'professions') {
            const result = await supabase
              .from('professions')
              .select('id, name')
              .eq('is_active', true)
              .order('name');
            data = result.data || [];
            error = result.error;
          } else if (field.foreignKey === 'seva_types') {
            const result = await supabase
              .from('seva_types')
              .select('id, name')
              .eq('is_active', true)
              .order('name');
            data = result.data || [];
            error = result.error;
          }

          if (error) {
            console.error(`Error loading ${field.foreignKey} options:`, error);
            continue;
          }

          if (data && Array.isArray(data)) {
            options[field.name] = data.map(item => ({
              value: item.id,
              label: item.name
            }));
          }
        } catch (error) {
          console.error(`Error loading ${field.foreignKey} options:`, error);
        }
      }
    }

    setForeignKeyOptions(options);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingItem) {
        const { error } = await supabase
          .from(table)
          .update(formData as any)
          .eq('id', editingItem.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: `${title} updated successfully`,
        });
      } else {
        const { error } = await supabase
          .from(table)
          .insert(formData as any);

        if (error) throw error;

        toast({
          title: "Success",
          description: `${title} created successfully`,
        });
      }

      setFormData({});
      setEditingItem(null);
      setOpen(false);
      onSuccess();
      loadExistingData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData(item);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from(table)
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${title} deleted successfully`,
      });

      loadExistingData();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({});
    setEditingItem(null);
  };

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
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={field.name}
                      value={(formData as any)[field.name] || ''}
                      onChange={(e) => updateFormData(field.name, e.target.value)}
                      required={field.required}
                    />
                  ) : field.type === 'select' && field.foreignKey ? (
                    <SearchableSelect
                      options={foreignKeyOptions[field.name] || []}
                      value={(formData as any)[field.name] || ''}
                      onValueChange={(value) => updateFormData(field.name, value)}
                      placeholder={`Select ${field.label}`}
                    />
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type}
                      value={(formData as any)[field.name] || ''}
                      onChange={(e) => updateFormData(field.name, e.target.value)}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (editingItem ? "Updating..." : "Creating...") : (editingItem ? "Update" : "Create")}
                </Button>
              </div>
            </form>
          </div>

          {/* Existing Data Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Existing {title}s</h3>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existingData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(item.id)}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
