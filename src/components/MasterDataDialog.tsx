
import { useState } from "react";
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
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type TableName = 'mandirs' | 'kshetras' | 'villages' | 'mandals' | 'professions' | 'seva_types';

// Type helper to get insert types for each table
type InsertData<T extends TableName> = Database['public']['Tables'][T]['Insert'];

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

export const MasterDataDialog = ({ title, table, fields, onSuccess }: MasterDataDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare the data based on the table type
      let insertData: any = { ...formData };
      
      // Add required fields based on table type
      if (table === 'kshetras' && !insertData.mandir_id) {
        // For kshetras, we need a mandir_id - this should be provided by the form
        // For now, we'll skip this validation and let the database handle it
      }
      
      if (table === 'villages' && !insertData.kshetra_id) {
        // For villages, we need a kshetra_id - this should be provided by the form
        // For now, we'll skip this validation and let the database handle it
      }
      
      if (table === 'mandals' && !insertData.village_id) {
        // For mandals, we need a village_id - this should be provided by the form
        // For now, we'll skip this validation and let the database handle it
      }

      const { error } = await supabase
        .from(table)
        .insert(insertData as InsertData<typeof table>);

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
                  value={formData[field.name] || ''}
                  onChange={(e) => updateFormData(field.name, e.target.value)}
                  required={field.required}
                />
              ) : (
                <Input
                  id={field.name}
                  type={field.type}
                  value={formData[field.name] || ''}
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
