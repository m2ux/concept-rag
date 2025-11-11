import { catalogTable } from "../../lancedb/conceptual_search_client.js";
import { createSimpleEmbedding } from "../../lancedb/hybrid_search_client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

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
  name = "extract_concepts";
  description = "Extract all concepts (primary concepts, technical terms, related concepts) from a specific document in the database. Search by document name or topic.";
  inputSchema = {
    type: "object" as const,
    properties: {
      document_query: {
        type: "string",
        description: "Search query to find the document (e.g., 'Sun Tzu Art of War', 'healthcare system', author name, or document title)",
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
      if (!catalogTable) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "Catalog table not available",
              message: "Database not properly initialized"
            }, null, 2)
          }],
          isError: true
        };
      }

      const format = params.format || "json";
      const includeSummary = params.include_summary !== false;

      // Use vector search to find document
      console.error(`🔍 Searching for document: "${params.document_query}"`);
      const queryVector = createSimpleEmbedding(params.document_query);
      const results = await catalogTable
        .vectorSearch(queryVector)
        .limit(10)
        .toArray();

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

