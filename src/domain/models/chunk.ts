/**
 * Domain model representing a text chunk with concept metadata
 */
export interface Chunk {
  id: string;
  text: string;
  source: string;
  hash: string;
  // For chunks: array of concept names
  // For catalog: rich metadata object with primary_concepts, technical_terms, etc.
  concepts?: string[] | any;
  conceptCategories?: string[];
  conceptDensity?: number;
  embeddings?: number[];  // Vector embeddings for semantic search
}

