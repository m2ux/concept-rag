/**
 * Domain model representing a text chunk with concept metadata
 */
export interface Chunk {
  id: string;
  text: string;
  source: string;
  hash: string;
  concepts?: string[];
  conceptCategories?: string[];
  conceptDensity?: number;
}

