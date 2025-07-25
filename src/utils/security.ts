
import DOMPurify from 'dompurify';

export const sanitizeInput = {
  // Sanitize display names and user inputs
  displayName: (input: string): string => {
    if (!input) return '';
    return DOMPurify.sanitize(input.trim(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  },

  // Sanitize text content
  text: (input: string): string => {
    if (!input) return '';
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  },

  // Sanitize HTML content with basic formatting
  html: (input: string): string => {
    if (!input) return '';
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: []
    });
  },

  // Sanitize URLs
  url: (input: string): string => {
    if (!input) return '';
    const sanitized = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    
    // Only allow http/https URLs
    if (sanitized.match(/^https?:\/\//)) {
      return sanitized;
    }
    
    return '';
  },

  // Sanitize file names
  fileName: (input: string): string => {
    if (!input) return '';
    return input.replace(/[^a-zA-Z0-9._-]/g, '').substring(0, 255);
  }
};

// Enhanced security headers helper
export const securityHeaders = {
  // Content Security Policy
  csp: {
    'default-src': "'self'",
    'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
    'style-src': "'self' 'unsafe-inline'",
    'img-src': "'self' data: https:",
    'connect-src': "'self' https://schuyrbqprqkdwrrjppj.supabase.co wss://schuyrbqprqkdwrrjppj.supabase.co",
    'font-src': "'self' https:",
    'object-src': "'none'",
    'media-src': "'self'",
    'frame-src': "'none'"
  },

  // Security headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  }
};

// Input validation patterns
export const validationPatterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^\+?[\d\s\-\(\)]{10,15}$/,
  name: /^[a-zA-Z\s]{2,50}$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  safeString: /^[a-zA-Z0-9\s\-_.]{1,255}$/
};

// Rate limiting configuration
export const rateLimits = {
  login: { attempts: 5, windowMs: 300000 }, // 5 attempts per 5 minutes
  passwordReset: { attempts: 3, windowMs: 600000 }, // 3 attempts per 10 minutes
  roleChange: { attempts: 10, windowMs: 3600000 }, // 10 attempts per hour
  fileUpload: { attempts: 20, windowMs: 3600000 } // 20 uploads per hour
};

// Security event types
export const securityEventTypes = {
  FAILED_LOGIN: 'failed_login',
  SUCCESSFUL_LOGIN: 'successful_login',
  LOGOUT: 'logout',
  ROLE_CHANGE: 'role_change',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  VALIDATION_FAILURE: 'validation_failure',
  FILE_UPLOAD_FAILURE: 'file_upload_failure',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded'
};
