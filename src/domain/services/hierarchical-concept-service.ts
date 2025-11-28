/**
 * Hierarchical Concept Service
 * 
 * Provides comprehensive concept retrieval using document-level navigation:
 * Concept → Documents (via catalogIds) → Chunks
 * 
 * This service orchestrates multi-level retrieval to provide rich context
 * for each concept, including:
 * - Concept metadata (summary, related concepts, WordNet relations)
 * - Documents where concept appears
 * - Chunks from those documents (with concept density ranking)
 * 
 * **Design**: Follows the Facade pattern to coordinate multiple repositories.
 */

import { ChunkRepository } from '../interfaces/repositories/chunk-repository.js';
import { ConceptRepository } from '../interfaces/repositories/concept-repository.js';
import { CatalogRepository } from '../interfaces/repositories/catalog-repository.js';
import { Chunk, Concept } from '../models/index.js';
import { isSome, foldOption } from '../functional/index.js';
import { hashToId } from '../../infrastructure/utils/hash.js';

/**
 * Source document with concept context.
 */
export interface SourceWithPages {
  /** Document catalog ID */
  catalogId: number;
  
  /** Document source path */
  source: string;
  
  /** Document title (extracted from source) */
  title: string;
  
  /** Page numbers where concept appears (from chunks) */
  pageNumbers: number[];
  
  /** Text previews from relevant chunks */
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
  
  /** Source documents with context */
  sources: SourceWithPages[];
  
  /** Enriched chunks with hierarchical context */
  chunks: EnrichedChunk[];
  
  /** Total number of documents where concept appears */
  totalDocuments: number;
  
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
 * Coordinates concept → documents → chunks navigation to provide comprehensive
 * context for any concept in the knowledge base.
 */
export class HierarchicalConceptService {
  constructor(
    private conceptRepo: ConceptRepository,
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
    
    let catalogIds: number[] = [];
    const conceptData = foldOption(
      conceptOpt,
      () => ({
        summary: '',
        relatedConcepts: [] as string[],
        synonyms: [] as string[],
        broaderTerms: [] as string[],
        narrowerTerms: [] as string[]
      }),
      (concept: Concept) => {
        catalogIds = concept.catalogIds || [];
        return {
          summary: concept.summary || '',
          relatedConcepts: concept.relatedConcepts || [],
          synonyms: concept.synonyms || [],
          broaderTerms: concept.broaderTerms || [],
          narrowerTerms: concept.narrowerTerms || []
        };
      }
    );
    
    const totalDocuments = catalogIds.length;
    
    // 2. Build sources from catalogIds
    const sources: SourceWithPages[] = [];
    const enrichedChunks: EnrichedChunk[] = [];
    let totalChunks = 0;
    
    // Limit to maxSources
    const limitedCatalogIds = catalogIds.slice(0, maxSources);
    
    for (const catalogId of limitedCatalogIds) {
      // Get document metadata
      const catalogOpt = await this.catalogRepo.findById(catalogId);
      const source = isSome(catalogOpt) && catalogOpt.value.source 
        ? catalogOpt.value.source 
        : `Document ${catalogId}`;
      const title = this.extractTitle(source);
      
      // Find chunks from this document that have the concept
      const docChunks = await this.chunkRepo.findByCatalogId(catalogId, 100);
      totalChunks += docChunks.length;
      
      // Filter to chunks with this concept
      const conceptChunks = docChunks
        .filter(chunk => chunk.conceptIds?.includes(conceptId))
        .slice(0, chunksPerSource);
      
      // Collect page numbers from chunks
      const pageNumbers = [...new Set(conceptChunks.map(c => c.pageNumber ?? 0))].sort((a, b) => a - b);
      
      // Build source info
      sources.push({
        catalogId,
        source,
        title,
        pageNumbers,
        pagePreviews: conceptChunks.slice(0, 3).map(c => c.text.substring(0, 200))
      });
      
      // Enrich chunks with hierarchical metadata
      for (const chunk of conceptChunks) {
        if (enrichedChunks.length >= maxChunks) break;
        
        enrichedChunks.push({
          chunk,
          pageNumber: chunk.pageNumber ?? 0,
          conceptDensity: chunk.conceptDensity ?? 0,
          documentTitle: title
        });
      }
      
      if (enrichedChunks.length >= maxChunks) break;
    }
    
    // 3. Sort enriched chunks by concept density
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
      totalDocuments,
      totalChunks
    };
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
