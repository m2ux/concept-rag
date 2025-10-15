// Shared types for conceptual search system

// Type of concept for differentiated search behavior
export type ConceptType = 'thematic' | 'terminology';

// Concept extracted from corpus
export interface ConceptRecord {
    concept: string;                    // "concurrent programming"
    concept_type: ConceptType;          // thematic (abstract) or terminology (specific)
    category: string;                   // "Software Engineering"
    sources: string[];                  // Documents containing this
    related_concepts: string[];         // Related terms from corpus
    synonyms?: string[];                // From WordNet
    broader_terms?: string[];           // From WordNet (hypernyms)
    narrower_terms?: string[];          // From WordNet (hyponyms)
    embeddings: number[];              // Vector representation
    weight: number;                     // Importance (document count)
    chunk_count?: number;               // Number of chunks containing this concept
    enrichment_source: 'corpus' | 'wordnet' | 'hybrid';
}

// Concept metadata stored in catalog
export interface ConceptMetadata {
    primary_concepts: string[];         // All important concepts, methods, ideas
    categories: string[];               // 2-3 domains
    related_concepts: string[];         // 3-5 related topics
    summary: string;                    // Brief description
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

// Chunk with concept metadata attached
export interface ChunkWithConcepts {
    text: string;
    source: string;
    concepts: string[];                 // Matched concepts for this chunk
    concept_categories: string[];       // Related categories
    concept_density: number;            // Conceptual richness score
    metadata?: any;                     // Original metadata
}



