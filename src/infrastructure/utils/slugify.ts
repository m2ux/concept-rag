/**
 * Slugify Utilities
 * 
 * Functions for creating human-readable, filesystem-safe identifiers
 * from document metadata.
 */

export interface DocumentInfo {
  title: string;
  author?: string;
  year?: number | string;
  id?: number | string;  // Fallback for uniqueness
}

/**
 * Creates a human-readable folder name from document metadata.
 * 
 * Format: {author-surname}_{short-title}_{year}
 * 
 * Examples:
 *   - "martin_clean-architecture_2017"
 *   - "gamma_design-patterns-elements_1994"
 *   - "unknown_cosmos-blockchain_2023"
 * 
 * @param doc Document metadata
 * @returns Filesystem-safe folder name
 */
export function slugifyDocument(doc: DocumentInfo): string {
  const author = extractAuthorSurname(doc.author);
  const title = extractShortTitle(doc.title);
  const year = extractYear(doc.year);
  
  return `${author}_${title}_${year}`;
}

/**
 * Extracts the first author's surname, normalized for filesystem use.
 * 
 * @param author Full author string (e.g., "Robert C. Martin", "Gamma, Erich et al.")
 * @returns Lowercase surname, max 15 chars
 */
export function extractAuthorSurname(author?: string): string {
  if (!author || author.trim() === '') {
    return 'unknown';
  }
  
  // Handle "Surname, FirstName" format
  if (author.includes(',')) {
    const surname = author.split(',')[0].trim();
    return normalizeForFilesystem(surname, 15);
  }
  
  // Handle "FirstName Surname" format - take last word before any "et al."
  const cleaned = author
    .replace(/\s+et\s+al\.?/i, '')
    .replace(/\s+and\s+.*/i, '')
    .trim();
  
  const parts = cleaned.split(/\s+/);
  const surname = parts[parts.length - 1];
  
  return normalizeForFilesystem(surname, 15);
}

/**
 * Extracts a short, readable title slug.
 * 
 * @param title Full document title
 * @returns Kebab-case title, max 30 chars, 4 significant words
 */
export function extractShortTitle(title: string): string {
  if (!title || title.trim() === '') {
    return 'untitled';
  }
  
  const shortTitle = title
    // Remove subtitles after : ; – —
    .replace(/[:;–—].*/g, '')
    // Remove edition markers
    .replace(/\(\d+(?:st|nd|rd|th)?\s*(?:ed\.?|edition)\)/gi, '')
    .replace(/,?\s*\d+(?:st|nd|rd|th)?\s*(?:ed\.?|edition)/gi, '')
    // Remove leading articles
    .replace(/^(the|a|an)\s+/i, '')
    .trim();
  
  // Convert to words, filter, and join
  const words = shortTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0)
    .slice(0, 4);  // First 4 significant words
  
  const slug = words.join('-');
  
  // Truncate to 30 chars at word boundary
  if (slug.length <= 30) {
    return slug || 'untitled';
  }
  
  const truncated = slug.slice(0, 30);
  const lastDash = truncated.lastIndexOf('-');
  return lastDash > 10 ? truncated.slice(0, lastDash) : truncated;
}

/**
 * Extracts year from various formats.
 * 
 * @param year Year value (number, string, or undefined)
 * @returns 4-digit year string or "undated"
 */
export function extractYear(year?: number | string): string {
  if (!year) {
    return 'undated';
  }
  
  const yearStr = String(year);
  
  // Extract 4-digit year from string
  const match = yearStr.match(/\b(19|20)\d{2}\b/);
  if (match) {
    return match[0];
  }
  
  // If it's already a valid year number
  const yearNum = parseInt(yearStr, 10);
  if (yearNum >= 1900 && yearNum <= 2100) {
    return String(yearNum);
  }
  
  return 'undated';
}

/**
 * Normalizes a string for safe filesystem use.
 * 
 * @param str Input string
 * @param maxLength Maximum length
 * @returns Lowercase, alphanumeric string
 */
export function normalizeForFilesystem(str: string, maxLength: number): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, maxLength) || 'unknown';
}

/**
 * Creates a unique folder name, appending ID suffix if needed.
 * 
 * @param doc Document metadata
 * @param existingNames Set of already-used folder names
 * @returns Unique folder name
 */
export function slugifyDocumentUnique(
  doc: DocumentInfo, 
  existingNames: Set<string>
): string {
  const baseSlug = slugifyDocument(doc);
  
  if (!existingNames.has(baseSlug)) {
    return baseSlug;
  }
  
  // Append short ID suffix for uniqueness
  if (doc.id) {
    const idSuffix = String(doc.id).slice(-6);
    const uniqueSlug = `${baseSlug}_${idSuffix}`;
    if (!existingNames.has(uniqueSlug)) {
      return uniqueSlug;
    }
  }
  
  // Fallback: append counter
  let counter = 2;
  while (existingNames.has(`${baseSlug}_${counter}`)) {
    counter++;
  }
  return `${baseSlug}_${counter}`;
}

/**
 * Formats visual filename within a document folder.
 * 
 * @param pageNumber Page number in document
 * @param visualIndex Index of visual on that page (0-based)
 * @param extension File extension (default: 'png')
 * @returns Filename like "p042_v0.png"
 */
export function formatVisualFilename(
  pageNumber: number,
  visualIndex: number = 0,
  extension: string = 'png'
): string {
  const page = String(pageNumber).padStart(3, '0');
  return `p${page}_v${visualIndex}.${extension}`;
}

