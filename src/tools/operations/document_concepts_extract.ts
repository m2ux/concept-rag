import { BaseTool, ToolParams } from "../base/tool.js";
import { CatalogRepository } from "../../domain/interfaces/repositories/catalog-repository.js";
import { EmbeddingService } from "../../domain/interfaces/services/embedding-service.js";

export interface DocumentConceptsExtractParams extends ToolParams {
  document_query: string;
  format?: "json" | "markdown";
  include_summary?: boolean;
}

/**
 * Extract all concepts from a specific document in the database
 * Uses vector search to find the document, then returns its concept metadata
 */
export class DocumentConceptsExtractTool extends BaseTool<DocumentConceptsExtractParams> {
  constructor(
    private catalogRepo: CatalogRepository,
    private embeddingService: EmbeddingService
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
- Finding where a concept is discussed (use concept_search)
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
      const format = params.format || "json";
      const includeSummary = params.include_summary !== false;

      // Use repository to find document
      console.error(`🔍 Searching for document: "${params.document_query}"`);
      const results = await this.catalogRepo.search({
        text: params.document_query,
        limit: 10
      });

      if (results.length === 0) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "No documents found",
              query: params.document_query
            }, null, 2)
          }],
          isError: true
        };
      }

      // Take the best match
      const doc = results[0];
      
      if (!doc.concepts) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "No concepts found for document",
              document: doc.source,
              message: "This document may not have been processed with concept extraction"
            }, null, 2)
          }],
          isError: true
        };
      }

      // Parse concepts
      const concepts = typeof doc.concepts === 'string' 
        ? JSON.parse(doc.concepts) 
        : doc.concepts;

      // Format output
      if (format === "markdown") {
        const markdown = this.formatAsMarkdown(doc.source, concepts, includeSummary);
        return {
          content: [{ type: "text" as const, text: markdown }],
          isError: false,
        };
      } else {
        // JSON format
        const response: any = {
          document: doc.source,
          document_hash: doc.hash,
          total_concepts: (concepts.primary_concepts?.length || 0) + 
                         (concepts.technical_terms?.length || 0) + 
                         (concepts.related_concepts?.length || 0),
          primary_concepts: concepts.primary_concepts || [],
          technical_terms: concepts.technical_terms || [],
          related_concepts: concepts.related_concepts || [],
        };

        if (includeSummary) {
          response.categories = concepts.categories || [];
          response.summary = concepts.summary || "";
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

