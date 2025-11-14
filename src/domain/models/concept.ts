/**
 * Domain model representing an extracted concept
 */
export interface Concept {
  concept: string;
  conceptType: 'thematic' | 'terminology';
  category: string;
  sources: string[];
  relatedConcepts: string[];
  synonyms?: string[];
  broaderTerms?: string[];
  narrowerTerms?: string[];
  embeddings: number[];
  weight: number;
  chunkCount?: number;
  enrichmentSource: 'corpus' | 'wordnet' | 'hybrid';
}

