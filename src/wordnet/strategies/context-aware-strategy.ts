/**
 * Context-Aware Synset Selection Strategy
 * 
 * Selects synsets by scoring them against query context, prioritizing
 * meanings that match the technical or domain-specific context of the query.
 * 
 * Scoring factors:
 * 1. Term overlap: Query terms appearing in synset definition
 * 2. Technical indicators: Technical vocabulary in definition
 * 3. Domain hints: User-provided domain hints
 * 4. Synonym/hypernym relevance: Related terms matching context
 * 
 * Use this strategy when:
 * - Query context is available for disambiguation
 * - Technical/domain-specific meanings are preferred
 * - Multiple synsets have similar frequency but different domains
 */

import { WordNetSynset } from '../../concepts/types.js';
import { SynsetSelectionStrategy, SelectionContext } from './synset-selection-strategy.js';

/**
 * Technical indicators for scoring synsets in technical/software contexts.
 * Words that suggest a technical meaning when found in a definition.
 */
const TECHNICAL_INDICATORS = [
  'computer', 'software', 'program', 'programming', 'process',
  'system', 'data', 'algorithm', 'network', 'digital',
  'electronic', 'code', 'computing', 'technology', 'technical',
  'engineering', 'pattern', 'design', 'structure', 'interface',
  'module', 'component', 'function', 'method', 'class',
  'object', 'instance', 'abstract', 'implementation', 'architecture'
];

/**
 * Default domain hints when none provided.
 * Can be overridden via SelectionContext.domainHints.
 */
const DEFAULT_DOMAIN_HINTS = [
  'software', 'programming', 'development', 'engineering'
];

export class ContextAwareStrategy implements SynsetSelectionStrategy {
  readonly name = 'context-aware';
  
  /** Weight for query term overlap in scoring */
  private readonly termOverlapWeight: number;
  
  /** Weight for technical indicators in scoring */
  private readonly technicalWeight: number;
  
  /** Weight for domain hint matching in scoring */
  private readonly domainWeight: number;
  
  /** Weight for synonym/hypernym relevance in scoring */
  private readonly relatedTermWeight: number;
  
  /**
   * Create a context-aware strategy with configurable weights.
   * 
   * @param weights - Optional weight configuration
   */
  constructor(weights?: {
    termOverlap?: number;
    technical?: number;
    domain?: number;
    relatedTerm?: number;
  }) {
    this.termOverlapWeight = weights?.termOverlap ?? 3.0;
    this.technicalWeight = weights?.technical ?? 1.0;
    this.domainWeight = weights?.domain ?? 2.0;
    this.relatedTermWeight = weights?.relatedTerm ?? 1.5;
  }
  
  /**
   * Select the highest-scoring synset based on context.
   * 
   * @param synsets - Available synsets from WordNet
   * @param context - Query context for disambiguation
   * @returns Best matching synset or undefined if empty
   */
  selectSynset(
    synsets: WordNetSynset[],
    context: SelectionContext
  ): WordNetSynset | undefined {
    if (synsets.length === 0) {
      return undefined;
    }
    
    // Score all synsets
    const scored = synsets.map(synset => ({
      synset,
      score: this.scoreSynset(synset, context)
    }));
    
    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    
    // Return highest scoring synset
    return scored[0].synset;
  }
  
  /**
   * Score a synset based on context relevance.
   * 
   * Scoring components:
   * - Term overlap: How many query terms appear in definition
   * - Technical indicators: Presence of technical vocabulary
   * - Domain hints: Matching user-provided domain hints
   * - Related terms: Query terms in synonyms/hypernyms
   * 
   * @param synset - Synset to score
   * @param context - Selection context
   * @returns Score from 0.0 to 1.0 (normalized)
   */
  scoreSynset(
    synset: WordNetSynset,
    context: SelectionContext
  ): number {
    if (!synset) {
      return 0.0;
    }
    
    const definition = synset.definition.toLowerCase();
    const queryTerms = context.queryTerms.map(t => t.toLowerCase());
    const domainHints = (context.domainHints || DEFAULT_DOMAIN_HINTS)
      .map(h => h.toLowerCase());
    
    let rawScore = 0;
    
    // 1. Term overlap: Query terms in definition
    const termOverlapScore = this.calculateTermOverlap(queryTerms, definition);
    rawScore += termOverlapScore * this.termOverlapWeight;
    
    // 2. Technical indicators in definition
    const technicalScore = this.calculateTechnicalScore(definition);
    rawScore += technicalScore * this.technicalWeight;
    
    // 3. Domain hint matching
    const domainScore = this.calculateDomainScore(domainHints, definition, synset);
    rawScore += domainScore * this.domainWeight;
    
    // 4. Related term relevance (query terms in synonyms/hypernyms)
    const relatedScore = this.calculateRelatedTermScore(queryTerms, synset);
    rawScore += relatedScore * this.relatedTermWeight;
    
    // Normalize to 0.0-1.0 range
    // Max possible raw score: ~7.5 * weight sum
    const maxRawScore = this.termOverlapWeight + this.technicalWeight + 
                        this.domainWeight + this.relatedTermWeight;
    
    return Math.min(rawScore / maxRawScore, 1.0);
  }
  
  /**
   * Calculate term overlap score.
   * Measures how many query terms appear in the definition.
   */
  private calculateTermOverlap(queryTerms: string[], definition: string): number {
    if (queryTerms.length === 0) {
      return 0;
    }
    
    let matches = 0;
    for (const term of queryTerms) {
      // Skip very short terms (articles, prepositions)
      if (term.length < 3) continue;
      
      // Check for word boundary match
      const wordPattern = new RegExp(`\\b${this.escapeRegex(term)}\\b`, 'i');
      if (wordPattern.test(definition)) {
        matches++;
      }
    }
    
    return matches / queryTerms.length;
  }
  
  /**
   * Calculate technical indicator score.
   * Measures presence of technical vocabulary in definition.
   */
  private calculateTechnicalScore(definition: string): number {
    let matches = 0;
    
    for (const indicator of TECHNICAL_INDICATORS) {
      if (definition.includes(indicator)) {
        matches++;
      }
    }
    
    // Normalize: more than 3 technical terms is max score
    return Math.min(matches / 3, 1.0);
  }
  
  /**
   * Calculate domain hint score.
   * Measures how well synset matches provided domain hints.
   */
  private calculateDomainScore(
    domainHints: string[], 
    definition: string,
    synset: WordNetSynset
  ): number {
    if (domainHints.length === 0) {
      return 0;
    }
    
    let matches = 0;
    const searchText = `${definition} ${synset.synonyms.join(' ')} ${synset.hypernyms.join(' ')}`.toLowerCase();
    
    for (const hint of domainHints) {
      if (searchText.includes(hint)) {
        matches++;
      }
    }
    
    return matches / domainHints.length;
  }
  
  /**
   * Calculate related term score.
   * Measures query terms appearing in synonyms/hypernyms.
   */
  private calculateRelatedTermScore(
    queryTerms: string[], 
    synset: WordNetSynset
  ): number {
    if (queryTerms.length === 0) {
      return 0;
    }
    
    const relatedText = [
      ...synset.synonyms,
      ...synset.hypernyms,
      ...synset.hyponyms
    ].join(' ').toLowerCase();
    
    let matches = 0;
    for (const term of queryTerms) {
      if (term.length < 3) continue;
      
      if (relatedText.includes(term)) {
        matches++;
      }
    }
    
    return matches / queryTerms.length;
  }
  
  /**
   * Escape special regex characters in a string.
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

/**
 * Pre-configured context-aware strategy instance.
 */
export const contextAwareStrategy = new ContextAwareStrategy();
