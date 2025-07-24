
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'number' | 'time';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  foreignKey?: string;
}

export const useForeignKeyOptions = (fields: FormField[]) => {
  const [foreignKeyOptions, setForeignKeyOptions] = useState<Record<string, Array<{ value: string; label: string }>>>({});

  const loadForeignKeyOptions = async () => {
    const foreignKeyFields = fields.filter(field => field.foreignKey);
    const options: Record<string, Array<{ value: string; label: string }>> = {};

    for (const field of foreignKeyFields) {
      if (field.foreignKey) {
        try {
          let data: any[] | null = null;
          let error: any = null;

          // Handle each table type explicitly to ensure proper TypeScript inference
          switch (field.foreignKey) {
            case 'mandirs':
              ({ data, error } = await supabase
                .from('mandirs')
                .select('id, name')
                .eq('is_active', true)
                .order('name'));
              break;
            case 'kshetras':
              ({ data, error } = await supabase
                .from('kshetras')
                .select('id, name')
                .eq('is_active', true)
                .order('name'));
              break;
            case 'villages':
              ({ data, error } = await supabase
                .from('villages')
                .select('id, name')
                .eq('is_active', true)
                .order('name'));
              break;
            case 'mandals':
              ({ data, error } = await supabase
                .from('mandals')
                .select('id, name')
                .eq('is_active', true)
                .order('name'));
              break;
            case 'professions':
              ({ data, error } = await supabase
                .from('professions')
                .select('id, name')
                .eq('is_active', true)
                .order('name'));
              break;
            case 'seva_types':
              ({ data, error } = await supabase
                .from('seva_types')
                .select('id, name')
                .eq('is_active', true)
                .order('name'));
              break;
            default:
              console.warn(`Unknown foreign key table: ${field.foreignKey}`);
              continue;
          }

          if (error) {
            console.error(`Error loading ${field.foreignKey} options:`, error);
            continue;
          }

          if (data && Array.isArray(data)) {
            options[field.name] = data
              .filter(item => {
                // Ultra-strict filtering to prevent empty values
                if (!item || typeof item !== 'object') return false;
                
                if (!item.id || (typeof item.id !== 'string' && typeof item.id !== 'number') || item.id.toString().trim() === '') {
                  console.warn(`useForeignKeyOptions: Filtering out ${field.foreignKey} item with invalid id:`, item);
                  return false;
                }
                
                if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
                  console.warn(`useForeignKeyOptions: Filtering out ${field.foreignKey} item with invalid name:`, item);
                  return false;
                }
                
                return true;
              })
              .map(item => ({
                value: item.id.toString().trim(),
                label: item.name.trim()
              }))
              .filter(option => option.value.length > 0 && option.label.length > 0);
          }
        } catch (error) {
          console.error(`Error loading ${field.foreignKey} options:`, error);
        }
      }
    }

    setForeignKeyOptions(options);
  };

  return { foreignKeyOptions, loadForeignKeyOptions };
};
