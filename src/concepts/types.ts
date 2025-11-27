// Shared types for conceptual search system

/**
 * @deprecated ConceptType was never meaningfully implemented.
 * Kept for backward compatibility.
 */
export type ConceptType = 'thematic' | 'terminology';

/**
 * Concept record for building the concept index.
 */
export interface ConceptRecord {
    concept: string;
    summary?: string;
    catalog_ids: number[];
    chunk_ids?: number[];
    related_concept_ids?: number[];
    related_concepts?: string[];
    synonyms?: string[];
    broader_terms?: string[];
    narrower_terms?: string[];
    embeddings: number[];
    weight: number;
}

/**
 * Concept metadata returned by LLM extraction.
 */
export interface ConceptMetadata {
    primary_concepts: string[];
    categories: string[];
}

// Search result with concept scoring
export interface ConceptualSearchResult {
    // Original fields
    id: string;
    text: string;
    source: string;
    hash: string;
    
    // Scoring components
    _distance: number;
    _vector_score: number;
    _bm25_score: number;
    _title_score: number;
    _concept_score: number;
    _wordnet_score: number;
    _hybrid_score: number;
    
    // Metadata
    matched_concepts?: string[];
    expanded_terms?: string[];
}

// WordNet synset data
export interface WordNetSynset {
    word: string;
    synset_name: string;
    synonyms: string[];
    hypernyms: string[];
    hyponyms: string[];
    meronyms: string[];
    definition: string;
}

// Query expansion result
export interface ExpandedQuery {
    original_terms: string[];
    corpus_terms: string[];            // From concept index
    wordnet_terms: string[];           // From WordNet
    all_terms: string[];               // Combined
    weights: Map<string, number>;      // Term importance weights
}

/**
 * Chunk with concept metadata attached.
 */
export interface ChunkWithConcepts {
    text: string;
    source: string;
    catalog_id?: number;
    concepts: string[];
    concept_ids?: number[];
    category_ids?: number[];
    metadata?: any;
}



