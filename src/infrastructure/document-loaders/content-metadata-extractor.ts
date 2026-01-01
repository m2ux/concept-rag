/**
 * Content-Based Metadata Extractor
 *
 * Extracts bibliographic metadata (title, author, year, publisher) from document
 * content when filename-based parsing yields incomplete results.
 *
 * Analyzes front matter (copyright pages, title pages) using pattern matching.
 * Each extracted field includes a confidence score (0.0-1.0).
 *
 * @example
 * ```typescript
 * const extractor = new ContentMetadataExtractor();
 * const metadata = await extractor.extract(frontMatterChunks);
 * console.log(metadata.author);      // "John Ousterhout"
 * console.log(metadata.confidence.author); // 0.9
 * ```
 */

/**
 * Chunk data structure matching what's stored in the database.
 * Includes ADR-0053 meta content classification fields.
 */
export interface ChunkData {
  text: string;
  page_number?: number;
  is_reference?: boolean;
  is_front_matter?: boolean;  // ADR-0053: Copyright, title page, preface
  is_toc?: boolean;           // ADR-0053: Table of contents entry
  is_meta_content?: boolean;  // ADR-0053: Aggregate flag
  catalog_title?: string;
  catalog_id?: number;
}

/**
 * Extracted metadata with confidence scores.
 */
export interface ExtractedMetadata {
  title?: string;
  author?: string;
  year?: number;
  publisher?: string;
  confidence: {
    title: number;
    author: number;
    year: number;
    publisher: number;
  };
}

/**
 * Internal match result with confidence.
 */
interface PatternMatch {
  value: string;
  confidence: number;
  source: string;
}

/**
 * Content-based metadata extractor using pattern matching.
 */
export class ContentMetadataExtractor {
  /**
   * Author patterns - ordered by specificity (higher confidence first).
   * Uses non-greedy matching and explicit boundaries to avoid over-matching.
   */
  private readonly AUTHOR_PATTERNS: Array<{
    pattern: RegExp;
    confidence: number;
    group: number;
  }> = [
    // "Copyright © YYYY by Author Name" - captures name after "by", allows initials with periods
    {
      pattern: /Copyright\s*©?\s*\d{4}\s+by\s+([A-Z][a-zA-Z]+(?:\s+[A-Z]\.?)?(?:\s+[A-Z][a-zA-Z'-]+)+)/i,
      confidence: 0.95,
      group: 1,
    },
    // "Copyright © YYYY Author Name" (no "by") - captures name after year
    {
      pattern: /Copyright\s*©?\s*\d{4}\s+([A-Z][a-zA-Z]+(?:\s+[A-Z]\.?)?(?:\s+[A-Z][a-zA-Z'-]+)+)/i,
      confidence: 0.93,
      group: 1,
    },
    // "by Author Name" at start of line - 2-4 capitalized words
    {
      pattern: /^by\s+([A-Z][a-zA-Z'-]+(?:\s+[A-Z]\.?)?(?:\s+[A-Z][a-zA-Z'-]+){1,3})/im,
      confidence: 0.9,
      group: 1,
    },
    // "Author: Name" explicit field
    {
      pattern: /Author[s]?:\s*([A-Z][a-zA-Z'-]+(?:\s+[A-Z]\.?)?(?:\s+[A-Z][a-zA-Z'-]+){1,3})/i,
      confidence: 0.9,
      group: 1,
    },
    // "Written by Name" - 2-4 capitalized words
    {
      pattern: /Written\s+by\s+([A-Z][a-zA-Z'-]+(?:\s+[A-Z]\.?)?(?:\s+[A-Z][a-zA-Z'-]+){1,3})/i,
      confidence: 0.85,
      group: 1,
    },
    // "by Author Name" inline (not "Published by") - more restrictive
    {
      pattern: /(?<!Published\s)\bby\s+([A-Z][a-zA-Z'-]+(?:\s+[A-Z]\.?)?(?:\s+[A-Z][a-zA-Z'-]+){1,3})/i,
      confidence: 0.8,
      group: 1,
    },
  ];

  /**
   * Year patterns - ordered by specificity.
   */
  private readonly YEAR_PATTERNS: Array<{
    pattern: RegExp;
    confidence: number;
    group: number;
  }> = [
    // "Copyright © YYYY" or "© YYYY"
    {
      pattern: /(?:Copyright\s*)?©\s*(\d{4})/i,
      confidence: 0.95,
      group: 1,
    },
    // "Copyright YYYY"
    {
      pattern: /Copyright\s+(\d{4})/i,
      confidence: 0.95,
      group: 1,
    },
    // "First published YYYY" or "Published YYYY"
    {
      pattern: /(?:First\s+)?[Pp]ublished(?:\s+in)?\s+(\d{4})/,
      confidence: 0.9,
      group: 1,
    },
    // "YYYY Edition"
    {
      pattern: /(\d{4})\s+Edition/i,
      confidence: 0.85,
      group: 1,
    },
    // "Printed in YYYY" or "Printed YYYY"
    {
      pattern: /Printed(?:\s+in\s+\w+)?\s+(\d{4})/i,
      confidence: 0.8,
      group: 1,
    },
    // Standalone year in copyright context (fallback)
    {
      pattern: /\b((?:19|20)\d{2})\b/,
      confidence: 0.5,
      group: 1,
    },
  ];

  /**
   * Publisher patterns.
   */
  private readonly PUBLISHER_PATTERNS: Array<{
    pattern: RegExp;
    confidence: number;
    group: number;
  }> = [
    // "Published by Publisher Name"
    {
      pattern: /Published\s+by\s+([A-Z][A-Za-z\s&,]+?)(?:\.|,|\n|$)/i,
      confidence: 0.95,
      group: 1,
    },
    // "Publisher: Name"
    {
      pattern: /Publisher:\s*([A-Z][A-Za-z\s&,]+?)(?:\.|,|\n|$)/i,
      confidence: 0.9,
      group: 1,
    },
    // Known publisher names
    {
      pattern:
        /(O'Reilly\s+Media|Addison[- ]Wesley|Pearson|Springer|Wiley|McGraw[- ]Hill|Packt|Manning|Pragmatic|Apress|Cambridge\s+University\s+Press|MIT\s+Press|Academic\s+Press|Prentice\s+Hall|Oxford\s+University\s+Press|No\s+Starch\s+Press)/i,
      confidence: 0.9,
      group: 1,
    },
  ];

  /**
   * Title patterns - used when title needs to be extracted from content.
   */
  private readonly TITLE_PATTERNS: Array<{
    pattern: RegExp;
    confidence: number;
    group: number;
  }> = [
    // Explicit title field
    {
      pattern: /Title:\s*([^\n]+)/i,
      confidence: 0.9,
      group: 1,
    },
    // Line before "by Author" pattern
    {
      pattern: /^([A-Z][A-Za-z\s:,'"-]+?)\s*\n\s*(?:by\s+[A-Z])/im,
      confidence: 0.85,
      group: 1,
    },
  ];

  /**
   * Extract metadata from document chunks.
   *
   * Analyzes front matter chunks for bibliographic information.
   * Uses ADR-0053 meta content classification when available:
   * - Prioritizes chunks tagged as `is_front_matter` (copyright, title pages)
   * - Skips ToC entries which contain noise
   * - Falls back to page-based heuristic (pages 1-10) for untagged chunks
   *
   * @param chunks - Array of chunk data from document front matter
   * @returns Extracted metadata with confidence scores
   */
  async extract(chunks: ChunkData[]): Promise<ExtractedMetadata> {
    const result: ExtractedMetadata = {
      confidence: {
        title: 0,
        author: 0,
        year: 0,
        publisher: 0,
      },
    };

    if (chunks.length === 0) {
      return result;
    }

    // Filter chunks: skip references and ToC entries (ADR-0053)
    // ToC entries match terms but provide no substantive metadata
    const filtered = chunks
      .filter((c) => !c.is_reference)
      .filter((c) => !c.is_toc);

    // Separate front matter chunks (ADR-0053) from page-based fallback
    const taggedFrontMatter = filtered.filter((c) => c.is_front_matter);
    const untaggedEarlyPages = filtered.filter(
      (c) => !c.is_front_matter && (!c.page_number || c.page_number <= 10)
    );

    // Prioritize tagged front matter, then early pages
    // Sort each group by page number
    const frontMatter = [
      ...taggedFrontMatter.sort((a, b) => (a.page_number || 0) - (b.page_number || 0)),
      ...untaggedEarlyPages.sort((a, b) => (a.page_number || 0) - (b.page_number || 0)),
    ];

    if (frontMatter.length === 0) {
      return result;
    }

    // Combine front matter text for pattern matching
    // Tagged front matter comes first, giving it priority in extraction
    const combinedText = frontMatter.map((c) => c.text).join("\n\n");

    // Extract each field
    const authorMatch = this.extractAuthor(combinedText);
    if (authorMatch) {
      result.author = this.cleanAuthorName(authorMatch.value);
      result.confidence.author = authorMatch.confidence;
    }

    const yearMatch = this.extractYear(combinedText);
    if (yearMatch) {
      const yearNum = parseInt(yearMatch.value, 10);
      if (yearNum >= 1900 && yearNum <= new Date().getFullYear() + 1) {
        result.year = yearNum;
        result.confidence.year = yearMatch.confidence;
      }
    }

    const publisherMatch = this.extractPublisher(combinedText);
    if (publisherMatch) {
      result.publisher = this.cleanPublisherName(publisherMatch.value);
      result.confidence.publisher = publisherMatch.confidence;
    }

    // Title extraction - only if we find it in content
    const titleMatch = this.extractTitle(combinedText);
    if (titleMatch) {
      result.title = titleMatch.value.trim();
      result.confidence.title = titleMatch.confidence;
    }

    return result;
  }

  /**
   * Extract author from text using pattern matching.
   */
  private extractAuthor(text: string): PatternMatch | null {
    for (const { pattern, confidence, group } of this.AUTHOR_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[group]) {
        const value = match[group].trim();
        // Validate: should be 2+ words, not too long
        const words = value.split(/\s+/).filter((w) => w.length > 0);
        if (words.length >= 2 && words.length <= 6 && value.length <= 60) {
          return { value, confidence, source: pattern.source };
        }
      }
    }
    return null;
  }

  /**
   * Extract year from text using pattern matching.
   */
  private extractYear(text: string): PatternMatch | null {
    // Process in pattern order (by confidence)
    for (const { pattern, confidence, group } of this.YEAR_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[group]) {
        const yearStr = match[group];
        const year = parseInt(yearStr, 10);
        // Validate year range
        if (year >= 1900 && year <= new Date().getFullYear() + 1) {
          return { value: yearStr, confidence, source: pattern.source };
        }
      }
    }
    return null;
  }

  /**
   * Extract publisher from text using pattern matching.
   */
  private extractPublisher(text: string): PatternMatch | null {
    for (const { pattern, confidence, group } of this.PUBLISHER_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[group]) {
        const value = match[group].trim();
        // Validate: reasonable length
        if (value.length >= 3 && value.length <= 80) {
          return { value, confidence, source: pattern.source };
        }
      }
    }
    return null;
  }

  /**
   * Extract title from text using pattern matching.
   */
  private extractTitle(text: string): PatternMatch | null {
    for (const { pattern, confidence, group } of this.TITLE_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[group]) {
        const value = match[group].trim();
        // Validate: reasonable length, not just numbers
        if (value.length >= 5 && value.length <= 200 && !/^\d+$/.test(value)) {
          return { value, confidence, source: pattern.source };
        }
      }
    }
    return null;
  }

  /**
   * Clean and normalize author name.
   */
  private cleanAuthorName(name: string): string {
    let cleaned = name
      // Normalize whitespace first
      .replace(/\s+/g, " ")
      .trim();

    // Remove trailing words that are not names (leaked text)
    // Stop at common boundary words (case-insensitive matching)
    const boundaryPatterns = [
      / Copyright\b/i,
      / Published\b/i,
      / All\b/i,
      / ISBN\b/i,
      / rights\b/i,
      / reserved\b/i,
      / and others\b/i,
      / and \d/i,
      / in \d/i,
      / et al/i,
      / Ph\.?D/i,
      / M\.?D\b/i,
    ];
    for (const pattern of boundaryPatterns) {
      const match = cleaned.match(pattern);
      if (match && match.index && match.index > 0) {
        cleaned = cleaned.substring(0, match.index);
      }
    }

    // Remove trailing punctuation
    cleaned = cleaned.replace(/[.,;:]+$/, "");

    // Remove common suffixes and partial matches
    cleaned = cleaned.replace(/\s+(Ph\.?D?\.?|M\.?D\.?|Jr\.?|Sr\.?)$/i, "");

    // Remove trailing "in" (from "written by Name in YYYY")
    cleaned = cleaned.replace(/\s+in$/i, "");

    // Remove trailing "Ph" (partial PhD match)
    cleaned = cleaned.replace(/\s+Ph$/i, "");

    return cleaned.trim();
  }

  /**
   * Clean and normalize publisher name.
   */
  private cleanPublisherName(name: string): string {
    return (
      name
        // Remove trailing punctuation
        .replace(/[.,;:]+$/, "")
        // Remove common suffixes
        .replace(/\s+(Inc\.?|Ltd\.?|LLC\.?|Publishing|Press)$/i, (match) => {
          // Keep "Press" but remove Inc/Ltd/LLC
          if (/Press/i.test(match)) return match;
          return "";
        })
        // Normalize whitespace
        .replace(/\s+/g, " ")
        .trim()
    );
  }
}

/**
 * Singleton instance for convenience.
 */
export const contentMetadataExtractor = new ContentMetadataExtractor();

/**
 * Convenience function for extraction.
 */
export async function extractContentMetadata(
  chunks: ChunkData[]
): Promise<ExtractedMetadata> {
  return contentMetadataExtractor.extract(chunks);
}

