import { BaseTool, ToolParams } from "../base/tool.js";
import { ConceptSearchService, ConceptSearchResult, EnrichedChunk, SourceWithPages } from "../../domain/services/concept-search-service.js";
import { Configuration } from "../../application/config/index.js";

export interface ConceptSearchParams extends ToolParams {
  /** The concept to search for */
  concept: string;
  
  /** Optional source path filter */
  source_filter?: string;
}

/**
 * MCP tool for hierarchical concept search.
 * 
 * Provides comprehensive concept retrieval using hierarchical navigation:
 * Concept → Pages → Chunks
 * 
 * Returns:
 * - Concept metadata (summary, synonyms, related concepts)
 * - Source documents with page-level context
 * - Enriched chunks sorted by concept density
 */
export class ConceptSearchTool extends BaseTool<ConceptSearchParams> {
  constructor(
    private conceptSearchService: ConceptSearchService
  ) {
    super();
  }
  
  name = "concept_search";
  description = `Find chunks associated with a concept, organized by source documents (hierarchical view).

Uses fuzzy matching to find the concept, then **expands to include documents from lexically-related concepts**.
For example: "software architecture" → also finds documents via "complexity software", "software design".

USE THIS TOOL WHEN:
- Searching for a conceptual topic (e.g., "innovation", "leadership", "strategic thinking")
- Tracking where and how a concept is discussed across your library
- Research queries focused on understanding a specific concept

DO NOT USE for:
- Keyword searches or exact phrase matching (use broad_chunks_search instead)
- Finding documents by title (use catalog_search instead)
- Searching within a known document (use chunks_search instead)

RETURNS: All matching content organized as Concept → Sources → Chunks:
- Concept metadata: summary, synonyms, broader/narrower terms
- All source documents with match_type: 'primary' (direct) or 'related' (via linked concept)
- All chunks: text with page numbers and concept density ranking

Debug output can be enabled via DEBUG_SEARCH=true environment variable.`;

  inputSchema = {
    type: "object" as const,
    properties: {
      concept: {
        type: "string",
        description: "The concept to search for - use conceptual terms not exact phrases (e.g., 'innovation' not 'innovation process')",
      },
      source_filter: {
        type: "string",
        description: "Optional: Filter results to documents containing this text in their source path"
      }
    },
    required: ["concept"],
  };

  async execute(params: ConceptSearchParams) {
    // Validate input
    if (!params.concept || params.concept.trim() === '') {
      return {
        isError: true,
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Concept name is required',
              field: 'concept'
            },
            timestamp: new Date().toISOString()
          })
        }]
      };
    }
    
    console.error(`🔍 Hierarchical concept search: "${params.concept}"`);
    
    try {
      // Perform hierarchical search - no limits, return all matching content
      const result = await this.conceptSearchService.search({
        concept: params.concept,
        maxSources: 1000,   // Effectively unlimited
        maxChunks: 3000,    // Effectively unlimited (~3 per source)
        chunksPerSource: 10,
        sourceFilter: params.source_filter
      });
      
      // Format for MCP response
      const debugSearch = Configuration.getInstance().logging.debugSearch;
      const formatted = this.formatResult(result, debugSearch);
      
      console.error(`✅ Found: ${result.totalDocuments} documents, ${result.chunks.length} chunks across ${result.sources.length} sources`);
      
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(formatted, null, 2) },
        ],
        isError: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        isError: true,
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            error: {
              code: 'SEARCH_ERROR',
              message: message
            },
            timestamp: new Date().toISOString()
          })
        }]
      };
    }
  }
  
  /**
   * Format hierarchical result for LLM consumption.
   */
  private formatResult(result: ConceptSearchResult, debug?: boolean) {
    // Format sources with page context and match type
    const sources = result.sources.map((s: SourceWithPages) => ({
      title: s.title,
      pages: s.pageNumbers,
      match_type: s.matchType,  // 'primary' or 'related'
      via_concept: s.viaConcept,  // If 'related', the concept that linked here
      page_previews: debug ? s.pagePreviews : undefined
    }));
    
    // Format chunks with enhanced metadata - use direct fields
    const chunks = result.chunks.map((e: EnrichedChunk) => {
      // Use derived concept_names field directly (new schema has this populated)
      const conceptNames = (e.chunk.conceptNames && e.chunk.conceptNames.length > 0 && e.chunk.conceptNames[0] !== '')
        ? e.chunk.conceptNames.slice(0, 10)
        : [];
      
      return {
        text: e.chunk.text,
        title: e.chunk.catalogTitle || e.documentTitle || '',
        page: e.pageNumber,
        concept_density: e.conceptDensity.toFixed(3),
        concepts: conceptNames
      };
    });
    
    return {
      concept: result.concept,
      concept_id: result.conceptId,
      summary: result.summary,
      
      // Semantic relationships
      related_concepts: result.relatedConcepts,
      synonyms: result.synonyms,
      broader_terms: result.broaderTerms,
      narrower_terms: result.narrowerTerms,
      
      // Sources with page-level context
      sources,
      
      // Enriched chunks (ranked by concept_density)
      chunks,
      
      // Statistics
      stats: {
        total_documents: result.totalDocuments,
        total_chunks: result.totalChunks,
        sources_returned: result.sources.length,
        chunks_returned: result.chunks.length
      },
      
      // Hybrid score always shown
      ...(result.scores ? { score: result.scores.hybridScore.toFixed(3) } : {}),
      
      // Component breakdown only when debug enabled
      ...(debug && result.scores ? {
        score_components: {
          name: result.scores.nameScore.toFixed(3),
          vector: result.scores.vectorScore.toFixed(3),
          bm25: result.scores.bm25Score.toFixed(3),
          wordnet: result.scores.wordnetScore.toFixed(3)
        }
      } : {})
    };
  }
}
