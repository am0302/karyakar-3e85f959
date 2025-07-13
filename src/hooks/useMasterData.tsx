
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type TableName = 'mandirs' | 'kshetras' | 'villages' | 'mandals' | 'professions' | 'seva_types';

type TableInsertTypes = {
  mandirs: Database['public']['Tables']['mandirs']['Insert'];
  kshetras: Database['public']['Tables']['kshetras']['Insert'];
  villages: Database['public']['Tables']['villages']['Insert'];
  mandals: Database['public']['Tables']['mandals']['Insert'];
  professions: Database['public']['Tables']['professions']['Insert'];
  seva_types: Database['public']['Tables']['seva_types']['Insert'];
};

export const useMasterData = (table: TableName, title: string, onSuccess: () => void) => {
  const [existingData, setExistingData] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<Partial<TableInsertTypes[TableName]>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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

  return {
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
  };
};
