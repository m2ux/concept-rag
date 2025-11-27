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
  wordnetScore: number;
}

export interface ExpandedQuery {
  original_terms: string[];
  corpus_terms: string[];
  wordnet_terms: string[];
  all_terms: string[];
  weights: Map<string, number>;
}

/**
 * Calculate vector similarity score from distance.
 * 
 * @param distance - Vector distance from LanceDB (0 = identical, higher = less similar)
 * @returns Score from 0.0 to 1.0 (1.0 = perfect match)
 */
export function calculateVectorScore(distance: number): number {
  return 1 - (distance || 0);
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
  const k1 = 1.5;  // Term frequency saturation parameter
  const b = 0.75;  // Document length normalization
  
  const combinedText = `${docText} ${docSource}`.toLowerCase();
  const docWords = combinedText.split(/\s+/);
  const avgDocLength = 100;  // Approximate average
  const docLength = docWords.length;
  
  let score = 0;
  let totalWeight = 0;
  
  for (const term of terms) {
    const termLower = term.toLowerCase();
    const weight = weights.get(termLower) || 0.5;  // Default weight
    totalWeight += weight;
    
    // Count term frequency (fuzzy matching)
    let termFreq = 0;
    for (const word of docWords) {
      if (word.includes(termLower) || termLower.includes(word)) {
        termFreq += 1;
      }
    }
    
    if (termFreq > 0) {
      const numerator = termFreq * (k1 + 1);
      const denominator = termFreq + k1 * (1 - b + b * (docLength / avgDocLength));
      score += (numerator / denominator) * weight;  // Apply term weight
    }
  }
  
  // Normalize by total weight to get 0-1 range
  return totalWeight > 0 ? Math.min(score / totalWeight, 1.0) : 0;
}

/**
 * Calculate title matching score.
 * 
 * Gives high scores to documents whose titles contain query terms.
 * Important for document-level search (catalog).
 * 
 * @param terms - Original query terms
 * @param source - Document source path (contains title/filename)
 * @returns Score from 0.0 to 1.0
 */
export function calculateTitleScore(terms: string[], source: string): number {
  if (!source || terms.length === 0) return 0;
  
  const sourceLower = source.toLowerCase();
  const filename = source.split('/').pop() || source;
  const filenameLower = filename.toLowerCase();
  
  let matches = 0;
  for (const term of terms) {
    const termLower = term.toLowerCase();
    // Prioritize filename matches over full path
    if (filenameLower.includes(termLower)) {
      matches += 2;  // Double weight for filename matches
    } else if (sourceLower.includes(termLower)) {
      matches += 1;
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
    
    let weightedScore = 0;
    
    // Match query terms against document concepts
    for (const queryConcept of expanded.all_terms) {
      const queryWeight = expanded.weights.get(queryConcept) || 0.5;
      
      // Fuzzy matching
      for (const docConcept of allConcepts) {
        if (docConcept.includes(queryConcept) || queryConcept.includes(docConcept)) {
          weightedScore += queryWeight;
          break;  // Count each query term once
        }
      }
    }
    
    // Normalize by number of query terms
    return Math.min(weightedScore / Math.max(expanded.all_terms.length, 1), 1.0);
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
 * Calculate final hybrid score from component scores.
 * 
 * Applies weighted combination of all scoring signals:
 * - 30% Vector similarity (semantic understanding)
 * - 30% BM25 (keyword relevance)
 * - 25% Title matching (document relevance)
 * - 15% WordNet (semantic enrichment)
 * 
 * Note: Concept scoring was removed - use concept_search tool instead
 * for concept-based discovery.
 * 
 * @param components - Individual score components
 * @returns Final hybrid score from 0.0 to 1.0
 */
export function calculateHybridScore(components: ScoreComponents): number {
  return (
    (components.vectorScore * 0.30) +
    (components.bm25Score * 0.30) +
    (components.titleScore * 0.25) +
    (components.wordnetScore * 0.15)
  );
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
    const metadata = result.concepts;
    if (!metadata) return [];
    
    const allConcepts = metadata.primary_concepts || [];
    const matched: string[] = [];
    
    for (const queryConcept of expanded.all_terms) {
      for (const docConcept of allConcepts) {
        if (docConcept.toLowerCase().includes(queryConcept) || 
            queryConcept.includes(docConcept.toLowerCase())) {
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

