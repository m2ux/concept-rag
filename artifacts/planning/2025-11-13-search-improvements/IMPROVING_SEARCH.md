# 🔍 Improving Semantic Search Quality

This guide explains how to improve search quality so that documents with specific terms in their titles (like "Distributed Systems") are always found when searching for those terms.

## 📊 Current Limitation

Your system uses a **simple custom embedding function** that:
- Creates 384-dimensional vectors using word hashing
- Is fast and free (no API calls needed)
- Works like TF-IDF / bag-of-words
- **Limitation**: Doesn't understand semantic meaning or prioritize title matches

## 💡 Three Solutions (Choose Based on Your Needs)

### Solution 1: Hybrid Search (Recommended) ⭐

**What it does:**
- Combines vector similarity with keyword matching
- Boosts results when query terms appear in document titles
- Uses BM25-like scoring for text relevance
- **Best balance of speed, cost, and accuracy**

**Implementation:**
I've created two new files:
1. `src/lancedb/hybrid_search_client.ts` - Enhanced search with title matching
2. `src/tools/operations/hybrid_catalog_search.ts` - Tool that uses hybrid search

**How to use it:**

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Update your tool registry** to use the hybrid search:

   Edit `src/tools/simple_registry.ts` (or create a new hybrid registry):
   ```typescript
   import { HybridCatalogSearchTool } from "./operations/hybrid_catalog_search.js";
   
   export const tools = [
     new HybridCatalogSearchTool(),
     // ... other tools
   ];
   ```

3. **Test it:**
   ```bash
   npx @modelcontextprotocol/inspector dist/simple_index.js ~/.lance_mcp
   ```

**Pros:**
- ✅ Title matches always rank highly
- ✅ Still uses fast local embeddings (no API costs)
- ✅ Combines semantic + keyword matching
- ✅ Easy to tune weights (40% vector, 30% BM25, 30% title)

**Cons:**
- ⚠️ Still uses simple embeddings (not true semantic understanding)

---

### Solution 2: Store Titles in Catalog

**What it does:**
- Extracts book titles from filenames during seeding
- Includes titles in the summary/text that gets embedded
- Ensures title terms are searchable

**Implementation:**

Modify `hybrid_fast_seed.ts` around line 720-750:

```typescript
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

    for (const [source, docs] of Object.entries(docsBySource)) {
        let hash = docs[0]?.metadata?.hash;
        if (!hash || hash === 'unknown') {
            const fileContent = await fs.promises.readFile(source);
            hash = crypto.createHash('sha256').update(fileContent).digest('hex');
        }

        const isOcrProcessed = docs.some(doc => doc.metadata.ocr_processed);
        const sourceBasename = path.basename(source);
        
        // Extract title from filename
        const title = extractTitleFromFilename(sourceBasename);
        
        console.log(`🤖 Generating summary for: ${title}`);
        
        const contentOverview = await generateContentOverview(docs);
        
        // Include title in the content that will be embedded
        const enrichedContent = `Title: ${title}\n\n${contentOverview}`;
        
        const catalogRecord = new Document({ 
            pageContent: enrichedContent,  // Changed from contentOverview
            metadata: { 
                source, 
                hash,
                title,  // Store title separately too
                ocr_processed: isOcrProcessed
            } 
        });
        
        catalogRecords.push(catalogRecord);
    }

    return catalogRecords;
}

// Helper function to extract clean title from filename
function extractTitleFromFilename(filename: string): string {
    return filename
        .replace(/\.pdf$/i, '')
        .replace(/--/g, ' ')  // Your filenames use -- as separator
        .replace(/_/g, ' ')
        .split('--')[0]  // Take the part before first --
        .trim();
}
```

**How to use:**
1. Modify `hybrid_fast_seed.ts` as shown
2. Re-run seeding: `npx tsx hybrid_fast_seed.ts --filesdir ~/Documents/ebooks --dbpath ~/.lance_mcp --overwrite`
3. Rebuild: `npm run build`

**Pros:**
- ✅ Simple modification to existing code
- ✅ Title terms now embedded in document summaries
- ✅ No changes to search logic needed

**Cons:**
- ⚠️ Requires re-seeding entire database
- ⚠️ Still limited by simple embedding function

---

### Solution 3: Use Real Semantic Embeddings (Best Quality)

**What it does:**
- Replaces simple hash-based embeddings with true semantic embeddings
- Uses models that understand meaning (like sentence-transformers)
- **Best search quality but adds cost/complexity**

**Option A: Use OpenAI Embeddings (Paid API)**

Modify `hybrid_fast_seed.ts`:

```typescript
import { OpenAIEmbeddings } from "@langchain/openai";

// Replace createSimpleEmbedding with:
const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small" // $0.02 per 1M tokens
});

async function createLanceTableWithOpenAIEmbeddings(
    db: lancedb.Connection,
    documents: Document[],
    tableName: string,
    mode?: "overwrite"
): Promise<lancedb.Table> {
    console.log(`🔄 Creating OpenAI embeddings for ${documents.length} documents...`);
    
    // Generate embeddings in batches
    const batchSize = 100;
    const data = [];
    
    for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        const texts = batch.map(doc => doc.pageContent);
        const vectors = await embeddings.embedDocuments(texts);
        
        batch.forEach((doc, idx) => {
            data.push({
                id: (i + idx).toString(),
                text: doc.pageContent,
                source: doc.metadata.source || '',
                hash: doc.metadata.hash || '',
                loc: JSON.stringify(doc.metadata.loc || {}),
                vector: vectors[idx]
            });
        });
        
        console.log(`✅ Embedded ${Math.min(i + batchSize, documents.length)}/${documents.length} documents`);
    }
    
    // ... rest of table creation logic
}
```

**Option B: Use Ollama Embeddings (Free, Local)**

```bash
# Pull embedding model
ollama pull nomic-embed-text

# Or use a smaller model
ollama pull snowflake-arctic-embed2
```

Then use the original `src/index.ts` and `src/seed.ts` which already support Ollama embeddings.

**Pros:**
- ✅ True semantic understanding
- ✅ "Distributed Systems" and "parallel computing" recognized as related
- ✅ Best search quality

**Cons:**
- ⚠️ OpenAI: ~$0.02 per 1000 documents
- ⚠️ Ollama: Requires local model + more memory
- ⚠️ Slower embedding generation

---

## 🎯 Recommendation

**For your use case (searching book titles):**

1. **Start with Solution 1 (Hybrid Search)** - Immediate improvement, no re-seeding needed
2. **Add Solution 2 (Store Titles)** - Better long-term, requires re-seeding
3. **Consider Solution 3** only if you need true semantic understanding (e.g., finding books about concepts, not just titles)

## 🧪 Testing Your Improvements

After implementing changes, test with:

```bash
# Search for "Distributed Systems"
# Should find all 4 books:
# 1. Distributed Computing: 16th International Conference
# 2. Distributed Systems for Practitioners  
# 3. Continuous and Distributed Systems
# 4. Understanding Distributed Systems
```

## 📈 Tuning Hybrid Search Weights

In `hybrid_search_client.ts`, adjust these weights based on your needs:

```typescript
// Current settings:
const hybridScore = (vectorScore * 0.4) + (bm25Score * 0.3) + (titleScore * 0.3);

// For more title emphasis:
const hybridScore = (vectorScore * 0.3) + (bm25Score * 0.2) + (titleScore * 0.5);

// For more semantic emphasis:
const hybridScore = (vectorScore * 0.6) + (bm25Score * 0.2) + (titleScore * 0.2);
```

## 🔧 Debug Mode

To see scoring details, modify `hybridSearchTable` to log scores:

```typescript
if (process.env.DEBUG_SEARCH) {
    console.log(`Document: ${result.source}`);
    console.log(`  Vector: ${vectorScore.toFixed(3)}`);
    console.log(`  BM25: ${bm25Score.toFixed(3)}`);
    console.log(`  Title: ${titleScore.toFixed(3)}`);
    console.log(`  Hybrid: ${hybridScore.toFixed(3)}`);
}
```

Then run with:
```bash
DEBUG_SEARCH=1 node dist/simple_index.js ~/.lance_mcp
```

## 📝 Next Steps

1. Choose your solution based on needs (I recommend starting with Solution 1)
2. Implement and test
3. If needed, combine multiple solutions for best results
4. Fine-tune weights based on your search patterns

Feel free to ask if you need help implementing any of these solutions!



