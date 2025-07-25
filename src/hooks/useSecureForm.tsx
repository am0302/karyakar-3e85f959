
import { useState, useCallback } from 'react';
import { validateInput, sanitizeInput, rateLimiter } from '@/utils/security';
import { useToast } from '@/hooks/use-toast';

interface SecureFormOptions {
  maxAttempts?: number;
  rateLimitWindow?: number;
  sanitizeOnChange?: boolean;
}

export const useSecureForm = <T extends Record<string, any>>(
  initialData: T,
  options: SecureFormOptions = {}
) => {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    maxAttempts = 5,
    rateLimitWindow = 15 * 60 * 1000,
    sanitizeOnChange = true
  } = options;

  // Secure field update with validation and sanitization
  const updateField = useCallback((field: keyof T, value: any) => {
    let sanitizedValue = value;

    // Apply sanitization if enabled
    if (sanitizeOnChange && typeof value === 'string') {
      sanitizedValue = sanitizeInput.text(value);
    }

    // Clear previous error
    setErrors(prev => ({ ...prev, [field]: undefined }));

    // Update field
    setData(prev => ({ ...prev, [field]: sanitizedValue }));
  }, [sanitizeOnChange]);

  // Validate individual field
  const validateField = useCallback((field: keyof T, value: any): string | null => {
    const fieldName = String(field);
    
    // Basic validation based on field name patterns
    if (fieldName.includes('email') && !validateInput.email(value)) {
      return 'Please enter a valid email address';
    }
    
    if (fieldName.includes('phone') && !validateInput.phone(value)) {
      return 'Please enter a valid phone number';
    }
    
    if (fieldName.includes('name') && !validateInput.text(value, 100)) {
      return 'Name must be between 1 and 100 characters';
    }
    
    if (typeof value === 'string' && value.length > 255) {
      return 'Input is too long (maximum 255 characters)';
    }

    return null;
  }, []);

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(data).forEach(key => {
      const error = validateField(key as keyof T, data[key as keyof T]);
      if (error) {
        newErrors[key as keyof T] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [data, validateField]);

  // Secure form submission with rate limiting
  const handleSubmit = useCallback(async (
    submitFn: (data: T) => Promise<void>,
    formId: string = 'default'
  ) => {
    // Check rate limiting
    if (!rateLimiter.canAttempt(formId, maxAttempts, rateLimitWindow)) {
      toast({
        title: 'Too Many Attempts',
        description: 'Please wait before trying again.',
        variant: 'destructive',
      });
      return;
    }

    // Validate form
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Sanitize data before submission
      const sanitizedData = { ...data };
      Object.keys(sanitizedData).forEach(key => {
        if (typeof sanitizedData[key] === 'string') {
          sanitizedData[key] = sanitizeInput.text(sanitizedData[key]);
        }
      });

      await submitFn(sanitizedData);
      
      // Reset rate limiter on successful submission
      rateLimiter.reset(formId);
      
      toast({
        title: 'Success',
        description: 'Form submitted successfully.',
      });
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while submitting the form.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [data, validateForm, maxAttempts, rateLimitWindow, toast]);

  return {
    data,
    errors,
    isSubmitting,
    updateField,
    validateField,
    validateForm,
    handleSubmit,
    setData,
    setErrors
  };
};
