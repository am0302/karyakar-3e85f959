
import { useState, useCallback } from 'react';
import { sanitizeInput } from '@/utils/security';
import { useToast } from '@/hooks/use-toast';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

interface FormConfig<T = Record<string, any>> {
  initialValues: T;
  validationRules: Partial<Record<keyof T, ValidationRule>>;
  onSubmit: (values: T) => Promise<void> | void;
}

export const useSecureForm = <T extends Record<string, any>>(config: FormConfig<T>) => {
  const [values, setValues] = useState<T>(config.initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validateField = useCallback((name: keyof T, value: any): string | null => {
    const rule = config.validationRules[name];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || value.toString().trim() === '')) {
      return `${String(name)} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === '') {
      return null;
    }

    // String length validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `${String(name)} must be at least ${rule.minLength} characters`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `${String(name)} cannot exceed ${rule.maxLength} characters`;
      }
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value.toString())) {
      return `${String(name)} format is invalid`;
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) return customError;
    }

    return null;
  }, [config.validationRules]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    for (const name in config.validationRules) {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [values, validateField, config.validationRules]);

  const handleChange = useCallback((name: keyof T, value: any) => {
    // Sanitize the input based on type
    let sanitizedValue = value;
    if (typeof value === 'string') {
      sanitizedValue = sanitizeInput.text(value);
    }

    setValues(prev => ({ ...prev, [name]: sanitizedValue }));
    
    // Clear error for this field
    setErrors(prev => ({ ...prev, [name]: undefined }));
  }, []);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await config.onSubmit(values);
      toast({
        title: 'Success',
        description: 'Form submitted successfully',
      });
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit form',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [values, validateForm, config.onSubmit, toast]);

  const reset = useCallback(() => {
    setValues(config.initialValues);
    setErrors({});
  }, [config.initialValues]);

  const getFieldProps = useCallback((name: keyof T) => ({
    value: values[name] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
      handleChange(name, e.target.value),
    error: errors[name],
    name: String(name),
  }), [values, errors, handleChange]);

  return {
    values,
    errors,
    loading,
    handleChange,
    handleSubmit,
    reset,
    validateForm,
    getFieldProps,
  };
};
