
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
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

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
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadForeignKeyOptions();
    }
  }, [open]);

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
      const { error } = await supabase
        .from(table)
        .insert(formData as any);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${title} created successfully`,
      });

      setFormData({});
      setOpen(false);
      onSuccess();
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

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add {title}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New {title}</DialogTitle>
        </DialogHeader>
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
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
