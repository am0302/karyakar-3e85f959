
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/SearchableSelect";

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'number' | 'time';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  foreignKey?: string;
}

interface MasterDataFormProps {
  fields: FormField[];
  formData: Record<string, any>;
  foreignKeyOptions: Record<string, Array<{ value: string; label: string }>>;
  editingItem: any;
  loading: boolean;
  onFormDataChange: (field: string, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const MasterDataForm = ({
  fields,
  formData,
  foreignKeyOptions,
  editingItem,
  loading,
  onFormDataChange,
  onSubmit,
  onCancel,
}: MasterDataFormProps) => {
  const renderField = (field: FormField) => {
    if (field.type === 'textarea') {
      return (
        <Textarea
          id={field.name}
          value={formData[field.name] || ''}
          onChange={(e) => onFormDataChange(field.name, e.target.value)}
          required={field.required}
          className="min-h-[80px] text-sm sm:text-base"
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      );
    }

    if (field.type === 'select') {
      // Handle static options
      if (field.options) {
        // Apply strict filtering for static options
        const validOptions = field.options.filter(option => 
          option && 
          option.value && 
          typeof option.value === 'string' && 
          option.value.trim() !== '' &&
          option.label &&
          typeof option.label === 'string' &&
          option.label.trim() !== ''
        );
        return (
          <SearchableSelect
            options={validOptions}
            value={formData[field.name] || ''}
            onValueChange={(value) => onFormDataChange(field.name, value)}
            placeholder={`Select ${field.label}`}
            className="text-sm sm:text-base"
          />
        );
      }
      
      // Handle foreign key options
      if (field.foreignKey) {
        // Apply strict filtering for foreign key options
        const validOptions = (foreignKeyOptions[field.name] || []).filter(option => 
          option && 
          option.value && 
          typeof option.value === 'string' && 
          option.value.trim() !== '' &&
          option.label &&
          typeof option.label === 'string' &&
          option.label.trim() !== ''
        );
        return (
          <SearchableSelect
            options={validOptions}
            value={formData[field.name] || ''}
            onValueChange={(value) => onFormDataChange(field.name, value)}
            placeholder={`Select ${field.label}`}
            className="text-sm sm:text-base"
          />
        );
      }
    }

    return (
      <Input
        id={field.name}
        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'text'}
        value={formData[field.name] || ''}
        onChange={(e) => onFormDataChange(field.name, e.target.value)}
        required={field.required}
        className="text-sm sm:text-base"
        placeholder={`Enter ${field.label.toLowerCase()}`}
      />
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name} className="text-sm font-medium">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </Label>
          {renderField(field)}
        </div>
      ))}
      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? (editingItem ? "Updating..." : "Creating...") : (editingItem ? "Update" : "Create")}
        </Button>
      </div>
    </form>
  );
};
