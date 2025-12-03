/**
 * Scoring strategies for hybrid search.
 * 
 * Each strategy calculates a score from 0.0 to 1.0 for different ranking signals.
 * These are combined in a weighted manner to produce the final hybrid score.
 */

export interface ScoreComponents {
  vectorScore: number;
  bm25Score: number;
  titleScore: number;
  conceptScore: number;
  wordnetScore: number;
}

export interface ExpandedQuery {
  original_terms: string[];
  corpus_terms: string[];
  concept_terms: string[];
  wordnet_terms: string[];
  all_terms: string[];
  weights: Map<string, number>;
}

/**
 * Calculate vector similarity score from distance.
 * 
 * @param distance - Vector distance from LanceDB (0 = identical, higher = less similar)
 * @returns Score from 0.0 to 1.0 (1.0 = perfect match, clamped to prevent negatives)
 */
export function calculateVectorScore(distance: number): number {
  const score = 1 - (distance || 0);
  return Math.max(0, Math.min(score, 1));  // Clamp to 0-1 range
}

/**
 * Calculate BM25 score with term weighting.
 * 
 * BM25 is a probabilistic ranking function that accounts for:
 * - Term frequency (how often term appears in document)
 * - Document length (normalize for longer documents)
 * - Term importance (via weights from query expansion)
 * 
 * @param terms - Search terms to score
 * @param weights - Weight for each term (from query expansion)
 * @param docText - Document text to score against
 * @param docSource - Document source path (also scored)
 * @returns Normalized score from 0.0 to 1.0
 */
export function calculateWeightedBM25(
  terms: string[],
  weights: Map<string, number>,
  docText: string,
  docSource: string
): number {
  if (terms.length === 0) return 0;
  
  const k1 = 1.5;  // Term frequency saturation parameter
  const b = 0.75;  // Document length normalization
  
  const combinedText = `${docText} ${docSource}`.toLowerCase();
  // Tokenize into words, removing punctuation
  const docWords = combinedText.split(/[\s.,;:!?()[\]{}'"]+/).filter(w => w.length > 0);
  const avgDocLength = 100;  // Approximate average
  const docLength = docWords.length;
  
  let rawScore = 0;
  let termsMatched = 0;
  
  for (const term of terms) {
    const termLower = term.toLowerCase();
    const weight = weights.get(termLower) || 0.5;  // Default weight
    
    // Count term frequency with stricter matching:
    // - Exact word match gets full score
    // - Word starts with term (prefix match) gets partial score
    let termFreq = 0;
    for (const word of docWords) {
      if (word === termLower) {
        termFreq += 1.0;  // Exact match
      } else if (word.startsWith(termLower) && termLower.length >= 3) {
        termFreq += 0.5;  // Prefix match (e.g., "war" matches "warfare")
      } else if (termLower.length >= 4 && word.length >= 4 && word.includes(termLower)) {
        termFreq += 0.25;  // Substring match (only for longer terms)
      }
    }
    
    if (termFreq > 0) {
      termsMatched++;
      // BM25 formula
      const numerator = termFreq * (k1 + 1);
      const denominator = termFreq + k1 * (1 - b + b * (docLength / avgDocLength));
      rawScore += (numerator / denominator) * weight;
    }
  }
  
  // No matches = 0 score
  if (termsMatched === 0) return 0;
  
  // Normalize: consider both the raw BM25 score and term coverage
  // - termCoverage: what fraction of query terms matched (rewards comprehensive matches)
  // - rawScore is already weighted, normalize by expected max (roughly 2.5 per matching term)
  const termCoverage = termsMatched / terms.length;
  const expectedMaxPerTerm = 2.5;  // BM25 saturates around this value per term
  const normalizedRaw = rawScore / (termsMatched * expectedMaxPerTerm);
  
  // Combine: weight term coverage more heavily to discriminate documents
  // that match more query terms
  const finalScore = (normalizedRaw * 0.5) + (termCoverage * 0.5);
  
  return Math.min(Math.max(finalScore, 0), 1.0);
}

/**
 * Calculate title matching score.
 * 
 * Gives high scores to documents whose titles contain query terms.
 * Uses word boundary matching to avoid false positives (e.g., "war" in "software").
 * Important for document-level search (catalog).
 * 
 * @param terms - Original query terms
 * @param source - Document source path (contains title/filename)
 * @returns Score from 0.0 to 1.0
 */
export function calculateTitleScore(terms: string[], source: string): number {
  if (!source || terms.length === 0) return 0;
  
  const filename = source.split('/').pop() || source;
  // Tokenize filename into words (split on non-alphanumeric characters)
  const filenameWords = filename.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 0);
  const sourceWords = source.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 0);
  
  let matches = 0;
  for (const term of terms) {
    const termLower = term.toLowerCase();
    // Check for whole word match in filename
    if (filenameWords.includes(termLower)) {
      matches += 2;  // Double weight for filename matches
    } else if (sourceWords.includes(termLower)) {
      matches += 1;  // Single weight for path matches
    } else {
      // Partial match: term is prefix of a word (e.g., "architect" matches "architecture")
      const hasFilenamePrefix = filenameWords.some(w => w.startsWith(termLower) && termLower.length >= 4);
      const hasSourcePrefix = sourceWords.some(w => w.startsWith(termLower) && termLower.length >= 4);
      if (hasFilenamePrefix) {
        matches += 1;  // Reduced weight for prefix match
      } else if (hasSourcePrefix) {
        matches += 0.5;
      }
    }
  }
  
  // Normalize by number of terms (bonus for multiple matches)
  return Math.min(matches / (terms.length * 2), 1.0);
}

/**
 * Calculate name matching score (for concept search).
 * 
 * Gives high scores to concepts whose names contain query terms.
 * Used instead of titleScore for concept search.
 * 
 * @param terms - Original query terms
 * @param name - Concept name to match against
 * @returns Score from 0.0 to 1.0
 */
export function calculateNameScore(terms: string[], name: string): number {
  if (!name || terms.length === 0) return 0;
  
  const nameLower = name.toLowerCase();
  
  let matches = 0;
  let exactMatch = false;
  
  for (const term of terms) {
    const termLower = term.toLowerCase();
    
    // Check for exact match (concept name equals query term)
    if (nameLower === termLower) {
      exactMatch = true;
      matches += 3;  // Triple weight for exact match
    }
    // Check for substring match
    else if (nameLower.includes(termLower)) {
      matches += 2;  // Double weight for substring
    }
    // Check for term containing concept name (e.g., "dependency injection patterns" contains "dependency injection")
    else if (termLower.includes(nameLower)) {
      matches += 1.5;
    }
  }
  
  // Bonus for exact match
  if (exactMatch) {
    return 1.0;
  }
  
  // Normalize by number of terms
  return Math.min(matches / (terms.length * 2), 1.0);
}

/**
 * Calculate concept matching score.
 * 
 * Scores documents based on concept alignment between query and document.
 * Uses fuzzy matching to handle variations.
 * 
 * @param expanded - Expanded query with terms and weights
 * @param result - Search result with concepts metadata
 * @returns Score from 0.0 to 1.0
 */
export function calculateConceptScore(
  expanded: ExpandedQuery,
  result: any
): number {
  try {
    const metadata = result.concepts;
    if (!metadata) return 0;
    
    // Get all document concepts
    const allConcepts = (metadata.primary_concepts || [])
      .map((c: string) => c.toLowerCase());
    
    if (allConcepts.length === 0) return 0;
    
    // Only use original terms + concept terms for concept scoring
    // (not corpus/wordnet terms which may be unrelated)
    const relevantTerms = [
      ...expanded.original_terms,
      ...expanded.concept_terms
    ];
    
    if (relevantTerms.length === 0) return 0;
    
    let weightedScore = 0;
    
    // Match query terms against document concepts
    for (const queryConcept of relevantTerms) {
      const queryWeight = expanded.weights.get(queryConcept) || 0.5;
      
      // Fuzzy matching
      for (const docConcept of allConcepts) {
        if (docConcept.includes(queryConcept) || queryConcept.includes(docConcept)) {
          weightedScore += queryWeight;
          break;  // Count each query term once
        }
      }
    }
    
    // Normalize by number of relevant terms
    return Math.min(weightedScore / Math.max(relevantTerms.length, 1), 1.0);
  } catch (e) {
    return 0;
  }
}

/**
 * Calculate WordNet bonus score.
 * 
 * Rewards documents that contain synonyms and related terms from WordNet.
 * Provides semantic expansion beyond exact matches.
 * 
 * @param wordnetTerms - Expanded terms from WordNet
 * @param docText - Document text to score
 * @returns Score from 0.0 to 1.0
 */
export function calculateWordNetBonus(
  wordnetTerms: string[],
  docText: string
): number {
  if (wordnetTerms.length === 0) return 0;
  
  const docLower = docText.toLowerCase();
  let matches = 0;
  
  for (const term of wordnetTerms) {
    if (docLower.includes(term.toLowerCase())) {
      matches++;
    }
  }
  
  return matches / Math.max(wordnetTerms.length, 1);
}

/**
 * Calculate hybrid score for catalog/document search.
 * 
 * Applies weighted combination optimized for document discovery:
 * - 30% Vector similarity (semantic understanding)
 * - 25% BM25 (keyword relevance)
 * - 20% Title matching (document title/filename relevance)
 * - 15% Concept matching (concept alignment)
 * - 10% WordNet (semantic enrichment)
 * 
 * @param components - Individual score components
 * @returns Final hybrid score from 0.0 to 1.0
 */
export function calculateCatalogHybridScore(components: ScoreComponents): number {
  return (
    (components.vectorScore * 0.30) +
    (components.bm25Score * 0.25) +
    (components.titleScore * 0.20) +
    (components.conceptScore * 0.15) +
    (components.wordnetScore * 0.10)
  );
}

/**
 * Calculate hybrid score for chunk search.
 * 
 * Applies weighted combination optimized for text passage retrieval:
 * - 35% Vector similarity (semantic understanding - primary signal)
 * - 35% BM25 (keyword relevance - critical for specific terms)
 * - 15% Concept matching (concept alignment)
 * - 15% WordNet (semantic enrichment)
 * 
 * Note: Title scoring excluded - chunks don't have meaningful titles.
 * The catalog_title field is for display only, not relevance ranking.
 * 
 * @param components - Individual score components (titleScore ignored)
 * @returns Final hybrid score from 0.0 to 1.0
 */
export function calculateChunkHybridScore(components: ScoreComponents): number {
  return (
    (components.vectorScore * 0.35) +
    (components.bm25Score * 0.30) +
    (components.conceptScore * 0.20) +
    (components.wordnetScore * 0.15)
  );
}

/**
 * Calculate hybrid score for concept search.
 * 
 * Applies weighted combination optimized for concept discovery:
 * - 40% Name matching (exact/partial concept name match is primary)
 * - 30% Vector similarity (semantic similarity to find related concepts)
 * - 20% BM25 (keyword matching in concept summary)
 * - 10% WordNet (synonym/hierarchy expansion)
 * 
 * Note: For concepts, we use nameScore in the titleScore slot since concepts
 * don't have titles - they have names.
 * 
 * @param components - Individual score components (titleScore = nameScore)
 * @returns Final hybrid score from 0.0 to 1.0
 */
export function calculateConceptHybridScore(components: ScoreComponents): number {
  return (
    (components.titleScore * 0.40) +  // Name score (most important for concepts)
    (components.vectorScore * 0.30) +
    (components.bm25Score * 0.20) +
    (components.wordnetScore * 0.10)
  );
}

/**
 * Calculate concept match score from expanded concept terms.
 * 
 * Scores documents based on how many of the query's expanded concept terms
 * match the document's concept names.
 * 
 * @param conceptTerms - Expanded concept terms from QueryExpander
 * @param docConceptNames - Document's concept names (concept_names field)
 * @returns Score from 0.0 to 1.0
 */
export function calculateConceptMatchScore(
  conceptTerms: string[],
  docConceptNames: string[]
): number {
  if (conceptTerms.length === 0 || docConceptNames.length === 0) return 0;
  
  const docConceptsLower = docConceptNames
    .filter(c => c && c.length > 0)
    .map(c => c.toLowerCase());
  
  if (docConceptsLower.length === 0) return 0;
  
  let matches = 0;
  
  for (const term of conceptTerms) {
    const termLower = term.toLowerCase();
    
    // Check for any matching concepts
    for (const docConcept of docConceptsLower) {
      // Exact match or partial match (term is part of concept or vice versa)
      if (docConcept === termLower) {
        matches += 1.5;  // Exact match gets bonus
        break;
      } else if (docConcept.includes(termLower) || termLower.includes(docConcept)) {
        matches += 1;
        break;  // Count each term once
      }
    }
  }
  
  // Normalize by number of concept terms
  return Math.min(matches / conceptTerms.length, 1.0);
}

/**
 * Calculate synonym matching bonus for concept search.
 * 
 * Boosts score when query terms match concept synonyms or hierarchy terms.
 * 
 * @param queryTerms - Original query terms
 * @param synonyms - Concept synonyms
 * @param broaderTerms - Concept hypernyms (broader terms)
 * @param narrowerTerms - Concept hyponyms (narrower terms)
 * @returns Score from 0.0 to 1.0
 */
export function calculateSynonymMatchScore(
  queryTerms: string[],
  synonyms: string[],
  broaderTerms: string[],
  narrowerTerms: string[]
): number {
  if (queryTerms.length === 0) return 0;
  
  const allRelated = [
    ...synonyms.map(s => s.toLowerCase()),
    ...broaderTerms.map(s => s.toLowerCase()),
    ...narrowerTerms.map(s => s.toLowerCase())
  ];
  
  if (allRelated.length === 0) return 0;
  
  let matches = 0;
  for (const term of queryTerms) {
    const termLower = term.toLowerCase();
    for (const related of allRelated) {
      if (related.includes(termLower) || termLower.includes(related)) {
        matches++;
        break;
      }
    }
  }
  
  return Math.min(matches / queryTerms.length, 1.0);
}

/**
 * Calculate hybrid score (legacy - defaults to catalog scoring).
 * @deprecated Use calculateCatalogHybridScore, calculateChunkHybridScore, or calculateConceptHybridScore instead
 */
export function calculateHybridScore(components: ScoreComponents): number {
  return calculateCatalogHybridScore(components);
}

/**
 * Get matched concepts between query and result.
 * 
 * Helper function to extract which document concepts matched the query.
 * Useful for debug output and result explanation.
 * 
 * @param expanded - Expanded query
 * @param result - Search result with concepts
 * @returns Array of matched concept names (limited to top 5)
 */
export function getMatchedConcepts(
  expanded: ExpandedQuery,
  result: any
): string[] {
  try {
    // New schema: concept_names is a direct array field on the row
    let allConcepts: string[] = [];
    
    if (result.concept_names) {
      // Handle Arrow Vector or regular array
      if (Array.isArray(result.concept_names)) {
        allConcepts = result.concept_names;
      } else if (typeof result.concept_names === 'object' && 'toArray' in result.concept_names) {
        allConcepts = Array.from(result.concept_names.toArray());
      }
    }
    // Legacy fallback: concepts.primary_concepts
    else if (result.concepts?.primary_concepts) {
      allConcepts = result.concepts.primary_concepts;
    }
    
    if (allConcepts.length === 0) return [];
    
    const matched: string[] = [];
    
    for (const queryConcept of expanded.all_terms) {
      const queryLower = queryConcept.toLowerCase();
      for (const docConcept of allConcepts) {
        if (!docConcept || docConcept === '') continue;
        const docLower = docConcept.toLowerCase();
        if (docLower.includes(queryLower) || queryLower.includes(docLower)) {
          matched.push(docConcept);
        }
      }
    }
    
    // Return unique concepts, limited to 5
    return [...new Set(matched)].slice(0, 5);
  } catch (e) {
    return [];
  }
}
