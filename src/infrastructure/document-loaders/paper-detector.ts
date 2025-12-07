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
 * console.log(result.documentType); // 'paper' | 'book' | 'magazine' | 'article' | 'unknown'
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
  documentType: 'book' | 'paper' | 'magazine' | 'article' | 'unknown';
  
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
    return this.calculateResult(signals, arxivId, doi, allText, pageCount);
  }
  
  /**
   * Calculate document type from weighted signals.
   */
  private calculateResult(
    signals: DetectionSignal[],
    arxivId: string | undefined,
    doi: string | undefined,
    allText: string,
    pageCount: number
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
    
    // Check for magazine article characteristics
    const isMagazine = this.detectMagazineArticle(allText, pageCount);
    
    // Determine document type
    let documentType: 'book' | 'paper' | 'magazine' | 'article' | 'unknown';
    let confidence: number;
    
    if (isMagazine.isMagazine) {
      // Magazine article detected
      documentType = 'magazine';
      confidence = isMagazine.confidence;
      matchedSignals.push(...isMagazine.signals);
    } else if (arxivId || doi) {
      // Strong signal: definitely a paper
      documentType = 'paper';
      confidence = Math.max(0.85, paperConfidence);
    } else if (paperConfidence >= 0.65) {
      documentType = 'paper';
      confidence = paperConfidence;
    } else if (paperConfidence <= 0.35) {
      documentType = 'book';
      confidence = 1 - paperConfidence;
    } else if (paperConfidence >= 0.5) {
      // Borderline - might be an article
      documentType = 'article';
      confidence = paperConfidence;
    } else {
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
   * Detect if document is a magazine article.
   * 
   * Magazine articles have distinct characteristics:
   * - Published in professional magazines (IEEE Software, CACM, etc.)
   * - Short (typically 2-8 pages)
   * - Column/Editor format
   * - No formal "Abstract" section
   * - Conversational tone
   */
  private detectMagazineArticle(
    fullText: string, 
    pageCount: number
  ): { isMagazine: boolean; confidence: number; signals: string[] } {
    const signals: string[] = [];
    let score = 0;
    
    // Magazine publication patterns - these need to be specific to magazine format, not just mentions
    // Only match in the first 500 chars (masthead area) to avoid citation matches
    const firstText = fullText.substring(0, 500);
    
    const magazinePatterns = [
      // These patterns should only match magazine mastheads, not citations
      { pattern: /IEEE\s+SOFTWARE/i, weight: 0.5, name: 'ieee_software', text: firstText },
      { pattern: /IEEE\s+Computer(?!\s+Society)/i, weight: 0.5, name: 'ieee_computer', text: firstText },
      { pattern: /IEEE\s+Spectrum/i, weight: 0.5, name: 'ieee_spectrum', text: firstText },
      { pattern: /Communications\s+of\s+the\s+ACM/i, weight: 0.5, name: 'cacm', text: firstText },
      { pattern: /ACM\s+Queue/i, weight: 0.5, name: 'acm_queue', text: firstText },
      { pattern: /Dr\.\s*Dobb/i, weight: 0.5, name: 'dr_dobbs', text: firstText },
      // Column format is a strong magazine indicator
      { pattern: /\bPRAGMATIC\s+DESIGNER\b/i, weight: 0.4, name: 'column_pragmatic', text: firstText },
      { pattern: /Editor:\s*[A-Z][a-z]+\s+[A-Z][a-z]+/i, weight: 0.4, name: 'editor_format', text: firstText },
      // "PUBLISHED BY THE IEEE COMPUTER SOCIETY" at the top is a strong indicator
      { pattern: /PUBLISHED\s+BY\s+THE\s+IEEE\s+COMPUTER\s+SOCIETY/i, weight: 0.5, name: 'ieee_cs_published', text: firstText },
    ];
    
    for (const { pattern, weight, name, text } of magazinePatterns) {
      if (pattern.test(text)) {
        score += weight;
        signals.push(`magazine_${name}`);
      }
    }
    
    // Short page count is typical for magazine articles
    if (pageCount >= 2 && pageCount <= 8) {
      score += 0.2;
      signals.push('magazine_short');
    }
    
    // No abstract is common in magazine articles
    if (!/\bABSTRACT\b/i.test(fullText.substring(0, 3000))) {
      score += 0.1;
      signals.push('magazine_no_abstract');
    }
    
    // Magazine articles often have fewer formal citations
    const citationCount = (fullText.match(/\[\d+\]/g) || []).length;
    if (citationCount < 10) {
      score += 0.1;
      signals.push('magazine_few_citations');
    }
    
    // Require at least one strong magazine signal
    const hasStrongSignal = signals.some(s => 
      s.includes('ieee_magazine') || 
      s.includes('cacm') || 
      s.includes('acm_queue') ||
      s.includes('editor_format') ||
      s.includes('ieee_published')
    );
    
    const isMagazine = hasStrongSignal && score >= 0.4;
    const confidence = Math.min(1.0, score);
    
    return { isMagazine, confidence, signals };
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
