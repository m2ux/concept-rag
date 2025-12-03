/**
 * Filename Metadata Parser
 * 
 * Parses bibliographic metadata from filenames using the '--' delimiter format.
 * Expected format: "Title -- Author -- Date -- Publisher -- ISBN -- Hash.ext"
 */

import * as path from 'path';

/**
 * Parsed bibliographic metadata from filename.
 */
export interface FilenameMetadata {
    title: string;
    author: string;
    year: number;
    publisher: string;
    isbn: string;
}

/**
 * Normalize text by converting encoded characters and underscores to spaces.
 * - Converts URL-encoded spaces (%20, _20) to spaces
 * - Converts underscores to spaces
 * - Normalizes multiple spaces to single space
 * - Trims leading/trailing whitespace
 */
export function normalizeText(text: string): string {
    return text
        .replace(/%20/g, ' ')      // URL-encoded space
        .replace(/_20/g, ' ')      // Alternative encoding (sometimes used)
        .replace(/_/g, ' ')        // Underscores to spaces
        .replace(/\s+/g, ' ')      // Multiple spaces to single
        .trim();
}

/**
 * Parse bibliographic metadata from filename using '--' delimiter format.
 * 
 * Expected format: "Title -- Author -- Date -- Publisher -- ISBN -- Hash.ext"
 * Example: "Effective software testing -- Elfriede Dustin -- December 18, 2002 -- Addison-Wesley -- 9780201794298 -- 5297d243816c0cae20024a3504eaabf0.pdf"
 * 
 * Fields are positional and optional. If a field is missing or cannot be parsed,
 * it will be empty/zero in the result.
 * 
 * @param sourcePath - Full path to the document file
 * @returns Parsed metadata object with empty defaults for missing fields
 */
export function parseFilenameMetadata(sourcePath: string): FilenameMetadata {
    const result: FilenameMetadata = {
        title: '',
        author: '',
        year: 0,
        publisher: '',
        isbn: ''
    };
    
    try {
        // Extract filename without extension
        const basename = path.basename(sourcePath);
        const extIndex = basename.lastIndexOf('.');
        const filenameWithoutExt = extIndex > 0 ? basename.slice(0, extIndex) : basename;
        
        // If no '--' delimiter found, use whole filename as title
        if (!filenameWithoutExt.includes(' -- ')) {
            result.title = normalizeText(filenameWithoutExt);
            return result;
        }
        
        // Split by ' -- ' delimiter (with spaces around dashes)
        const parts = filenameWithoutExt.split(' -- ').map(p => p.trim());
        
        if (parts.length === 0) {
            return result;
        }
        
        // Field positions (0-based):
        // 0: Title
        // 1: Author
        // 2: Date (parse year from it)
        // 3: Publisher
        // 4: ISBN
        // 5: Hash (ignored - we compute our own)
        
        // Title (required, position 0)
        if (parts[0]) {
            result.title = normalizeText(parts[0]);
        }
        
        // Author (position 1)
        if (parts.length > 1 && parts[1]) {
            result.author = normalizeText(parts[1]);
        }
        
        // Date -> Year (position 2)
        if (parts.length > 2 && parts[2]) {
            const dateStr = parts[2].trim();
            // Try to extract a 4-digit year from the date string
            const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/);
            if (yearMatch) {
                result.year = parseInt(yearMatch[0], 10);
            }
        }
        
        // Publisher (position 3)
        if (parts.length > 3 && parts[3]) {
            result.publisher = normalizeText(parts[3]);
        }
        
        // ISBN (position 4) - Don't normalize, preserve original format
        if (parts.length > 4 && parts[4]) {
            const isbnCandidate = parts[4].trim();
            // Validate it looks like an ISBN (10 or 13 digits, possibly with hyphens)
            const cleanIsbn = isbnCandidate.replace(/[-\s]/g, '');
            if (/^\d{10}(\d{3})?$/.test(cleanIsbn)) {
                result.isbn = isbnCandidate;
            }
        }
    } catch (error) {
        // On any parsing error, return defaults (empty fields)
        // Silently fail - caller should handle empty results
    }
    
    return result;
}
