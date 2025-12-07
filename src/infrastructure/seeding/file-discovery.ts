/**
 * File Discovery Utilities
 * 
 * Utilities for finding and filtering document files in a directory structure.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Default document file extensions supported by the seeding process.
 */
export const DEFAULT_DOCUMENT_EXTENSIONS = ['.pdf', '.epub', '.mobi'];

/**
 * Recursively find all document files in a directory.
 * 
 * Searches through all subdirectories for files with matching extensions.
 * 
 * @param dir - Root directory to search
 * @param extensions - File extensions to match (including dot, e.g., '.pdf')
 * @returns Array of absolute file paths
 */
export async function findDocumentFilesRecursively(
  dir: string,
  extensions: string[] = DEFAULT_DOCUMENT_EXTENSIONS
): Promise<string[]> {
  const documentFiles: string[] = [];

  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        const subDirDocs = await findDocumentFilesRecursively(fullPath, extensions);
        documentFiles.push(...subDirDocs);
      } else if (entry.isFile()) {
        const fileExt = path.extname(entry.name).toLowerCase();
        if (extensions.includes(fileExt)) {
          documentFiles.push(fullPath);
        }
      }
    }
  } catch (error: any) {
    console.warn(`⚠️ Error scanning directory ${dir}: ${error.message}`);
  }

  return documentFiles;
}

/**
 * Check if a path is a directory.
 * 
 * @param filePath - Path to check
 * @returns True if path is a directory
 */
export async function isDirectory(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.promises.stat(filePath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Get the size of a file or directory (recursively).
 * 
 * @param filePath - Path to file or directory
 * @returns Size in bytes
 */
export async function getPathSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.promises.stat(filePath);

    if (!stats.isDirectory()) {
      return stats.size;
    }

    // Recursively calculate directory size
    let totalSize = 0;
    const items = await fs.promises.readdir(filePath, { withFileTypes: true });

    for (const item of items) {
      const itemPath = path.join(filePath, item.name);

      if (item.isDirectory()) {
        totalSize += await getPathSize(itemPath);
      } else if (item.isFile()) {
        const itemStats = await fs.promises.stat(itemPath);
        totalSize += itemStats.size;
      }
    }

    return totalSize;
  } catch {
    return 0;
  }
}

/**
 * Format a file size in human-readable format.
 * 
 * @param sizeInBytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(2)} KB`;
  } else if (sizeInBytes < 1024 * 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  } else {
    return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

/**
 * Get the size of a database directory in human-readable format.
 * 
 * @param dbPath - Path to database directory
 * @returns Formatted size string or 'N/A' if unavailable
 */
export async function getDatabaseSize(dbPath: string): Promise<string> {
  try {
    const sizeInBytes = await getPathSize(dbPath);
    if (sizeInBytes === 0) {
      return 'N/A';
    }
    return formatFileSize(sizeInBytes);
  } catch {
    return 'N/A';
  }
}
