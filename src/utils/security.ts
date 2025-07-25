
// Security utilities for input validation and XSS protection
import DOMPurify from 'dompurify';

// Input validation functions
export const validateInput = {
  // Validate text input with length limits
  text: (value: string, maxLength: number = 255): boolean => {
    if (typeof value !== 'string') return false;
    return value.length <= maxLength && value.trim().length > 0;
  },

  // Validate email format
  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) && value.length <= 254;
  },

  // Validate phone number (basic validation)
  phone: (value: string): boolean => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(value) && value.length >= 10 && value.length <= 15;
  },

  // Validate UUID format
  uuid: (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },

  // Validate file upload
  file: (file: File, allowedTypes: string[], maxSize: number = 5 * 1024 * 1024): boolean => {
    if (!file) return false;
    
    // Check file type
    const fileType = file.type.toLowerCase();
    if (!allowedTypes.some(type => fileType.includes(type))) return false;
    
    // Check file size
    if (file.size > maxSize) return false;
    
    return true;
  }
};

// XSS protection utilities
export const sanitizeInput = {
  // Sanitize HTML content
  html: (content: string): string => {
    if (typeof content !== 'string') return '';
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  },

  // Sanitize plain text (remove HTML tags)
  text: (content: string): string => {
    if (typeof content !== 'string') return '';
    return DOMPurify.sanitize(content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  },

  // Sanitize user display name
  displayName: (name: string): string => {
    if (typeof name !== 'string') return '';
    return DOMPurify.sanitize(name.trim(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  }
};

// Rate limiting utility (client-side)
export const rateLimiter = {
  attempts: new Map<string, { count: number; lastAttempt: number }>(),

  canAttempt: (key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean => {
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

    // Check if within limits
    if (record.count >= maxAttempts) {
      return false;
    }

    // Increment counter
    record.count++;
    record.lastAttempt = now;
    return true;
  },

  reset: (key: string): void => {
    rateLimiter.attempts.delete(key);
  }
};

// Security headers utility
export const securityHeaders = {
  // Generate CSP nonce
  generateNonce: (): string => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Validate origin
  validateOrigin: (origin: string): boolean => {
    const allowedOrigins = [
      'https://schuyrbqprqkdwrrjppj.supabase.co',
      window.location.origin
    ];
    return allowedOrigins.includes(origin);
  }
};
