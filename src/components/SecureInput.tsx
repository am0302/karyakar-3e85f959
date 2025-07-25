
import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateInput, sanitizeInput } from '@/utils/security';
import { AlertCircle } from 'lucide-react';

interface SecureInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'phone' | 'password';
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  className?: string;
  disabled?: boolean;
}

export const SecureInput: React.FC<SecureInputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  maxLength = 255,
  className = '',
  disabled = false
}) => {
  const [error, setError] = useState<string>('');
  const [isTouched, setIsTouched] = useState(false);

  const validateField = useCallback((inputValue: string): string => {
    if (required && !inputValue.trim()) {
      return `${label} is required`;
    }

    switch (type) {
      case 'email':
        if (inputValue && !validateInput.email(inputValue)) {
          return 'Please enter a valid email address';
        }
        break;
      case 'phone':
        if (inputValue && !validateInput.phone(inputValue)) {
          return 'Please enter a valid phone number';
        }
        break;
      case 'text':
        if (inputValue && !validateInput.text(inputValue, maxLength)) {
          return `${label} must be between 1 and ${maxLength} characters`;
        }
        break;
    }

    return '';
  }, [label, type, required, maxLength]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Sanitize input
    const sanitizedValue = sanitizeInput.text(inputValue);
    
    // Validate
    const validationError = validateField(sanitizedValue);
    setError(validationError);
    
    // Update value
    onChange(sanitizedValue);
  }, [onChange, validateField]);

  const handleBlur = useCallback(() => {
    setIsTouched(true);
    const validationError = validateField(value);
    setError(validationError);
  }, [value, validateField]);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={label} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={label}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={error && isTouched ? 'border-red-500' : ''}
      />
      {error && isTouched && (
        <div className="flex items-center gap-1 text-red-600 text-sm">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  );
};
