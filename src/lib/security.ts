/**
 * Security utilities for the application
 */

// Sanitize user input to prevent XSS
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Basic HTML sanitization
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number format (basic validation)
export function isValidPhone(phone: string): boolean {
  // Allow +, spaces, parentheses, hyphens, and digits
  const phoneRegex = /^[\+\s\(\)\-\d]+$/;
  
  // Must have at least 7 digits
  const digitCount = (phone.match(/\d/g) || []).length;
  
  return phoneRegex.test(phone) && digitCount >= 7;
}

// Generate a secure random ID (for client-side use)
export function generateSecureId(length: number = 16): string {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Validate input against SQL injection patterns
export function hasSqlInjection(input: string): boolean {
  if (!input) return false;
  
  const sqlPatterns = [
    /(\s|^)(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)(\s|$)/i,
    /(\s|^)(UNION|JOIN|FROM|WHERE)(\s|$)/i,
    /--/,
    /;/,
    /\/\*/,
    /\*\//
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

// Validate against common security threats
export function validateSecurityThreats(input: string): { valid: boolean; threats: string[] } {
  const threats = [];
  
  if (hasSqlInjection(input)) {
    threats.push('Potential SQL injection detected');
  }
  
  if (/(<script|javascript:|on\w+=)/i.test(input)) {
    threats.push('Potential XSS attack detected');
  }
  
  if (/(\.\.|\/etc\/passwd|\/bin\/bash)/i.test(input)) {
    threats.push('Potential path traversal detected');
  }
  
  return {
    valid: threats.length === 0,
    threats
  };
}

// Rate limiting helper (basic implementation)
export class RateLimiter {
  private attempts: Map<string, { count: number; timestamp: number }> = new Map();
  private maxAttempts: number;
  private timeWindowMs: number;
  
  constructor(maxAttempts: number = 5, timeWindowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.timeWindowMs = timeWindowMs;
  }
  
  isRateLimited(key: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);
    
    // Clean up old records
    this.cleanup();
    
    if (!record) {
      this.attempts.set(key, { count: 1, timestamp: now });
      return false;
    }
    
    // Check if within time window
    if (now - record.timestamp > this.timeWindowMs) {
      this.attempts.set(key, { count: 1, timestamp: now });
      return false;
    }
    
    // Increment count
    record.count += 1;
    this.attempts.set(key, record);
    
    return record.count > this.maxAttempts;
  }
  
  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.attempts.entries()) {
      if (now - record.timestamp > this.timeWindowMs) {
        this.attempts.delete(key);
      }
    }
  }
}