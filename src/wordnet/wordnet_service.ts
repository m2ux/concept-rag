import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import { WordNetSynset } from '../concepts/types.js';
import { 
    SynsetSelectionStrategy, 
    SelectionContext, 
    defaultStrategy 
} from './strategies/index.js';

export class WordNetService {
    private cache = new Map<string, WordNetSynset[]>();
    private cacheFile = './data/caches/wordnet_cache.json';
    private cacheLoaded = false;
    private selectionStrategy: SynsetSelectionStrategy;
    
    constructor(strategy?: SynsetSelectionStrategy) {
        this.selectionStrategy = strategy || defaultStrategy;
        // Load cache asynchronously (don't block constructor)
        this.loadCache().catch(err => {
            console.debug('WordNet cache load failed:', err.message);
        });
    }
    
    /**
     * Set the synset selection strategy.
     * Allows runtime switching of disambiguation algorithms.
     */
    setStrategy(strategy: SynsetSelectionStrategy): void {
        this.selectionStrategy = strategy;
    }
    
    /**
     * Get the current selection strategy name.
     */
    getStrategyName(): string {
        return this.selectionStrategy.name;
    }
    
    // Load cache from disk
    private async loadCache() {
        if (this.cacheLoaded) return;
        
        try {
            const data = await fs.readFile(this.cacheFile, 'utf-8');
            const entries = JSON.parse(data);
            this.cache = new Map(entries);
            this.cacheLoaded = true;
            console.error(`📚 Loaded ${this.cache.size} WordNet entries from cache`);
        } catch (e) {
            console.warn('📚 No WordNet cache found, starting fresh');
            this.cacheLoaded = true;
        }
    }
    
    // Save cache to disk
    async saveCache() {
        try {
            const entries = Array.from(this.cache.entries());
            await fs.writeFile(this.cacheFile, JSON.stringify(entries, null, 2));
            console.error(`💾 Saved ${entries.length} WordNet entries to cache`);
        } catch (error: any) {
            console.error(`Failed to save WordNet cache: ${error.message}`);
        }
    }
    
    // Get synsets from WordNet
    async getSynsets(word: string): Promise<WordNetSynset[]> {
        // Ensure cache is loaded
        if (!this.cacheLoaded) {
            await this.loadCache();
        }
        
        // Check cache first
        const cacheKey = word.toLowerCase().trim();
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }
        
        // Lookup in WordNet
        const result = await this.wordnetLookup(word);
        
        // Cache result (even if empty)
        this.cache.set(cacheKey, result);
        
        return result;
    }
    
    /**
     * Get the best synset for a word using the configured selection strategy.
     * 
     * Uses the strategy pattern to select the most appropriate synset
     * based on query context and domain hints.
     * 
     * @param word - Word to look up
     * @param context - Selection context for disambiguation
     * @returns Best matching synset or undefined if not found
     */
    async getContextualSynset(
        word: string, 
        context: SelectionContext
    ): Promise<WordNetSynset | undefined> {
        const synsets = await this.getSynsets(word);
        
        if (synsets.length === 0) {
            return undefined;
        }
        
        return this.selectionStrategy.selectSynset(synsets, context);
    }
    
    /**
     * Score all synsets for a word using the configured strategy.
     * 
     * @param word - Word to look up
     * @param context - Selection context for scoring
     * @returns Array of synsets with scores, sorted by score descending
     */
    async scoreSynsets(
        word: string,
        context: SelectionContext
    ): Promise<Array<{ synset: WordNetSynset; score: number }>> {
        const synsets = await this.getSynsets(word);
        
        const scored = synsets.map(synset => ({
            synset,
            score: this.selectionStrategy.scoreSynset(synset, context)
        }));
        
        return scored.sort((a, b) => b.score - a.score);
    }
    
    private async wordnetLookup(word: string): Promise<WordNetSynset[]> {
        return new Promise((resolve) => {
            const pythonScript = `
import json
from nltk.corpus import wordnet as wn

word = "${word.replace(/"/g, '\\"')}"
results = []

try:
    for synset in wn.synsets(word):
        result = {
            "word": word,
            "synset_name": synset.name(),
            "synonyms": [lemma.name().replace('_', ' ') for lemma in synset.lemmas()],
            "hypernyms": [h.lemmas()[0].name().replace('_', ' ') for h in synset.hypernyms()[:5]],
            "hyponyms": [h.lemmas()[0].name().replace('_', ' ') for h in synset.hyponyms()[:5]],
            "meronyms": [m.lemmas()[0].name().replace('_', ' ') for m in synset.part_meronyms()[:3]],
            "definition": synset.definition()
        }
        results.append(result)
except Exception as e:
    pass  # Return empty list on error

print(json.dumps(results))
`;
            
            const python = spawn('python3', ['-c', pythonScript]);
            let output = '';
            let error = '';
            
            python.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            python.stderr.on('data', (data) => {
                error += data.toString();
            });
            
            python.on('close', (code) => {
                if (code === 0 && output.trim()) {
                    try {
                        const parsed = JSON.parse(output);
                        resolve(parsed);
                    } catch (e) {
                        resolve([]);  // Parse error = no results
                    }
                } else {
                    resolve([]);  // Lookup error = no results (not in WordNet)
                }
            });
            
            // Timeout after 5 seconds
            setTimeout(() => {
                python.kill();
                resolve([]);
            }, 5000);
        });
    }
    
    // Filter synsets for technical context
    async getTechnicalSynsets(word: string, contextWords: string[] = []): Promise<WordNetSynset[]> {
        const allSynsets = await this.getSynsets(word);
        
        if (contextWords.length === 0 || allSynsets.length === 0) {
            return allSynsets;
        }
        
        // Score by technical relevance
        const scored = allSynsets.map(synset => {
            let score = 0;
            const definition = synset.definition.toLowerCase();
            
            // Technical indicators
            const technicalTerms = [
                'computer', 'software', 'program', 'process',
                'system', 'data', 'algorithm', 'network',
                'digital', 'electronic', 'code', 'computing',
                'technology', 'technical', 'engineering'
            ];
            
            for (const term of technicalTerms) {
                if (definition.includes(term)) {
                    score += 1;
                }
            }
            
            // Context matching (higher weight)
            for (const context of contextWords) {
                if (definition.includes(context.toLowerCase())) {
                    score += 2;
                }
            }
            
            return { synset, score };
        });
        
        // Return all if no clear technical winner, otherwise filter
        const maxScore = Math.max(...scored.map(s => s.score), 0);
        if (maxScore === 0) {
            return allSynsets;  // No technical context found, return all
        }
        
        // Return synsets with non-zero scores, sorted by score
        return scored
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(s => s.synset);
    }
    
    // Expand query terms with WordNet
    async expandQuery(
        terms: string[], 
        maxSynonyms: number = 5,
        maxHypernyms: number = 2
    ): Promise<Map<string, number>> {
        const expanded = new Map<string, number>();
        
        // Original terms get weight 1.0
        for (const term of terms) {
            expanded.set(term.toLowerCase(), 1.0);
        }
        
        // Add related terms with lower weights
        for (const term of terms) {
            const synsets = await this.getTechnicalSynsets(term, terms);
            
            if (synsets.length > 0) {
                const synset = synsets[0];  // Use most relevant synset
                
                // Add synonyms (weight 0.6)
                for (const syn of synset.synonyms.slice(0, maxSynonyms)) {
                    const key = syn.toLowerCase();
                    if (!expanded.has(key)) {
                        expanded.set(key, 0.6);
                    }
                }
                
                // Add hypernyms (weight 0.4)
                for (const hyper of synset.hypernyms.slice(0, maxHypernyms)) {
                    const key = hyper.toLowerCase();
                    if (!expanded.has(key)) {
                        expanded.set(key, 0.4);
                    }
                }
            }
        }
        
        return expanded;
    }
}



