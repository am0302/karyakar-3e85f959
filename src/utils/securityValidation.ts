
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';

// Enhanced input validation and sanitization
export const securityValidation = {
  // Sanitize HTML content to prevent XSS
  sanitizeHtml: (input: string): string => {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  },

  // Validate and sanitize text input
  validateText: (input: string, maxLength: number = 255): { valid: boolean; sanitized: string; error?: string } => {
    if (!input || typeof input !== 'string') {
      return { valid: false, sanitized: '', error: 'Input is required' };
    }

    if (input.length > maxLength) {
      return { valid: false, sanitized: '', error: `Input exceeds maximum length of ${maxLength} characters` };
    }

    // Remove potential XSS patterns
    const sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();

    return { valid: true, sanitized };
  },

  // Validate email format
  validateEmail: (email: string): { valid: boolean; error?: string } => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!email) {
      return { valid: false, error: 'Email is required' };
    }

    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    return { valid: true };
  },

  // Validate phone number
  validatePhone: (phone: string): { valid: boolean; error?: string } => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
    
    if (!phone) {
      return { valid: false, error: 'Phone number is required' };
    }

    if (!phoneRegex.test(phone)) {
      return { valid: false, error: 'Invalid phone number format' };
    }

    return { valid: true };
  },

  // Validate password strength
  validatePassword: (password: string): { valid: boolean; score: number; error?: string } => {
    if (!password) {
      return { valid: false, score: 0, error: 'Password is required' };
    }

    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    Object.values(checks).forEach(check => {
      if (check) score++;
    });

    if (score < 3) {
      return { 
        valid: false, 
        score, 
        error: 'Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols' 
      };
    }

    return { valid: true, score };
  },

  // Validate file uploads
  validateFile: (file: File, allowedTypes: string[] = [], maxSize: number = 5 * 1024 * 1024): { valid: boolean; error?: string } => {
    if (!file) {
      return { valid: false, error: 'File is required' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` };
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return { valid: false, error: `File type ${file.type} is not allowed` };
    }

    // Check for potentially dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (dangerousExtensions.includes(fileExtension)) {
      return { valid: false, error: 'File type is not allowed for security reasons' };
    }

    return { valid: true };
  }
};

// Security event logging
export const securityLogger = {
  logSecurityEvent: async (eventType: string, details: any = {}) => {
    try {
      // Log to console for now since security_events table is not in types yet
      console.log('Security Event:', {
        event_type: eventType,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        details,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Security logging error:', error);
    }
  },

  logRoleChange: async (targetUserId: string, oldRole: string, newRole: string, reason?: string) => {
    await securityLogger.logSecurityEvent('role_change', {
      target_user_id: targetUserId,
      old_role: oldRole,
      new_role: newRole,
      reason
    });
  },

  logFailedLogin: async (email: string, reason: string) => {
    await securityLogger.logSecurityEvent('failed_login', {
      email,
      reason
    });
  },

  logUnauthorizedAccess: async (module: string, action: string) => {
    await securityLogger.logSecurityEvent('unauthorized_access', {
      module,
      action
    });
  }
};

// Helper function to get client IP (simplified - in production use proper IP detection)
const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
};

// Rate limiting helper
export const rateLimiter = {
  attempts: new Map<string, { count: number; lastAttempt: number }>(),

  checkRateLimit: (key: string, maxAttempts: number = 5, windowMs: number = 300000): boolean => {
    const now = Date.now();
    const record = rateLimiter.attempts.get(key);

    if (!record) {
      rateLimiter.attempts.set(key, { count: 1, lastAttempt: now });
      return true;
    }

    // Reset if window has passed
    if (now - record.lastAttempt > windowMs) {
      rateLimiter.attempts.set(key, { count: 1, lastAttempt: now });
      return true;
    }

    // Check if limit exceeded
    if (record.count >= maxAttempts) {
      return false;
    }

    // Increment count
    record.count++;
    record.lastAttempt = now;
    return true;
  }
};
