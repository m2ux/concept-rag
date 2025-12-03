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
    name: string;
    summary?: string;
    catalog_ids: number[];
    /** DERIVED: Human-readable document titles (from catalog.source paths) */
    catalog_titles?: string[];
    chunk_ids?: number[];
    /** Co-occurrence based links (concepts appearing together in documents) */
    adjacent_ids?: number[];
    /** Lexically-linked concepts (sharing significant words) */
    related_ids?: number[];
    related_concepts?: string[];
    synonyms?: string[];
    broader_terms?: string[];
    narrower_terms?: string[];
    embeddings: number[];
    weight: number;
}

/**
 * Individual concept with its summary (from LLM extraction).
 */
export interface ExtractedConcept {
    name: string;
    /** One-sentence summary generated in context of the source document */
    summary: string;
}

/**
 * Concept metadata returned by LLM extraction.
 * 
 * Note: primary_concepts can be either:
 * - ExtractedConcept[] (new format with summaries)
 * - string[] (legacy format without summaries)
 * 
 * Use normalizeConceptMetadata() to handle both formats.
 */
export interface ConceptMetadata {
    primary_concepts: (ExtractedConcept | string)[];
    categories: string[];
}

/**
 * Normalize concept metadata to always have ExtractedConcept[] format.
 * Handles both legacy (string[]) and new (ExtractedConcept[]) formats.
 */
export function normalizeConceptMetadata(metadata: ConceptMetadata): { 
    concepts: ExtractedConcept[]; 
    categories: string[] 
} {
    const concepts: ExtractedConcept[] = metadata.primary_concepts.map(c => {
        if (typeof c === 'string') {
            // Legacy format: convert string to object with empty summary
            return { name: c, summary: '' };
        }
        // New format: already an ExtractedConcept
        return c;
    });
    
    return {
        concepts,
        categories: metadata.categories
    };
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
    corpus_terms: string[];            // From concept index vector search
    concept_terms: string[];           // From concept hybrid search (names + related)
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
