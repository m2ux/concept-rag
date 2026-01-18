# 🗺️ Conceptual Search Implementation Plan

## 📋 Executive Summary

This plan implements a **hybrid conceptual lexicon system** combining:
1. **Corpus-driven concept extraction** (70% weight) - Domain-specific technical terms
2. **WordNet semantic enrichment** (30% weight) - General vocabulary relationships
3. **Enhanced hybrid search** - Multi-signal ranking with concept awareness

**Expected Timeline:** 12-15 hours for full implementation
**Expected Cost:** ~$0.01-0.02 per 1000 documents (one-time seeding cost)
**Expected Improvement:** 2-3x better concept matching, ~80% better synonym coverage

---

## 🎯 Implementation Phases

### Phase 1: Foundation Setup (2 hours)

#### Task 1.1: Install Dependencies (15 min)
```bash
# Python for WordNet
pip install nltk

# Download WordNet data
python3 -c "import nltk; nltk.download('wordnet'); nltk.download('omw-1.4')"

# Test WordNet access
python3 -c "from nltk.corpus import wordnet as wn; print(len(list(wn.all_synsets()))); print('✅ WordNet ready')"
```

**Deliverable:** WordNet accessible from Python

#### Task 1.2: Create Project Structure (15 min)
```bash
# Create new directories
mkdir -p src/wordnet
mkdir -p src/concepts
mkdir -p test/fixtures
mkdir -p data/caches

# Create placeholder files
touch src/wordnet/wordnet_service.ts
touch src/concepts/concept_extractor.ts
touch src/concepts/concept_index.ts
touch src/lancedb/conceptual_search_client.ts
```

**Deliverable:** Clean project structure

#### Task 1.3: Update TypeScript Config (15 min)

**File:** `tsconfig.json`
```json
{
  "compilerOptions": {
    // existing config...
    "resolveJsonModule": true,
    "esModuleInterop": true
  },
  "include": [
    "src/**/*",
    "test/**/*"
  ]
}
```

**Deliverable:** TypeScript ready for new modules

#### Task 1.4: Create Shared Types (45 min)

**File:** `src/concepts/types.ts`
```typescript
// Concept extracted from corpus
export interface ConceptRecord {
    concept: string;                    // "concurrent programming"
    category: string;                   // "Software Engineering"
    sources: string[];                  // Documents containing this
    related_concepts: string[];         // Related terms from corpus
    synonyms?: string[];                // From WordNet
    broader_terms?: string[];           // From WordNet (hypernyms)
    narrower_terms?: string[];          // From WordNet (hyponyms)
    embeddings: number[];              // Vector representation
    weight: number;                     // Importance (document count)
    enrichment_source: 'corpus' | 'wordnet' | 'hybrid';
}

// Concept metadata stored in catalog
export interface ConceptMetadata {
    primary_concepts: string[];         // 3-5 main topics
    technical_terms: string[];          // 5-10 key terms
    categories: string[];               // 2-3 domains
    related_concepts: string[];         // 3-5 related topics
    summary: string;                    // Brief description
}

// Search result with concept scoring
export interface ConceptualSearchResult {
    // Original fields
    id: string;
    text: string;
    source: string;
    hash: string;
    
    // Scoring components
    _distance: number;
    _vector_score: number;
    _bm25_score: number;
    _title_score: number;
    _concept_score: number;
    _wordnet_score: number;
    _hybrid_score: number;
    
    // Metadata
    matched_concepts?: string[];
    expanded_terms?: string[];
}

// WordNet synset data
export interface WordNetSynset {
    word: string;
    synset_name: string;
    synonyms: string[];
    hypernyms: string[];
    hyponyms: string[];
    meronyms: string[];
    definition: string;
}

// Query expansion result
export interface ExpandedQuery {
    original_terms: string[];
    corpus_terms: string[];            // From concept index
    wordnet_terms: string[];           // From WordNet
    all_terms: string[];               // Combined
    weights: Map<string, number>;      // Term importance weights
}
```

**Deliverable:** Shared types for all modules

---

### Phase 2: Corpus-Driven Concept Extraction (4 hours)

#### Task 2.1: Enhanced Concept Extraction Prompt (30 min)

**File:** `src/concepts/concept_extractor.ts`
```typescript
import { Document } from "@langchain/core/documents";

export class ConceptExtractor {
    
    private openRouterApiKey: string;
    
    constructor(apiKey: string) {
        this.openRouterApiKey = apiKey;
    }
    
    // Extract concepts from document using LLM
    async extractConcepts(docs: Document[]): Promise<ConceptMetadata> {
        const contentSample = this.sampleContent(docs);
        
        const prompt = `
You are a technical document analyzer. Extract structured concepts from this document.

Document Content:
${contentSample}

Return a JSON object with:
1. "primary_concepts": [3-5 high-level topics/themes]
2. "technical_terms": [5-10 specific terms, technologies, or methods]
3. "categories": [2-3 broad domains like "Software Engineering", "Data Science"]
4. "related_concepts": [3-5 topics someone interested in this would research]
5. "summary": "2-3 sentence overview"

Example output:
{
  "primary_concepts": ["concurrent programming", "thread safety", "synchronization"],
  "technical_terms": ["mutex", "semaphore", "race condition", "deadlock", "atomic operations"],
  "categories": ["Software Engineering", "Operating Systems"],
  "related_concepts": ["parallel computing", "distributed systems", "lock-free algorithms"],
  "summary": "This document covers concurrent programming patterns..."
}

Return ONLY the JSON object, no markdown or explanation.
`;
        
        const response = await this.callOpenRouter(prompt);
        return JSON.parse(response);
    }
    
    private sampleContent(docs: Document[]): string {
        // Take first 2000 chars from first 5 docs
        return docs
            .slice(0, 5)
            .map(d => d.pageContent)
            .join('\n\n')
            .slice(0, 2000);
    }
    
    private async callOpenRouter(prompt: string): Promise<string> {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.openRouterApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/your-repo/lance-mcp',
                'X-Title': 'LanceDB MCP Concept Extraction'
            },
            body: JSON.stringify({
                model: 'anthropic/claude-3.5-haiku',
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                temperature: 0.3,  // Lower for more consistent extraction
                max_tokens: 500
            })
        });
        
        const data = await response.json();
        return data.choices[0].message.content;
    }
}
```

**Deliverable:** LLM-based concept extraction

#### Task 2.2: Concept Index Builder (1.5 hours)

**File:** `src/concepts/concept_index.ts`
```typescript
import * as lancedb from "@lancedb/lancedb";
import { Document } from "@langchain/core/documents";
import { ConceptRecord, ConceptMetadata } from "./types.js";
import { createSimpleEmbedding } from "../lancedb/hybrid_search_client.js";

export class ConceptIndexBuilder {
    
    // Build concept index from documents with metadata
    async buildConceptIndex(documents: Document[]): Promise<ConceptRecord[]> {
        const conceptMap = new Map<string, ConceptRecord>();
        
        for (const doc of documents) {
            const metadata = doc.metadata.concepts as ConceptMetadata;
            if (!metadata) continue;
            
            const source = doc.metadata.source;
            
            // Process primary concepts
            for (const concept of metadata.primary_concepts) {
                this.addOrUpdateConcept(
                    conceptMap, 
                    concept, 
                    source,
                    metadata.categories[0] || 'General',
                    metadata.related_concepts
                );
            }
            
            // Process technical terms
            for (const term of metadata.technical_terms) {
                this.addOrUpdateConcept(
                    conceptMap,
                    term,
                    source,
                    metadata.categories[0] || 'Technical',
                    []
                );
            }
        }
        
        // Build co-occurrence relationships
        this.enrichWithCoOccurrence(conceptMap, documents);
        
        return Array.from(conceptMap.values());
    }
    
    private addOrUpdateConcept(
        map: Map<string, ConceptRecord>,
        concept: string,
        source: string,
        category: string,
        relatedConcepts: string[]
    ) {
        const key = concept.toLowerCase();
        
        if (!map.has(key)) {
            map.set(key, {
                concept: key,
                category,
                sources: [],
                related_concepts: [...relatedConcepts],
                embeddings: createSimpleEmbedding(concept),
                weight: 0,
                enrichment_source: 'corpus'
            });
        }
        
        const record = map.get(key)!;
        if (!record.sources.includes(source)) {
            record.sources.push(source);
            record.weight += 1;
        }
        
        // Merge related concepts
        for (const related of relatedConcepts) {
            if (!record.related_concepts.includes(related)) {
                record.related_concepts.push(related);
            }
        }
    }
    
    // Find concepts that co-occur frequently
    private enrichWithCoOccurrence(
        conceptMap: Map<string, ConceptRecord>,
        documents: Document[]
    ) {
        // Build co-occurrence matrix
        const coOccurrence = new Map<string, Map<string, number>>();
        
        for (const doc of documents) {
            const metadata = doc.metadata.concepts as ConceptMetadata;
            if (!metadata) continue;
            
            const allTerms = [
                ...metadata.primary_concepts,
                ...metadata.technical_terms
            ].map(t => t.toLowerCase());
            
            // Count co-occurrences
            for (let i = 0; i < allTerms.length; i++) {
                for (let j = i + 1; j < allTerms.length; j++) {
                    const term1 = allTerms[i];
                    const term2 = allTerms[j];
                    
                    if (!coOccurrence.has(term1)) {
                        coOccurrence.set(term1, new Map());
                    }
                    
                    const coMap = coOccurrence.get(term1)!;
                    coMap.set(term2, (coMap.get(term2) || 0) + 1);
                    
                    // Symmetric
                    if (!coOccurrence.has(term2)) {
                        coOccurrence.set(term2, new Map());
                    }
                    coOccurrence.get(term2)!.set(term1, (coOccurrence.get(term2)!.get(term1) || 0) + 1);
                }
            }
        }
        
        // Add top co-occurring terms to related_concepts
        for (const [concept, coMap] of coOccurrence.entries()) {
            const record = conceptMap.get(concept);
            if (!record) continue;
            
            // Get top 5 co-occurring terms
            const topRelated = Array.from(coMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([term, _]) => term);
            
            // Add to related concepts (avoiding duplicates)
            for (const related of topRelated) {
                if (!record.related_concepts.includes(related)) {
                    record.related_concepts.push(related);
                }
            }
        }
    }
    
    // Create LanceDB table for concepts
    async createConceptTable(
        db: lancedb.Connection,
        concepts: ConceptRecord[],
        tableName: string = 'concepts'
    ): Promise<lancedb.Table> {
        
        const data = concepts.map((concept, idx) => ({
            id: idx.toString(),
            concept: concept.concept,
            category: concept.category,
            sources: JSON.stringify(concept.sources),
            related_concepts: JSON.stringify(concept.related_concepts),
            synonyms: JSON.stringify(concept.synonyms || []),
            broader_terms: JSON.stringify(concept.broader_terms || []),
            narrower_terms: JSON.stringify(concept.narrower_terms || []),
            weight: concept.weight,
            enrichment_source: concept.enrichment_source,
            vector: concept.embeddings
        }));
        
        console.log(`📊 Creating concept table with ${data.length} concepts`);
        
        const table = await db.createTable(tableName, data, { 
            mode: 'overwrite' 
        });
        
        // Create index for fast vector search
        await table.createIndex({
            column: 'vector',
            type: 'ivf_pq'
        });
        
        return table;
    }
}
```

**Deliverable:** Concept index builder with co-occurrence

#### Task 2.3: Update Seeding Script (2 hours)

**File:** `hybrid_fast_seed.ts` (modifications)
```typescript
import { ConceptExtractor } from './src/concepts/concept_extractor.js';
import { ConceptIndexBuilder } from './src/concepts/concept_index.js';

// Add to processDocuments function
async function processDocuments(rawDocs: Document[]) {
    const docsBySource = rawDocs.reduce((acc: Record<string, Document[]>, doc: Document) => {
        const source = doc.metadata.source;
        if (!acc[source]) {
            acc[source] = [];
        }
        acc[source].push(doc);
        return acc;
    }, {});

    let catalogRecords: Document[] = [];
    const conceptExtractor = new ConceptExtractor(process.env.OPENROUTER_API_KEY!);

    for (const [source, docs] of Object.entries(docsBySource)) {
        let hash = docs[0]?.metadata?.hash;
        if (!hash || hash === 'unknown') {
            const fileContent = await fs.promises.readFile(source);
            hash = crypto.createHash('sha256').update(fileContent).digest('hex');
        }

        const isOcrProcessed = docs.some(doc => doc.metadata.ocr_processed);
        const sourceBasename = path.basename(source);
        
        console.log(`🤖 Generating summary + concepts for: ${sourceBasename}`);
        
        // ENHANCED: Extract concepts
        const concepts = await conceptExtractor.extractConcepts(docs);
        const contentOverview = await generateContentOverview(docs);
        
        // Include concepts in the embedded text
        const enrichedContent = `
${contentOverview}

Key Concepts: ${concepts.primary_concepts.join(', ')}
Technical Terms: ${concepts.technical_terms.join(', ')}
Categories: ${concepts.categories.join(', ')}
`.trim();
        
        const catalogRecord = new Document({ 
            pageContent: enrichedContent,
            metadata: { 
                source, 
                hash,
                title: extractTitleFromFilename(sourceBasename),
                ocr_processed: isOcrProcessed,
                concepts: concepts  // STORE STRUCTURED CONCEPTS
            } 
        });
        
        catalogRecords.push(catalogRecord);
    }

    return catalogRecords;
}

// Add new function to create concept table
async function seedAll() {
    // ... existing seeding code ...
    
    // NEW: Build and store concept index
    console.log('\n📊 Building concept index...');
    const conceptBuilder = new ConceptIndexBuilder();
    const conceptRecords = await conceptBuilder.buildConceptIndex(catalogRecords);
    
    console.log(`✅ Built ${conceptRecords.length} concept records`);
    
    // Create concept table
    const conceptTable = await conceptBuilder.createConceptTable(
        db,
        conceptRecords,
        'concepts'
    );
    
    console.log('✅ Concept index created');
    
    // ... rest of seeding ...
}
```

**Deliverable:** Enhanced seeding with concept extraction

---

### Phase 3: WordNet Integration (3 hours)

#### Task 3.1: WordNet Service (1.5 hours)

**File:** `src/wordnet/wordnet_service.ts`
```typescript
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import { WordNetSynset } from '../concepts/types.js';

export class WordNetService {
    private cache = new Map<string, WordNetSynset[]>();
    private cacheFile = './data/caches/wordnet_cache.json';
    
    constructor() {
        this.loadCache();
    }
    
    // Load cache from disk
    private async loadCache() {
        try {
            const data = await fs.readFile(this.cacheFile, 'utf-8');
            const entries = JSON.parse(data);
            this.cache = new Map(entries);
            console.log(`📚 Loaded ${this.cache.size} WordNet entries from cache`);
        } catch (e) {
            console.log('📚 No WordNet cache found, starting fresh');
        }
    }
    
    // Save cache to disk
    async saveCache() {
        const entries = Array.from(this.cache.entries());
        await fs.writeFile(this.cacheFile, JSON.stringify(entries, null, 2));
        console.log(`💾 Saved ${entries.length} WordNet entries to cache`);
    }
    
    // Get synsets from WordNet
    async getSynsets(word: string): Promise<WordNetSynset[]> {
        // Check cache first
        if (this.cache.has(word)) {
            return this.cache.get(word)!;
        }
        
        // Lookup in WordNet
        const result = await this.wordnetLookup(word);
        
        // Cache result (even if empty)
        this.cache.set(word, result);
        
        return result;
    }
    
    private async wordnetLookup(word: string): Promise<WordNetSynset[]> {
        return new Promise((resolve, reject) => {
            const pythonScript = `
import json
from nltk.corpus import wordnet as wn

word = "${word.replace(/"/g, '\\"')}"
results = []

for synset in wn.synsets(word):
    result = {
        "word": word,
        "synset_name": synset.name(),
        "synonyms": [lemma.name().replace('_', ' ') for lemma in synset.lemmas()],
        "hypernyms": [h.lemmas()[0].name().replace('_', ' ') for h in synset.hypernyms()],
        "hyponyms": [h.lemmas()[0].name().replace('_', ' ') for h in synset.hyponyms()[:5]],
        "meronyms": [m.lemmas()[0].name().replace('_', ' ') for m in synset.part_meronyms()[:3]],
        "definition": synset.definition()
    }
    results.append(result)

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
                if (code === 0 && output) {
                    try {
                        resolve(JSON.parse(output));
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
        
        if (contextWords.length === 0) {
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
                'digital', 'electronic', 'code', 'computing'
            ];
            
            for (const term of technicalTerms) {
                if (definition.includes(term)) {
                    score += 1;
                }
            }
            
            // Context matching
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
            return allSynsets;
        }
        
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
```

**Deliverable:** WordNet service with caching

#### Task 3.2: Enrich Concepts with WordNet (1.5 hours)

**File:** `src/concepts/concept_enricher.ts`
```typescript
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
        
        for (const concept of concepts) {
            try {
                const synsets = await this.wordnet.getSynsets(concept.concept);
                
                if (synsets.length > 0) {
                    const mainSynset = synsets[0];
                    
                    concept.synonyms = mainSynset.synonyms;
                    concept.broader_terms = mainSynset.hypernyms.slice(0, 3);
                    concept.narrower_terms = mainSynset.hyponyms.slice(0, 5);
                    concept.enrichment_source = 
                        concept.enrichment_source === 'corpus' ? 'hybrid' : 'wordnet';
                    
                    enriched++;
                } else {
                    notFound++;
                }
            } catch (e) {
                // Continue on error
                notFound++;
            }
        }
        
        console.log(`✅ Enriched: ${enriched}, Not in WordNet: ${notFound}`);
        
        // Save cache
        await this.wordnet.saveCache();
        
        return concepts;
    }
}
```

**Deliverable:** Concept enrichment with WordNet

---

### Phase 4: Conceptual Search Engine (3 hours)

#### Task 4.1: Query Expander (1 hour)

**File:** `src/concepts/query_expander.ts`
```typescript
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
        // Extract terms
        const originalTerms = queryText
            .toLowerCase()
            .split(/\s+/)
            .filter(term => term.length > 2)
            .map(term => term.replace(/[^\w\s]/g, ''));
        
        // Expand with WordNet
        const wordnetExpanded = await this.wordnet.expandQuery(originalTerms);
        
        // Expand with corpus concepts
        const corpusExpanded = await this.expandWithCorpus(originalTerms);
        
        // Combine with weights
        const allTerms = new Map<string, number>();
        
        // Add original terms
        for (const term of originalTerms) {
            allTerms.set(term, 1.0);
        }
        
        // Add WordNet terms (weighted)
        for (const [term, weight] of wordnetExpanded.entries()) {
            if (!allTerms.has(term)) {
                allTerms.set(term, weight * 0.6);  // 60% of WordNet weight
            }
        }
        
        // Add corpus terms (weighted higher)
        for (const [term, weight] of corpusExpanded.entries()) {
            const existing = allTerms.get(term) || 0;
            allTerms.set(term, Math.max(existing, weight * 0.8));  // 80% of corpus weight
        }
        
        return {
            original_terms: originalTerms,
            corpus_terms: Array.from(corpusExpanded.keys()),
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
                
                if (!expanded.has(concept)) {
                    expanded.set(concept, weight * 0.8);
                }
                
                // Add related concepts
                try {
                    const relatedConcepts = JSON.parse(result.related_concepts || '[]');
                    for (const related of relatedConcepts.slice(0, 5)) {
                        const relatedLower = related.toLowerCase();
                        if (!expanded.has(relatedLower)) {
                            expanded.set(relatedLower, weight * 0.5);
                        }
                    }
                } catch (e) {
                    // Skip if parsing fails
                }
            }
        } catch (e) {
            console.error('Corpus expansion error:', e);
        }
        
        return expanded;
    }
    
    private createSimpleEmbedding(text: string): number[] {
        // Simple embedding (same as in hybrid_search_client.ts)
        const embedding = new Array(384).fill(0);
        const words = text.toLowerCase().split(/\s+/);
        
        for (let i = 0; i < Math.min(words.length, 100); i++) {
            const word = words[i];
            const hash = this.simpleHash(word);
            embedding[hash % 384] += 1;
        }
        
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
```

**Deliverable:** Query expansion with both sources

#### Task 4.2: Conceptual Search Client (2 hours)

**File:** `src/lancedb/conceptual_search_client.ts`
```typescript
import * as lancedb from "@lancedb/lancedb";
import { ConceptualSearchResult } from '../concepts/types.js';
import { QueryExpander } from '../concepts/query_expander.js';
import { 
    createSimpleEmbedding, 
    calculateBM25Score, 
    titleMatchScore 
} from './hybrid_search_client.js';

export class ConceptualSearchClient {
    private queryExpander: QueryExpander;
    
    constructor(private conceptTable: lancedb.Table) {
        this.queryExpander = new QueryExpander(conceptTable);
    }
    
    async search(
        catalogTable: lancedb.Table,
        queryText: string,
        limit: number = 5,
        debug: boolean = false
    ): Promise<ConceptualSearchResult[]> {
        
        // Step 1: Expand query
        const expanded = await this.queryExpander.expandQuery(queryText);
        
        if (debug) {
            console.log('\n🔍 Query Expansion:');
            console.log('  Original:', expanded.original_terms);
            console.log('  + Corpus:', expanded.corpus_terms.slice(0, 5));
            console.log('  + WordNet:', expanded.wordnet_terms.slice(0, 5));
            console.log('  Total terms:', expanded.all_terms.length);
        }
        
        // Step 2: Vector search with original query
        const queryVector = createSimpleEmbedding(queryText);
        const vectorResults = await catalogTable
            .vectorSearch(queryVector)
            .limit(limit * 3)
            .toArray();
        
        // Step 3: Score each result with multi-signal approach
        const scored = vectorResults.map((result: any) => {
            // 1. Vector similarity score
            const vectorScore = 1 - (result._distance || 0);
            
            // 2. BM25 with expanded terms
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
        
        for (const term of terms) {
            const termLower = term.toLowerCase();
            const weight = weights.get(termLower) || 0.5;
            
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
        
        return Math.min(score / terms.length, 1.0);  // Normalize
    }
    
    private calculateConceptScore(
        expanded: ExpandedQuery,
        result: any
    ): number {
        try {
            const metadata = result.concepts;
            if (!metadata) return 0;
            
            const docConcepts = [
                ...(metadata.primary_concepts || []),
                ...(metadata.technical_terms || [])
            ].map((c: string) => c.toLowerCase());
            
            let matches = 0;
            let weightedScore = 0;
            
            for (const queryConcept of expanded.all_terms) {
                for (const docConcept of docConcepts) {
                    if (docConcept.includes(queryConcept) || queryConcept.includes(docConcept)) {
                        matches++;
                        const weight = expanded.weights.get(queryConcept) || 0.5;
                        weightedScore += weight;
                    }
                }
            }
            
            return matches > 0 ? Math.min(weightedScore / expanded.all_terms.length, 1.0) : 0;
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
        
        return matches / wordnetTerms.length;
    }
    
    private getMatchedConcepts(expanded: ExpandedQuery, result: any): string[] {
        try {
            const metadata = result.concepts;
            if (!metadata) return [];
            
            const docConcepts = [
                ...(metadata.primary_concepts || []),
                ...(metadata.technical_terms || [])
            ];
            
            const matched: string[] = [];
            
            for (const queryConcept of expanded.all_terms) {
                for (const docConcept of docConcepts) {
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
            console.log(`${idx + 1}. ${result.source}`);
            console.log(`   Vector: ${result._vector_score.toFixed(3)}`);
            console.log(`   BM25: ${result._bm25_score.toFixed(3)}`);
            console.log(`   Title: ${result._title_score.toFixed(3)}`);
            console.log(`   Concept: ${result._concept_score.toFixed(3)}`);
            console.log(`   WordNet: ${result._wordnet_score.toFixed(3)}`);
            console.log(`   ➜ Hybrid: ${result._hybrid_score.toFixed(3)}`);
            if (result.matched_concepts && result.matched_concepts.length > 0) {
                console.log(`   Matched: ${result.matched_concepts.join(', ')}`);
            }
            console.log();
        });
    }
}
```

**Deliverable:** Complete conceptual search engine

---

### Phase 5: Integration & Testing (2-3 hours)

#### Task 5.1: Update MCP Tools (1 hour)

**File:** `src/tools/operations/conceptual_catalog_search.ts`
```typescript
import { catalogTable, conceptTable } from "../../lancedb/conceptual_search_client.js";
import { ConceptualSearchClient } from "../../lancedb/conceptual_search_client.js";
import { BaseTool, ToolParams } from "../base/tool.js";

export interface ConceptualSearchParams extends ToolParams {
  text: string;
  debug?: boolean;
}

export class ConceptualCatalogSearchTool extends BaseTool<ConceptualSearchParams> {
  name = "catalog_search";
  description = "Search for relevant documents using conceptual search (corpus concepts + WordNet + hybrid signals)";
  inputSchema = {
    type: "object" as const,
    properties: {
      text: {
        type: "string",
        description: "Search string",
      },
      debug: {
        type: "boolean",
        description: "Show debug information (query expansion, scores)",
        default: false
      }
    },
    required: ["text"],
  };

  private searchClient?: ConceptualSearchClient;

  async execute(params: ConceptualSearchParams) {
    try {
      if (!this.searchClient) {
        this.searchClient = new ConceptualSearchClient(conceptTable);
      }

      const results = await this.searchClient.search(
        catalogTable,
        params.text,
        5,
        params.debug || false
      );
      
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(results, null, 2) },
        ],
        isError: false,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
```

**Deliverable:** MCP tool with conceptual search

#### Task 5.2: Create Test Suite (1 hour)

**File:** `test/conceptual_search.test.ts`
```typescript
import { ConceptualSearchClient } from '../src/lancedb/conceptual_search_client';
import { QueryExpander } from '../src/concepts/query_expander';

// Test queries for technical content
const testQueries = [
    {
        query: "thread synchronization mechanisms",
        expectedConcepts: ["mutex", "semaphore", "lock", "concurrent"],
        expectedSources: ["concurrency", "threading", "synchronization"]
    },
    {
        query: "sorting algorithm efficiency",
        expectedConcepts: ["quicksort", "mergesort", "big o", "complexity"],
        expectedSources: ["algorithms", "sorting", "performance"]
    },
    {
        query: "database transaction isolation",
        expectedConcepts: ["acid", "serializable", "commit", "rollback"],
        expectedSources: ["database", "transaction", "sql"]
    }
];

async function runTests() {
    console.log('🧪 Testing Conceptual Search\n');
    
    for (const test of testQueries) {
        console.log(`Query: "${test.query}"`);
        
        // Test query expansion
        const expanded = await queryExpander.expandQuery(test.query);
        console.log(`  Expanded to ${expanded.all_terms.length} terms`);
        
        // Check if expected concepts are present
        const foundConcepts = test.expectedConcepts.filter(
            c => expanded.all_terms.includes(c)
        );
        console.log(`  Found concepts: ${foundConcepts.join(', ') || 'none'}`);
        
        // Test search
        const results = await searchClient.search(catalogTable, test.query, 5);
        console.log(`  Results: ${results.length}`);
        
        if (results.length > 0) {
            console.log(`  Top result: ${results[0].source}`);
            console.log(`  Hybrid score: ${results[0]._hybrid_score.toFixed(3)}`);
        }
        
        console.log();
    }
}
```

**Deliverable:** Test suite for validation

#### Task 5.3: Documentation (1 hour)

Create usage documentation with examples

**File:** `.engineering/artifacts/planning/2025-11-13-search-improvements/CONCEPTUAL_SEARCH_USAGE.md`
```markdown
# Using Conceptual Search

## Query Examples

### Basic Query
"thread synchronization"

Expands to:
- WordNet: thread, synchronization, concurrent, parallel
- Corpus: mutex, semaphore, lock, race condition

### Complex Query
"implement authentication with JWT tokens"

Expands to:
- WordNet: implement → execute, apply
- Corpus: authentication → OAuth, session, login
- Corpus: JWT → token, authorization, security

## Debug Mode

Enable to see query expansion:
```json
{
  "text": "your query",
  "debug": true
}
```

Shows:
- Original terms
- Corpus-added terms
- WordNet-added terms
- Score breakdown per result
```

**Deliverable:** User documentation

---

## 📊 Success Metrics

### Quantitative Metrics
- [ ] Query expansion ratio: 3-5x original terms
- [ ] Search latency: < 500ms with caching
- [ ] Concept coverage: > 80% of technical terms
- [ ] WordNet hit rate: 60-70% for general terms

### Qualitative Metrics
- [ ] Synonym queries work (function/method/procedure)
- [ ] Related concept queries work (mutex → race condition)
- [ ] Hierarchical queries work (quicksort → sorting → algorithm)
- [ ] Domain-specific queries work (React hooks, Kubernetes)

### Test Queries
```typescript
const benchmarkQueries = [
    "increase performance",  // WordNet synonyms
    "sorting algorithms",     // Technical hierarchy
    "React hooks",            // Modern framework (corpus-only)
    "thread safety",          // Technical + general
    "API authentication"      // Mixed technical terms
];
```

---

## 🎯 Timeline Summary

| Phase | Tasks | Time | Cumulative |
|-------|-------|------|------------|
| 1. Foundation | Setup, structure, types | 2h | 2h |
| 2. Corpus Concepts | Extraction, indexing, seeding | 4h | 6h |
| 3. WordNet | Service, enrichment | 3h | 9h |
| 4. Search Engine | Expander, client | 3h | 12h |
| 5. Integration | Tools, tests, docs | 2-3h | 14-15h |

**Total: 14-15 hours**

---

## 🚀 Quick Start Path

**Want to start immediately? Follow this sequence:**

1. **Hour 1:** Task 1.1-1.4 (Foundation)
2. **Hour 2-3:** Task 2.1 (Concept extraction prompt)
3. **Hour 4:** Task 2.3 (Update seeding, test with 2-3 documents)
4. **Hour 5:** Task 3.1 (WordNet service)
5. **Hour 6:** Task 4.1-4.2 (Search engine)
6. **Hour 7:** Test and iterate

This gives you a working system in 7 hours, then polish later.

---

## 📝 Next Steps

1. Review this plan and adjust priorities
2. Set up development environment (Phase 1)
3. Start with corpus extraction (highest ROI)
4. Add WordNet incrementally
5. Test with real queries
6. Iterate based on results

**Ready to start? I can begin implementing Phase 1 right now!**

