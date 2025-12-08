/**
 * References Section Detector
 * 
 * Detects and filters reference/bibliography sections in research papers.
 * Reference sections add noise to semantic search since they contain
 * many unrelated terms from cited works.
 * 
 * **Detection Strategy:**
 * - Identify "References", "Bibliography", "Works Cited" headers
 * - Track page numbers where references begin
 * - Mark or filter chunks from reference sections
 * 
 * @example
 * ```typescript
 * const detector = new ReferencesDetector();
 * const result = detector.detectReferencesStart(docs);
 * console.log(result.startsAtPage);  // 15
 * console.log(result.headerFound);   // "References"
 * 
 * // Filter out reference chunks
 * const filtered = detector.filterReferenceChunks(chunks, result);
 * ```
 */

import { Document } from "@langchain/core/documents";

/**
 * Result of references section detection.
 */
export interface ReferencesDetectionResult {
  /** Whether a references section was found */
  found: boolean;
  
  /** Page number where references start (1-indexed) */
  startsAtPage?: number;
  
  /** The header text that was matched */
  headerFound?: string;
  
  /** Character offset in the document where references start */
  startsAtOffset?: number;
  
  /** Confidence score 0-1 */
  confidence: number;
}

/**
 * Information about whether a chunk is from the references section.
 */
export interface ChunkReferenceInfo {
  /** Whether this chunk is from the references section */
  isReference: boolean;
  
  /** The chunk's page number */
  pageNumber: number;
  
  /** Whether this chunk contains citation entries */
  containsCitations: boolean;
}

/**
 * Detects reference/bibliography sections in research papers.
 */
export class ReferencesDetector {
  // Reference section header patterns (case insensitive)
  // Must be at start of line or after number (e.g., "7. References")
  private readonly REFERENCE_HEADERS = [
    /^(?:\d+\.?\s*)?references\s*$/im,
    /^(?:\d+\.?\s*)?bibliography\s*$/im,
    /^(?:\d+\.?\s*)?works\s+cited\s*$/im,
    /^(?:\d+\.?\s*)?cited\s+literature\s*$/im,
    /^(?:\d+\.?\s*)?literature\s+cited\s*$/im,
    /^(?:[ivx]+\.?\s*)?references\s*$/im,  // Roman numerals
  ];
  
  // Citation entry patterns (numbered or author-year)
  private readonly CITATION_ENTRY_PATTERNS = [
    // [1] Author, Title...
    /^\s*\[\d+\]\s+[A-Z]/m,
    // 1. Author, Title...
    /^\s*\d+\.\s+[A-Z][a-z]+,?\s+[A-Z]/m,
    // Author, A., Author, B. (Year)
    /^[A-Z][a-z]+,\s+[A-Z]\.,?\s+(?:and\s+)?[A-Z][a-z]+,?\s+[A-Z]\./m,
    // Author et al. (Year)
    /^[A-Z][a-z]+\s+et\s+al\.\s*\(\d{4}\)/m,
  ];
  
  // Patterns that indicate we're past the main content
  private readonly POST_CONTENT_INDICATORS = [
    /\bappendix\b/i,
    /\backnowledg(?:e)?ments?\b/i,
    /\bsupplementary\s+materials?\b/i,
  ];

  /**
   * Detect where the references section starts in a document.
   * 
   * @param docs - LangChain documents (one per page)
   * @returns Detection result with page number and confidence
   */
  detectReferencesStart(docs: Document[]): ReferencesDetectionResult {
    if (docs.length === 0) {
      return { found: false, confidence: 0 };
    }
    
    // Search from the back since references are typically at the end
    // But limit search to last 40% of document (references rarely start earlier)
    const searchStartPage = Math.floor(docs.length * 0.6);
    
    for (let i = searchStartPage; i < docs.length; i++) {
      const pageContent = docs[i].pageContent;
      const pageNumber = i + 1;  // 1-indexed
      
      // Check for reference headers
      for (const pattern of this.REFERENCE_HEADERS) {
        const match = pageContent.match(pattern);
        if (match) {
          // Verify this looks like a real references section
          // by checking for citation entries on this or next page
          const hasEntries = this.hasCitationEntries(pageContent) ||
            (i + 1 < docs.length && this.hasCitationEntries(docs[i + 1].pageContent));
          
          if (hasEntries) {
            return {
              found: true,
              startsAtPage: pageNumber,
              headerFound: match[0].trim(),
              startsAtOffset: match.index,
              confidence: 0.95
            };
          } else {
            // Header found but no entries - might be a false positive
            // Continue searching but remember this as fallback
            return {
              found: true,
              startsAtPage: pageNumber,
              headerFound: match[0].trim(),
              startsAtOffset: match.index,
              confidence: 0.6
            };
          }
        }
      }
    }
    
    // No explicit header found - try to detect by citation density
    // This handles papers where "References" is not on its own line
    for (let i = docs.length - 1; i >= searchStartPage; i--) {
      const pageContent = docs[i].pageContent;
      const citationDensity = this.calculateCitationDensity(pageContent);
      
      if (citationDensity > 0.3) {
        // High citation density - likely a references page
        // Walk backwards to find the start
        let startPage = i;
        while (startPage > searchStartPage) {
          const prevDensity = this.calculateCitationDensity(docs[startPage - 1].pageContent);
          if (prevDensity < 0.2) {
            break;  // Found transition from content to references
          }
          startPage--;
        }
        
        return {
          found: true,
          startsAtPage: startPage + 1,
          confidence: 0.7
        };
      }
    }
    
    return { found: false, confidence: 0 };
  }
  
  /**
   * Check if text contains citation entries.
   */
  private hasCitationEntries(text: string): boolean {
    let matchCount = 0;
    for (const pattern of this.CITATION_ENTRY_PATTERNS) {
      if (pattern.test(text)) {
        matchCount++;
      }
    }
    return matchCount >= 1;
  }
  
  /**
   * Calculate the density of citation-like entries in text.
   * Returns ratio of lines that look like citations.
   */
  private calculateCitationDensity(text: string): number {
    const lines = text.split('\n').filter(l => l.trim().length > 10);
    if (lines.length === 0) return 0;
    
    let citationLines = 0;
    for (const line of lines) {
      // Check if line looks like a citation entry
      if (/^\s*\[\d+\]/.test(line) ||  // [1] style
          /^\s*\d+\.\s+[A-Z]/.test(line) ||  // 1. Author style
          /^[A-Z][a-z]+,\s+[A-Z]\./.test(line) ||  // Author, A. style
          /\(\d{4}\)/.test(line) && /[A-Z][a-z]+/.test(line)) {  // Has year and name
        citationLines++;
      }
    }
    
    return citationLines / lines.length;
  }
  
  /**
   * Check if a chunk is from the references section.
   * 
   * @param chunk - The chunk to check
   * @param referencesStart - Result from detectReferencesStart
   * @returns Information about the chunk's reference status
   */
  isReferenceChunk(
    chunk: Document,
    referencesStart: ReferencesDetectionResult
  ): ChunkReferenceInfo {
    const pageNumber = chunk.metadata.page_number ?? 
                       chunk.metadata.loc?.pageNumber ?? 1;
    
    // If no references section found, nothing is a reference
    if (!referencesStart.found || !referencesStart.startsAtPage) {
      return {
        isReference: false,
        pageNumber,
        containsCitations: this.hasCitationEntries(chunk.pageContent)
      };
    }
    
    // Check if chunk is on or after the references start page
    const isReference = pageNumber >= referencesStart.startsAtPage;
    
    return {
      isReference,
      pageNumber,
      containsCitations: this.hasCitationEntries(chunk.pageContent)
    };
  }
  
  /**
   * Filter chunks to exclude reference section content.
   * 
   * @param chunks - All chunks from a document
   * @param referencesStart - Result from detectReferencesStart
   * @returns Chunks with reference sections removed
   */
  filterReferenceChunks(
    chunks: Document[],
    referencesStart: ReferencesDetectionResult
  ): Document[] {
    if (!referencesStart.found || !referencesStart.startsAtPage) {
      return chunks;
    }
    
    return chunks.filter(chunk => {
      const info = this.isReferenceChunk(chunk, referencesStart);
      return !info.isReference;
    });
  }
  
  /**
   * Mark chunks with reference section metadata instead of filtering.
   * Useful when you want to keep references but exclude from certain searches.
   * 
   * @param chunks - All chunks from a document
   * @param referencesStart - Result from detectReferencesStart
   * @returns Chunks with is_reference metadata added
   */
  markReferenceChunks(
    chunks: Document[],
    referencesStart: ReferencesDetectionResult
  ): Document[] {
    return chunks.map(chunk => {
      const info = this.isReferenceChunk(chunk, referencesStart);
      return new Document({
        pageContent: chunk.pageContent,
        metadata: {
          ...chunk.metadata,
          is_reference: info.isReference,
          contains_citations: info.containsCitations
        }
      });
    });
  }
  
  /**
   * Get statistics about references in a document.
   */
  getStats(
    docs: Document[],
    referencesStart: ReferencesDetectionResult
  ): {
    totalPages: number;
    referencePages: number;
    contentPages: number;
    referenceStartPage: number | null;
  } {
    const totalPages = docs.length;
    const referenceStartPage = referencesStart.startsAtPage ?? null;
    const referencePages = referenceStartPage 
      ? totalPages - referenceStartPage + 1 
      : 0;
    const contentPages = totalPages - referencePages;
    
    return {
      totalPages,
      referencePages,
      contentPages,
      referenceStartPage
    };
  }
}

/**
 * Singleton instance for convenience.
 */
export const referencesDetector = new ReferencesDetector();

/**
 * Convenience function to detect references start.
 */
export function detectReferencesStart(docs: Document[]): ReferencesDetectionResult {
  return referencesDetector.detectReferencesStart(docs);
}

/**
 * Convenience function to filter reference chunks.
 */
export function filterReferenceChunks(
  chunks: Document[],
  referencesStart: ReferencesDetectionResult
): Document[] {
  return referencesDetector.filterReferenceChunks(chunks, referencesStart);
}
