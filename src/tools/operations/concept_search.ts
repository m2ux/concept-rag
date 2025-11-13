import { chunksTable, conceptTable } from "../../lancedb/conceptual_search_client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

export interface ConceptSearchParams extends ToolParams {
  concept: string;
  limit?: number;
  source_filter?: string;
}

/**
 * Search for all chunks that reference a specific concept
 * Uses the hybrid approach with concept metadata stored in chunks
 */
export class ConceptSearchTool extends BaseTool<ConceptSearchParams> {
  name = "concept_search";
  description = "Find all document chunks that reference a specific concept. Returns chunks sorted by relevance, showing where in your library a particular concept is discussed.";
  inputSchema = {
    type: "object" as const,
    properties: {
      concept: {
        type: "string",
        description: "The concept to search for (e.g., 'suspicion creation', 'military strategy', 'leadership')",
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return (default: 10)",
        default: 10
      },
      source_filter: {
        type: "string",
        description: "Optional: Filter results to documents containing this text in their source path",
      }
    },
    required: ["concept"],
  };

  async execute(params: ConceptSearchParams) {
    try {
      const limit = params.limit || 10;
      const conceptLower = params.concept.toLowerCase().trim();
      
      if (!chunksTable) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "Chunks table not available",
              message: "Database not properly initialized"
            }, null, 2)
          }],
          isError: true
        };
      }

      // Get concept info from concepts table if available
      let conceptInfo: any = null;
      if (conceptTable) {
        try {
          const conceptResults = await conceptTable
            .query()
            .where(`concept = '${conceptLower}'`)
            .limit(1)
            .toArray();
          
          if (conceptResults.length > 0) {
            conceptInfo = conceptResults[0];
          }
        } catch (e) {
          // Concept table query failed, continue without it
        }
      }

      // Query chunks that contain this concept
      // Load ALL chunks and filter in memory (concepts stored as JSON, can't use SQL WHERE)
      console.error(`🔍 Searching for concept: "${conceptLower}"`);
      
      // Get total count and load ALL chunks (LanceDB defaults to 10 if no limit!)
      const totalCount = await chunksTable.countRows();
      console.error(`📊 Scanning ${totalCount.toLocaleString()} chunks...`);
      
      // Load all chunks - MUST specify limit (toArray() defaults to 10!)
      const allChunks = await chunksTable
        .query()
        .limit(totalCount)  // CRITICAL: Explicit limit required
        .toArray();
      
      console.error(`✅ Loaded ${allChunks.length.toLocaleString()} chunks`);
      
      // Filter chunks that contain this concept
      const matchingChunks = allChunks
        .filter((chunk: any) => {
          if (!chunk.concepts) return false;
          
          // Parse concepts array (stored as JSON string)
          let chunkConcepts: string[] = [];
          try {
            chunkConcepts = typeof chunk.concepts === 'string' 
              ? JSON.parse(chunk.concepts)
              : chunk.concepts;
          } catch (e) {
            return false;
          }
          
          // Check if concept matches (case-insensitive, fuzzy)
          return chunkConcepts.some((c: string) => {
            const cLower = c.toLowerCase();
            return cLower === conceptLower || 
                   cLower.includes(conceptLower) || 
                   conceptLower.includes(cLower);
          });
        })
        .filter((chunk: any) => {
          // Apply source filter if provided
          if (params.source_filter) {
            return chunk.source && chunk.source.toLowerCase().includes(params.source_filter.toLowerCase());
          }
          return true;
        })
        .sort((a: any, b: any) => {
          // Sort by concept_density (higher is better)
          const densityA = a.concept_density || 0;
          const densityB = b.concept_density || 0;
          return densityB - densityA;
        })
        .slice(0, limit);
      
      // Format results
      const results = matchingChunks.map((chunk: any) => {
        // Parse concepts and categories
        let concepts: string[] = [];
        let categories: string[] = [];
        
        try {
          concepts = typeof chunk.concepts === 'string' 
            ? JSON.parse(chunk.concepts)
            : chunk.concepts || [];
          categories = typeof chunk.concept_categories === 'string'
            ? JSON.parse(chunk.concept_categories)
            : chunk.concept_categories || [];
        } catch (e) {
          // Keep empty arrays
        }
        
        return {
          text: chunk.text,
          source: chunk.source,
          concept_density: (chunk.concept_density || 0).toFixed(3),
          concepts_in_chunk: concepts,
          categories: categories,
          relevance: concepts.filter((c: string) => 
            c.toLowerCase() === conceptLower || 
            c.toLowerCase().includes(conceptLower)
          ).length
        };
      });
      
      // Build response with concept info
      const response: any = {
        concept: params.concept,
        total_chunks_found: matchingChunks.length,
        results: results
      };
      
      // Add concept metadata if available
      if (conceptInfo) {
        response.concept_metadata = {
          category: conceptInfo.category,
          weight: conceptInfo.weight,
          chunk_count: conceptInfo.chunk_count,
          sources_count: conceptInfo.sources ? JSON.parse(conceptInfo.sources).length : 0
        };
        
        // Add related concepts if available
        if (conceptInfo.related_concepts) {
          try {
            const related = JSON.parse(conceptInfo.related_concepts);
            if (related.length > 0) {
              response.related_concepts = related.slice(0, 10);
            }
          } catch (e) {
            // Skip related concepts
          }
        }
      }
      
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(response, null, 2) },
        ],
        isError: false,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}

