// Shared types for conceptual search system

// Concept extracted from corpus
export interface ConceptRecord {
    concept: string;                    // "concurrent programming"
    category: string;                   // "Software Engineering"
    sources: string[];                  // Documents containing this
    related_concepts: string[];         // Related terms from corpus
    synonyms?: string[];                // From WordNet
    broader_terms?: string[];           // From WordNet (hypernyms)
    narrower_terms?: string[];          // From WordNet (hyponyms)
    embeddings: number[];              // Vector representation
    weight: number;                     // Importance (document count)
    enrichment_source: 'corpus' | 'wordnet' | 'hybrid';
}

// Concept metadata stored in catalog
export interface ConceptMetadata {
    primary_concepts: string[];         // 3-5 main topics
    technical_terms: string[];          // 5-10 key terms
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



