import * as lancedb from "@lancedb/lancedb";
import { ExpandedQuery } from './types.js';
import { WordNetService } from '../wordnet/wordnet_service.js';
import { ContextAwareStrategy } from '../wordnet/strategies/index.js';
import { EmbeddingService } from '../domain/interfaces/services/embedding-service.js';
import { ConceptRepository } from '../domain/interfaces/repositories/concept-repository.js';

export class QueryExpander {
    private wordnet: WordNetService;
    private conceptTable: lancedb.Table;
    private embeddingService: EmbeddingService;
    private conceptRepo?: ConceptRepository;
    
    constructor(
        conceptTable: lancedb.Table, 
        embeddingService: EmbeddingService,
        conceptRepo?: ConceptRepository,
        wordnetService?: WordNetService
    ) {
        // Use provided WordNetService or create one with context-aware synset selection
        this.wordnet = wordnetService || new WordNetService(new ContextAwareStrategy());
        this.conceptTable = conceptTable;
        this.embeddingService = embeddingService;
        this.conceptRepo = conceptRepo;
    }
    
    async expandQuery(queryText: string): Promise<ExpandedQuery> {
        // Extract terms from query
        const originalTerms = queryText
            .toLowerCase()
            .split(/\s+/)
            .filter(term => term.length > 2)
            .map(term => term.replace(/[^\w\s]/g, ''))
            .filter(term => term.length > 0);
        
        // Expand with all sources in parallel
        const [wordnetExpanded, corpusExpanded, conceptExpanded] = await Promise.all([
            this.wordnet.expandQuery(originalTerms, 5, 2),
            this.expandWithCorpus(originalTerms),
            this.expandWithConcepts(originalTerms)
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
        
        // Add concept terms (weight 70%)
        for (const [term, weight] of conceptExpanded.entries()) {
            const existing = allTerms.get(term) || 0;
            allTerms.set(term, Math.max(existing, weight * 0.7));
        }
        
        // Add WordNet terms (medium weight - 60%)
        for (const [term, weight] of wordnetExpanded.entries()) {
            const existing = allTerms.get(term) || 0;
            allTerms.set(term, Math.max(existing, weight * 0.6));
        }
        
        return {
            original_terms: originalTerms,
            corpus_terms: Array.from(corpusExpanded.keys()).filter(t => !originalTerms.includes(t)),
            concept_terms: Array.from(conceptExpanded.keys()).filter(t => !originalTerms.includes(t)),
            wordnet_terms: Array.from(wordnetExpanded.keys()).filter(t => !originalTerms.includes(t)),
            all_terms: Array.from(allTerms.keys()),
            weights: allTerms
        };
    }
    
    /**
     * Expand query using hybrid concept search.
     * Finds matching concepts and includes their related concepts.
     */
    private async expandWithConcepts(terms: string[]): Promise<Map<string, number>> {
        const expanded = new Map<string, number>();
        
        if (!this.conceptRepo?.searchByHybrid) {
            return expanded;  // No concept repo = no expansion
        }
        
        try {
            const queryText = terms.join(' ');
            const queryVector = this.embeddingService.generateEmbedding(queryText);
            
            // Use hybrid concept search
            const conceptResults = await this.conceptRepo.searchByHybrid(
                queryText, 
                queryVector, 
                10
            );
            
            for (const concept of conceptResults) {
                const score = concept.hybridScore || 0.5;
                
                // Only include quality matches
                if (score < 0.3) continue;
                
                // Skip concepts that don't share any WHOLE words with original query
                // (prevents "software" matching "war" via substring)
                const conceptName = concept.name.toLowerCase().trim();
                const conceptWords = conceptName.split(/\s+/);
                const hasOverlap = terms.some(term => 
                    conceptWords.some(word => word === term)
                );
                
                if (!hasOverlap) continue;  // Skip unrelated concepts
                
                // Add concept name as complete phrase (don't split into words)
                if (conceptName.length > 2) {
                    const existing = expanded.get(conceptName) || 0;
                    expanded.set(conceptName, Math.max(existing, score));
                }
                
                // Add related concepts as complete phrases (from lexical linking) with lower weight
                for (const related of concept.relatedConcepts || []) {
                    const relatedName = related.toLowerCase().trim();
                    if (relatedName.length > 2) {
                        const existing = expanded.get(relatedName) || 0;
                        expanded.set(relatedName, Math.max(existing, score * 0.7));
                    }
                }
            }
        } catch (error) {
            console.warn('Concept expansion failed, continuing without:', error);
        }
        
        return expanded;
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
                
                // Skip concepts that don't share any WHOLE words with original query
                // (prevents "software" matching "war" via substring)
                const conceptWords = concept.split(/\s+/);
                const hasOverlap = terms.some(term => 
                    conceptWords.some((word: string) => word === term)
                );
                
                if (!hasOverlap) continue;  // Skip unrelated concepts
                
                // Apply type-specific expansion strategy
                if (conceptType === 'thematic') {
                    // Thematic concepts: Aggressive expansion
                    if (weight > 0.3 && !expanded.has(concept)) {
                        expanded.set(concept, weight * 0.85);
                    }
                    
                    // Add related concepts for thematic (they're abstract and benefit from expansion)
                    try {
                        const relatedConcepts = JSON.parse(result.related_concepts || '[]');
                        for (const related of relatedConcepts.slice(0, 4)) {
                            const relatedLower = related.toLowerCase();
                            if (!expanded.has(relatedLower) && weight > 0.4) {
                                expanded.set(relatedLower, weight * 0.6);
                            }
                        }
                    } catch (e) {
                        // Skip if parsing fails
                    }
                } else if (conceptType === 'terminology') {
                    // Terminology: Conservative expansion (only high-confidence matches)
                    if (weight > 0.6 && !expanded.has(concept)) {
                        expanded.set(concept, weight * 0.7);
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
