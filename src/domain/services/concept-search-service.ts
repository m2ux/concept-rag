/**
 * Concept Search Service
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
 * **Hybrid Search**: When EmbeddingService is provided, uses 4-signal hybrid scoring:
 * - 40% Name matching (exact/partial concept name match)
 * - 30% Vector similarity (semantic search)
 * - 20% BM25 (keyword matching in summary)
 * - 10% Synonym/hierarchy matching
 * 
 * **Design**: Follows the Facade pattern to coordinate multiple repositories.
 */

import { ChunkRepository } from '../interfaces/repositories/chunk-repository.js';
import { ConceptRepository, ScoredConcept } from '../interfaces/repositories/concept-repository.js';
import { CatalogRepository } from '../interfaces/repositories/catalog-repository.js';
import { EmbeddingService } from '../interfaces/services/embedding-service.js';
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
  
  /** How this document matched: 'primary' (direct concept) or 'related' (via related concept) */
  matchType: 'primary' | 'related';
  
  /** If matchType is 'related', the concept that linked to this document */
  viaConcept?: string;
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
export interface ConceptSearchResult {
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
  
  /** Hybrid search scores (only when using hybrid search) */
  scores?: {
    hybridScore: number;
    vectorScore: number;
    bm25Score: number;
    nameScore: number;
    wordnetScore: number;
  };
}

/**
 * Parameters for hierarchical concept search.
 */
export interface ConceptSearchParams {
  /** Concept name to search for */
  concept: string;
  
  /** Maximum chunks to return per source (default: 3) */
  chunksPerSource?: number;
  
  /** Maximum total chunks (default: 10) */
  maxChunks?: number;
  
  /** Maximum sources (default: 5) */
  maxSources?: number;
  
  /** Optional: Filter results to documents containing this text in their title */
  titleFilter?: string;
}

/**
 * Service for hierarchical concept retrieval.
 * 
 * Coordinates concept → documents → chunks navigation to provide comprehensive
 * context for any concept in the knowledge base.
 * 
 * When EmbeddingService is provided, uses hybrid search (vector + name + summary + synonyms).
 * Without EmbeddingService, falls back to exact name matching.
 */
export class ConceptSearchService {
  constructor(
    private conceptRepo: ConceptRepository,
    private chunkRepo: ChunkRepository,
    private catalogRepo: CatalogRepository,
    private embeddingService?: EmbeddingService
  ) {}
  
  /**
   * Perform hierarchical concept search.
   * 
   * Uses hybrid scoring when EmbeddingService is available:
   * - 40% Name matching
   * - 30% Vector similarity
   * - 20% BM25 on summary
   * - 10% Synonym matching
   * 
   * Falls back to exact name matching otherwise.
   * 
   * @param params - Search parameters
   * @returns Comprehensive concept result with multi-level context
   */
  async search(params: ConceptSearchParams): Promise<ConceptSearchResult> {
    const conceptQuery = params.concept.toLowerCase().trim();
    const chunksPerSource = params.chunksPerSource ?? 3;
    const maxChunks = params.maxChunks ?? 10;
    const maxSources = params.maxSources ?? 5;
    
    // 1. Find concept using hybrid search or exact match
    let matchedConcept: Concept | undefined;
    let conceptId: number;
    let scores: ConceptSearchResult['scores'] | undefined;
    
    // Try hybrid search if embedding service is available
    if (this.embeddingService && this.conceptRepo.searchByHybrid) {
      const queryVector = this.embeddingService.generateEmbedding(conceptQuery);
      const hybridResults = await this.conceptRepo.searchByHybrid(conceptQuery, queryVector, 1);
      
      if (hybridResults.length > 0) {
        const topResult = hybridResults[0] as ScoredConcept;
        matchedConcept = topResult;
        conceptId = hashToId(topResult.name.toLowerCase().trim());
        scores = {
          hybridScore: topResult.hybridScore,
          vectorScore: topResult.vectorScore,
          bm25Score: topResult.bm25Score,
          nameScore: topResult.nameScore,
          wordnetScore: topResult.wordnetScore
        };
      } else {
        conceptId = hashToId(conceptQuery);
      }
    } else {
      // Fallback to exact name match
      conceptId = hashToId(conceptQuery);
      const conceptOpt = await this.conceptRepo.findByName(conceptQuery);
      if (isSome(conceptOpt)) {
        matchedConcept = conceptOpt.value;
      }
    }
    
    // Extract concept data
    let catalogIds: number[] = [];
    const conceptData = matchedConcept ? {
      summary: matchedConcept.summary || '',
      relatedConcepts: matchedConcept.relatedConcepts || [],
      synonyms: matchedConcept.synonyms || [],
      broaderTerms: matchedConcept.broaderTerms || [],
      narrowerTerms: matchedConcept.narrowerTerms || []
    } : {
      summary: '',
      relatedConcepts: [] as string[],
      synonyms: [] as string[],
      broaderTerms: [] as string[],
      narrowerTerms: [] as string[]
    };
    
    if (matchedConcept) {
      catalogIds = matchedConcept.catalogIds || [];
      conceptId = hashToId(matchedConcept.name.toLowerCase().trim());
    }
    
    // 2. Expand to include documents from related concepts
    // Build a map of catalogId → { matchType, viaConcept }
    const catalogSourceMap = new Map<number, { matchType: 'primary' | 'related'; viaConcept?: string }>();
    
    // Add primary concept's documents
    for (const catId of catalogIds) {
      catalogSourceMap.set(catId, { matchType: 'primary' });
    }
    
    // Look up related concepts and add their documents
    const relatedConceptNames = conceptData.relatedConcepts || [];
    for (const relatedName of relatedConceptNames) {
      if (!relatedName) continue;
      
      // Find the related concept
      const relatedOpt = await this.conceptRepo.findByName(relatedName);
      if (isSome(relatedOpt)) {
        const relatedConcept = relatedOpt.value;
        const relatedCatalogIds = relatedConcept.catalogIds || [];
        
        // Add related concept's documents (if not already from primary)
        for (const catId of relatedCatalogIds) {
          if (!catalogSourceMap.has(catId)) {
            catalogSourceMap.set(catId, { matchType: 'related', viaConcept: relatedName });
          }
        }
      }
    }
    
    // Get all unique catalog IDs (primary first, then related)
    const allCatalogIds = Array.from(catalogSourceMap.keys());
    const primaryIds = allCatalogIds.filter(id => catalogSourceMap.get(id)?.matchType === 'primary');
    const relatedIds = allCatalogIds.filter(id => catalogSourceMap.get(id)?.matchType === 'related');
    const orderedCatalogIds = [...primaryIds, ...relatedIds];
    
    const totalDocuments = orderedCatalogIds.length;
    
    // 3. Build sources from catalogIds
    const sources: SourceWithPages[] = [];
    const enrichedChunks: EnrichedChunk[] = [];
    let totalChunks = 0;
    
    // Limit to maxSources
    const limitedCatalogIds = orderedCatalogIds.slice(0, maxSources);
    
    for (const catalogId of limitedCatalogIds) {
      const sourceInfo = catalogSourceMap.get(catalogId)!;
      
      // Get document metadata
      const catalogOpt = await this.catalogRepo.findById(catalogId);
      const source = isSome(catalogOpt) && catalogOpt.value.source 
        ? catalogOpt.value.source 
        : `Document ${catalogId}`;
      const title = this.extractTitle(source);
      
      // Find chunks from this document that have the concept
      const docChunks = await this.chunkRepo.findByCatalogId(catalogId, 100);
      totalChunks += docChunks.length;
      
      // For primary matches, filter to chunks with primary concept
      // For related matches, filter to chunks with the related concept
      const targetConceptId = sourceInfo.matchType === 'primary' 
        ? conceptId 
        : hashToId((sourceInfo.viaConcept || '').toLowerCase().trim());
      
      const conceptChunks = docChunks
        .filter(chunk => chunk.conceptIds?.includes(targetConceptId))
        .slice(0, chunksPerSource);
      
      // Collect page numbers from chunks
      const pageNumbers = [...new Set(conceptChunks.map(c => c.pageNumber ?? 0))].sort((a, b) => a - b);
      
      // Build source info
      sources.push({
        catalogId,
        source,
        title,
        pageNumbers,
        pagePreviews: conceptChunks.slice(0, 3).map(c => c.text.substring(0, 200)),
        matchType: sourceInfo.matchType,
        viaConcept: sourceInfo.viaConcept
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
    
    const matchedConceptName = matchedConcept?.name || conceptQuery;
    
    return {
      query: params.concept,
      concept: matchedConceptName,
      conceptId,
      summary: conceptData.summary,
      relatedConcepts: conceptData.relatedConcepts.slice(0, 10),
      synonyms: conceptData.synonyms,
      broaderTerms: conceptData.broaderTerms,
      narrowerTerms: conceptData.narrowerTerms,
      sources,
      chunks: enrichedChunks.slice(0, maxChunks),
      totalDocuments,
      totalChunks,
      scores
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
