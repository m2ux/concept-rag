import { Document } from "@langchain/core/documents";
import { ConceptMetadata, ChunkWithConcepts } from "./types.js";

/**
 * Matches document-level concepts to individual chunks
 * Uses fuzzy matching to determine which concepts appear in each chunk
 */
export class ConceptChunkMatcher {
    
    /**
     * Match document concepts to a chunk of text
     * Returns relevant concepts and a relevance score for each
     */
    matchConceptsToChunk(
        chunkText: string,
        documentConcepts: ConceptMetadata
    ): { concepts: string[], categories: string[], density: number } {
        
        const chunkLower = chunkText.toLowerCase();
        const matchedConcepts = new Set<string>();
        const matchedCategories = new Set<string>();
        
        // Check primary concepts (fuzzy matching)
        for (const concept of documentConcepts.primary_concepts || []) {
            if (this.conceptMatchesText(concept, chunkLower, 0.7)) {
                matchedConcepts.add(concept);
            }
        }
        
        // Check related concepts (lighter matching)
        for (const related of documentConcepts.related_concepts || []) {
            if (this.conceptMatchesText(related, chunkLower, 0.65)) {
                matchedConcepts.add(related);
            }
        }
        
        // Add relevant categories if concepts match
        if (matchedConcepts.size > 0) {
            documentConcepts.categories.forEach(cat => matchedCategories.add(cat));
        }
        
        // Calculate concept density (richness of conceptual content)
        const density = this.calculateConceptDensity(
            chunkText,
            Array.from(matchedConcepts)
        );
        
        return {
            concepts: Array.from(matchedConcepts),
            categories: Array.from(matchedCategories),
            density
        };
    }
    
    /**
     * Enhanced chunk with concept metadata
     */
    enrichChunkWithConcepts(
        chunk: Document,
        documentConcepts: ConceptMetadata
    ): ChunkWithConcepts {
        const matched = this.matchConceptsToChunk(
            chunk.pageContent,
            documentConcepts
        );
        
        return {
            text: chunk.pageContent,
            source: chunk.metadata.source || '',
            concepts: matched.concepts,
            concept_categories: matched.categories,
            concept_density: matched.density
        };
    }
    
    /**
     * Process multiple chunks for a document
     */
    enrichChunksWithConcepts(
        chunks: Document[],
        documentConcepts: ConceptMetadata
    ): ChunkWithConcepts[] {
        return chunks.map(chunk => 
            this.enrichChunkWithConcepts(chunk, documentConcepts)
        );
    }
    
    /**
     * Check if a technical term appears in text using strict matching
     * Requires exact or near-exact matches for terminology
     */
    private technicalTermMatchesText(
        term: string,
        text: string
    ): boolean {
        const termLower = term.toLowerCase().trim();
        
        // Direct exact match (strict)
        if (text.includes(termLower)) {
            return true;
        }
        
        // For multi-word terms, require ALL words present and in sequence (or close)
        const termWords = termLower.split(/\s+/);
        if (termWords.length > 1) {
            // Check if all words appear in order (with some flexibility)
            const textWords = text.split(/\s+/);
            let lastIndex = -1;
            let matches = 0;
            
            for (const termWord of termWords) {
                const foundIndex = textWords.findIndex((tw, idx) => 
                    idx > lastIndex && tw.includes(termWord) && termWord.length > 2
                );
                if (foundIndex > -1) {
                    lastIndex = foundIndex;
                    matches++;
                }
            }
            
            // All words must be found in sequence
            return matches === termWords.length;
        }
        
        // For single-word terms, require word boundary match (no partial)
        if (termWords.length === 1 && termWords[0].length > 2) {
            const wordBoundaryRegex = new RegExp(`\\b${this.escapeRegex(termWords[0])}\\b`, 'i');
            return wordBoundaryRegex.test(text);
        }
        
        return false;
    }
    
    /**
     * Check if a concept appears in text using fuzzy matching
     * Handles multi-word concepts and partial matches (for thematic concepts)
     */
    private conceptMatchesText(
        concept: string,
        text: string,
        threshold: number = 0.7
    ): boolean {
        const conceptLower = concept.toLowerCase().trim();
        
        // Direct exact match
        if (text.includes(conceptLower)) {
            return true;
        }
        
        // For multi-word concepts, check if all words appear
        const conceptWords = conceptLower.split(/\s+/);
        if (conceptWords.length > 1) {
            const allWordsPresent = conceptWords.every(word => 
                word.length > 2 && text.includes(word)
            );
            if (allWordsPresent) {
                return true;
            }
        }
        
        // For single-word concepts, check for word boundaries
        if (conceptWords.length === 1 && conceptWords[0].length > 3) {
            const wordBoundaryRegex = new RegExp(`\\b${this.escapeRegex(conceptWords[0])}`, 'i');
            if (wordBoundaryRegex.test(text)) {
                return true;
            }
        }
        
        // Fuzzy match: check if concept is a substring of any word
        if (threshold < 1.0 && conceptLower.length > 4) {
            const textWords = text.split(/\s+/);
            for (const word of textWords) {
                if (word.includes(conceptLower) || conceptLower.includes(word)) {
                    // Calculate similarity
                    const similarity = this.calculateSimilarity(conceptLower, word);
                    if (similarity >= threshold) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    /**
     * Calculate concept density - how rich this chunk is in concepts
     * Returns a score between 0 and 1
     */
    private calculateConceptDensity(text: string, concepts: string[]): number {
        if (concepts.length === 0) return 0;
        
        const words = text.split(/\s+/).length;
        const conceptWords = concepts.reduce((sum, concept) => 
            sum + concept.split(/\s+/).length, 0
        );
        
        // Normalized by text length and concept count
        const rawDensity = conceptWords / Math.max(words, 1);
        const conceptCount = concepts.length;
        
        // Combine both factors: density and count
        const densityScore = Math.min(rawDensity * 10, 1.0);  // Scale density
        const countScore = Math.min(conceptCount / 10, 1.0);   // Scale count
        
        // Weighted average favoring count slightly
        return (densityScore * 0.4) + (countScore * 0.6);
    }
    
    /**
     * Simple string similarity (Jaccard-like)
     */
    private calculateSimilarity(str1: string, str2: string): number {
        const set1 = new Set(str1.split(''));
        const set2 = new Set(str2.split(''));
        
        const intersection = new Set([...set1].filter(c => set2.has(c)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size;
    }
    
    /**
     * Escape special regex characters
     */
    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    /**
     * Get statistics about concept matching for debugging
     */
    getMatchingStats(
        chunks: ChunkWithConcepts[]
    ): {
        totalChunks: number;
        chunksWithConcepts: number;
        avgConceptsPerChunk: number;
        avgDensity: number;
        topConcepts: Array<{ concept: string; count: number }>;
    } {
        const conceptCounts = new Map<string, number>();
        let totalConcepts = 0;
        let totalDensity = 0;
        let chunksWithConcepts = 0;
        
        for (const chunk of chunks) {
            if (chunk.concepts.length > 0) {
                chunksWithConcepts++;
            }
            
            totalConcepts += chunk.concepts.length;
            totalDensity += chunk.concept_density;
            
            for (const concept of chunk.concepts) {
                conceptCounts.set(concept, (conceptCounts.get(concept) || 0) + 1);
            }
        }
        
        // Get top 10 most frequent concepts
        const topConcepts = Array.from(conceptCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([concept, count]) => ({ concept, count }));
        
        return {
            totalChunks: chunks.length,
            chunksWithConcepts,
            avgConceptsPerChunk: chunks.length > 0 ? totalConcepts / chunks.length : 0,
            avgDensity: chunks.length > 0 ? totalDensity / chunks.length : 0,
            topConcepts
        };
    }
}


