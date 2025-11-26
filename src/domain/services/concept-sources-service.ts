/**
 * Result-Based Concept Sources Service
 * 
 * This service provides source attribution for concepts - finding all documents
 * where a specific concept appears. It enriches source paths with document
 * metadata from the catalog when available.
 * 
 * **Use this when you want to:**
 * - Find which documents contain a specific concept
 * - Get source attribution for research/citation purposes
 * - Understand concept coverage across your document library
 */

import { ConceptRepository } from '../interfaces/repositories/concept-repository.js';
import { CatalogRepository } from '../interfaces/repositories/catalog-repository.js';
import { Result, Ok, Err } from '../functional/result.js';
import { isSome } from '../functional/option.js';
import { InputValidator } from './validation/InputValidator.js';

/**
 * Parameters for concept sources lookup.
 */
export interface ConceptSourcesParams {
  /** Concept name(s) to find sources for - can be a single concept or array */
  concept: string | string[];
  
  /** Include document metadata (title, summary) from catalog */
  includeMetadata?: boolean;
}

/**
 * Source information for a concept.
 */
export interface SourceInfo {
  /** Source document path */
  source: string;
  
  /** Document title */
  title: string;
  
  /** Document author(s) */
  author?: string;
  
  /** Publication year */
  year?: string;
  
  /** Indices of the searched concepts that appear in this source (references concepts_searched array) */
  conceptIndices?: number[];
  
  /** Document summary (if includeMetadata is true and available) */
  summary?: string;
  
  /** Primary concepts from the document (if includeMetadata is true) */
  primaryConcepts?: string[];
  
  /** Categories of the document (if includeMetadata is true) */
  categories?: string[];
}

/**
 * Concept sources lookup result.
 */
export interface ConceptSourcesResult {
  /** The concept(s) searched for */
  concepts: string[];
  
  /** Concepts that were found */
  foundConcepts: string[];
  
  /** Concepts that were not found */
  notFoundConcepts: string[];
  
  /** Total number of unique sources */
  sourceCount: number;
  
  /** Source documents with metadata (union of all matching sources) */
  sources: SourceInfo[];
}

/**
 * Error types for concept sources lookup.
 */
export type ConceptSourcesError =
  | { type: 'validation'; field: string; message: string }
  | { type: 'concept_not_found'; concept: string }
  | { type: 'database'; message: string }
  | { type: 'unknown'; message: string };

/**
 * Service for finding all document sources that contain a specific concept.
 * 
 * Returns Result<T, ConceptSourcesError> instead of throwing exceptions,
 * enabling functional composition and explicit error handling.
 */
export class ConceptSourcesService {
  private validator = new InputValidator();
  
  constructor(
    private conceptRepo: ConceptRepository,
    private catalogRepo: CatalogRepository
  ) {}
  
  /**
   * Find all sources (documents) that contain any of the given concepts.
   * Returns the union (superset) of all sources across all concepts.
   * 
   * @param params - Lookup parameters
   * @returns Result containing sources or error
   * 
   * @example
   * ```typescript
   * // Single concept
   * const result = await service.getConceptSources({
   *   concept: 'test driven development',
   *   includeMetadata: true
   * });
   * 
   * // Multiple concepts - returns union of all sources
   * const result = await service.getConceptSources({
   *   concept: ['test driven development', 'dependency injection', 'clean code'],
   *   includeMetadata: true
   * });
   * 
   * if (result.ok) {
   *   console.log(`Found in ${result.value.sourceCount} documents:`);
   *   result.value.sources.forEach(s => {
   *     console.log(`- ${s.title} (matches: ${s.matchingConcepts?.join(', ')})`);
   *   });
   * } else {
   *   console.error('Error:', result.error);
   * }
   * ```
   */
  async getConceptSources(
    params: ConceptSourcesParams
  ): Promise<Result<ConceptSourcesResult, ConceptSourcesError>> {
    // Normalize concept input to array
    const conceptNames = Array.isArray(params.concept) 
      ? params.concept 
      : [params.concept];
    
    // Validate each concept
    for (const concept of conceptNames) {
      try {
        this.validator.validateConceptSearch({ concept });
      } catch (error) {
        return Err({
          type: 'validation',
          field: 'concept',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    const includeMetadata = params.includeMetadata ?? true;
    
    try {
      // Track sources by path to avoid duplicates and merge matching concept indices
      const sourceMap = new Map<string, { 
        sourceInfo: SourceInfo; 
        conceptIndices: Set<number>;
      }>();
      
      const foundConcepts: string[] = [];
      const notFoundConcepts: string[] = [];
      
      // Look up each concept (track index for attribution)
      for (let i = 0; i < conceptNames.length; i++) {
        const conceptInput = conceptNames[i];
        const conceptName = conceptInput.toLowerCase().trim();
        const conceptOpt = await this.conceptRepo.findByName(conceptName);
        
        if (!isSome(conceptOpt)) {
          notFoundConcepts.push(conceptInput);
          continue;
        }
        
        foundConcepts.push(conceptInput);
        const concept = conceptOpt.value;
        
        // Get sources from catalogIds (new schema) or legacy sources field
        const sourcePaths: string[] = [];
        if (concept.catalogIds && concept.catalogIds.length > 0) {
          // New schema: look up catalog entries by ID to get source paths
          for (const catalogId of concept.catalogIds) {
            // Search catalog by ID - catalog entries have source paths
            const catalogResults = await this.catalogRepo.search({ 
              text: '', 
              limit: 1 
            });
            // Note: This is a simplified lookup. In production, add findById method
            const entry = catalogResults.find(r => r.id === String(catalogId));
            if (entry?.source) {
              sourcePaths.push(entry.source);
            }
          }
        }
        
        // Process each source for this concept
        for (const sourcePath of sourcePaths) {
          if (sourceMap.has(sourcePath)) {
            // Source already exists, just add this concept's index to its list
            sourceMap.get(sourcePath)!.conceptIndices.add(i);
          } else {
            // New source - create entry
            const parsedInfo = this.parseFilename(sourcePath);
            const sourceInfo: SourceInfo = {
              source: sourcePath,
              title: parsedInfo.title,
              author: parsedInfo.author,
              year: parsedInfo.year
            };
            
            sourceMap.set(sourcePath, {
              sourceInfo,
              conceptIndices: new Set([i])
            });
          }
        }
      }
      
      // If no concepts were found at all, return error
      if (foundConcepts.length === 0) {
        return Err({
          type: 'concept_not_found',
          concept: conceptNames.join(', ')
        });
      }
      
      // Enrich sources with catalog metadata if requested
      const sources: SourceInfo[] = [];
      
      for (const [sourcePath, { sourceInfo, conceptIndices }] of sourceMap) {
        // Add concept indices to source info (sorted for consistency)
        sourceInfo.conceptIndices = Array.from(conceptIndices).sort((a, b) => a - b);
        
        // Optionally enrich with catalog metadata
        if (includeMetadata) {
          try {
            const catalogEntry = await this.catalogRepo.findBySource(sourcePath);
            
            if (isSome(catalogEntry)) {
              const entry = catalogEntry.value;
              
              // Use document summary for a better title if available
              if (entry.text) {
                const extractedTitle = this.extractTitleFromSummary(entry.text);
                if (extractedTitle) {
                  sourceInfo.title = extractedTitle;
                }
              }
              
              sourceInfo.summary = entry.text?.substring(0, 500);
              
              // Parse concepts if available
              if (entry.concepts) {
                const concepts = typeof entry.concepts === 'string' 
                  ? JSON.parse(entry.concepts) 
                  : entry.concepts;
                sourceInfo.primaryConcepts = concepts.primary_concepts?.slice(0, 10);
                sourceInfo.categories = concepts.categories?.slice(0, 5);
              }
            }
          } catch (catalogError) {
            // Log but don't fail - catalog metadata is optional enrichment
            console.error(`⚠️  Could not fetch catalog metadata for "${sourcePath}": ${catalogError instanceof Error ? catalogError.message : catalogError}`);
          }
        }
        
        sources.push(sourceInfo);
      }
      
      // Sort sources by number of matching concepts (descending), then by title
      sources.sort((a, b) => {
        const aCount = a.conceptIndices?.length || 0;
        const bCount = b.conceptIndices?.length || 0;
        if (bCount !== aCount) return bCount - aCount;
        return a.title.localeCompare(b.title);
      });
      
      return Ok({
        concepts: conceptNames,
        foundConcepts,
        notFoundConcepts,
        sourceCount: sources.length,
        sources
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.constructor.name === 'DatabaseError') {
          return Err({
            type: 'database',
            message: error.message
          });
        }
      }
      
      return Err({
        type: 'unknown',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Extract a human-readable title from the document summary text.
   * Looks for the first sentence or line that looks like a title.
   */
  private extractTitleFromSummary(summaryText: string): string | null {
    if (!summaryText || summaryText.trim().length === 0) {
      return null;
    }
    
    // Try to get the first line or sentence as the title
    const lines = summaryText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    if (lines.length === 0) {
      return null;
    }
    
    // First line often contains the book/document title
    let title = lines[0];
    
    // If the first line is too long, try to get just the first sentence
    if (title.length > 150) {
      const sentenceEnd = title.search(/[.!?]/);
      if (sentenceEnd > 10 && sentenceEnd < 150) {
        title = title.substring(0, sentenceEnd);
      } else {
        // Truncate with ellipsis
        title = title.substring(0, 100) + '...';
      }
    }
    
    return title;
  }
  
  /**
   * Parse filename to extract title, author, and year.
   * 
   * Handles filename patterns like:
   * - "Title -- Author -- Year -- Publisher -- Hash -- Source.pdf"
   * - "Title -- Author -- Edition, Year -- Publisher -- ISBN -- Hash -- Source.pdf"
   * - "Simple Title.pdf"
   */
  private parseFilename(sourcePath: string): { title: string; author?: string; year?: string } {
    // Extract filename from path
    const parts = sourcePath.split('/');
    const filename = parts[parts.length - 1];
    
    // Remove extension
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
    
    // Check if filename uses the " -- " delimiter pattern
    if (nameWithoutExt.includes(' -- ')) {
      const segments = nameWithoutExt.split(' -- ').map(s => s.trim());
      
      // First segment is the title
      let title = this.cleanTitle(segments[0]);
      
      // Second segment is usually the author
      let author: string | undefined;
      if (segments.length > 1) {
        author = this.cleanAuthor(segments[1]);
      }
      
      // Look for year in any segment (usually 3rd or embedded in edition info)
      let year: string | undefined;
      for (let i = 2; i < Math.min(segments.length, 5); i++) {
        const extractedYear = this.extractYear(segments[i]);
        if (extractedYear) {
          year = extractedYear;
          break;
        }
      }
      
      return { title, author, year };
    }
    
    // Simple filename without delimiters
    const title = nameWithoutExt.replace(/[_-]/g, ' ').trim();
    return { title };
  }
  
  /**
   * Clean up a title string.
   */
  private cleanTitle(raw: string): string {
    let title = raw
      .replace(/[_]/g, ' ')  // Replace underscores with spaces
      .replace(/\s+/g, ' ')  // Normalize multiple spaces
      .trim();
    
    // Remove trailing edition indicators that look incomplete
    title = title.replace(/,?\s*\d+(st|nd|rd|th)?\s*$/, '');
    
    // Remove trailing colons or incomplete subtitles
    title = title.replace(/[:\-]\s*$/, '');
    
    // Convert to title case
    title = this.toTitleCase(title);
    
    return title.trim();
  }
  
  /**
   * Convert a string to title case.
   * Capitalizes the first letter of each word, except for small words
   * (unless they're the first word).
   */
  private toTitleCase(str: string): string {
    // Words that should stay lowercase (unless first word)
    const smallWords = new Set([
      'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 
      'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet', 'with', 'from'
    ]);
    
    const words = str.toLowerCase().split(' ');
    
    return words.map((word, index) => {
      // Always capitalize the first word
      if (index === 0) {
        return this.capitalizeWord(word);
      }
      
      // Keep small words lowercase
      if (smallWords.has(word)) {
        return word;
      }
      
      return this.capitalizeWord(word);
    }).join(' ');
  }
  
  /**
   * Capitalize the first letter of a word, handling hyphenated words.
   */
  private capitalizeWord(word: string): string {
    if (!word) return word;
    
    // Handle hyphenated words (e.g., "risk-driven" -> "Risk-Driven")
    if (word.includes('-')) {
      return word.split('-').map(part => this.capitalizeWord(part)).join('-');
    }
    
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
  
  /**
   * Clean up an author string.
   */
  private cleanAuthor(raw: string): string {
    let author = raw
      .replace(/[_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Remove common suffixes like "[Author Name]" duplicates or "[foreword by ...]"
    author = author.replace(/\s*\[.*?\]\s*/g, '');
    
    // Clean up Safari/O'Reilly media company suffixes
    author = author.replace(/;\s*Safari,?\s*(an\s+)?O'Reilly Media Company/i, '');
    
    // Remove trailing semicolons and clean up
    author = author.replace(/[;,]\s*$/, '');
    
    // Clean up multiple semicolons/separators
    author = author.replace(/\s*;\s*/g, '; ');
    
    // Normalize "LastName, FirstName" to "FirstName LastName" for single authors
    // But keep as-is if multiple authors (contains ; or &)
    if (!author.includes(';') && !author.includes('&')) {
      const commaMatch = author.match(/^([^,]+),\s*(.+)$/);
      if (commaMatch && commaMatch[2].split(' ').length <= 3) {
        // Looks like "LastName, FirstName" format
        author = `${commaMatch[2]} ${commaMatch[1]}`;
      }
    }
    
    return author.trim();
  }
  
  /**
   * Extract a 4-digit year from a string.
   */
  private extractYear(segment: string): string | undefined {
    // Look for 4-digit year patterns (1900-2099)
    const yearMatch = segment.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? yearMatch[0] : undefined;
  }
}

