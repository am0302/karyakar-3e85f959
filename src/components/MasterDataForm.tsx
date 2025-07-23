
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SearchableSelect } from "@/components/SearchableSelect";

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'number' | 'time' | 'boolean';
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
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </Label>
          {field.type === 'textarea' ? (
            <Textarea
              id={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => onFormDataChange(field.name, e.target.value)}
              required={field.required}
            />
          ) : field.type === 'boolean' ? (
            <div className="flex items-center space-x-2">
              <Switch
                id={field.name}
                checked={formData[field.name] || false}
                onCheckedChange={(checked) => onFormDataChange(field.name, checked)}
              />
              <Label htmlFor={field.name} className="text-sm font-normal">
                {field.label}
              </Label>
            </div>
          ) : field.type === 'select' && field.options ? (
            <SearchableSelect
              options={field.options}
              value={formData[field.name] || ''}
              onValueChange={(value) => onFormDataChange(field.name, value)}
              placeholder={`Select ${field.label}`}
            />
          ) : field.type === 'select' && field.foreignKey ? (
            <SearchableSelect
              options={foreignKeyOptions[field.name] || []}
              value={formData[field.name] || ''}
              onValueChange={(value) => onFormDataChange(field.name, value)}
              placeholder={`Select ${field.label}`}
            />
          ) : (
            <Input
              id={field.name}
              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'text'}
              value={formData[field.name] || ''}
              onChange={(e) => onFormDataChange(field.name, e.target.value)}
              required={field.required}
            />
          )}
        </div>
      ))}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (editingItem ? "Updating..." : "Creating...") : (editingItem ? "Update" : "Create")}
        </Button>
      </div>
    </form>
  );
};
