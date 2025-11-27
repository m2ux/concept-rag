/**
 * Hierarchical Concept Service
 * 
 * Provides comprehensive concept retrieval using hierarchical navigation:
 * Concept → Pages → Chunks
 * 
 * This service orchestrates multi-level retrieval to provide rich context
 * for each concept, including:
 * - Concept metadata (summary, related concepts, WordNet relations)
 * - Pages where concept is discussed (with page numbers)
 * - Chunks from those pages (with concept density ranking)
 * 
 * **Design**: Follows the Facade pattern to coordinate multiple repositories.
 */

import { ChunkRepository } from '../interfaces/repositories/chunk-repository.js';
import { ConceptRepository } from '../interfaces/repositories/concept-repository.js';
import { PageRepository } from '../interfaces/repositories/page-repository.js';
import { CatalogRepository } from '../interfaces/repositories/catalog-repository.js';
import { Chunk, Concept, Page } from '../models/index.js';
import { isSome, foldOption } from '../functional/index.js';
import { hashToId } from '../../infrastructure/utils/hash.js';

/**
 * Source document with page context.
 */
export interface SourceWithPages {
  /** Document catalog ID */
  catalogId: number;
  
  /** Document source path */
  source: string;
  
  /** Document title (extracted from source) */
  title: string;
  
  /** Page numbers where concept appears */
  pageNumbers: number[];
  
  /** Text previews from relevant pages */
  pagePreviews: string[];
}

/**
 * Chunk with enhanced metadata for hierarchical retrieval.
 */
export interface EnrichedChunk {
  /** The chunk data */
  chunk: Chunk;
  
  /** Page number this chunk is from */
  pageNumber: number;
  
  /** Concept density score (0-1) */
  conceptDensity: number;
  
  /** Source document title */
  documentTitle: string;
}

/**
 * Complete hierarchical concept search result.
 */
export interface HierarchicalConceptResult {
  /** Search query */
  query: string;
  
  /** Matched concept name (normalized) */
  concept: string;
  
  /** Concept ID (hash-based) */
  conceptId: number;
  
  /** One-sentence concept summary (LLM-generated) */
  summary: string;
  
  /** Related concepts from concept graph */
  relatedConcepts: string[];
  
  /** WordNet synonyms */
  synonyms: string[];
  
  /** WordNet broader terms (hypernyms) */
  broaderTerms: string[];
  
  /** WordNet narrower terms (hyponyms) */
  narrowerTerms: string[];
  
  /** Source documents with page-level context */
  sources: SourceWithPages[];
  
  /** Enriched chunks with hierarchical context */
  chunks: EnrichedChunk[];
  
  /** Total number of pages where concept appears */
  totalPages: number;
  
  /** Total number of chunks with this concept */
  totalChunks: number;
}

/**
 * Parameters for hierarchical concept search.
 */
export interface HierarchicalSearchParams {
  /** Concept name to search for */
  concept: string;
  
  /** Maximum chunks to return per source (default: 3) */
  chunksPerSource?: number;
  
  /** Maximum total chunks (default: 10) */
  maxChunks?: number;
  
  /** Maximum sources (default: 5) */
  maxSources?: number;
  
  /** Optional source filter */
  sourceFilter?: string;
}

/**
 * Service for hierarchical concept retrieval.
 * 
 * Coordinates concept → pages → chunks navigation to provide comprehensive
 * context for any concept in the knowledge base.
 */
export class HierarchicalConceptService {
  constructor(
    private conceptRepo: ConceptRepository,
    private pageRepo: PageRepository,
    private chunkRepo: ChunkRepository,
    private catalogRepo: CatalogRepository
  ) {}
  
  /**
   * Perform hierarchical concept search.
   * 
   * @param params - Search parameters
   * @returns Comprehensive concept result with multi-level context
   */
  async search(params: HierarchicalSearchParams): Promise<HierarchicalConceptResult> {
    const conceptName = params.concept.toLowerCase().trim();
    const conceptId = hashToId(conceptName);
    const chunksPerSource = params.chunksPerSource ?? 3;
    const maxChunks = params.maxChunks ?? 10;
    const maxSources = params.maxSources ?? 5;
    
    // 1. Get concept metadata
    const conceptOpt = await this.conceptRepo.findByName(conceptName);
    
    const conceptData = foldOption(
      conceptOpt,
      () => ({
        summary: '',
        relatedConcepts: [] as string[],
        synonyms: [] as string[],
        broaderTerms: [] as string[],
        narrowerTerms: [] as string[]
      }),
      (concept: Concept) => ({
        summary: concept.summary || '',
        relatedConcepts: concept.relatedConcepts || [],
        synonyms: concept.synonyms || [],
        broaderTerms: concept.broaderTerms || [],
        narrowerTerms: concept.narrowerTerms || []
      })
    );
    
    // 2. Find pages where concept appears
    const pages = await this.pageRepo.findByConceptId(conceptId, 100);
    const totalPages = pages.length;
    
    // 3. Group pages by document
    const pagesByDocument = this.groupPagesByDocument(pages);
    
    // 4. Build sources with page context
    const sources: SourceWithPages[] = [];
    for (const [catalogId, docPages] of pagesByDocument.entries()) {
      if (sources.length >= maxSources) break;
      
      // Get document metadata
      const catalogOpt = await this.catalogRepo.findById(catalogId);
      const source = isSome(catalogOpt) && catalogOpt.value.source ? catalogOpt.value.source : `Document ${catalogId}`;
      const title = this.extractTitle(source);
      
      sources.push({
        catalogId,
        source,
        title,
        pageNumbers: docPages.map(p => p.pageNumber).sort((a, b) => a - b),
        pagePreviews: docPages.slice(0, 3).map(p => p.textPreview)
      });
    }
    
    // 5. Find chunks from relevant pages
    const enrichedChunks: EnrichedChunk[] = [];
    let totalChunks = 0;
    
    for (const sourceDoc of sources) {
      // Get page numbers for this document
      const pageNumbers = new Set(sourceDoc.pageNumbers);
      
      // Find chunks from this document
      const docChunks = await this.chunkRepo.findBySource(sourceDoc.source, 100);
      totalChunks += docChunks.length;
      
      // Filter to chunks from relevant pages and with the concept
      const relevantChunks = docChunks
        .filter(chunk => {
          const chunkPage = chunk.pageNumber ?? 0;
          const hasConcept = chunk.concepts?.some(c => 
            c.toLowerCase() === conceptName
          ) ?? false;
          return pageNumbers.has(chunkPage) || hasConcept;
        })
        .slice(0, chunksPerSource);
      
      // Enrich chunks with hierarchical metadata
      for (const chunk of relevantChunks) {
        if (enrichedChunks.length >= maxChunks) break;
        
        enrichedChunks.push({
          chunk,
          pageNumber: chunk.pageNumber ?? 0,
          conceptDensity: chunk.conceptDensity ?? 0,
          documentTitle: sourceDoc.title
        });
      }
    }
    
    // 6. Sort enriched chunks by concept density
    enrichedChunks.sort((a, b) => b.conceptDensity - a.conceptDensity);
    
    return {
      query: params.concept,
      concept: conceptName,
      conceptId,
      summary: conceptData.summary,
      relatedConcepts: conceptData.relatedConcepts.slice(0, 10),
      synonyms: conceptData.synonyms,
      broaderTerms: conceptData.broaderTerms,
      narrowerTerms: conceptData.narrowerTerms,
      sources,
      chunks: enrichedChunks.slice(0, maxChunks),
      totalPages,
      totalChunks
    };
  }
  
  /**
   * Group pages by their catalog (document) ID.
   */
  private groupPagesByDocument(pages: Page[]): Map<number, Page[]> {
    const byDocument = new Map<number, Page[]>();
    
    for (const page of pages) {
      const existing = byDocument.get(page.catalogId) || [];
      existing.push(page);
      byDocument.set(page.catalogId, existing);
    }
    
    return byDocument;
  }
  
  /**
   * Extract a readable title from a source path.
   */
  private extractTitle(source: string): string {
    // Get filename without extension
    const filename = source.split('/').pop() || source;
    const withoutExt = filename.replace(/\.(pdf|epub|txt|md)$/i, '');
    
    // Clean up common patterns
    return withoutExt
      .replace(/_/g, ' ')
      .replace(/--/g, ' - ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

