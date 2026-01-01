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
 * Known underscore-encoded characters.
 * Only these specific patterns are decoded to avoid false positives
 * (e.g., "_bar" should not decode as "º" + "r").
 */
const UNDERSCORE_ENCODINGS: Record<string, string> = {
    '20': ' ',   // space
    '2C': ',',   // comma
    '2F': '/',   // forward slash
    '26': '&',   // ampersand
    '27': "'",   // apostrophe
    '28': '(',   // opening parenthesis
    '29': ')',   // closing parenthesis
    '2B': '+',   // plus
    '3A': ':',   // colon
    '3B': ';',   // semicolon
    '3D': '=',   // equals
    '3F': '?',   // question mark
    '40': '@',   // at sign
    '5B': '[',   // opening bracket
    '5D': ']',   // closing bracket
};

/**
 * Decode URL-encoded characters in text.
 * Handles both standard percent encoding (%XX) and underscore encoding (_XX).
 * 
 * Only specific known patterns are decoded to avoid false positives where
 * underscore followed by letters (like "_bar") could be misinterpreted as
 * hex encoding.
 * 
 * Common encodings:
 * - _20 or %20 = space
 * - _3A or %3A = colon (:)
 * - _3B or %3B = semicolon (;)
 * - _2C or %2C = comma (,)
 * - _2F or %2F = forward slash (/)
 * - _26 or %26 = ampersand (&)
 * - _28 or %28 = opening parenthesis (
 * - _29 or %29 = closing parenthesis )
 * - _27 or %27 = apostrophe (')
 */
export function decodeUrlEncoding(text: string): string {
    // First handle underscore-style encoding (_XX)
    // Only decode known patterns to avoid false positives like _bar -> º + r
    let decoded = text.replace(/_([0-9A-Fa-f]{2})/g, (match, hex) => {
        const upperHex = hex.toUpperCase();
        if (UNDERSCORE_ENCODINGS[upperHex]) {
            return UNDERSCORE_ENCODINGS[upperHex];
        }
        return match; // Keep original if not a known encoding
    });
    
    // Then handle standard percent encoding (%XX)
    try {
        decoded = decodeURIComponent(decoded.replace(/%(?![0-9A-Fa-f]{2})/g, '%25'));
    } catch {
        // If decodeURIComponent fails, try manual replacement of common patterns
        decoded = decoded
            .replace(/%20/g, ' ')
            .replace(/%3A/gi, ':')
            .replace(/%3B/gi, ';')
            .replace(/%2C/gi, ',')
            .replace(/%2F/gi, '/')
            .replace(/%26/gi, '&')
            .replace(/%28/gi, '(')
            .replace(/%29/gi, ')')
            .replace(/%27/gi, "'");
    }
    
    return decoded;
}

/**
 * Normalize text by converting encoded characters and cleaning up whitespace.
 * - Decodes URL-encoded characters (both %XX and _XX formats)
 * - Converts remaining underscores to spaces
 * - Normalizes multiple spaces to single space
 * - Trims leading/trailing whitespace
 */
export function normalizeText(text: string): string {
    return decodeUrlEncoding(text)
        .replace(/_/g, ' ')        // Remaining underscores to spaces
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
        
        // Decode URL-encoded characters BEFORE checking for delimiters
        // This handles filenames like "Title_20--_20Author" which should become "Title -- Author"
        const decodedFilename = decodeUrlEncoding(filenameWithoutExt);
        
        // If no '--' delimiter found, use whole filename as title
        if (!decodedFilename.includes(' -- ')) {
            result.title = normalizeText(filenameWithoutExt);
            return result;
        }
        
        // Split by ' -- ' delimiter (with spaces around dashes)
        const parts = decodedFilename.split(' -- ').map(p => p.trim());
        
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

