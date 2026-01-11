# DeepSeek-OCR Quick Reference

## TL;DR Decision Guide

```
Do you have GPU access?
├─ NO  → Keep current system (it's already excellent)
│        Consider cloud GPU only if quality is critical
│
└─ YES → Proceed to Step 2
         
    Is document quality problematic?
    ├─ NO  → Keep current (don't fix what isn't broken)
    │
    └─ YES → Proceed to Step 3
    
        Do you need table/figure preservation?
        ├─ NO  → Option 2a: Fallback enhancement only
        │        (Low risk, high reward for edge cases)
        │
        └─ YES → Option 2b: Markdown-first pipeline
                 (Best quality, preserves structure)
```

---

## Three Viable Options

| Option | What It Does | When to Use | Cost Impact | Effort |
|--------|-------------|-------------|-------------|--------|
| **2a: Fallback** | Replace Tesseract with DeepSeek-OCR for problematic PDFs only | Testing, low risk | Minimal (~10% docs) | 2-3 days |
| **2b: Markdown-First** ⭐ | Always use DeepSeek-OCR, cache markdown, enhance chunks | Best quality, have GPU | +40% seeding cost | 1-2 weeks |
| **2c: Structure-Aware** 🚀 | Add chapter/section search on top of 2b | Advanced features | Same as 2b | 1+ months |

---

## Cost Comparison (100 documents)

```
Current System:         $4.80
Option 2a (Fallback):   $5.50  (+15%)  - Only problematic PDFs
Option 2b (All MD):     $6.80  (+42%)  - All PDFs
Option 2c (Enhanced):   $6.80  (+42%)  - Same as 2b

Runtime Search: $0 for all options (local embeddings)
```

---

## What You SHOULD NOT Do

❌ **Option i (In-Situ Vision Tokens)**
- Destroys your fast search (<1s → 10-60s)
- Breaks concept extraction pipeline
- Expensive runtime costs
- No hybrid ranking possible

**Verdict:** This fundamentally breaks your architecture. Do not pursue.

---

## Recommended Path

### Phase 1: Proof of Concept (This Week)
```bash
# Set up DeepSeek-OCR
git clone https://github.com/deepseek-ai/DeepSeek-OCR.git
cd DeepSeek-OCR
# Follow their setup instructions

# Test on 5-10 sample PDFs
# Compare quality with current output
# Measure GPU time and cost
```

### Phase 2: Fallback Integration (Next Week)
```typescript
// Modify hybrid_fast_seed.ts
// Replace Tesseract fallback with DeepSeek-OCR
// Test on problematic PDFs
```

### Phase 3: Full Pipeline (If POC succeeds)
```typescript
// Implement markdown caching
// Add structure-aware chunking
// Test on full corpus
```

---

## Key Insights

### What Stays the Same ✅
- Concept extraction (Claude Sonnet 4.5)
- Summary generation (Grok-4-fast)
- WordNet enrichment
- Hybrid search (5 signals)
- Fast runtime (<1s)
- Zero runtime API costs
- Incremental seeding
- LanceDB storage

### What Improves ⬆️
- OCR quality (especially scanned docs)
- Table/figure preservation
- Document structure (headings, hierarchy)
- Chunk boundary detection
- Future: Chapter-aware search

### What Changes ⚠️
- Seeding speed (15s → 30-60s per doc)
- Seeding cost ($0.048 → $0.068 per doc)
- Infrastructure (need GPU for seeding)
- Disk space (+markdown cache)

---

## Sample Implementation

### Option 2a: Fallback Enhancement

```typescript
// In hybrid_fast_seed.ts, modify callOpenRouterOCR()

async function callOpenRouterOCR(pdfPath: string) {
    try {
        // Existing Tesseract logic
        return await tesseractOCR(pdfPath);
    } catch (error) {
        console.log('⚡ Tesseract failed, using DeepSeek-OCR...');
        
        // New: Call DeepSeek-OCR
        const markdown = await fetch('http://localhost:8000/ocr', {
            method: 'POST',
            body: JSON.stringify({ 
                pdf_path: pdfPath,
                prompt: "<image>\n<|grounding|>Convert the document to markdown."
            })
        });
        
        // Convert markdown to Document[]
        return markdownToDocuments(markdown);
    }
}
```

### Option 2b: Markdown-First

```typescript
// New function in hybrid_fast_seed.ts

async function getOrCreateMarkdown(
    pdfPath: string, 
    hash: string
): Promise<string> {
    const cachePath = path.join(
        databaseDir, 
        'markdown_cache', 
        `${hash}.md`
    );
    
    // Check cache
    if (fs.existsSync(cachePath)) {
        console.log(`📄 Cache hit: ${hash.slice(0,8)}...`);
        return fs.readFileSync(cachePath, 'utf-8');
    }
    
    // Convert with DeepSeek-OCR
    console.log(`🔄 Converting: ${hash.slice(0,8)}...`);
    const response = await fetch('http://localhost:8000/convert', {
        method: 'POST',
        body: JSON.stringify({ 
            pdf_path: pdfPath,
            base_size: 1024,
            image_size: 640,
            crop_mode: true
        })
    });
    
    const markdown = await response.text();
    
    // Cache for future
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(cachePath, markdown);
    
    return markdown;
}

// Use in main seeding loop:
for (const pdfFile of pdfFiles) {
    const hash = calculateHash(pdfFile);
    const markdown = await getOrCreateMarkdown(pdfFile, hash);
    
    // Continue with existing concept extraction...
    const concepts = await extractor.extractConcepts([
        new Document({ pageContent: markdown, metadata: { source: pdfFile }})
    ]);
    
    // Rest of pipeline unchanged...
}
```

---

## Next Steps

1. **Read the full evaluation**: `DEEPSEEK_OCR_EVALUATION.md`
2. **Check GPU availability**: Do you have access to A100/H100?
3. **Decide on approach**: 2a (safe), 2b (best), or stay current
4. **Run POC if interested**: Test DeepSeek-OCR on 5-10 PDFs
5. **Ask questions**: I can help implement any option

---

## Questions?

- "Should I even do this?" → Only if quality is insufficient OR you want structure preservation
- "Which option is safest?" → Option 2a (fallback only)
- "Which is best?" → Option 2b if you have GPU and want best quality
- "Will this break my system?" → No, your core architecture stays intact
- "What about cost?" → ~40% more for seeding, $0 at runtime (same as now)

---

See `DEEPSEEK_OCR_EVALUATION.md` for detailed analysis and implementation guides.

