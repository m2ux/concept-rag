/**
 * Meta Content Detector
 * 
 * Detects and classifies non-content sections in documents such as
 * table of contents, front matter, and back matter. These sections
 * add noise to semantic search since they contain terms without
 * substantive context.
 * 
 * **Detection Strategy:**
 * - Table of Contents: Pattern matching for "Title.....Page#" entries
 * - Front Matter: Keyword detection (Copyright, ISBN, Preface, etc.) + page position
 * - Back Matter: Keyword detection (Index, Glossary, Appendix) + page position
 * 
 * @example
 * ```typescript
 * const detector = new MetaContentDetector();
 * const analysis = detector.analyze(chunkText, pageNumber, totalPages);
 * console.log(analysis.isMetaContent);  // true
 * console.log(analysis.isToc);          // true
 * console.log(analysis.matchedPatterns); // ['toc_dotted_line']
 * ```
 */

import { Document } from "@langchain/core/documents";

/**
 * Result of meta content analysis for a chunk.
 */
export interface MetaContentAnalysis {
  /** Whether this chunk is a table of contents entry */
  isToc: boolean;
  
  /** Whether this chunk is from front matter (title page, copyright, preface, etc.) */
  isFrontMatter: boolean;
  
  /** Whether this chunk is from back matter (index, glossary, appendix) */
  isBackMatter: boolean;
  
  /** Aggregate: true if any of isToc, isFrontMatter, or isBackMatter is true */
  isMetaContent: boolean;
  
  /** Confidence score 0-1 */
  confidence: number;
  
  /** Which patterns were matched */
  matchedPatterns: string[];
}

/**
 * Document-level detection result for front/back matter boundaries.
 */
export interface DocumentMetaInfo {
  /** Estimated page where front matter ends (1-indexed) */
  frontMatterEndsAtPage?: number;
  
  /** Estimated page where back matter starts (1-indexed) */
  backMatterStartsAtPage?: number;
  
  /** Total pages in document */
  totalPages: number;
}

/**
 * Detects table of contents, front matter, and back matter in documents.
 */
export class MetaContentDetector {
  // ============================================
  // Table of Contents Patterns
  // ============================================
  
  /**
   * ToC entry patterns - dotted/spaced lines with page numbers
   * Examples:
   *   "Chapter 1: Introduction.............1"
   *   "1.2 Methods                       42"
   *   "Section 3...........................15"
   */
  private readonly TOC_LINE_PATTERNS = [
    // "Chapter N: Title.......Page" or "Chapter N Title.....Page"
    /^(?:chapter|section|part)\s+(?:\d+|[ivxlc]+)[.:]\s*.+?\.{3,}\s*\d+\s*$/im,
    // "N.N.N Title.........Page" (numbered sections)
    /^\d+(?:\.\d+)*\.?\s+.+?\.{3,}\s*\d+\s*$/m,
    // "Title          Page" (spaced, no dots, but has significant whitespace before number)
    /^[A-Z][A-Za-z\s,:'"-]{5,}\s{4,}\d+\s*$/m,
    // "N. Title.........Page"
    /^\d+\.\s+.+?\.{3,}\s*\d+\s*$/m,
  ];
  
  /**
   * ToC header patterns
   */
  private readonly TOC_HEADER_PATTERNS = [
    /^(?:table\s+of\s+)?contents?\s*$/im,
    /^brief\s+contents?\s*$/im,
    /^detailed\s+contents?\s*$/im,
  ];
  
  // ============================================
  // Front Matter Patterns
  // ============================================
  
  /**
   * Front matter section headers
   */
  private readonly FRONT_MATTER_HEADERS = [
    /^dedication\s*$/im,
    /^preface\s*$/im,
    /^foreword\s*$/im,
    /^acknowledg(?:e)?ments?\s*$/im,
    /^about\s+this\s+book\s*$/im,
    /^how\s+to\s+use\s+this\s+book\s*$/im,
    /^introduction\s+to\s+the\s+\w+\s+edition\s*$/im,
  ];
  
  /**
   * Copyright and publishing patterns
   */
  private readonly COPYRIGHT_PATTERNS = [
    /copyright\s*©?\s*\d{4}/i,
    /©\s*\d{4}/,
    /all\s+rights\s+reserved/i,
    /ISBN[:\s-]*[\d-]{10,}/i,
    /first\s+(?:published|edition|printing)/i,
    /printed\s+in\s+(?:the\s+)?(?:united\s+states|usa|uk|china)/i,
    /library\s+of\s+congress/i,
    /cataloging[- ]in[- ]publication/i,
  ];
  
  // ============================================
  // Back Matter Patterns
  // ============================================
  
  /**
   * Back matter section headers
   */
  private readonly BACK_MATTER_HEADERS = [
    /^index\s*$/im,
    /^glossary\s*$/im,
    /^appendix(?:\s+[a-z])?\s*$/im,
    /^about\s+the\s+author(?:s)?\s*$/im,
    /^bibliography\s*$/im,  // Can be back matter in books (vs references in papers)
    /^further\s+reading\s*$/im,
    /^resources?\s*$/im,
    /^colophon\s*$/im,
  ];
  
  /**
   * Index entry patterns (alphabetically organized entries with page numbers)
   */
  private readonly INDEX_ENTRY_PATTERNS = [
    // "term, 42" or "term, 42-45" or "term, 42, 56, 78"
    /^[a-zA-Z][a-zA-Z\s,'-]*,\s*\d+(?:[–-]\d+)?(?:,\s*\d+(?:[–-]\d+)?)*\s*$/m,
    // "term (see also related)" 
    /^[a-zA-Z][a-zA-Z\s,'-]*\s*\(see\s+(?:also\s+)?[^)]+\)/im,
  ];

  /**
   * Position thresholds for front/back matter detection
   */
  private readonly FRONT_MATTER_THRESHOLD = 0.15;  // First 15% of document
  private readonly BACK_MATTER_THRESHOLD = 0.85;   // Last 15% of document

  /**
   * Analyze a chunk for meta content indicators.
   * 
   * @param text - The chunk text content
   * @param pageNumber - Page number (1-indexed)
   * @param totalPages - Total pages in document
   * @returns Analysis result with classification and confidence
   */
  analyze(text: string, pageNumber: number, totalPages: number): MetaContentAnalysis {
    const matchedPatterns: string[] = [];
    let confidence = 0;
    
    // Check for ToC content
    const tocResult = this.detectTocContent(text);
    if (tocResult.isToc) {
      matchedPatterns.push(...tocResult.patterns);
      confidence = Math.max(confidence, tocResult.confidence);
    }
    
    // Check for front matter
    const frontResult = this.detectFrontMatter(text, pageNumber, totalPages);
    if (frontResult.isFrontMatter) {
      matchedPatterns.push(...frontResult.patterns);
      confidence = Math.max(confidence, frontResult.confidence);
    }
    
    // Check for back matter
    const backResult = this.detectBackMatter(text, pageNumber, totalPages);
    if (backResult.isBackMatter) {
      matchedPatterns.push(...backResult.patterns);
      confidence = Math.max(confidence, backResult.confidence);
    }
    
    const isMetaContent = tocResult.isToc || frontResult.isFrontMatter || backResult.isBackMatter;
    
    return {
      isToc: tocResult.isToc,
      isFrontMatter: frontResult.isFrontMatter,
      isBackMatter: backResult.isBackMatter,
      isMetaContent,
      confidence: isMetaContent ? confidence : 0,
      matchedPatterns
    };
  }
  
  /**
   * Detect table of contents content.
   */
  private detectTocContent(text: string): { isToc: boolean; confidence: number; patterns: string[] } {
    const patterns: string[] = [];
    let score = 0;
    
    // Check for ToC header
    for (const pattern of this.TOC_HEADER_PATTERNS) {
      if (pattern.test(text)) {
        patterns.push('toc_header');
        score += 0.5;
        break;
      }
    }
    
    // Check for ToC line patterns
    const lines = text.split('\n');
    let tocLineCount = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length < 5) continue;
      
      for (const pattern of this.TOC_LINE_PATTERNS) {
        if (pattern.test(trimmed)) {
          tocLineCount++;
          break;
        }
      }
    }
    
    // High density of ToC-like lines indicates ToC content
    const nonEmptyLines = lines.filter(l => l.trim().length > 0).length;
    if (nonEmptyLines > 0) {
      const tocDensity = tocLineCount / nonEmptyLines;
      
      if (tocDensity >= 0.5) {
        patterns.push('toc_high_density');
        score += 0.6;
      } else if (tocDensity >= 0.3 && tocLineCount >= 3) {
        patterns.push('toc_medium_density');
        score += 0.4;
      } else if (tocLineCount >= 2) {
        patterns.push('toc_some_entries');
        score += 0.2;
      }
    }
    
    const isToc = score >= 0.4;
    
    return {
      isToc,
      confidence: Math.min(score, 1.0),
      patterns
    };
  }
  
  /**
   * Detect front matter content.
   */
  private detectFrontMatter(
    text: string, 
    pageNumber: number, 
    totalPages: number
  ): { isFrontMatter: boolean; confidence: number; patterns: string[] } {
    const patterns: string[] = [];
    let score = 0;
    
    // Position check: front matter should be in first portion of document
    const positionRatio = pageNumber / totalPages;
    const inFrontPosition = positionRatio <= this.FRONT_MATTER_THRESHOLD;
    
    // Check for front matter headers
    for (const pattern of this.FRONT_MATTER_HEADERS) {
      if (pattern.test(text)) {
        patterns.push('front_matter_header');
        score += 0.6;
        break;
      }
    }
    
    // Check for copyright/publishing patterns
    let copyrightMatches = 0;
    for (const pattern of this.COPYRIGHT_PATTERNS) {
      if (pattern.test(text)) {
        copyrightMatches++;
      }
    }
    
    if (copyrightMatches >= 2) {
      patterns.push('copyright_multiple');
      score += 0.7;
    } else if (copyrightMatches === 1) {
      patterns.push('copyright_single');
      score += 0.4;
    }
    
    // Position bonus if in front portion
    if (inFrontPosition && score > 0) {
      patterns.push('front_position');
      score += 0.2;
    }
    
    // Strong position-based detection for very early pages
    if (pageNumber <= 3 && copyrightMatches >= 1) {
      score += 0.2;
    }
    
    const isFrontMatter = score >= 0.5;
    
    return {
      isFrontMatter,
      confidence: Math.min(score, 1.0),
      patterns
    };
  }
  
  /**
   * Detect back matter content.
   */
  private detectBackMatter(
    text: string, 
    pageNumber: number, 
    totalPages: number
  ): { isBackMatter: boolean; confidence: number; patterns: string[] } {
    const patterns: string[] = [];
    let score = 0;
    
    // Position check: back matter should be in last portion of document
    const positionRatio = pageNumber / totalPages;
    const inBackPosition = positionRatio >= this.BACK_MATTER_THRESHOLD;
    
    // Check for back matter headers
    for (const pattern of this.BACK_MATTER_HEADERS) {
      if (pattern.test(text)) {
        patterns.push('back_matter_header');
        score += 0.6;
        break;
      }
    }
    
    // Check for index entry patterns
    const lines = text.split('\n');
    let indexEntryCount = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length < 3) continue;
      
      for (const pattern of this.INDEX_ENTRY_PATTERNS) {
        if (pattern.test(trimmed)) {
          indexEntryCount++;
          break;
        }
      }
    }
    
    // High density of index-like entries
    const nonEmptyLines = lines.filter(l => l.trim().length > 0).length;
    if (nonEmptyLines > 0) {
      const indexDensity = indexEntryCount / nonEmptyLines;
      
      if (indexDensity >= 0.4) {
        patterns.push('index_high_density');
        score += 0.5;
      } else if (indexDensity >= 0.2 && indexEntryCount >= 3) {
        patterns.push('index_medium_density');
        score += 0.3;
      }
    }
    
    // Position bonus if in back portion
    if (inBackPosition && score > 0) {
      patterns.push('back_position');
      score += 0.2;
    }
    
    const isBackMatter = score >= 0.5;
    
    return {
      isBackMatter,
      confidence: Math.min(score, 1.0),
      patterns
    };
  }
  
  /**
   * Analyze a batch of chunks from a document.
   * Adds meta content metadata to each chunk's metadata.
   * 
   * @param chunks - LangChain documents (chunks)
   * @param totalPages - Total pages in the source document
   */
  markMetaContentChunks(chunks: Document[], totalPages: number): void {
    for (const chunk of chunks) {
      const pageNumber = chunk.metadata.page_number ?? 
                         chunk.metadata.loc?.pageNumber ?? 1;
      
      const analysis = this.analyze(chunk.pageContent, pageNumber, totalPages);
      
      chunk.metadata.is_toc = analysis.isToc;
      chunk.metadata.is_front_matter = analysis.isFrontMatter;
      chunk.metadata.is_back_matter = analysis.isBackMatter;
      chunk.metadata.is_meta_content = analysis.isMetaContent;
    }
  }
  
  /**
   * Get statistics about meta content in chunks.
   */
  getStats(chunks: Document[]): {
    total: number;
    tocChunks: number;
    frontMatterChunks: number;
    backMatterChunks: number;
    metaContentChunks: number;
  } {
    let tocChunks = 0;
    let frontMatterChunks = 0;
    let backMatterChunks = 0;
    let metaContentChunks = 0;
    
    for (const chunk of chunks) {
      if (chunk.metadata.is_toc) tocChunks++;
      if (chunk.metadata.is_front_matter) frontMatterChunks++;
      if (chunk.metadata.is_back_matter) backMatterChunks++;
      if (chunk.metadata.is_meta_content) metaContentChunks++;
    }
    
    return {
      total: chunks.length,
      tocChunks,
      frontMatterChunks,
      backMatterChunks,
      metaContentChunks
    };
  }
}

/**
 * Singleton instance for convenience.
 */
export const metaContentDetector = new MetaContentDetector();

/**
 * Convenience function for single chunk analysis.
 */
export function analyzeMetaContent(
  text: string, 
  pageNumber: number, 
  totalPages: number
): MetaContentAnalysis {
  return metaContentDetector.analyze(text, pageNumber, totalPages);
}

/**
 * Convenience function to mark chunks with meta content metadata.
 */
export function markMetaContentChunks(chunks: Document[], totalPages: number): void {
  metaContentDetector.markMetaContentChunks(chunks, totalPages);
}

