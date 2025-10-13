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
        
        for (const concept of concepts) {
            try {
                const synsets = await this.wordnet.getSynsets(concept.concept);
                
                if (synsets.length > 0) {
                    const mainSynset = synsets[0];
                    
                    // Add WordNet data
                    concept.synonyms = mainSynset.synonyms.slice(0, 5);  // Top 5 synonyms
                    concept.broader_terms = mainSynset.hypernyms.slice(0, 3);  // Top 3 broader terms
                    concept.narrower_terms = mainSynset.hyponyms.slice(0, 5);  // Top 5 narrower terms
                    
                    // Update enrichment source
                    concept.enrichment_source = 
                        concept.enrichment_source === 'corpus' ? 'hybrid' : 'wordnet';
                    
                    enriched++;
                } else {
                    notFound++;
                }
            } catch (e: any) {
                // Continue on error
                errors++;
                console.debug(`Error enriching concept "${concept.concept}":`, e.message);
            }
        }
        
        console.log(`✅ Enriched: ${enriched}, Not in WordNet: ${notFound}, Errors: ${errors}`);
        
        // Save cache for future runs
        await this.wordnet.saveCache();
        
        return concepts;
    }
    
    // Enrich a single concept (useful for runtime enrichment)
    async enrichSingleConcept(concept: ConceptRecord): Promise<ConceptRecord> {
        try {
            const synsets = await this.wordnet.getSynsets(concept.concept);
            
            if (synsets.length > 0) {
                const mainSynset = synsets[0];
                
                concept.synonyms = mainSynset.synonyms.slice(0, 5);
                concept.broader_terms = mainSynset.hypernyms.slice(0, 3);
                concept.narrower_terms = mainSynset.hyponyms.slice(0, 5);
                concept.enrichment_source = 
                    concept.enrichment_source === 'corpus' ? 'hybrid' : 'wordnet';
            }
        } catch (e: any) {
            console.debug(`Error enriching concept "${concept.concept}":`, e.message);
        }
        
        return concept;
    }
}



