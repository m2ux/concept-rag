import * as lancedb from "@lancedb/lancedb";
import * as defaults from '../config.js';
import { ConceptualSearchResult } from '../concepts/types.js';
import { QueryExpander } from '../concepts/query_expander.js';
import { 
    createSimpleEmbedding, 
    calculateBM25Score, 
    titleMatchScore 
} from './hybrid_search_client.js';

export let client: lancedb.Connection;
export let chunksTable: lancedb.Table;
export let catalogTable: lancedb.Table;
export let conceptTable: lancedb.Table;

export class ConceptualSearchClient {
    private queryExpander: QueryExpander;
    
    constructor(private _conceptTable: lancedb.Table) {
        this.queryExpander = new QueryExpander(_conceptTable);
    }
    
    async search(
        _catalogTable: lancedb.Table,
        queryText: string,
        limit: number = 5,
        debug: boolean = false
    ): Promise<ConceptualSearchResult[]> {
        
        // Step 1: Expand query
        const expanded = await this.queryExpander.expandQuery(queryText);
        
        if (debug) {
            console.log('\n🔍 Query Expansion:');
            console.log('  Original:', expanded.original_terms.join(', '));
            console.log('  + Corpus:', expanded.corpus_terms.slice(0, 5).join(', '));
            console.log('  + WordNet:', expanded.wordnet_terms.slice(0, 5).join(', '));
            console.log('  Total terms:', expanded.all_terms.length);
        }
        
        // Step 2: Vector search with original query
        const queryVector = createSimpleEmbedding(queryText);
        const vectorResults = await _catalogTable
            .vectorSearch(queryVector)
            .limit(limit * 3)  // Get 3x for reranking
            .toArray();
        
        // Step 3: Score each result with multi-signal approach
        const scored = vectorResults.map((result: any) => {
            // 1. Vector similarity score
            const vectorScore = 1 - (result._distance || 0);
            
            // 2. BM25 with expanded terms (weighted by term importance)
            const bm25Score = this.calculateWeightedBM25(
                expanded.all_terms,
                expanded.weights,
                result.text || '',
                result.source || ''
            );
            
            // 3. Title matching
            const titleScore = titleMatchScore(expanded.original_terms, result.source || '');
            
            // 4. Concept matching (NEW)
            const conceptScore = this.calculateConceptScore(
                expanded,
                result
            );
            
            // 5. WordNet bonus (NEW)
            const wordnetScore = this.calculateWordNetBonus(
                expanded.wordnet_terms,
                result.text || ''
            );
            
            // Weighted combination
            const hybridScore = 
                (vectorScore * 0.25) +      // 25% vector
                (bm25Score * 0.25) +        // 25% BM25
                (titleScore * 0.20) +       // 20% title
                (conceptScore * 0.20) +     // 20% concepts
                (wordnetScore * 0.10);      // 10% WordNet
            
            return {
                ...result,
                _vector_score: vectorScore,
                _bm25_score: bm25Score,
                _title_score: titleScore,
                _concept_score: conceptScore,
                _wordnet_score: wordnetScore,
                _hybrid_score: hybridScore,
                _distance: 1 - hybridScore,
                matched_concepts: this.getMatchedConcepts(expanded, result),
                expanded_terms: expanded.all_terms.slice(0, 10)
            } as ConceptualSearchResult;
        });
        
        // Step 4: Re-rank and return
        scored.sort((a, b) => b._hybrid_score - a._hybrid_score);
        
        if (debug) {
            this.printDebugScores(scored.slice(0, limit));
        }
        
        return scored.slice(0, limit);
    }
    
    private calculateWeightedBM25(
        terms: string[],
        weights: Map<string, number>,
        docText: string,
        docSource: string
    ): number {
        const k1 = 1.5;
        const b = 0.75;
        const combinedText = `${docText} ${docSource}`.toLowerCase();
        const docWords = combinedText.split(/\s+/);
        const avgDocLength = 100;
        const docLength = docWords.length;
        
        let score = 0;
        let totalWeight = 0;
        
        for (const term of terms) {
            const termLower = term.toLowerCase();
            const weight = weights.get(termLower) || 0.5;
            totalWeight += weight;
            
            let termFreq = 0;
            for (const word of docWords) {
                if (word.includes(termLower) || termLower.includes(word)) {
                    termFreq += 1;
                }
            }
            
            if (termFreq > 0) {
                const numerator = termFreq * (k1 + 1);
                const denominator = termFreq + k1 * (1 - b + b * (docLength / avgDocLength));
                score += (numerator / denominator) * weight;  // Apply term weight
            }
        }
        
        // Normalize by total weight
        return totalWeight > 0 ? Math.min(score / totalWeight, 1.0) : 0;
    }
    
    private calculateConceptScore(
        expanded: any,
        result: any
    ): number {
        try {
            const metadata = result.concepts;
            if (!metadata) return 0;
            
            // Get all concepts
            const allConcepts = (metadata.primary_concepts || [])
                .map((c: string) => c.toLowerCase());
            
            let matches = 0;
            let weightedScore = 0;
            
            for (const queryConcept of expanded.all_terms) {
                const queryWeight = expanded.weights.get(queryConcept) || 0.5;
                
                // Fuzzy matching for all concepts
                for (const docConcept of allConcepts) {
                    if (docConcept.includes(queryConcept) || queryConcept.includes(docConcept)) {
                        matches++;
                        weightedScore += queryWeight;
                    }
                }
            }
            
            return matches > 0 ? Math.min(weightedScore / Math.max(expanded.all_terms.length, 1), 1.0) : 0;
        } catch (e) {
            return 0;
        }
    }
    
    private calculateWordNetBonus(
        wordnetTerms: string[],
        docText: string
    ): number {
        if (wordnetTerms.length === 0) return 0;
        
        const docLower = docText.toLowerCase();
        let matches = 0;
        
        for (const term of wordnetTerms) {
            if (docLower.includes(term.toLowerCase())) {
                matches++;
            }
        }
        
        return matches / Math.max(wordnetTerms.length, 1);
    }
    
    private getMatchedConcepts(expanded: any, result: any): string[] {
        try {
            const metadata = result.concepts;
            if (!metadata) return [];
            
            // Get all concepts
            const allConcepts = metadata.primary_concepts || [];
            
            const matched: string[] = [];
            
            for (const queryConcept of expanded.all_terms) {
                for (const docConcept of allConcepts) {
                    if (docConcept.toLowerCase().includes(queryConcept) || 
                        queryConcept.includes(docConcept.toLowerCase())) {
                        matched.push(docConcept);
                    }
                }
            }
            
            return [...new Set(matched)].slice(0, 5);
        } catch (e) {
            return [];
        }
    }
    
    private printDebugScores(results: ConceptualSearchResult[]) {
        console.log('\n📊 Top Results with Scores:\n');
        results.forEach((result, idx) => {
            const filename = result.source.split('/').pop() || result.source;
            console.log(`${idx + 1}. ${filename}`);
            console.log(`   Vector: ${result._vector_score.toFixed(3)}`);
            console.log(`   BM25: ${result._bm25_score.toFixed(3)}`);
            console.log(`   Title: ${result._title_score.toFixed(3)}`);
            console.log(`   Concept: ${result._concept_score.toFixed(3)}`);
            console.log(`   WordNet: ${result._wordnet_score.toFixed(3)}`);
            console.log(`   ➜ Hybrid: ${result._hybrid_score.toFixed(3)}`);
            if (result.matched_concepts && result.matched_concepts.length > 0) {
                console.log(`   Matched: ${result.matched_concepts.slice(0, 3).join(', ')}`);
            }
            console.log();
        });
    }
}

// Connect to LanceDB
export async function connectToLanceDB(databaseUrl: string, chunksTableName: string, catalogTableName: string) {
  try {
    console.error(`Connecting to database: ${databaseUrl}`);
    client = await lancedb.connect(databaseUrl);

    chunksTable = await client.openTable(chunksTableName);
    catalogTable = await client.openTable(catalogTableName);
    
    // Try to open concepts table (may not exist in older databases)
    try {
        conceptTable = await client.openTable('concepts');
        console.error("✅ Connected to LanceDB with conceptual search enabled");
    } catch (e) {
        console.error("⚠️  Concepts table not found - using basic search");
        console.error("   Run seeding with concept extraction to enable full conceptual search");
    }

  } catch (error) {
    console.error("LanceDB connection error:", error);
    throw error;
  }
}

export async function closeLanceDB() {
  await client?.close();
}



