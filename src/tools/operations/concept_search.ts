import { BaseTool, ToolParams } from "../base/tool.js";
import { CatalogSourceCache } from "../../infrastructure/cache/catalog-source-cache.js";
import { HierarchicalConceptService, HierarchicalConceptResult, EnrichedChunk, SourceWithPages } from "../../domain/services/hierarchical-concept-service.js";

export interface ConceptSearchParams extends ToolParams {
  /** The concept to search for */
  concept: string;
  
  /** Maximum sources to return (default: 5) */
  limit?: number;
  
  /** Optional source path filter */
  source_filter?: string;
  
  /** Show debug information */
  debug?: boolean;
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
    private hierarchicalService: HierarchicalConceptService
  ) {
    super();
  }
  
  name = "concept_search";
  description = `Find all chunks tagged with a specific concept from the concept-enriched index. 
  
USE THIS TOOL WHEN:
- Searching for a conceptual topic (e.g., "innovation", "leadership", "strategic thinking")
- You want semantically-tagged, high-precision results about a concept
- Tracking where and how a concept is discussed across your library
- Research queries focused on understanding a specific concept

DO NOT USE for:
- Keyword searches or exact phrase matching (use broad_chunks_search instead)
- Finding documents by title (use catalog_search instead)
- Searching within a known document (use chunks_search instead)

RETURNS: Concept-tagged chunks with concept_density scores, related concepts, and semantic categories. Results include:
- Concept metadata: summary, synonyms, broader/narrower terms
- Source documents: paths, page numbers where concept appears
- Enriched chunks: text with page numbers and concept density ranking`;

  inputSchema = {
    type: "object" as const,
    properties: {
      concept: {
        type: "string",
        description: "The concept to search for - use conceptual terms not exact phrases (e.g., 'innovation' not 'innovation process')",
      },
      limit: {
        type: "number",
        description: "Maximum number of sources to return (default: 5)",
        default: 5
      },
      source_filter: {
        type: "string",
        description: "Optional: Filter results to documents containing this text in their source path"
      },
      debug: {
        type: "boolean",
        description: "Show debug information",
        default: false
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
    
    const maxSources = params.limit || 5;
    
    console.error(`🔍 Hierarchical concept search: "${params.concept}"`);
    
    try {
      // Perform hierarchical search
      const result = await this.hierarchicalService.search({
        concept: params.concept,
        maxSources,
        maxChunks: maxSources * 3, // ~3 chunks per source
        chunksPerSource: 3,
        sourceFilter: params.source_filter
      });
      
      // Format for MCP response
      const formatted = this.formatResult(result, params.debug);
      
      console.error(`✅ Found: ${result.totalPages} pages, ${result.chunks.length} chunks across ${result.sources.length} sources`);
      
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
  private formatResult(result: HierarchicalConceptResult, debug?: boolean) {
    // Format sources with page context
    const sources = result.sources.map((s: SourceWithPages) => ({
      title: s.title,
      source: s.source,
      pages: s.pageNumbers,
      page_previews: debug ? s.pagePreviews : undefined
    }));
    
    // Format chunks with enhanced metadata
    const chunks = result.chunks.map((e: EnrichedChunk) => ({
      text: e.chunk.text,
      source: CatalogSourceCache.getInstance().getSourceOrDefault(e.chunk.catalogId),
      page: e.pageNumber,
      concept_density: e.conceptDensity.toFixed(3),
      concepts: e.chunk.concepts?.slice(0, 10),
      document_title: e.documentTitle
    }));
    
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
      
      // Enriched chunks
      chunks,
      
      // Statistics
      stats: {
        total_pages: result.totalPages,
        total_chunks: result.totalChunks,
        sources_returned: result.sources.length,
        chunks_returned: result.chunks.length
      }
    };
  }
}
