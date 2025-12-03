/**
 * WordNet Synset Selection Strategies
 * 
 * Provides pluggable algorithms for selecting the most appropriate
 * WordNet synset based on context and domain requirements.
 */

export type { 
  SynsetSelectionStrategy, 
  SelectionContext 
} from './synset-selection-strategy.js';

export { 
  FirstSynsetStrategy, 
  defaultStrategy 
} from './first-synset-strategy.js';

export {
  ContextAwareStrategy,
  contextAwareStrategy
} from './context-aware-strategy.js';

