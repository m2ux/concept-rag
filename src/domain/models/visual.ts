/**
 * Domain model representing a visual (diagram, chart, table, figure) extracted from a document.
 * 
 * A visual is an image extracted from a document that has semantic meaning:
 * - Flowcharts, UML diagrams, architecture diagrams
 * - Charts and graphs (bar, line, pie, etc.)
 * - Tables with structured data
 * - Technical figures with labels
 * 
 * Photos, screenshots, and decorative images are NOT stored as visuals.
 * 
 * Each visual is enriched with:
 * - LLM-generated semantic description
 * - Vector embeddings for semantic search
 * - Extracted concepts for conceptual navigation
 * - Links to nearby text chunks for context
 * 
 * @example
 * ```typescript
 * const visual: Visual = {
 *   id: 3847293847,
 *   catalogId: 12345678,
 *   catalogTitle: 'Clean Architecture',
 *   imagePath: 'images/12345678/p42_v1.png',
 *   description: 'Architecture diagram showing dependency inversion...',
 *   visualType: 'diagram',
 *   pageNumber: 42,
 *   conceptIds: [11111111, 22222222],
 *   conceptNames: ['dependency inversion', 'clean architecture'],
 *   chunkIds: [33333333, 44444444]
 * };
 * ```
 */
export interface Visual {
  /** Unique identifier for the visual (hash-based integer from catalog_id + page + index) */
  id: number;
  
  /** Parent document ID (hash-based integer, matches catalog.id) */
  catalogId: number;
  
  /**
   * Document title from catalog - DERIVED field for display.
   * Populated from catalog.title during extraction.
   */
  catalogTitle: string;
  
  /** 
   * Path to the extracted image file, relative to database directory.
   * Format: `images/{catalog_id}/p{page}_v{index}.png`
   * Images are stored as grayscale PNG for storage efficiency.
   */
  imagePath: string;
  
  /**
   * LLM-generated semantic description of the visual.
   * Captures the meaning, components, and relationships depicted.
   * Used for generating embeddings and extracting concepts.
   */
  description: string;
  
  /** 384-dimensional vector embedding of the description for semantic search */
  vector?: number[];
  
  /**
   * Classification of the visual type.
   * - diagram: flowcharts, UML, architecture, state machines
   * - flowchart: process flows, decision trees
   * - chart: bar, line, pie, scatter, histogram
   * - table: structured tabular data
   * - figure: technical illustrations with labels
   */
  visualType: VisualType;
  
  /** Page number within source document (1-indexed) */
  pageNumber: number;
  
  /**
   * Bounding box of the visual on the page.
   * JSON string format: `{"x": 0, "y": 0, "width": 100, "height": 100}`
   * Coordinates are in pixels relative to the page.
   */
  boundingBox?: string;
  
  /** Hash-based concept IDs extracted from the description */
  conceptIds?: number[];
  
  /**
   * Denormalized concept names - DERIVED field for display.
   * Regenerated from concept_ids → concepts.name lookup.
   */
  conceptNames?: string[];
  
  /**
   * IDs of text chunks near this visual on the same page.
   * Provides context for understanding the visual.
   */
  chunkIds?: number[];
}

/**
 * Visual type classification.
 * Only visuals with semantic meaning are stored.
 */
export type VisualType = 
  | 'diagram'    // flowcharts, UML, architecture, state machines
  | 'flowchart'  // process flows, decision trees
  | 'chart'      // bar, line, pie, scatter, histogram
  | 'table'      // structured tabular data
  | 'figure';    // technical illustrations with labels

/**
 * Bounding box for a visual on a page.
 */
export interface BoundingBox {
  /** X coordinate (left edge) in pixels */
  x: number;
  /** Y coordinate (top edge) in pixels */
  y: number;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

/**
 * Parse a bounding box from JSON string.
 */
export function parseBoundingBox(json: string | undefined): BoundingBox | undefined {
  if (!json) return undefined;
  try {
    return JSON.parse(json) as BoundingBox;
  } catch {
    return undefined;
  }
}

/**
 * Serialize a bounding box to JSON string.
 */
export function serializeBoundingBox(box: BoundingBox): string {
  return JSON.stringify(box);
}

