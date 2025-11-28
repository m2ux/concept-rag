import * as lancedb from "@lancedb/lancedb";
import { ExpandedQuery } from './types.js';
import { WordNetService } from '../wordnet/wordnet_service.js';
import { EmbeddingService } from '../domain/interfaces/services/embedding-service.js';

export class QueryExpander {
    private wordnet: WordNetService;
    private conceptTable: lancedb.Table;
    private embeddingService: EmbeddingService;
    
    constructor(conceptTable: lancedb.Table, embeddingService: EmbeddingService) {
        this.wordnet = new WordNetService();
        this.conceptTable = conceptTable;
        this.embeddingService = embeddingService;
    }
    
    async expandQuery(queryText: string): Promise<ExpandedQuery> {
        // Extract terms from query
        const originalTerms = queryText
            .toLowerCase()
            .split(/\s+/)
            .filter(term => term.length > 2)
            .map(term => term.replace(/[^\w\s]/g, ''))
            .filter(term => term.length > 0);
        
        // Expand with WordNet (parallel with corpus)
        const [wordnetExpanded, corpusExpanded] = await Promise.all([
            this.wordnet.expandQuery(originalTerms, 5, 2),
            this.expandWithCorpus(originalTerms)
        ]);
        
        // Combine with weights
        const allTerms = new Map<string, number>();
        
        // Add original terms (highest weight)
        for (const term of originalTerms) {
            allTerms.set(term, 1.0);
        }
        
        // Add corpus terms (high weight - 80%)
        for (const [term, weight] of corpusExpanded.entries()) {
            const existing = allTerms.get(term) || 0;
            allTerms.set(term, Math.max(existing, weight * 0.8));
        }
        
        // Add WordNet terms (medium weight - 60%)
        for (const [term, weight] of wordnetExpanded.entries()) {
            const existing = allTerms.get(term) || 0;
            allTerms.set(term, Math.max(existing, weight * 0.6));
        }
        
        return {
            original_terms: originalTerms,
            corpus_terms: Array.from(corpusExpanded.keys()).filter(t => !originalTerms.includes(t)),
            wordnet_terms: Array.from(wordnetExpanded.keys()).filter(t => !originalTerms.includes(t)),
            all_terms: Array.from(allTerms.keys()),
            weights: allTerms
        };
    }
    
    private async expandWithCorpus(terms: string[]): Promise<Map<string, number>> {
        const expanded = new Map<string, number>();
        
        // Original terms
        for (const term of terms) {
            expanded.set(term, 1.0);
        }
        
        // Search concept index for matching concepts
        try {
            const queryVector = this.embeddingService.generateEmbedding(terms.join(' '));
            const results = await this.conceptTable
                .vectorSearch(queryVector)
                .limit(15)  // Increased to get more candidates
                .toArray();
            
            for (const result of results) {
                const concept = result.name.toLowerCase();
                const conceptType = result.concept_type;  // 'thematic' or 'terminology'
                const weight = 1 - (result._distance || 0);
                
                // Apply type-specific expansion strategy
                if (conceptType === 'thematic') {
                    // Thematic concepts: Aggressive expansion
                    if (weight > 0.3 && !expanded.has(concept)) {
                        expanded.set(concept, weight * 0.85);  // Higher weight for thematic
                    }
                    
                    // Add related concepts for thematic (they're abstract and benefit from expansion)
                    try {
                        const relatedConcepts = JSON.parse(result.related_concepts || '[]');
                        for (const related of relatedConcepts.slice(0, 4)) {  // Top 4 related
                            const relatedLower = related.toLowerCase();
                            if (!expanded.has(relatedLower) && weight > 0.4) {
                                expanded.set(relatedLower, weight * 0.6);  // Boost related
                            }
                        }
                    } catch (e) {
                        // Skip if parsing fails
                    }
                } else if (conceptType === 'terminology') {
                    // Terminology: Conservative expansion (only high-confidence matches)
                    if (weight > 0.6 && !expanded.has(concept)) {  // Higher threshold
                        expanded.set(concept, weight * 0.7);  // Lower weight boost
                    }
                    // Do NOT expand related concepts for terminology (preserve precision)
                }
            }
        } catch (e: any) {
            console.error('Corpus expansion error:', e.message);
        }
        
        return expanded;
    }
}



