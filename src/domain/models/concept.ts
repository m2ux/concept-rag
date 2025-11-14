/**
 * Domain model representing an extracted concept from the document corpus.
 * 
 * Concepts are semantic entities identified in documents through AI extraction.
 * They are enriched with:
 * - WordNet relationships (synonyms, broader/narrower terms)
 * - Cross-document connections (sources, related concepts)
 * - Vector embeddings for similarity search
 * 
 * **Types**:
 * - **Thematic**: Abstract ideas or themes (e.g., 'innovation', 'leadership')
 * - **Terminology**: Technical terms or domain-specific vocabulary (e.g., 'REST API', 'microservice')
 * 
 * @example
 * ```typescript
 * const concept: Concept = {
 *   concept: 'machine learning',
 *   conceptType: 'thematic',
 *   category: 'artificial intelligence',
 *   sources: ['/docs/ai-intro.pdf', '/docs/ml-guide.pdf'],
 *   relatedConcepts: ['deep learning', 'neural networks'],
 *   synonyms: ['ML', 'statistical learning'],
 *   broaderTerms: ['artificial intelligence'],
 *   narrowerTerms: ['supervised learning', 'unsupervised learning'],
 *   embeddings: [0.1, 0.2, ...], // 384 dimensions
 *   weight: 0.85,
 *   chunkCount: 42,
 *   enrichmentSource: 'hybrid'
 * };
 * ```
 */
export interface Concept {
  /** The concept name (e.g., 'dependency injection', 'REST API') */
  concept: string;
  
  /**
   * Type of concept:
   * - `thematic`: Abstract ideas or themes
   * - `terminology`: Technical terms or domain vocabulary
   */
  conceptType: 'thematic' | 'terminology';
  
  /** Semantic category the concept belongs to (e.g., 'software design patterns') */
  category: string;
  
  /** Document sources where this concept appears */
  sources: string[];
  
  /** Other concepts frequently mentioned alongside this one */
  relatedConcepts: string[];
  
  /** Alternative names or abbreviations (from WordNet or corpus analysis) */
  synonyms?: string[];
  
  /** More general concepts in the hierarchy (WordNet: hypernyms) */
  broaderTerms?: string[];
  
  /** More specific concepts in the hierarchy (WordNet: hyponyms) */
  narrowerTerms?: string[];
  
  /** 384-dimensional vector embedding for semantic similarity */
  embeddings: number[];
  
  /** Importance weight (0-1, based on frequency and centrality) */
  weight: number;
  
  /** Number of chunks containing this concept */
  chunkCount?: number;
  
  /**
   * Source of semantic enrichment:
   * - `corpus`: Extracted from document analysis alone
   * - `wordnet`: Enriched with WordNet relationships
   * - `hybrid`: Both corpus extraction and WordNet enrichment
   */
  enrichmentSource: 'corpus' | 'wordnet' | 'hybrid';
}

