import * as lancedb from "@lancedb/lancedb";
import { ExpandedQuery } from './types.js';
import { WordNetService } from '../wordnet/wordnet_service.js';

export class QueryExpander {
    private wordnet: WordNetService;
    private conceptTable: lancedb.Table;
    
    constructor(conceptTable: lancedb.Table) {
        this.wordnet = new WordNetService();
        this.conceptTable = conceptTable;
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
            const queryVector = this.createSimpleEmbedding(terms.join(' '));
            const results = await this.conceptTable
                .vectorSearch(queryVector)
                .limit(10)
                .toArray();
            
            for (const result of results) {
                const concept = result.concept.toLowerCase();
                const weight = 1 - (result._distance || 0);
                
                // Only add if weight is significant
                if (weight > 0.3 && !expanded.has(concept)) {
                    expanded.set(concept, weight * 0.8);
                }
                
                // Add related concepts with lower weight
                try {
                    const relatedConcepts = JSON.parse(result.related_concepts || '[]');
                    for (const related of relatedConcepts.slice(0, 3)) {  // Top 3 related
                        const relatedLower = related.toLowerCase();
                        if (!expanded.has(relatedLower) && weight > 0.4) {
                            expanded.set(relatedLower, weight * 0.5);
                        }
                    }
                } catch (e) {
                    // Skip if parsing fails
                }
            }
        } catch (e: any) {
            console.error('Corpus expansion error:', e.message);
        }
        
        return expanded;
    }
    
    // Simple embedding function (same as in hybrid_search_client.ts)
    private createSimpleEmbedding(text: string): number[] {
        const embedding = new Array(384).fill(0);
        const words = text.toLowerCase().split(/\s+/);
        const chars = text.toLowerCase();
        
        for (let i = 0; i < Math.min(words.length, 100); i++) {
            const word = words[i];
            const hash = this.simpleHash(word);
            embedding[hash % 384] += 1;
        }
        
        for (let i = 0; i < Math.min(chars.length, 1000); i++) {
            const charCode = chars.charCodeAt(i);
            embedding[charCode % 384] += 0.1;
        }
        
        embedding[0] = text.length / 1000;
        embedding[1] = words.length / 100;
        embedding[2] = (text.match(/\./g) || []).length / 10;
        
        const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        return embedding.map(val => norm > 0 ? val / norm : 0);
    }
    
    private simpleHash(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
}



