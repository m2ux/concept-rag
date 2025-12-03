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
    
    /**
     * Pre-warm the cache with a list of terms.
     * 
     * Useful for pre-populating cache at ingestion time with concept vocabulary
     * to reduce lookup latency during search operations.
     * 
     * @param terms - Array of terms to pre-fetch from WordNet
     * @param options - Pre-warming options
     * @returns Statistics about the pre-warming operation
     */
    async prewarmCache(
        terms: string[],
        options: {
            /** Skip terms already in cache (default: true) */
            skipCached?: boolean;
            /** Maximum concurrent lookups (default: 5) */
            concurrency?: number;
            /** Progress callback */
            onProgress?: (current: number, total: number, term: string) => void;
        } = {}
    ): Promise<{ 
        total: number; 
        cached: number; 
        fetched: number; 
        failed: number;
        duration: number;
    }> {
        const { 
            skipCached = true, 
            concurrency = 5,
            onProgress
        } = options;
        
        // Ensure cache is loaded
        if (!this.cacheLoaded) {
            await this.loadCache();
        }
        
        // Deduplicate and normalize terms
        const uniqueTerms = [...new Set(
            terms
                .map(t => t.toLowerCase().trim())
                .filter(t => t.length > 2)  // Skip very short terms
        )];
        
        const startTime = Date.now();
        let cached = 0;
        let fetched = 0;
        let failed = 0;
        
        // Filter terms to process
        const termsToFetch = skipCached 
            ? uniqueTerms.filter(t => !this.cache.has(t))
            : uniqueTerms;
        
        cached = uniqueTerms.length - termsToFetch.length;
        
        // Process in batches for concurrency control
        for (let i = 0; i < termsToFetch.length; i += concurrency) {
            const batch = termsToFetch.slice(i, i + concurrency);
            
            await Promise.all(batch.map(async (term, batchIdx) => {
                try {
                    const synsets = await this.getSynsets(term);
                    if (synsets.length > 0) {
                        fetched++;
                    } else {
                        failed++;  // Term not in WordNet
                    }
                } catch (e) {
                    failed++;
                }
                
                if (onProgress) {
                    onProgress(i + batchIdx + 1, termsToFetch.length, term);
                }
            }));
        }
        
        const duration = Date.now() - startTime;
        
        return {
            total: uniqueTerms.length,
            cached,
            fetched,
            failed,
            duration
        };
    }
    
    /**
     * Extract unique words from concept names for cache pre-warming.
     * 
     * @param conceptNames - Array of concept names (may be multi-word)
     * @returns Array of unique words suitable for WordNet lookup
     */
    static extractTermsFromConcepts(conceptNames: string[]): string[] {
        const terms = new Set<string>();
        
        for (const name of conceptNames) {
            // Split on whitespace and common separators
            const words = name
                .toLowerCase()
                .split(/[\s\-_\/]+/)
                .map(w => w.replace(/[^\w]/g, ''))
                .filter(w => w.length > 2);
            
            for (const word of words) {
                terms.add(word);
            }
        }
        
        return [...terms];
    }
    
    /**
     * Get cache statistics.
     */
    getCacheStats(): { size: number; loaded: boolean } {
        return {
            size: this.cache.size,
            loaded: this.cacheLoaded
        };
    }
    
    /**
     * Get broader terms (hypernyms) for a word.
     * 
     * Returns generalized/parent concepts from WordNet hierarchy.
     * Example: "dog" → ["canine", "mammal", "animal"]
     * 
     * @param word - Word to look up
     * @param depth - How many levels up to traverse (default: 1)
     * @returns Array of broader terms
     */
    async getBroaderTerms(
        word: string,
        depth: number = 1
    ): Promise<string[]> {
        const synsets = await this.getSynsets(word);
        
        if (synsets.length === 0) {
            return [];
        }
        
        const broaderTerms = new Set<string>();
        
        // Get hypernyms from all synsets at requested depth
        for (const synset of synsets) {
            for (const hypernym of synset.hypernyms) {
                broaderTerms.add(hypernym.toLowerCase());
                
                // If depth > 1, recursively get hypernyms
                if (depth > 1) {
                    const moreHypernyms = await this.getBroaderTerms(hypernym, depth - 1);
                    for (const h of moreHypernyms) {
                        broaderTerms.add(h.toLowerCase());
                    }
                }
            }
        }
        
        return [...broaderTerms];
    }
    
    /**
     * Get narrower terms (hyponyms) for a word.
     * 
     * Returns specialized/child concepts from WordNet hierarchy.
     * Example: "animal" → ["mammal", "bird", "fish", "reptile"]
     * 
     * @param word - Word to look up
     * @param depth - How many levels down to traverse (default: 1)
     * @returns Array of narrower terms
     */
    async getNarrowerTerms(
        word: string,
        depth: number = 1
    ): Promise<string[]> {
        const synsets = await this.getSynsets(word);
        
        if (synsets.length === 0) {
            return [];
        }
        
        const narrowerTerms = new Set<string>();
        
        // Get hyponyms from all synsets at requested depth
        for (const synset of synsets) {
            for (const hyponym of synset.hyponyms) {
                narrowerTerms.add(hyponym.toLowerCase());
                
                // If depth > 1, recursively get hyponyms
                if (depth > 1) {
                    const moreHyponyms = await this.getNarrowerTerms(hyponym, depth - 1);
                    for (const h of moreHyponyms) {
                        narrowerTerms.add(h.toLowerCase());
                    }
                }
            }
        }
        
        return [...narrowerTerms];
    }
    
    /**
     * Get synonyms for a word.
     * 
     * Returns words with the same meaning from WordNet.
     * 
     * @param word - Word to look up
     * @returns Array of synonyms
     */
    async getSynonyms(word: string): Promise<string[]> {
        const synsets = await this.getSynsets(word);
        
        if (synsets.length === 0) {
            return [];
        }
        
        const synonyms = new Set<string>();
        
        for (const synset of synsets) {
            for (const syn of synset.synonyms) {
                const synLower = syn.toLowerCase();
                // Don't include the original word as a synonym
                if (synLower !== word.toLowerCase()) {
                    synonyms.add(synLower);
                }
            }
        }
        
        return [...synonyms];
    }
    
    /**
     * Get related terms in all directions (synonyms, broader, narrower).
     * 
     * Useful for comprehensive term expansion.
     * 
     * @param word - Word to look up
     * @returns Object with all related terms
     */
    async getAllRelatedTerms(
        word: string
    ): Promise<{
        synonyms: string[];
        broader: string[];
        narrower: string[];
    }> {
        const [synonyms, broader, narrower] = await Promise.all([
            this.getSynonyms(word),
            this.getBroaderTerms(word, 1),
            this.getNarrowerTerms(word, 1)
        ]);
        
        return { synonyms, broader, narrower };
    }
    
    /**
     * Find the path between two concepts in WordNet hierarchy.
     * 
     * Useful for understanding semantic distance between concepts.
     * Returns undefined if no path found within max depth.
     * 
     * @param term1 - First term
     * @param term2 - Second term
     * @param maxDepth - Maximum search depth (default: 5)
     * @returns Path array or undefined
     */
    async findHierarchyPath(
        term1: string,
        term2: string,
        maxDepth: number = 5
    ): Promise<string[] | undefined> {
        const term2Lower = term2.toLowerCase();
        const visited = new Set<string>();
        
        // BFS to find path
        const queue: Array<{ term: string; path: string[] }> = [
            { term: term1, path: [term1] }
        ];
        
        while (queue.length > 0) {
            const { term, path } = queue.shift()!;
            
            if (path.length > maxDepth) {
                continue;
            }
            
            const termLower = term.toLowerCase();
            
            if (termLower === term2Lower) {
                return path;
            }
            
            if (visited.has(termLower)) {
                continue;
            }
            visited.add(termLower);
            
            // Get related terms
            const synsets = await this.getSynsets(term);
            for (const synset of synsets) {
                // Check hypernyms
                for (const hypernym of synset.hypernyms) {
                    if (!visited.has(hypernym.toLowerCase())) {
                        queue.push({ term: hypernym, path: [...path, hypernym] });
                    }
                }
                // Check hyponyms
                for (const hyponym of synset.hyponyms) {
                    if (!visited.has(hyponym.toLowerCase())) {
                        queue.push({ term: hyponym, path: [...path, hyponym] });
                    }
                }
            }
        }
        
        return undefined;
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



