/**
 * First Synset Selection Strategy
 * 
 * Selects the first synset from WordNet results, which is ordered by
 * frequency of usage in the WordNet corpus. This is the default behavior
 * and provides backward compatibility.
 * 
 * Use this strategy when:
 * - No context is available for disambiguation
 * - General/common meanings are preferred
 * - Performance is critical (no scoring overhead)
 */

import { WordNetSynset } from '../../concepts/types.js';
import { SynsetSelectionStrategy, SelectionContext } from './synset-selection-strategy.js';

export class FirstSynsetStrategy implements SynsetSelectionStrategy {
  readonly name = 'first-synset';
  
  /**
   * Select the first synset (most common meaning by WordNet frequency).
   * 
   * @param synsets - Available synsets from WordNet
   * @param _context - Ignored in this strategy
   * @returns First synset or undefined if empty
   */
  selectSynset(
    synsets: WordNetSynset[],
    _context: SelectionContext
  ): WordNetSynset | undefined {
    if (synsets.length === 0) {
      return undefined;
    }
    return synsets[0];
  }
  
  /**
   * Score based on position in WordNet results.
   * First synset gets 1.0, subsequent synsets get decreasing scores.
   * 
   * @param synset - Synset to score
   * @param _context - Ignored in this strategy
   * @returns Score based on assumed position (1.0 for any synset since we don't track position)
   */
  scoreSynset(
    synset: WordNetSynset,
    _context: SelectionContext
  ): number {
    // Without position information, return constant score
    // The selection logic handles ordering
    return synset ? 1.0 : 0.0;
  }
}

/**
 * Default strategy instance for convenience.
 */
export const defaultStrategy = new FirstSynsetStrategy();


