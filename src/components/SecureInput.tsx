
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSecurityValidation } from '@/hooks/useSecurityValidation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface SecureInputProps {
  label: string;
  type: 'text' | 'email' | 'phone' | 'password';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  className?: string;
}

export const SecureInput: React.FC<SecureInputProps> = ({
  label,
  type,
  value,
  onChange,
  placeholder,
  maxLength,
  required = false,
  className
}) => {
  const [error, setError] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);
  const { validateInput, isValidating } = useSecurityValidation();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Update value immediately for better UX
    onChange(inputValue);
    
    // Validate input
    if (inputValue.trim()) {
      const result = await validateInput(inputValue, type, maxLength);
      
      if (!result.valid) {
        setError(result.error || 'Invalid input');
        setIsValid(false);
      } else {
        setError('');
        setIsValid(true);
        // Use sanitized value if available
        if (result.sanitized && result.sanitized !== inputValue) {
          onChange(result.sanitized);
        }
      }
    } else {
      if (required) {
        setError(`${label} is required`);
        setIsValid(false);
      } else {
        setError('');
        setIsValid(true);
      }
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          id={label.toLowerCase().replace(/\s+/g, '-')}
          type={type === 'phone' ? 'tel' : type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`${!isValid && error ? 'border-red-500' : ''} ${
            isValid && value.trim() ? 'border-green-500' : ''
          }`}
          disabled={isValidating}
        />
        
        {isValidating && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {!isValidating && isValid && value.trim() && (
          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
        )}
      </div>
      
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
      
      {type === 'password' && value.trim() && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>Password should contain:</p>
          <ul className="list-disc list-inside space-y-1">
            <li className={value.length >= 8 ? 'text-green-600' : 'text-red-600'}>
              At least 8 characters
            </li>
            <li className={/[A-Z]/.test(value) ? 'text-green-600' : 'text-red-600'}>
              Uppercase letter
            </li>
            <li className={/[a-z]/.test(value) ? 'text-green-600' : 'text-red-600'}>
              Lowercase letter
            </li>
            <li className={/\d/.test(value) ? 'text-green-600' : 'text-red-600'}>
              Number
            </li>
            <li className={/[!@#$%^&*(),.?":{}|<>]/.test(value) ? 'text-green-600' : 'text-red-600'}>
              Special character
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
