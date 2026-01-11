# Extract Concepts Script Fix

## Problem Identified

The original `extract_concepts.ts` script had a critical issue:

### The Issue
- **Always selected rank #1** - Script used `results[0]` from vector search
- **Vector similarity ≠ exact match** - Semantic search sometimes ranks the wrong document higher
- **Example**: "Complexity Perspectives" book ranked #8 instead of #1

### Why This Happened
The script used **vector search** on enriched content (summary + concepts), which compares semantic meaning rather than exact title matching. This meant:
- Documents with similar themes could rank higher
- The actual document being searched for could appear lower in results
- No fallback to check for title matches

## Solution Implemented

### Smart Selection Logic

Added intelligent document selection that prioritizes exact title matches:

```typescript
// Smart selection: prioritize exact title matches over vector similarity
let doc = results[0];

// Check if any result has the search query in its filename (case-insensitive)
const queryLower = documentQuery.toLowerCase();
const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2); // Only words > 2 chars

// Look for a document that contains most of the query words in its filename
for (const result of results) {
    const filename = result.source.toLowerCase();
    const matchCount = queryWords.filter(word => filename.includes(word)).length;
    
    // If this document matches more than 50% of query words, prefer it
    if (matchCount > queryWords.length * 0.5) {
        doc = result;
        console.log(`\n🎯 Found exact title match (rank ${results.indexOf(result) + 1})`);
        break;
    }
}
```

### How It Works

1. **Vector search** - Still performs semantic search to get top 10 candidates
2. **Title matching** - Checks each result's filename for query words
3. **50% threshold** - If a document matches >50% of query words, it's selected
4. **Fallback** - If no title match found, uses the top-ranked result (original behavior)

## Test Results

### Before Fix
```bash
npx tsx scripts/extract_concepts.ts "complexity perspectives innovation social change"
# ❌ Selected: Social Skill and the Theory of Fields (rank 1)
# ✗ Complexity Perspectives book was rank 8
```

### After Fix
```bash
npx tsx scripts/extract_concepts.ts "complexity perspectives innovation social change"
# 🎯 Found exact title match (rank 8)
# ✅ Selected: Complexity Perspectives in Innovation and Social Change
# 📊 Extracted 1993 concepts!
```

## All Three Books Successfully Extracted

### 1. The Art of War
- **Total:** 397 concepts
- **Primary:** 367
- **Related:** 30
- **Categories:** 7
- **File:** `art_of_war_concepts.md`

### 2. Notes on the Synthesis of Form
- **Total:** 122 concepts
- **Primary:** 95
- **Related:** 27
- **Categories:** 5
- **File:** `notes_on_synthesis_of_form_concepts.md`

### 3. Complexity Perspectives in Innovation and Social Change
- **Total:** 1,993 concepts (!)
- **Primary:** 1,943
- **Related:** 50
- **Categories:** 7
- **File:** `complexity_perspectives_concepts.md`

## Key Benefits

✅ **Accurate document selection** - Finds the right document even when it ranks lower
✅ **Backward compatible** - Falls back to vector similarity if no title match
✅ **User feedback** - Shows when exact match is found vs. similarity match
✅ **Flexible matching** - Works with partial titles and various query formats

## Usage Examples

```bash
# Exact title
npx tsx scripts/extract_concepts.ts "complexity perspectives innovation social change"

# Author names
npx tsx scripts/extract_concepts.ts "Christopher Alexander synthesis form"

# Partial title
npx tsx scripts/extract_concepts.ts "Art of War"

# With ISBN
npx tsx scripts/extract_concepts.ts "9781282006263"
```

## Document Linking in Database

To answer your question about how concepts are linked to documents:

### Database Schema
```
catalog table:
├── source (string) - Full file path
├── text_preview (string) - Document summary
├── concepts (object) - Structured concept data
│   ├── primary_concepts (array)
│   ├── related_concepts (array)
│   └── categories (array)
├── hash (string) - Document hash
└── vector (embedding) - For semantic search
```

### How It Works
1. **Concepts are stored IN the document record** via the `concepts` field
2. **Title is part of the `source` field** (full file path)
3. **Vector search** queries the embedding, not the title directly
4. **Our fix** adds title matching as a post-search filter

This means concepts are directly associated with documents through the catalog table, but the vector search doesn't prioritize exact title matching - which is why we needed the fix!


