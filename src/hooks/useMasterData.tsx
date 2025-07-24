
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type TableName = 'mandirs' | 'kshetras' | 'villages' | 'mandals' | 'professions' | 'seva_types' | 'custom_roles';

type TableInsertTypes = {
  mandirs: Database['public']['Tables']['mandirs']['Insert'];
  kshetras: Database['public']['Tables']['kshetras']['Insert'];
  villages: Database['public']['Tables']['villages']['Insert'];
  mandals: Database['public']['Tables']['mandals']['Insert'];
  professions: Database['public']['Tables']['professions']['Insert'];
  seva_types: Database['public']['Tables']['seva_types']['Insert'];
  custom_roles: Database['public']['Tables']['custom_roles']['Insert'];
};

export const useMasterData = (table: TableName, title: string, onSuccess?: () => void) => {
  const [existingData, setExistingData] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<Partial<TableInsertTypes[TableName]>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadExistingData = async () => {
    try {
      let query = supabase.from(table).select('*');
      
      // For custom_roles, don't filter by is_active initially to show all
      if (table !== 'custom_roles') {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setExistingData(data || []);
    } catch (error: any) {
      console.error(`Error loading existing ${table} data:`, error);
      toast({
        title: "Error",
        description: `Failed to load existing ${title.toLowerCase()}s`,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For custom_roles, prevent editing system roles
      if (table === 'custom_roles' && editingItem?.is_system_role) {
        toast({
          title: "Error",
          description: "System roles cannot be modified",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const dataToSubmit = { ...formData };
      
      // For custom_roles, ensure is_system_role is set to false for new roles
      if (table === 'custom_roles' && !editingItem) {
        (dataToSubmit as any).is_system_role = false;
      }

      if (editingItem) {
        console.log('Updating item:', editingItem.id, 'with data:', dataToSubmit);
        
        const { error } = await supabase
          .from(table)
          .update(dataToSubmit as any)
          .eq('id', editingItem.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: `${title} updated successfully`,
        });
      } else {
        console.log('Creating new item with data:', dataToSubmit);
        
        const { error } = await supabase
          .from(table)
          .insert(dataToSubmit as any);

        if (error) throw error;

        toast({
          title: "Success",
          description: `${title} created successfully`,
        });
      }

      setFormData({});
      setEditingItem(null);
      await loadExistingData();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error(`Error ${editingItem ? 'updating' : 'creating'} ${table}:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingItem ? 'update' : 'create'} ${title.toLowerCase()}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    console.log('handleEdit called with:', item);
    
    // For custom_roles, prevent editing system roles
    if (table === 'custom_roles' && item.is_system_role) {
      toast({
        title: "Error",
        description: "System roles cannot be modified",
        variant: "destructive",
      });
      return;
    }
    
    setEditingItem(item);
    setFormData(item);
  };

  const handleDelete = async (id: string) => {
    try {
      console.log('handleDelete called with id:', id);
      
      // For custom_roles, check if it's a system role
      if (table === 'custom_roles') {
        const item = existingData.find(data => data.id === id);
        if (item?.is_system_role) {
          toast({
            title: "Error",
            description: "System roles cannot be deleted",
            variant: "destructive",
          });
          return;
        }
      }

      const { error } = await supabase
        .from(table)
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${title} deleted successfully`,
      });

      await loadExistingData();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error(`Error deleting ${table} item:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to delete ${title.toLowerCase()}`,
        variant: "destructive",
      });
    }
  };

  const updateFormData = (field: string, value: any) => {
    console.log('updateFormData called:', field, value);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    console.log('resetForm called');
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
