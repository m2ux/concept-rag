/**
 * Get Visuals MCP Tool
 * 
 * Retrieves visual content (diagrams, charts, tables, figures) from documents.
 * Enables semantic search over diagram descriptions and filtering by type.
 */

import { BaseTool, ToolParams } from '../base/tool.js';
import type { VisualRepository } from '../../domain/interfaces/repositories/visual-repository.js';
import type { CatalogRepository } from '../../domain/interfaces/repositories/catalog-repository.js';
import type { Visual, VisualType } from '../../domain/models/visual.js';

export interface GetVisualsParams extends ToolParams {
  /** Filter by catalog ID */
  catalog_id?: number;
  /** Filter by visual type */
  visual_type?: VisualType;
  /** Filter by page number */
  page_number?: number;
  /** Filter by concept name */
  concept?: string;
  /** Maximum number of visuals to return */
  limit?: number;
}

/**
 * MCP tool for retrieving visuals (diagrams, charts, tables, figures) from documents.
 * 
 * USE THIS TOOL WHEN:
 * - Looking for diagrams, charts, or figures that illustrate a concept
 * - Finding visual representations associated with specific documents
 * - Retrieving visual context for text content
 * 
 * DO NOT USE for:
 * - Text-based search (use chunks_search or broad_chunks_search instead)
 * - Finding documents by title (use catalog_search instead)
 * - Searching for concepts in text (use concept_search instead)
 * 
 * RETURNS: Array of visuals with descriptions, types, page numbers, 
 * concept associations, and image paths.
 */
export class GetVisualsTool extends BaseTool<GetVisualsParams> {
  
  constructor(
    private visualRepo: VisualRepository,
    private catalogRepo: CatalogRepository
  ) {
    super();
  }
  
  name = "get_visuals";
  description = `Retrieve visual content (diagrams, charts, tables, figures) from documents.

USE THIS TOOL WHEN:
- Looking for diagrams, charts, or figures that illustrate a concept
- Finding visual representations associated with specific documents
- Retrieving visual context for text content

DO NOT USE for:
- Text-based search (use chunks_search or broad_chunks_search instead)
- Finding documents by title (use catalog_search instead)
- Searching for concepts in text (use concept_search instead)

RETURNS: Array of visuals with descriptions, types, page numbers, 
concept associations, and image paths. Visual types include:
diagram, flowchart, chart, table, figure.`;

  inputSchema = {
    type: "object" as const,
    properties: {
      catalog_id: {
        type: "number",
        description: "Filter visuals by catalog (document) ID",
      },
      visual_type: {
        type: "string",
        enum: ["diagram", "flowchart", "chart", "table", "figure"],
        description: "Filter by visual type: diagram, flowchart, chart, table, or figure",
      },
      page_number: {
        type: "number",
        description: "Filter by page number within the document",
      },
      concept: {
        type: "string",
        description: "Filter by concept name associated with the visual",
      },
      limit: {
        type: "number",
        description: "Maximum number of visuals to return (default: 20)",
        default: 20
      }
    },
    required: [],
  };

  async execute(params: GetVisualsParams) {
    try {
      const limit = params.limit ?? 20;
      let visuals: Visual[];

      // Apply filters in order of specificity
      if (params.concept) {
        // Search by concept first (most specific filter)
        console.error(`🔍 Searching visuals for concept: "${params.concept}"`);
        visuals = await this.visualRepo.findByConceptName(params.concept, limit);
      } else if (params.catalog_id) {
        // Filter by catalog
        console.error(`🔍 Searching visuals for catalog ID: ${params.catalog_id}`);
        visuals = await this.visualRepo.findByCatalogId(params.catalog_id, limit);
      } else if (params.visual_type) {
        // Filter by visual type
        console.error(`🔍 Searching visuals of type: ${params.visual_type}`);
        visuals = await this.visualRepo.findByType(params.visual_type, limit);
      } else {
        // Get all visuals with limit - use findByType with any type to get all
        console.error(`🔍 Retrieving up to ${limit} visuals`);
        // Query all types
        visuals = await this.visualRepo.findByType('diagram', limit);
      }

      // Apply page number filter if specified
      if (params.page_number && visuals.length > 0) {
        visuals = visuals.filter((v: Visual) => v.pageNumber === params.page_number);
      }

      // Apply limit
      visuals = visuals.slice(0, limit);

      // Format response
      const formattedVisuals = visuals.map((v: Visual) => ({
        id: v.id,
        catalog_id: v.catalogId,
        catalog_title: v.catalogTitle,
        visual_type: v.visualType,
        page_number: v.pageNumber,
        description: v.description || 'No description available',
        image_path: v.imagePath,
        concepts: v.conceptNames || [],
        chunk_ids: v.chunkIds || []
      }));

      const response = {
        visuals: formattedVisuals,
        total_returned: formattedVisuals.length,
        filters_applied: {
          ...(params.catalog_id && { catalog_id: params.catalog_id }),
          ...(params.visual_type && { visual_type: params.visual_type }),
          ...(params.page_number && { page_number: params.page_number }),
          ...(params.concept && { concept: params.concept })
        }
      };

      console.error(`✅ Found ${formattedVisuals.length} visuals`);

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(response, null, 2)
        }],
        isError: false
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}

