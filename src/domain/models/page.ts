/**
 * Domain model representing a document page with concept metadata.
 * 
 * Pages are an intermediate level in the hierarchical retrieval:
 * Document → Pages → Chunks
 * 
 * Each page captures:
 * - Page number within the source document
 * - Concepts discussed on this page (LLM-extracted)
 * - Text preview for quick context
 * - Vector embedding for similarity search
 * 
 * This enables hierarchical concept retrieval:
 * 1. Find pages where concept appears
 * 2. Use page numbers to locate relevant chunks
 * 3. Provide comprehensive concept context
 * 
 * @example
 * ```typescript
 * const page: Page = {
 *   id: 123456789,
 *   catalogId: 987654321,
 *   pageNumber: 42,
 *   conceptIds: [111111, 222222, 333333],
 *   textPreview: 'The factory pattern provides a way to...',
 *   embeddings: [0.1, 0.2, ...]
 * };
 * ```
 */
export interface Page {
  /** Unique identifier for the page (hash-based) */
  id: number;
  
  /** Parent document ID (matches catalog.id) */
  catalogId: number;
  
  /** Page number within document (1-indexed) */
  pageNumber: number;
  
  /** Hash-based concept IDs discussed on this page */
  conceptIds: number[];
  
  /** 
   * Resolved concept names (populated from conceptIds).
   * This is a computed field for API convenience.
   */
  concepts?: string[];
  
  /** First ~500 characters of page content for preview */
  textPreview: string;
  
  /** 384-dimensional vector embedding for semantic search */
  embeddings?: number[];
}

