import { ConceptRecord } from './types.js';
import { WordNetService } from '../wordnet/wordnet_service.js';

export class ConceptEnricher {
    private wordnet: WordNetService;
    
    constructor() {
        this.wordnet = new WordNetService();
    }
    
    // Enrich concept records with WordNet data
    async enrichConcepts(concepts: ConceptRecord[]): Promise<ConceptRecord[]> {
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
