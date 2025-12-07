/**
 * Paper Metadata Extractor
 * 
 * Extracts bibliographic metadata from research paper content.
 * Designed for LaTeX-generated PDFs which typically have well-structured
 * front matter but sparse PDF metadata.
 * 
 * **Extracted Fields:**
 * - Title (from first page header)
 * - Authors (with affiliations)
 * - Abstract
 * - Keywords
 * - Venue (journal/conference name)
 * - DOI/arXiv ID
 * 
 * @example
 * ```typescript
 * const extractor = new PaperMetadataExtractor();
 * const metadata = extractor.extract(docs);
 * console.log(metadata.title);    // "Smart Contract Security"
 * console.log(metadata.authors);  // ["Alice Smith", "Bob Jones"]
 * console.log(metadata.abstract); // "This paper presents..."
 * ```
 */

import { Document } from "@langchain/core/documents";

/**
 * Extracted paper metadata.
 */
export interface PaperMetadata {
  /** Paper title */
  title?: string;
  
  /** List of authors */
  authors?: string[];
  
  /** Abstract text */
  abstract?: string;
  
  /** Paper keywords */
  keywords?: string[];
  
  /** Publication venue (journal/conference) */
  venue?: string;
  
  /** DOI if found */
  doi?: string;
  
  /** ArXiv ID if found */
  arxivId?: string;
}

/**
 * Extracts metadata from research paper PDFs.
 */
export class PaperMetadataExtractor {
  // DOI pattern
  private readonly DOI_PATTERN = /\b(10\.\d{4,}\/[^\s,;]+)/;
  
  // ArXiv ID pattern
  private readonly ARXIV_PATTERN = /arxiv[:\s]*(\d{4}\.\d{4,5}(?:v\d+)?)/i;
  
  // Common venue patterns
  private readonly VENUE_PATTERNS = [
    // IEEE journals/conferences
    /IEEE\s+(?:Transactions\s+on\s+)?[A-Z][A-Za-z\s]+(?:\([A-Z]+\))?/,
    // ACM conferences/journals
    /ACM\s+[A-Za-z\s]+(?:Conference|Symposium|Journal|Transactions)/i,
    // arXiv preprint
    /arXiv\s*(?:preprint\s*)?(?:arXiv:)?\d{4}\.\d{4,5}/i,
    // Generic journal/conference
    /(?:Proceedings|Journal)\s+of\s+(?:the\s+)?[A-Za-z\s]+/i
  ];
  
  // Keywords section patterns
  private readonly KEYWORDS_PATTERNS = [
    /keywords?[:\s—–-]+([^\n]+)/i,
    /index\s+terms?[:\s—–-]+([^\n]+)/i,
    /key\s+words?[:\s—–-]+([^\n]+)/i
  ];

  /**
   * Extract metadata from paper documents.
   * 
   * @param docs - LangChain documents (one per page)
   * @returns Extracted metadata
   */
  extract(docs: Document[]): PaperMetadata {
    if (docs.length === 0) {
      return {};
    }
    
    // Get first few pages for extraction (metadata usually in first 2 pages)
    const firstPages = docs.slice(0, Math.min(3, docs.length)).map(d => d.pageContent);
    const frontMatter = firstPages.join('\n');
    const firstPage = firstPages[0] || '';
    
    const metadata: PaperMetadata = {};
    
    // Extract DOI
    metadata.doi = this.extractDoi(frontMatter);
    
    // Extract arXiv ID
    metadata.arxivId = this.extractArxivId(frontMatter);
    
    // Extract abstract
    metadata.abstract = this.extractAbstract(frontMatter);
    
    // Extract keywords
    metadata.keywords = this.extractKeywords(frontMatter);
    
    // Extract venue
    metadata.venue = this.extractVenue(frontMatter);
    
    // Extract title (from first page, before abstract)
    metadata.title = this.extractTitle(firstPage, metadata.abstract);
    
    // Extract authors (between title and abstract)
    metadata.authors = this.extractAuthors(firstPage, metadata.title, metadata.abstract);
    
    return metadata;
  }
  
  /**
   * Extract DOI from text.
   */
  private extractDoi(text: string): string | undefined {
    const match = text.match(this.DOI_PATTERN);
    if (match) {
      // Clean up trailing punctuation
      let doi = match[1];
      doi = doi.replace(/[.,;:)\]]+$/, '');
      return doi;
    }
    return undefined;
  }
  
  /**
   * Extract arXiv ID from text.
   */
  private extractArxivId(text: string): string | undefined {
    const match = text.match(this.ARXIV_PATTERN);
    return match ? match[1] : undefined;
  }
  
  /**
   * Extract abstract from text.
   */
  private extractAbstract(text: string): string | undefined {
    // Look for "Abstract" section
    const abstractMatch = text.match(
      /\babstract\b[:\s—–-]*\n?([\s\S]*?)(?=\n\s*(?:1\.?\s*)?(?:introduction|i\.\s*introduction|keywords?|index\s+terms?|categories|ccs\s+concepts?|\d+\s+introduction)\b|$)/i
    );
    
    if (abstractMatch && abstractMatch[1]) {
      let abstract = abstractMatch[1].trim();
      
      // Clean up: remove excessive whitespace, limit length
      abstract = abstract.replace(/\s+/g, ' ').trim();
      
      // Skip if too short (probably not a real abstract)
      if (abstract.length < 100) {
        return undefined;
      }
      
      // Limit to reasonable length
      if (abstract.length > 2000) {
        abstract = abstract.substring(0, 2000).trim();
        // Try to end at sentence boundary
        const lastPeriod = abstract.lastIndexOf('.');
        if (lastPeriod > 1500) {
          abstract = abstract.substring(0, lastPeriod + 1);
        }
      }
      
      return abstract;
    }
    
    return undefined;
  }
  
  /**
   * Extract keywords from text.
   */
  private extractKeywords(text: string): string[] | undefined {
    for (const pattern of this.KEYWORDS_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[1]) {
        // Split by common separators
        const keywords = match[1]
          .split(/[,;·•]/)
          .map(k => k.trim())
          .filter(k => k.length > 0 && k.length < 100)
          .filter(k => !/^\d+$/.test(k)); // Filter out numbers
        
        if (keywords.length > 0) {
          return keywords;
        }
      }
    }
    
    return undefined;
  }
  
  /**
   * Extract venue from text.
   */
  private extractVenue(text: string): string | undefined {
    // First check for explicit arXiv preprint
    if (/arXiv\s*(?:preprint|:)/i.test(text)) {
      return 'arXiv preprint';
    }
    
    // Try each venue pattern
    for (const pattern of this.VENUE_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const venue = match[0].trim();
        // Skip if it's just "arXiv" alone
        if (venue.toLowerCase() === 'arxiv') continue;
        return venue;
      }
    }
    
    // Check for copyright lines that indicate venue
    const copyrightMatch = text.match(
      /©\s*\d{4}\s+(?:IEEE|ACM|Springer|Elsevier|[A-Z][A-Za-z]+\s+(?:Inc|Ltd|Publishing))/i
    );
    if (copyrightMatch) {
      const org = copyrightMatch[0].replace(/©\s*\d{4}\s+/, '').trim();
      return org;
    }
    
    return undefined;
  }
  
  /**
   * Extract title from first page.
   * 
   * Heuristic: The title is usually the largest text on the first page,
   * appearing before the authors and abstract. In PDF text extraction,
   * it often appears as the first non-empty line(s).
   */
  private extractTitle(firstPage: string, abstract?: string): string | undefined {
    const lines = firstPage.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    if (lines.length === 0) {
      return undefined;
    }
    
    // Find where abstract starts (if known)
    let abstractStart = lines.length;
    if (abstract) {
      const abstractWords = abstract.split(' ').slice(0, 5).join(' ');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('abstract') || 
            lines[i].includes(abstractWords.substring(0, 30))) {
          abstractStart = i;
          break;
        }
      }
    }
    
    // Skip common header elements
    const skipPatterns = [
      /^arXiv:/i,
      /^preprint/i,
      /^\d{4}\.\d{4,5}/,  // ArXiv ID
      /^IEEE/i,
      /^ACM/i,
      /^proceedings/i,
      /^journal\s+of/i,
      /©\s*\d{4}/,  // Copyright
      /^vol\.\s*\d+/i,
      /^\d+\s*$/, // Page numbers
      /^http/i,
      /^doi:/i
    ];
    
    // Collect potential title lines (usually first 1-3 meaningful lines)
    const titleLines: string[] = [];
    let lineCount = 0;
    
    for (let i = 0; i < Math.min(abstractStart, 10); i++) {
      const line = lines[i];
      
      // Skip header elements
      if (skipPatterns.some(p => p.test(line))) {
        continue;
      }
      
      // Stop if we hit author-like content (email, affiliation)
      if (/@\w+\.\w+/.test(line) || 
          /\buniversity\b/i.test(line) ||
          /\bdepartment\b/i.test(line) ||
          /\binstitute\b/i.test(line)) {
        break;
      }
      
      // Stop if line looks like abstract start
      if (/^abstract\b/i.test(line)) {
        break;
      }
      
      // Add line to potential title
      titleLines.push(line);
      lineCount++;
      
      // Usually title is 1-3 lines max
      if (lineCount >= 3) {
        break;
      }
      
      // Stop if line ends with proper sentence ending (likely not title)
      if (/[.!?]\s*$/.test(line) && line.length > 50) {
        break;
      }
    }
    
    if (titleLines.length === 0) {
      return undefined;
    }
    
    // Join title lines
    let title = titleLines.join(' ').trim();
    
    // Clean up
    title = title.replace(/\s+/g, ' ');
    
    // Validate: title should be reasonable length and not look like metadata
    if (title.length < 10 || title.length > 500) {
      return undefined;
    }
    
    return title;
  }
  
  /**
   * Extract authors from first page.
   * 
   * Heuristic: Authors appear between title and abstract.
   */
  private extractAuthors(
    firstPage: string, 
    title?: string, 
    abstract?: string
  ): string[] | undefined {
    const lines = firstPage.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Find title end position
    let titleEnd = 0;
    if (title) {
      const titleWords = title.split(' ').slice(0, 5).join(' ');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(titleWords.substring(0, 20))) {
          titleEnd = i + 1;
          // Check if title spans multiple lines
          while (titleEnd < lines.length && 
                 title.includes(lines[titleEnd].substring(0, 10))) {
            titleEnd++;
          }
          break;
        }
      }
    }
    
    // Find abstract start position  
    let abstractStart = lines.length;
    if (abstract) {
      for (let i = titleEnd; i < lines.length; i++) {
        if (/^abstract\b/i.test(lines[i])) {
          abstractStart = i;
          break;
        }
      }
    }
    
    // Author region is between title end and abstract start
    const authorRegion = lines.slice(titleEnd, abstractStart).join('\n');
    
    // Extract author names using patterns
    const authors = this.parseAuthorNames(authorRegion);
    
    return authors.length > 0 ? authors : undefined;
  }
  
  /**
   * Parse author names from text.
   */
  private parseAuthorNames(text: string): string[] {
    const authors: string[] = [];
    
    // Remove affiliations (text in parentheses/brackets, superscripts)
    let cleanText = text
      .replace(/\([^)]*\)/g, ' ')  // Remove parenthetical
      .replace(/\[[^\]]*\]/g, ' ')  // Remove bracketed
      .replace(/\{[^}]*\}/g, ' ')   // Remove braced
      .replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰∗†‡§¶]/g, ' ')  // Remove superscripts
      .replace(/\d+/g, ' ')  // Remove numbers (affiliations)
      .replace(/\s+/g, ' ')
      .trim();
    
    // Skip lines that are clearly affiliations
    const affiliationKeywords = [
      'university', 'institute', 'department', 'school', 'college',
      'laboratory', 'lab', 'research', 'center', 'centre',
      '@', 'email', '.edu', '.ac.', '.org', '.com'
    ];
    
    // Split by common separators (comma, "and", newlines)
    const parts = cleanText
      .split(/(?:,|\band\b|\n)+/i)
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    for (const part of parts) {
      const lowerPart = part.toLowerCase();
      
      // Skip if contains affiliation keywords
      if (affiliationKeywords.some(kw => lowerPart.includes(kw))) {
        continue;
      }
      
      // Check if this looks like a name (contains at least 2 words, each starting with capital)
      const words = part.split(/\s+/);
      const nameWords = words.filter(w => 
        /^[A-Z][a-zA-Z]*$/.test(w) && w.length >= 2
      );
      
      if (nameWords.length >= 2) {
        const authorName = nameWords.join(' ');
        // Avoid duplicates
        if (!authors.some(a => a.toLowerCase() === authorName.toLowerCase())) {
          authors.push(authorName);
        }
      }
    }
    
    return authors;
  }
}

/**
 * Singleton instance for convenience.
 */
export const paperMetadataExtractor = new PaperMetadataExtractor();

/**
 * Convenience function for extraction.
 */
export function extractPaperMetadata(docs: Document[]): PaperMetadata {
  return paperMetadataExtractor.extract(docs);
}

