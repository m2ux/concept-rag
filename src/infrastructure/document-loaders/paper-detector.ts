/**
 * Paper Detection Heuristics
 * 
 * Determines whether a document is likely a research paper vs. a book
 * using multiple signals from content, metadata, and filename.
 * 
 * **Detection Signals:**
 * - Page count (papers typically <50 pages)
 * - Presence of "Abstract" section
 * - Citation patterns ([1], [2] style references)
 * - Filename patterns (arXiv ID, DOI)
 * - Section headings (Introduction, Methods, Results, Conclusion)
 * - Author affiliation patterns
 * 
 * @example
 * ```typescript
 * const detector = new PaperDetector();
 * const result = detector.detect(docs, filename, pdfMetadata);
 * console.log(result.documentType); // 'paper' | 'book' | 'article' | 'unknown'
 * console.log(result.confidence);   // 0.85
 * console.log(result.signals);      // ['page_count', 'has_abstract', ...]
 * ```
 */

import { Document } from "@langchain/core/documents";

/**
 * Result of document type detection.
 */
export interface DocumentTypeInfo {
  /** Classified document type */
  documentType: 'book' | 'paper' | 'article' | 'unknown';
  
  /** Confidence score 0-1 */
  confidence: number;
  
  /** Signals that contributed to this classification */
  signals: string[];
  
  /** Detected arXiv ID if present in filename */
  arxivId?: string;
  
  /** Detected DOI if present in filename or content */
  doi?: string;
}

/**
 * Detection signal with weight and match indicator.
 */
interface DetectionSignal {
  name: string;
  weight: number;
  matched: boolean;
  value?: string | number;
}

/**
 * Detects document type (book vs paper) using multiple heuristics.
 */
export class PaperDetector {
  // ArXiv ID pattern: YYMM.NNNNN or YYMM.NNNNNvN
  private readonly ARXIV_PATTERN = /^(\d{4}\.\d{4,5})(v\d+)?$/;
  
  // DOI pattern in filename (hyphens instead of slashes)
  private readonly DOI_FILENAME_PATTERN = /^10\.\d{4,}-[^\s]+$/;
  
  // DOI pattern in content
  private readonly DOI_CONTENT_PATTERN = /\b(10\.\d{4,}\/[^\s]+)\b/;
  
  // Citation patterns: [1], [2, 3], (Author, 2020), etc.
  private readonly BRACKET_CITATION_PATTERN = /\[\d+(?:,\s*\d+)*\]/g;
  private readonly AUTHOR_YEAR_CITATION_PATTERN = /\([A-Z][a-z]+(?:\s+(?:et\s+al\.|and\s+[A-Z][a-z]+))?,\s*\d{4}\)/g;
  
  // Academic section headings (case insensitive)
  private readonly ACADEMIC_SECTIONS = [
    /\babstract\b/i,
    /\bintroduction\b/i,
    /\brelated\s+work\b/i,
    /\bmethodology?\b/i,
    /\bmethods?\b/i,
    /\bresults?\b/i,
    /\bdiscussion\b/i,
    /\bconclusions?\b/i,
    /\breferences\b/i,
    /\backnowledg(?:e)?ments?\b/i,
    /\bappendix\b/i
  ];
  
  // Book chapter patterns
  private readonly BOOK_PATTERNS = [
    /\bchapter\s+\d+/i,
    /\bpart\s+(?:one|two|three|four|five|i{1,3}|iv|v)/i,
    /\btable\s+of\s+contents\b/i,
    /\bpreface\b/i,
    /\bforeword\b/i,
    /\bepilogue\b/i,
    /\bindex\b/i
  ];

  /**
   * Detect document type using multiple heuristics.
   * 
   * @param docs - LangChain documents (one per page)
   * @param filename - Original filename
   * @param pdfMetadata - PDF metadata dictionary (optional)
   * @returns Document type classification with confidence
   */
  detect(
    docs: Document[],
    filename: string,
    pdfMetadata?: any
  ): DocumentTypeInfo {
    const signals: DetectionSignal[] = [];
    let arxivId: string | undefined;
    let doi: string | undefined;
    
    // 1. Check filename for arXiv ID
    const filenameWithoutExt = this.removeExtension(filename);
    const arxivMatch = filenameWithoutExt.match(this.ARXIV_PATTERN);
    if (arxivMatch) {
      arxivId = arxivMatch[0];
      signals.push({ name: 'arxiv_filename', weight: 0.9, matched: true, value: arxivId });
    }
    
    // 2. Check filename for DOI pattern
    const doiFilenameMatch = filenameWithoutExt.match(this.DOI_FILENAME_PATTERN);
    if (doiFilenameMatch) {
      doi = doiFilenameMatch[0].replace(/-/g, '/');
      signals.push({ name: 'doi_filename', weight: 0.85, matched: true, value: doi });
    }
    
    // 3. Check page count
    const pageCount = docs.length;
    if (pageCount > 0 && pageCount <= 30) {
      signals.push({ name: 'short_page_count', weight: 0.6, matched: true, value: pageCount });
    } else if (pageCount > 30 && pageCount <= 60) {
      signals.push({ name: 'medium_page_count', weight: 0.3, matched: true, value: pageCount });
    } else if (pageCount > 100) {
      signals.push({ name: 'long_page_count', weight: 0.7, matched: false, value: pageCount });
    }
    
    // Get first few pages for content analysis
    const firstPages = docs.slice(0, Math.min(5, docs.length));
    const firstPagesText = firstPages.map(d => d.pageContent).join('\n');
    const allText = docs.map(d => d.pageContent).join('\n');
    
    // 4. Check for abstract section
    if (/\babstract\b/i.test(firstPagesText)) {
      signals.push({ name: 'has_abstract', weight: 0.7, matched: true });
    }
    
    // 5. Count academic section headings
    let academicSectionCount = 0;
    for (const pattern of this.ACADEMIC_SECTIONS) {
      if (pattern.test(allText)) {
        academicSectionCount++;
      }
    }
    if (academicSectionCount >= 4) {
      signals.push({ name: 'academic_sections', weight: 0.6, matched: true, value: academicSectionCount });
    }
    
    // 6. Check for citation patterns
    const bracketCitations = (allText.match(this.BRACKET_CITATION_PATTERN) || []).length;
    const authorYearCitations = (allText.match(this.AUTHOR_YEAR_CITATION_PATTERN) || []).length;
    const totalCitations = bracketCitations + authorYearCitations;
    
    if (totalCitations >= 10) {
      signals.push({ name: 'many_citations', weight: 0.5, matched: true, value: totalCitations });
    } else if (totalCitations >= 3) {
      signals.push({ name: 'some_citations', weight: 0.3, matched: true, value: totalCitations });
    }
    
    // 7. Check for book patterns
    let bookPatternCount = 0;
    for (const pattern of this.BOOK_PATTERNS) {
      if (pattern.test(allText)) {
        bookPatternCount++;
      }
    }
    if (bookPatternCount >= 2) {
      signals.push({ name: 'book_patterns', weight: 0.7, matched: false, value: bookPatternCount });
    }
    
    // 8. Check for DOI in content (first pages)
    if (!doi) {
      const doiContentMatch = firstPagesText.match(this.DOI_CONTENT_PATTERN);
      if (doiContentMatch) {
        doi = doiContentMatch[1];
        signals.push({ name: 'doi_in_content', weight: 0.7, matched: true, value: doi });
      }
    }
    
    // 9. Check PDF metadata for academic indicators
    if (pdfMetadata) {
      const pdfInfo = pdfMetadata.info || pdfMetadata;
      
      // Check for DOI in subject/description
      if (pdfInfo.Subject && /10\.\d{4,}/.test(pdfInfo.Subject)) {
        if (!doi) {
          const doiMatch = pdfInfo.Subject.match(/10\.\d{4,}\/[^\s;]+/);
          if (doiMatch) doi = doiMatch[0];
        }
        signals.push({ name: 'doi_in_pdf_metadata', weight: 0.8, matched: true });
      }
      
      // Check for academic keywords
      if (pdfInfo.Keywords) {
        signals.push({ name: 'has_keywords', weight: 0.4, matched: true });
      }
      
      // Check for journal/conference in producer/creator
      const producer = (pdfInfo.Producer || '').toLowerCase();
      const creator = (pdfInfo.Creator || '').toLowerCase();
      if (producer.includes('latex') || creator.includes('latex')) {
        signals.push({ name: 'latex_generated', weight: 0.6, matched: true });
      }
    }
    
    // 10. Check for author affiliations pattern (email, university)
    const affiliationPatterns = [
      /@[a-z]+\.(edu|ac\.[a-z]+)/i,  // Academic email
      /\buniversity\b/i,
      /\binstitute\b/i,
      /\bdepartment\s+of\b/i
    ];
    let hasAffiliations = false;
    for (const pattern of affiliationPatterns) {
      if (pattern.test(firstPagesText)) {
        hasAffiliations = true;
        break;
      }
    }
    if (hasAffiliations) {
      signals.push({ name: 'author_affiliations', weight: 0.5, matched: true });
    }
    
    // Calculate final score
    return this.calculateResult(signals, arxivId, doi, allText, pageCount, pdfMetadata);
  }
  
  /**
   * Calculate document type from weighted signals.
   */
  private calculateResult(
    signals: DetectionSignal[],
    arxivId: string | undefined,
    doi: string | undefined,
    allText: string,
    pageCount: number,
    pdfMetadata?: any
  ): DocumentTypeInfo {
    // Sum up paper-positive and paper-negative weights
    let paperScore = 0;
    let bookScore = 0;
    const matchedSignals: string[] = [];
    
    for (const signal of signals) {
      if (signal.matched) {
        paperScore += signal.weight;
        matchedSignals.push(signal.name);
      } else {
        // Negative signal (indicates book)
        bookScore += signal.weight;
        matchedSignals.push(`!${signal.name}`);
      }
    }
    
    // Normalize to confidence score
    const totalWeight = paperScore + bookScore;
    const paperConfidence = totalWeight > 0 ? paperScore / totalWeight : 0.5;
    
    // Check for professional article characteristics (magazines, trade publications)
    const isArticle = this.detectArticle(allText, pageCount);
    
    // Check for book characteristics
    const isBook = this.detectBook(allText, pageCount, pdfMetadata);
    
    // Determine document type
    let documentType: 'book' | 'paper' | 'article' | 'unknown';
    let confidence: number;
    
    if (isArticle.isArticle) {
      // Professional article detected (IEEE Software, CACM, etc.)
      documentType = 'article';
      confidence = isArticle.confidence;
      matchedSignals.push(...isArticle.signals);
    } else if (isBook.isBook && !arxivId && !doi) {
      // Book detected (only if no strong paper signals like DOI/ArXiv)
      documentType = 'book';
      confidence = isBook.confidence;
      matchedSignals.push(...isBook.signals);
    } else if (arxivId || doi) {
      // Strong signal: definitely a paper
      documentType = 'paper';
      confidence = Math.max(0.85, paperConfidence);
    } else if (paperConfidence >= 0.65) {
      documentType = 'paper';
      confidence = paperConfidence;
    } else if (paperConfidence <= 0.35 || isBook.confidence > 0.3) {
      // Weak paper signals or some book signals - likely a book
      documentType = 'book';
      confidence = Math.max(1 - paperConfidence, isBook.confidence);
      if (isBook.signals.length > 0) {
        matchedSignals.push(...isBook.signals);
      }
    } else {
      // Borderline - can't determine with confidence
      documentType = 'unknown';
      confidence = 0.5;
    }
    
    return {
      documentType,
      confidence: Math.round(confidence * 100) / 100,
      signals: matchedSignals,
      arxivId,
      doi
    };
  }
  
  /**
   * Detect if document is a professional article.
   * 
   * Professional articles have distinct characteristics:
   * - Published in trade magazines (IEEE Software, CACM, etc.)
   * - Short (typically 2-8 pages)
   * - Column/Editor format
   * - No formal "Abstract" section
   * - Conversational tone, fewer citations
   */
  private detectArticle(
    fullText: string, 
    pageCount: number
  ): { isArticle: boolean; confidence: number; signals: string[] } {
    const signals: string[] = [];
    let score = 0;
    
    // Article publication patterns - only match in first 500 chars (masthead area)
    const firstText = fullText.substring(0, 500);
    
    const articlePatterns = [
      // Trade magazine mastheads
      { pattern: /IEEE\s+SOFTWARE/i, weight: 0.5, name: 'ieee_software', text: firstText },
      { pattern: /IEEE\s+Computer(?!\s+Society)/i, weight: 0.5, name: 'ieee_computer', text: firstText },
      { pattern: /IEEE\s+Spectrum/i, weight: 0.5, name: 'ieee_spectrum', text: firstText },
      { pattern: /Communications\s+of\s+the\s+ACM/i, weight: 0.5, name: 'cacm', text: firstText },
      { pattern: /ACM\s+Queue/i, weight: 0.5, name: 'acm_queue', text: firstText },
      { pattern: /Dr\.\s*Dobb/i, weight: 0.5, name: 'dr_dobbs', text: firstText },
      // Column format indicators
      { pattern: /\bPRAGMATIC\s+DESIGNER\b/i, weight: 0.4, name: 'column_pragmatic', text: firstText },
      { pattern: /Editor:\s*[A-Z][a-z]+\s+[A-Z][a-z]+/i, weight: 0.4, name: 'editor_format', text: firstText },
      // Publisher masthead
      { pattern: /PUBLISHED\s+BY\s+THE\s+IEEE\s+COMPUTER\s+SOCIETY/i, weight: 0.5, name: 'ieee_cs_published', text: firstText },
    ];
    
    for (const { pattern, weight, name, text } of articlePatterns) {
      if (pattern.test(text)) {
        score += weight;
        signals.push(`article_${name}`);
      }
    }
    
    // Short page count is typical for articles
    if (pageCount >= 2 && pageCount <= 8) {
      score += 0.2;
      signals.push('article_short');
    }
    
    // No abstract is common in articles
    if (!/\bABSTRACT\b/i.test(fullText.substring(0, 3000))) {
      score += 0.1;
      signals.push('article_no_abstract');
    }
    
    // Articles often have fewer formal citations
    const citationCount = (fullText.match(/\[\d+\]/g) || []).length;
    if (citationCount < 10) {
      score += 0.1;
      signals.push('article_few_citations');
    }
    
    // Require at least one strong article signal
    const hasStrongSignal = signals.some(s => 
      s.includes('ieee_software') || 
      s.includes('cacm') || 
      s.includes('acm_queue') ||
      s.includes('editor_format') ||
      s.includes('ieee_cs_published')
    );
    
    const isArticle = hasStrongSignal && score >= 0.4;
    const confidence = Math.min(1.0, score);
    
    return { isArticle, confidence, signals };
  }
  
  /**
   * Detect if document is a book.
   * 
   * Books have distinct characteristics:
   * - Long (typically 100+ pages)
   * - Chapter structure (Chapter 1, Chapter 2, etc.)
   * - Table of Contents, Preface, Index
   * - ISBN in content or metadata
   * - Publisher information
   * - Copyright notices
   */
  private detectBook(
    fullText: string, 
    pageCount: number,
    pdfMetadata?: any
  ): { isBook: boolean; confidence: number; signals: string[] } {
    const signals: string[] = [];
    let score = 0;
    
    // ISBN patterns (ISBN-10 and ISBN-13)
    const isbnPattern = /ISBN[:\s-]*(?:13[:\s-]*)?(?:978|979)?[\d\s-]{10,17}/i;
    if (isbnPattern.test(fullText)) {
      score += 0.6;
      signals.push('book_isbn');
    }
    
    // Check PDF metadata for ISBN
    if (pdfMetadata?.info) {
      const metaStr = JSON.stringify(pdfMetadata.info).toLowerCase();
      if (metaStr.includes('isbn')) {
        score += 0.4;
        signals.push('book_isbn_metadata');
      }
    }
    
    // Publisher patterns - ONLY check first 10% (title/copyright page)
    // NOT the last 10% because references sections cite publishers
    const firstPart = fullText.substring(0, Math.min(5000, fullText.length * 0.1));
    
    // Publisher patterns with context - need "published by", "©", or standalone publisher name
    const publisherPatterns = [
      /(?:published\s+by\s+)?O'Reilly\s+Media/i,
      /(?:published\s+by\s+)?Packt\s+Publishing/i,
      /(?:published\s+by\s+)?Manning\s+Publications/i,
      /(?:published\s+by\s+)?Apress/i,
      /(?:©|published\s+by)\s*Springer/i,  // Require context for Springer (commonly cited)
      /(?:published\s+by\s+)?Addison[- ]Wesley/i,
      /(?:©|published\s+by)\s*Pearson/i,
      /(?:©|published\s+by)\s*(?:John\s+)?Wiley/i,
      /(?:published\s+by\s+)?McGraw[- ]Hill/i,
      /(?:published\s+by\s+)?Cambridge\s+University\s+Press/i,
      /(?:published\s+by\s+)?Oxford\s+University\s+Press/i,
      /(?:published\s+by\s+)?MIT\s+Press/i,
      /(?:published\s+by\s+)?No\s+Starch\s+Press/i,
      /(?:published\s+by\s+)?Pragmatic\s+Bookshelf/i,
      /(?:published\s+by\s+)?Pragmatic\s+Programmers/i,
    ];
    
    for (const pattern of publisherPatterns) {
      if (pattern.test(firstPart)) {
        score += 0.5;
        signals.push('book_publisher');
        break; // Only count publisher once
      }
    }
    
    // Chapter counting - multiple chapters is a strong book signal
    const chapterMatches = fullText.match(/\bchapter\s+\d+/gi) || [];
    const uniqueChapters = new Set(chapterMatches.map(m => m.toLowerCase())).size;
    
    if (uniqueChapters >= 5) {
      score += 0.5;
      signals.push('book_many_chapters');
    } else if (uniqueChapters >= 3) {
      score += 0.3;
      signals.push('book_chapters');
    }
    
    // Table of Contents
    if (/\btable\s+of\s+contents\b/i.test(fullText)) {
      score += 0.4;
      signals.push('book_toc');
    }
    
    // Preface, Foreword - check only first 20% (front matter location)
    // Must be at start of line (section header style)
    const frontPortion = fullText.substring(0, Math.min(10000, fullText.length * 0.2));
    
    const frontMatterPatterns = [
      /^preface\b/im,           // "Preface" at start of line
      /^foreword\b/im,          // "Foreword" at start of line
      /^dedication\b/im,        // "Dedication" at start of line
      /^about\s+the\s+author/im,
    ];
    
    let frontMatterCount = 0;
    for (const pattern of frontMatterPatterns) {
      if (pattern.test(frontPortion)) {
        frontMatterCount++;
      }
    }
    
    if (frontMatterCount >= 2) {
      score += 0.4;
      signals.push('book_front_matter');
    } else if (frontMatterCount >= 1) {
      score += 0.2;
      signals.push('book_has_preface');
    }
    
    // Back matter - Index and Glossary (but not Appendix - common in papers)
    // Must be at start of line
    const backMatterPatterns = [
      /^index\b(?!\s+of\s+)/im,  // "Index" at start of line, not "index of"
      /^glossary\b/im,
    ];
    
    for (const pattern of backMatterPatterns) {
      if (pattern.test(fullText)) {
        score += 0.2;
        signals.push('book_back_matter');
        break;
      }
    }
    
    // Copyright notice
    if (/(?:©|copyright)\s*\d{4}|all\s+rights\s+reserved/i.test(fullText)) {
      score += 0.2;
      signals.push('book_copyright');
    }
    
    // Page count - books are typically long
    if (pageCount >= 300) {
      score += 0.5;
      signals.push('book_very_long');
    } else if (pageCount >= 150) {
      score += 0.4;
      signals.push('book_long');
    } else if (pageCount >= 80) {
      score += 0.2;
      signals.push('book_medium_length');
    }
    
    // Part structure (Part I, Part II, etc.)
    const partMatches = fullText.match(/\bpart\s+(?:one|two|three|four|five|[ivx]+|\d+)\b/gi) || [];
    if (partMatches.length >= 2) {
      score += 0.3;
      signals.push('book_parts');
    }
    
    // Require meaningful book signals (not just length)
    const hasStructuralSignal = signals.some(s => 
      s.includes('isbn') || 
      s.includes('publisher') || 
      s.includes('chapters') || 
      s.includes('toc') ||
      s.includes('front_matter')
    );
    
    // Book needs structural signals + decent score, or very strong score
    const isBook = (hasStructuralSignal && score >= 0.5) || score >= 1.0;
    const confidence = Math.min(1.0, score);
    
    return { isBook, confidence, signals };
  }
  
  /**
   * Remove file extension from filename.
   */
  private removeExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot > 0) {
      return filename.substring(0, lastDot);
    }
    return filename;
  }
  
  /**
   * Quick check if filename looks like an arXiv paper.
   * Useful for fast pre-filtering.
   */
  isArxivFilename(filename: string): boolean {
    const base = this.removeExtension(filename);
    return this.ARXIV_PATTERN.test(base);
  }
  
  /**
   * Extract arXiv ID from filename if present.
   */
  extractArxivId(filename: string): string | undefined {
    const base = this.removeExtension(filename);
    const match = base.match(this.ARXIV_PATTERN);
    return match ? match[0] : undefined;
  }
}

/**
 * Singleton instance for convenience.
 */
export const paperDetector = new PaperDetector();

/**
 * Convenience function for detection.
 */
export function detectDocumentType(
  docs: Document[],
  filename: string,
  pdfMetadata?: any
): DocumentTypeInfo {
  return paperDetector.detect(docs, filename, pdfMetadata);
}
