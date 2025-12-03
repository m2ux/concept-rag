import { ConceptRecord } from './types.js';
import { WordNetService } from '../wordnet/wordnet_service.js';

export interface EnrichmentOptions {
    /** Pre-warm WordNet cache before enrichment (default: true) */
    prewarm?: boolean;
    /** Concurrency for pre-warming (default: 5) */
    prewarmConcurrency?: number;
    /** Show pre-warming progress (default: true) */
    showPrewarmProgress?: boolean;
}

export class ConceptEnricher {
    private wordnet: WordNetService;
    
    constructor(wordnetService?: WordNetService) {
        this.wordnet = wordnetService || new WordNetService();
    }
    
    /**
     * Pre-warm the WordNet cache with vocabulary from concepts.
     * Call this before enrichment to reduce individual lookup latency.
     * 
     * @param concepts - Concepts to extract vocabulary from
     * @param options - Pre-warming options
     */
    async prewarmCache(
        concepts: ConceptRecord[],
        options: { concurrency?: number; showProgress?: boolean } = {}
    ): Promise<void> {
        const { concurrency = 5, showProgress = true } = options;
        
        // Extract unique terms from concept names
        const conceptNames = concepts.map(c => c.name);
        const terms = WordNetService.extractTermsFromConcepts(conceptNames);
        
        if (terms.length === 0) {
            return;
        }
        
        if (showProgress) {
            console.log(`🔥 Pre-warming WordNet cache with ${terms.length} terms...`);
        }
        
        const stats = await this.wordnet.prewarmCache(terms, {
            skipCached: true,
            concurrency,
            onProgress: showProgress 
                ? (current, total, _term) => {
                    const percent = ((current / total) * 100).toFixed(1);
                    process.stdout.write(`\r  Pre-warming: ${percent}% (${current}/${total})   `);
                }
                : undefined
        });
        
        if (showProgress) {
            process.stdout.write('\r' + ' '.repeat(60) + '\r');
            console.log(`✅ Pre-warmed ${stats.fetched} terms (${stats.cached} already cached, ${stats.failed} not in WordNet) in ${(stats.duration / 1000).toFixed(1)}s`);
        }
    }
    
    /**
     * Enrich concept records with WordNet data.
     * 
     * @param concepts - Concepts to enrich
     * @param options - Enrichment options
     */
    async enrichConcepts(
        concepts: ConceptRecord[],
        options: EnrichmentOptions = {}
    ): Promise<ConceptRecord[]> {
        const { prewarm = true, prewarmConcurrency = 5, showPrewarmProgress = true } = options;
        
        // Pre-warm cache if enabled
        if (prewarm) {
            await this.prewarmCache(concepts, { 
                concurrency: prewarmConcurrency, 
                showProgress: showPrewarmProgress 
            });
        }
        
        console.log(`🔍 Enriching ${concepts.length} concepts with WordNet...`);
        
        let enriched = 0;
        let notFound = 0;
        let errors = 0;
        const total = concepts.length;
        const startTime = Date.now();
        
        // Progress tracking - update every 5% or at least every concept if < 20
        const progressInterval = Math.max(1, Math.floor(total / 20));
        
        for (let i = 0; i < concepts.length; i++) {
            const concept = concepts[i];
            try {
                const synsets = await this.wordnet.getSynsets(concept.name);
                
                if (synsets.length > 0) {
                    const mainSynset = synsets[0];
                    
                    // Add WordNet data
                    concept.synonyms = mainSynset.synonyms.slice(0, 5);  // Top 5 synonyms
                    concept.broader_terms = mainSynset.hypernyms.slice(0, 3);  // Top 3 broader terms
                    concept.narrower_terms = mainSynset.hyponyms.slice(0, 5);  // Top 5 narrower terms
                    
                    enriched++;
                } else {
                    notFound++;
                }
            } catch (e: any) {
                // Continue on error
                errors++;
                console.debug(`Error enriching concept "${concept.name}":`, e.message);
            }
            
            // Show progress
            if ((i + 1) % progressInterval === 0 || i === total - 1) {
                const percent = ((i + 1) / total * 100).toFixed(1);
                const elapsed = (Date.now() - startTime) / 1000;
                const rate = elapsed > 0 ? (i + 1) / elapsed : 0;
                const remaining = rate > 0 ? Math.round((total - i - 1) / rate) : 0;
                const bar = this.createProgressBar(i + 1, total, 20);
                process.stdout.write(`\r  ${bar} ${percent}% (${i + 1}/${total}) - ${enriched} enriched - ETA: ${remaining}s   `);
            }
        }
        
        // Clear progress line and show final stats
        process.stdout.write('\r' + ' '.repeat(80) + '\r');
        console.log(`✅ WordNet: ${enriched} enriched, ${notFound} not found, ${errors} errors`);
        
        // Save cache for future runs
        await this.wordnet.saveCache();
        
        return concepts;
    }
    
    // Create a simple ASCII progress bar
    private createProgressBar(current: number, total: number, width: number): string {
        const filled = Math.round((current / total) * width);
        const empty = width - filled;
        return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
    }
    
    // Enrich a single concept (useful for runtime enrichment)
    async enrichSingleConcept(concept: ConceptRecord): Promise<ConceptRecord> {
        try {
            const synsets = await this.wordnet.getSynsets(concept.name);
            
            if (synsets.length > 0) {
                const mainSynset = synsets[0];
                
                concept.synonyms = mainSynset.synonyms.slice(0, 5);
                concept.broader_terms = mainSynset.hypernyms.slice(0, 3);
                concept.narrower_terms = mainSynset.hyponyms.slice(0, 5);
            }
        } catch (e: any) {
            console.debug(`Error enriching concept "${concept.name}":`, e.message);
        }
        
        return concept;
    }
}
