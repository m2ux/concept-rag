import { BaseTool, ToolParams } from "../base/tool.js";
import { CatalogRepository } from "../../domain/interfaces/repositories/catalog-repository.js";
import { ChunkRepository } from "../../domain/interfaces/repositories/chunk-repository.js";
import { ConceptRepository } from "../../domain/interfaces/repositories/concept-repository.js";
import { InputValidator } from "../../domain/services/validation/index.js";
import { RecordNotFoundError } from "../../domain/exceptions/index.js";

export interface DocumentConceptsExtractParams extends ToolParams {
  document_query: string;
  format?: "json" | "markdown";
  include_summary?: boolean;
}

/**
 * Extract all concepts from a specific document in the database.
 * Uses derived text fields (concept_names, category_names) for fast lookup.
 */
export class DocumentConceptsExtractTool extends BaseTool<DocumentConceptsExtractParams> {
  private validator = new InputValidator();
  
  constructor(
    private catalogRepo: CatalogRepository,
    private _chunkRepo?: ChunkRepository,
    private conceptRepo?: ConceptRepository
  ) {
    super();
  }
  
  name = "extract_concepts";
  description = `Export the complete list of concepts extracted from a specific document. Returns all primary concepts, technical terms, related concepts, categories, and summary.

USE THIS TOOL WHEN:
- User explicitly asks to "extract concepts", "list concepts", "show concepts", or "export concepts"
- Creating a concept map or overview of a document's conceptual content
- Reviewing the quality of concept extraction for a document
- Exporting concept data for external analysis or documentation
- Generating concept inventories or taxonomies

DO NOT USE for:
- Searching for information (use catalog_search, chunks_search, or broad_chunks_search)
- Finding where a concept is discussed (use concept_chunks)
- General document discovery (use catalog_search)

RETURNS: Complete concept inventory (typically 80-150+ concepts) organized by type: primary_concepts, technical_terms, related_concepts. Also includes categories and document summary if requested.

OUTPUT FORMATS:
- json: Structured data with arrays of concepts by type
- markdown: Formatted tables with row numbers, suitable for documentation`;
  inputSchema = {
    type: "object" as const,
    properties: {
      document_query: {
        type: "string",
        description: "Document title, author name, subject, or keywords to identify the document (uses vector search to find best match)",
      },
      format: {
        type: "string",
        enum: ["json", "markdown"],
        description: "Output format: 'json' for structured data or 'markdown' for formatted tables (default: json)",
        default: "json"
      },
      include_summary: {
        type: "boolean",
        description: "Include document summary and categories (default: true)",
        default: true
      }
    },
    required: ["document_query"],
  };

  async execute(params: DocumentConceptsExtractParams) {
    try {
      // Validate input
      this.validator.validateExtractConcepts(params);
      
      const format = params.format || "json";
      const includeSummary = params.include_summary !== false;

      // Step 1: Search to find matching document (hybrid search for best match)
      console.error(`🔍 Searching for document: "${params.document_query}"`);
      const searchResults = await this.catalogRepo.search({
        text: params.document_query,
        limit: 10
      });

      if (searchResults.length === 0) {
        throw new RecordNotFoundError('Document', params.document_query);
      }

      // Step 2: Get full document record with all derived fields via direct lookup
      const matchedDoc = searchResults[0];
      const { isSome } = await import('../../domain/functional/option.js');
      const fullDocOpt = await this.catalogRepo.findById(matchedDoc.catalogId || matchedDoc.id as number);
      
      // Use full document if found, otherwise fall back to search result
      const doc = isSome(fullDocOpt) ? fullDocOpt.value : matchedDoc;
      
      // Get concepts - use derived fields directly (new schema)
      let primaryConcepts: string[] = [];
      let categories: string[] = [];
      let relatedConcepts: string[] = [];
      
      // Use derived concept_names field
      if (doc.conceptNames && doc.conceptNames.length > 0 && doc.conceptNames[0] !== '') {
        primaryConcepts = doc.conceptNames;
      }
      
      // Use derived category_names field
      if (doc.categoryNames && doc.categoryNames.length > 0 && doc.categoryNames[0] !== '') {
        categories = doc.categoryNames;
      }
      
      // Derive related concepts from concept repository if available
      if (relatedConcepts.length === 0 && this.conceptRepo && doc.conceptIds) {
        relatedConcepts = await this.deriveRelatedConcepts(doc.conceptIds);
      }

      const concepts = {
        primary_concepts: primaryConcepts,
        categories: categories,
        related_concepts: relatedConcepts
      };

      // Format output
      if (format === "markdown") {
        const markdown = this.formatAsMarkdown(doc.source || '', concepts, includeSummary);
        return {
          content: [{ type: "text" as const, text: markdown }],
          isError: false,
        };
      } else {
        // JSON format
        const response: any = {
          document: doc.source,
          document_hash: doc.hash,
          total_concepts: primaryConcepts.length + relatedConcepts.length,
          primary_concepts: primaryConcepts,
          related_concepts: relatedConcepts,
        };

        if (includeSummary) {
          response.categories = categories;
          response.summary = doc.text || "";
        }

        return {
          content: [{ type: "text" as const, text: JSON.stringify(response, null, 2) }],
          isError: false,
        };
      }
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  /**
   * Derive related concepts from the concepts in a document.
   */
  private async deriveRelatedConcepts(conceptIds: number[]): Promise<string[]> {
    if (!this.conceptRepo) return [];
    
    const related = new Set<string>();
    
    for (const id of conceptIds.slice(0, 10)) { // Limit to first 10 to avoid too many queries
      try {
        const { isSome } = await import('../../domain/functional/option.js');
        const conceptOpt = await this.conceptRepo.findById(id);
        if (isSome(conceptOpt)) {
          const concept = conceptOpt.value;
          if (concept.relatedConcepts) {
            concept.relatedConcepts.forEach(r => related.add(r));
          }
        }
      } catch {
        // Skip concepts that can't be found
      }
    }
    
    return Array.from(related).slice(0, 20);
  }

  private formatAsMarkdown(source: string, concepts: any, includeSummary: boolean): string {
    const filename = source.split('/').pop() || source;
    let markdown = `# Concepts Extracted from Document\n\n`;
    markdown += `**Document:** ${filename}\n\n`;
    markdown += `**Full Path:** ${source}\n\n`;

    const totalConcepts = (concepts.primary_concepts?.length || 0) + 
                         (concepts.technical_terms?.length || 0) + 
                         (concepts.related_concepts?.length || 0);
    markdown += `**Total Concepts:** ${totalConcepts}\n\n`;
    markdown += `---\n\n`;

    // Primary concepts
    if (concepts.primary_concepts && concepts.primary_concepts.length > 0) {
      markdown += `## Primary Concepts (${concepts.primary_concepts.length})\n\n`;
      markdown += `| # | Concept |\n`;
      markdown += `|---|---------|\n`;
      concepts.primary_concepts.forEach((concept: string, idx: number) => {
        markdown += `| ${idx + 1} | ${concept} |\n`;
      });
      markdown += `\n`;
    }

    // Technical terms
    if (concepts.technical_terms && concepts.technical_terms.length > 0) {
      markdown += `## Technical Terms (${concepts.technical_terms.length})\n\n`;
      markdown += `| # | Term |\n`;
      markdown += `|---|------|\n`;
      concepts.technical_terms.forEach((term: string, idx: number) => {
        markdown += `| ${idx + 1} | ${term} |\n`;
      });
      markdown += `\n`;
    }

    // Related concepts
    if (concepts.related_concepts && concepts.related_concepts.length > 0) {
      markdown += `## Related Concepts (${concepts.related_concepts.length})\n\n`;
      markdown += `| # | Concept |\n`;
      markdown += `|---|---------|\n`;
      concepts.related_concepts.forEach((concept: string, idx: number) => {
        markdown += `| ${idx + 1} | ${concept} |\n`;
      });
      markdown += `\n`;
    }

    // Categories and summary
    if (includeSummary) {
      if (concepts.categories && concepts.categories.length > 0) {
        markdown += `## Categories (${concepts.categories.length})\n\n`;
        concepts.categories.forEach((category: string) => {
          markdown += `- ${category}\n`;
        });
        markdown += `\n`;
      }

      if (concepts.summary) {
        markdown += `## Summary\n\n`;
        markdown += `${concepts.summary}\n`;
      }
    }

    return markdown;
  }
}
