/**
 * Strategy interface for selecting the most appropriate WordNet synset.
 * 
 * Different strategies can be used to select synsets based on various criteria:
 * - First synset (default WordNet ordering by frequency)
 * - Context-aware (scores against query/document context)
 * - Technical domain (prioritizes technical meanings)
 * 
 * Implements the Strategy Pattern to allow runtime selection of synset
 * disambiguation algorithms.
 */

import { WordNetSynset } from '../../concepts/types.js';

/**
 * Context information for synset selection.
 * Provides surrounding terms and optional domain hints for disambiguation.
 */
export interface SelectionContext {
  /** Original query terms for context matching */
  queryTerms: string[];
  
  /** Document text snippet for semantic context (optional) */
  documentContext?: string;
  
  /** Domain hints for technical filtering (optional) */
  domainHints?: string[];
}

/**
 * Strategy interface for synset selection.
 * 
 * Implementations encapsulate different algorithms for choosing
 * the most appropriate synset from WordNet's multiple meanings.
 */
export interface SynsetSelectionStrategy {
  /** Strategy name for logging and debugging */
  readonly name: string;
  
  /**
   * Select the most appropriate synset from available options.
   * 
   * @param synsets - Available synsets from WordNet lookup
   * @param context - Selection context (query terms, document context, etc.)
   * @returns The selected synset, or undefined if no suitable match
   */
  selectSynset(
    synsets: WordNetSynset[],
    context: SelectionContext
  ): WordNetSynset | undefined;
  
  /**
   * Score a synset for ranking purposes.
   * 
   * @param synset - Synset to score
   * @param context - Selection context
   * @returns Score from 0.0 to 1.0 (higher = better match)
   */
  scoreSynset(
    synset: WordNetSynset,
    context: SelectionContext
  ): number;
}
