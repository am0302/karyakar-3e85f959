
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
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
          const { data, error } = await supabase
            .from(field.foreignKey as any)
            .select('id, name')
            .eq('is_active', true)
            .order('name');

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

  return { foreignKeyOptions, loadForeignKeyOptions };
};
