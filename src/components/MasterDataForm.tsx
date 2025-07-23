import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Save, X } from "lucide-react";

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
  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => onFormDataChange(field.name, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            required={field.required}
          />
        );
      case 'select':
        const options = field.foreignKey 
          ? foreignKeyOptions[field.foreignKey] || []
          : field.options || [];
        
        return (
          <SearchableSelect
            options={options}
            value={value}
            onValueChange={(val) => onFormDataChange(field.name, val)}
            placeholder={`Select ${field.label.toLowerCase()}`}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => onFormDataChange(field.name, e.target.value)}
            required={field.required}
          />
        );
      case 'time':
        return (
          <Input
            type="time"
            value={value}
            onChange={(e) => onFormDataChange(field.name, e.target.value)}
            required={field.required}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onFormDataChange(field.name, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            required={field.required}
          />
        );
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value === true || value === 'true'}
              onCheckedChange={(checked) => onFormDataChange(field.name, checked)}
            />
            <Label>{value === true || value === 'true' ? 'Active' : 'Inactive'}</Label>
          </div>
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => onFormDataChange(field.name, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            required={field.required}
          />
        );
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">
        {editingItem ? 'Edit' : 'Add New'} Entry
      </h3>
      
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </Label>
          {renderField(field)}
        </div>
      ))}

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              {editingItem ? 'Updating...' : 'Adding...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {editingItem ? 'Update' : 'Add'}
            </>
          )}
        </Button>
        {editingItem && (
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};
