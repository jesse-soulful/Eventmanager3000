import path from 'path';
import fs from 'fs';

/**
 * Sanitizes a filename to prevent path traversal attacks
 * @param filename - The filename to sanitize
 * @returns Sanitized filename (basename only, no directory separators)
 */
export function sanitizeFilename(filename: string): string {
  // Remove any directory separators and get only the basename
  const basename = path.basename(filename);
  
  // Remove any remaining path traversal attempts
  const sanitized = basename.replace(/\.\./g, '').replace(/[\/\\]/g, '');
  
  return sanitized;
}

/**
 * Validates that a file path stays within the allowed directory
 * @param filePath - The resolved file path
 * @param allowedDir - The allowed directory (must be absolute)
 * @returns true if path is safe, false otherwise
 */
export function validatePathInDirectory(filePath: string, allowedDir: string): boolean {
  // Resolve both paths to absolute paths
  const resolvedPath = path.resolve(filePath);
  const resolvedDir = path.resolve(allowedDir);
  
  // Check if the resolved path starts with the allowed directory
  return resolvedPath.startsWith(resolvedDir);
}

/**
 * Gets a safe file path within an allowed directory
 * @param filename - The filename (will be sanitized)
 * @param allowedDir - The allowed directory
 * @returns Safe file path or null if invalid
 */
export function getSafeFilePath(filename: string, allowedDir: string): string | null {
  const sanitized = sanitizeFilename(filename);
  
  if (!sanitized || sanitized.length === 0) {
    return null;
  }
  
  const filePath = path.join(allowedDir, sanitized);
  
  // Validate the path stays within the allowed directory
  if (!validatePathInDirectory(filePath, allowedDir)) {
    return null;
  }
  
  return filePath;
}

/**
 * Validates MIME type against allowed types
 * @param mimetype - The MIME type to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns true if allowed, false otherwise
 */
export function validateMimeType(mimetype: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimetype.toLowerCase());
}

/**
 * Allowed MIME types for document uploads
 */
export const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

/**
 * Allowed MIME types for image uploads (profile pictures, banners)
 */
export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];



