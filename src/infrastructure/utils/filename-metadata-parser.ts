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
 * Known URL-encoded characters (underscore format).
 * Only these specific encodings are decoded - arbitrary hex pairs are NOT decoded
 * to avoid corrupting text like "foo_bar" (where _ba would incorrectly decode as 0xBA).
 */
const UNDERSCORE_ENCODINGS: Record<string, string> = {
    '_20': ' ',   // space
    '_2C': ',',   // comma
    '_2F': '/',   // forward slash
    '_3A': ':',   // colon
    '_3B': ';',   // semicolon
    '_26': '&',   // ampersand
    '_27': "'",   // apostrophe
    '_28': '(',   // opening parenthesis
    '_29': ')',   // closing parenthesis
    '_2B': '+',   // plus
    '_3D': '=',   // equals
    '_3F': '?',   // question mark
    '_40': '@',   // at sign
    '_23': '#',   // hash
    '_25': '%',   // percent
    '_5B': '[',   // opening bracket
    '_5D': ']',   // closing bracket
    '_7B': '{',   // opening brace
    '_7D': '}',   // closing brace
};

/**
 * Decode URL-encoded characters in text.
 * Handles both standard percent encoding (%XX) and underscore encoding (_XX).
 * 
 * Only decodes known URL-encoded characters (whitelist approach) to avoid
 * incorrectly decoding text like "foo_bar" where "_ba" might look like hex.
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
    // First handle underscore-style encoding (_XX) using whitelist
    // Only decode known URL-encoded characters to avoid corrupting normal text
    let decoded = text.replace(/_([0-9A-Fa-f]{2})/gi, (match) => {
        const upper = match.toUpperCase();
        return UNDERSCORE_ENCODINGS[upper] ?? match;
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

