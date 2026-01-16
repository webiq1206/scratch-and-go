/**
 * Input sanitization utilities for user-provided content
 * Helps prevent XSS, injection attacks, and ensures data integrity
 */

/**
 * Sanitizes a string by removing potentially dangerous characters
 * and trimming whitespace
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters (except newlines and tabs for notes)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize whitespace (collapse multiple spaces)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitizes a multi-line string (like notes) while preserving line breaks
 */
export function sanitizeMultilineString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters (preserve newlines and tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize excessive newlines (max 2 consecutive)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Sanitizes a name (person name, title, etc.)
 * More restrictive than general string sanitization
 */
export function sanitizeName(input: string, maxLength: number = 100): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    // Remove anything that's not a letter, number, space, hyphen, or apostrophe
    .replace(/[^\p{L}\p{N}\s\-']/gu, '')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitizes a number input ensuring it's a valid positive number
 */
export function sanitizeNumber(input: string | number, defaultValue: number = 0): number {
  if (typeof input === 'number') {
    return isNaN(input) ? defaultValue : Math.max(0, input);
  }
  
  if (typeof input !== 'string') {
    return defaultValue;
  }
  
  const parsed = parseFloat(input.trim());
  return isNaN(parsed) ? defaultValue : Math.max(0, parsed);
}

/**
 * Sanitizes a URL to prevent javascript: and data: URLs
 */
export function sanitizeUrl(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  const trimmed = input.trim();
  
  // Block dangerous protocols
  const lowerUrl = trimmed.toLowerCase();
  if (
    lowerUrl.startsWith('javascript:') ||
    lowerUrl.startsWith('data:') ||
    lowerUrl.startsWith('vbscript:')
  ) {
    return '';
  }
  
  return trimmed;
}
