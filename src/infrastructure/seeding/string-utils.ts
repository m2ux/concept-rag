/**
 * String Utilities for Seeding
 * 
 * String manipulation utilities used during document seeding.
 */

/**
 * Truncate a file path to a maximum length.
 * 
 * Adds '...' suffix if truncated.
 * 
 * @param filePath - File path to truncate
 * @param maxLength - Maximum length (default: 180)
 * @returns Truncated path
 */
export function truncateFilePath(filePath: string, maxLength: number = 180): string {
  if (filePath.length <= maxLength) {
    return filePath;
  }
  return filePath.slice(0, maxLength - 3) + '...';
}

/**
 * Format a hash for display (show first and last 4 characters).
 * 
 * @param hash - Full hash string
 * @returns Formatted hash display string
 */
export function formatHashDisplay(hash: string): string {
  if (!hash || hash === 'unknown') {
    return '[????..????]';
  }
  return `[${hash.slice(0, 4)}..${hash.slice(-4)}]`;
}


