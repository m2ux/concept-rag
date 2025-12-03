/**
 * Dynamic Weight Adjustment for Hybrid Search Scoring
 * 
 * Analyzes query characteristics to determine optimal weighting for
 * WordNet contribution in hybrid scoring. Increases WordNet weight
 * when the query would benefit from semantic expansion.
 * 
 * Query characteristics that increase WordNet weight:
 * - Single-term queries (benefit most from synonym expansion)
 * - Queries with few/no concept matches (need vocabulary bridging)
 * - Queries with common/ambiguous terms (need disambiguation)
 * 
 * Query characteristics that decrease WordNet weight:
 * - Multi-term technical queries (specific enough already)
 * - Queries with strong concept matches (corpus signals sufficient)
 * - Queries with rare/specific terms (WordNet may not help)
 */

import { ExpandedQuery } from './scoring-strategies.js';

/**
 * Weight profile for a specific search type.
 */
export interface WeightProfile {
  vectorWeight: number;
  bm25Weight: number;
  titleWeight: number;
  conceptWeight: number;
  wordnetWeight: number;
}

/**
 * Query analysis result with characteristics.
 */
export interface QueryAnalysis {
  /** Number of original query terms */
  termCount: number;
  
  /** Whether query is single-term */
  isSingleTerm: boolean;
  
  /** Number of WordNet expanded terms */
  wordnetTermCount: number;
  
  /** Number of concept expanded terms */
  conceptTermCount: number;
  
  /** Ratio of WordNet terms to original terms */
  wordnetExpansionRatio: number;
  
  /** Whether query has strong corpus/concept signals */
  hasStrongConceptSignal: boolean;
  
  /** Recommended WordNet weight boost factor (1.0 = no change) */
  wordnetBoostFactor: number;
  
  /** Reason for the boost factor */
  boostReason: string;
}

/**
 * Default weight profiles for each search type.
 */
export const DEFAULT_WEIGHTS = {
  catalog: {
    vectorWeight: 0.30,
    bm25Weight: 0.25,
    titleWeight: 0.20,
    conceptWeight: 0.15,
    wordnetWeight: 0.10
  },
  chunk: {
    vectorWeight: 0.35,
    bm25Weight: 0.30,
    titleWeight: 0.00,  // Not used for chunks
    conceptWeight: 0.20,
    wordnetWeight: 0.15
  },
  concept: {
    vectorWeight: 0.30,
    bm25Weight: 0.20,
    titleWeight: 0.40,  // Name score
    conceptWeight: 0.00,
    wordnetWeight: 0.10
  }
};

/**
 * Maximum WordNet weight boost factor.
 * Prevents WordNet from dominating the score.
 */
export const MAX_WORDNET_BOOST = 2.5;

/**
 * Minimum WordNet weight boost factor.
 * Ensures WordNet always contributes something.
 */
export const MIN_WORDNET_BOOST = 0.5;

/**
 * Analyze query characteristics to determine optimal WordNet weighting.
 * 
 * @param expanded - Expanded query from QueryExpander
 * @returns Analysis with boost factor and reasoning
 */
export function analyzeQuery(expanded: ExpandedQuery): QueryAnalysis {
  const termCount = expanded.original_terms.length;
  const isSingleTerm = termCount === 1;
  const wordnetTermCount = expanded.wordnet_terms.length;
  const conceptTermCount = expanded.concept_terms.length;
  
  // Calculate expansion ratio (how much WordNet expanded the query)
  const wordnetExpansionRatio = termCount > 0 
    ? wordnetTermCount / termCount 
    : 0;
  
  // Determine if query has strong concept signals
  // (concept_terms indicates corpus found related concepts)
  const hasStrongConceptSignal = conceptTermCount >= termCount;
  
  // Calculate boost factor based on characteristics
  let boostFactor = 1.0;
  let boostReason = 'standard weighting';
  
  // Single-term queries benefit most from WordNet expansion
  if (isSingleTerm) {
    if (!hasStrongConceptSignal) {
      // Single term, no concept matches - WordNet is crucial
      boostFactor = 2.0;
      boostReason = 'single-term query without concept matches';
    } else {
      // Single term but has concept matches - moderate boost
      boostFactor = 1.5;
      boostReason = 'single-term query with concept matches';
    }
  }
  // Multi-term queries with low concept matches
  else if (termCount <= 3 && !hasStrongConceptSignal) {
    boostFactor = 1.5;
    boostReason = 'short query without strong concept signal';
  }
  // Multi-term queries with strong concept matches - reduce WordNet
  else if (termCount > 3 && hasStrongConceptSignal) {
    boostFactor = 0.75;
    boostReason = 'multi-term query with strong concept matches';
  }
  // High WordNet expansion suggests WordNet found good synonyms
  else if (wordnetExpansionRatio > 3) {
    boostFactor = 1.25;
    boostReason = 'high WordNet expansion ratio';
  }
  
  // Clamp to valid range
  boostFactor = Math.max(MIN_WORDNET_BOOST, Math.min(boostFactor, MAX_WORDNET_BOOST));
  
  return {
    termCount,
    isSingleTerm,
    wordnetTermCount,
    conceptTermCount,
    wordnetExpansionRatio,
    hasStrongConceptSignal,
    wordnetBoostFactor: boostFactor,
    boostReason
  };
}

/**
 * Calculate adjusted weights for catalog search.
 * 
 * Applies dynamic WordNet boost while maintaining weight sum of 1.0.
 * Redistributes weight from lower-priority signals.
 * 
 * @param analysis - Query analysis result
 * @returns Adjusted weight profile
 */
export function getAdjustedCatalogWeights(analysis: QueryAnalysis): WeightProfile {
  const base = { ...DEFAULT_WEIGHTS.catalog };
  
  if (analysis.wordnetBoostFactor === 1.0) {
    return base;
  }
  
  // Calculate new WordNet weight
  const oldWordnetWeight = base.wordnetWeight;
  const newWordnetWeight = Math.min(oldWordnetWeight * analysis.wordnetBoostFactor, 0.25);
  const weightDelta = newWordnetWeight - oldWordnetWeight;
  
  // Redistribute weight from bm25 and title (lower priority for semantic queries)
  return {
    vectorWeight: base.vectorWeight,  // Keep semantic signal strong
    bm25Weight: base.bm25Weight - (weightDelta * 0.5),
    titleWeight: base.titleWeight - (weightDelta * 0.5),
    conceptWeight: base.conceptWeight,  // Keep concept signal
    wordnetWeight: newWordnetWeight
  };
}

/**
 * Calculate adjusted weights for chunk search.
 * 
 * @param analysis - Query analysis result
 * @returns Adjusted weight profile
 */
export function getAdjustedChunkWeights(analysis: QueryAnalysis): WeightProfile {
  const base = { ...DEFAULT_WEIGHTS.chunk };
  
  if (analysis.wordnetBoostFactor === 1.0) {
    return base;
  }
  
  // Calculate new WordNet weight
  const oldWordnetWeight = base.wordnetWeight;
  const newWordnetWeight = Math.min(oldWordnetWeight * analysis.wordnetBoostFactor, 0.30);
  const weightDelta = newWordnetWeight - oldWordnetWeight;
  
  // Redistribute weight from bm25 (less important for semantic queries)
  return {
    vectorWeight: base.vectorWeight,  // Keep semantic signal strong
    bm25Weight: base.bm25Weight - weightDelta,
    titleWeight: base.titleWeight,
    conceptWeight: base.conceptWeight,  // Keep concept signal
    wordnetWeight: newWordnetWeight
  };
}

/**
 * Calculate adjusted weights for concept search.
 * 
 * @param analysis - Query analysis result
 * @returns Adjusted weight profile
 */
export function getAdjustedConceptWeights(analysis: QueryAnalysis): WeightProfile {
  const base = { ...DEFAULT_WEIGHTS.concept };
  
  if (analysis.wordnetBoostFactor === 1.0) {
    return base;
  }
  
  // Calculate new WordNet weight
  const oldWordnetWeight = base.wordnetWeight;
  const newWordnetWeight = Math.min(oldWordnetWeight * analysis.wordnetBoostFactor, 0.20);
  const weightDelta = newWordnetWeight - oldWordnetWeight;
  
  // Redistribute weight from bm25
  return {
    vectorWeight: base.vectorWeight,
    bm25Weight: Math.max(base.bm25Weight - weightDelta, 0.10),
    titleWeight: base.titleWeight,  // Keep name matching priority
    conceptWeight: base.conceptWeight,
    wordnetWeight: newWordnetWeight
  };
}

/**
 * Calculate hybrid score with dynamic weights.
 * 
 * @param components - Score components
 * @param weights - Weight profile to apply
 * @returns Final hybrid score from 0.0 to 1.0
 */
export function calculateDynamicHybridScore(
  components: {
    vectorScore: number;
    bm25Score: number;
    titleScore: number;
    conceptScore: number;
    wordnetScore: number;
  },
  weights: WeightProfile
): number {
  return (
    (components.vectorScore * weights.vectorWeight) +
    (components.bm25Score * weights.bm25Weight) +
    (components.titleScore * weights.titleWeight) +
    (components.conceptScore * weights.conceptWeight) +
    (components.wordnetScore * weights.wordnetWeight)
  );
}

