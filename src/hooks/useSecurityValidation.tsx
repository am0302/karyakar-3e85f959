
import { useState } from 'react';
import { securityValidation, securityLogger } from '@/utils/securityValidation';

interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

export const useSecurityValidation = () => {
  const [isValidating, setIsValidating] = useState(false);

  const validateInput = async (
    input: string,
    type: 'text' | 'email' | 'phone' | 'password',
    maxLength?: number
  ): Promise<ValidationResult> => {
    setIsValidating(true);
    
    try {
      let result: ValidationResult;
      
      switch (type) {
        case 'text':
          const textResult = securityValidation.validateText(input, maxLength);
          result = {
            valid: textResult.valid,
            error: textResult.error,
            sanitized: textResult.sanitized
          };
          break;
          
        case 'email':
          const emailResult = securityValidation.validateEmail(input);
          result = {
            valid: emailResult.valid,
            error: emailResult.error,
            sanitized: input
          };
          break;
          
        case 'phone':
          const phoneResult = securityValidation.validatePhone(input);
          result = {
            valid: phoneResult.valid,
            error: phoneResult.error,
            sanitized: input
          };
          break;
          
        case 'password':
          const passwordResult = securityValidation.validatePassword(input);
          result = {
            valid: passwordResult.valid,
            error: passwordResult.error,
            sanitized: input
          };
          break;
          
        default:
          result = { valid: false, error: 'Invalid validation type' };
      }
      
      // Log validation failures for security monitoring
      if (!result.valid) {
        await securityLogger.logSecurityEvent('validation_failure', {
          type,
          error: result.error,
          input_length: input.length
        });
      }
      
      return result;
    } catch (error) {
      console.error('Validation error:', error);
      return { valid: false, error: 'Validation failed' };
    } finally {
      setIsValidating(false);
    }
  };

  const sanitizeHtml = (input: string): string => {
    return securityValidation.sanitizeHtml(input);
  };

  const validateFile = (file: File, allowedTypes?: string[], maxSize?: number): ValidationResult => {
    const result = securityValidation.validateFile(file, allowedTypes, maxSize);
    
    if (!result.valid) {
      securityLogger.logSecurityEvent('file_validation_failure', {
        filename: file.name,
        type: file.type,
        size: file.size,
        error: result.error
      });
    }
    
    return result;
  };

  return {
    validateInput,
    sanitizeHtml,
    validateFile,
    isValidating
  };
};
