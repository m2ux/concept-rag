# 24. Multi-Provider Embedding Architecture

**Date:** 2025-11-15  
**Status:** Accepted  
**Deciders:** concept-rag Engineering Team  
**Technical Story:** Alternative Embedding Providers (November 15, 2025)

**Sources:**
- Planning: .ai/planning/2025-11-15-alternative-embedding-providers/
- Git Commit: b05192e178dad86e7960b86b10699314272c8913 (November 15, 2024)

## Context and Problem Statement

The system used simple hash-based embeddings (local, zero cost) but lacked true semantic understanding [Limitation: hash embeddings]. For production semantic search quality, real transformer-based embeddings needed [Requirement: quality improvement], but users needed choice between cost (free local) vs. quality (API) and different providers for flexibility [Use case: options].

**The Core Problem:** How to support multiple embedding providers (OpenAI, Voyage AI, Ollama, local) with configuration-based switching? [Planning: `.ai/planning/2025-11-15-alternative-embedding-providers/01-implementation-plan.md`]

**Decision Drivers:**
* User choice: cost vs. quality trade-off [Requirement: flexibility]
* Avoid vendor lock-in [Risk: single provider dependency]
* Privacy options (local vs. cloud) [Requirement: privacy-conscious users]
* Different use cases (development vs. production) [Context: varied needs]
* Easy switching without code changes [UX: configuration-based]

## Alternative Options

* **Option 1: Multi-Provider with Factory Pattern** - Support OpenAI, Voyage AI, Ollama
* **Option 2: Single Provider (OpenAI only)** - Lock to one provider
* **Option 3: Bring-Your-Own-Embeddings** - Users provide pre-computed vectors
* **Option 4: Multiple Forks** - Separate codebases per provider
* **Option 5: Keep Simple Hash Only** - No real embeddings

## Decision Outcome

**Chosen option:** "Multi-Provider with Factory Pattern (Option 1)", because it provides user flexibility, avoids lock-in, supports privacy-conscious users, and enables cost/quality trade-offs through simple configuration.

### Supported Providers

**Configuration:** [Source: `01-implementation-plan.md`, lines 38-91]
- **simple** (default): Hash-based, zero cost, fast
- **openai**: OpenAI ada-002 or text-embedding-3-small
- **voyage**: Voyage AI embedding models
- **ollama**: Local models (privacy-first)

**Environment Variables:**
```bash
EMBEDDING_PROVIDER=openai           # Provider selection
OPENAI_API_KEY=sk-...              # OpenAI key
VOYAGE_API_KEY=pa-...              # Voyage AI key
# Ollama uses local endpoint (no key needed)
```
[Source: Configuration design in planning]

### Factory Pattern Implementation

**Factory:** [Source: `README.md`, lines 108-117; planning doc]
```typescript
// Application container creates provider based on config
container.register('EmbeddingProvider', {
  useFactory: (container) => {
    const config = container.resolve('Configuration');
    
    switch (config.embeddings.provider) {
      case 'openai': return new OpenAIEmbeddingProvider(config.openai);
      case 'voyage': return new VoyageAIEmbeddingProvider(config.voyage);
      case 'ollama': return new OllamaEmbeddingProvider(config.ollama);
      default: return new SimpleEmbeddingService();
    }
  }
});
```

### Consequences

**Positive:**
* **User choice:** Pick provider based on needs [Flexibility: cost/quality/privacy]
* **No vendor lock-in:** Can switch providers anytime [Risk mitigation: flexibility]
* **Privacy options:** Local Ollama for sensitive documents [Feature: privacy]
* **Cost options:** Simple (free) vs. OpenAI ($0.02/1M tokens) [Trade-off: explicit]
* **Development flexibility:** Simple for dev, OpenAI for production [Use case: environment-based]
* **Future-proof:** Easy to add new providers (Cohere, etc.) [Extensibility: open]
* **Backward compatible:** Simple provider is default [Safety: no breaking changes]

**Negative:**
* **Configuration complexity:** More environment variables [UX: configuration burden]
* **Testing matrix:** Must test all providers [Testing: increased scope]
* **Dimension handling:** Different models have different dimensions [Complexity: normalization]
* **API key management:** Users must manage multiple keys [UX: key management]
* **Provider-specific issues:** Must handle quirks of each provider [Maintenance: provider differences]

**Neutral:**
* **Factory pattern:** Standard design pattern [Architecture: conventional]
* **Environment-based:** Configuration via env vars [Deployment: 12-factor app]

### Confirmation

**Implementation Status:** [Source: `.ai/planning/2025-11-15-alternative-embedding-providers/README.md`]
- Planning complete November 15, 2025
- Implementation in progress
- Feature branch created

**Providers Planned:**
- ✅ Simple (existing, default)
- 🏗️ OpenAI (planned)
- 🏗️ Voyage AI (planned)  
- 🏗️ Ollama (planned)

## Pros and Cons of the Options

### Option 1: Multi-Provider with Factory - Chosen

**Pros:**
* Maximum flexibility (4 providers)
* No vendor lock-in
* Privacy options (local)
* Cost options (free to paid)
* Easy to extend (add providers)
* Configuration-based switching
* Backward compatible

**Cons:**
* Configuration complexity
* Testing matrix expanded
* Dimension normalization needed
* Multiple API keys to manage
* Provider-specific handling

### Option 2: Single Provider (OpenAI Only)

Lock to OpenAI embeddings only.

**Pros:**
* Simplest implementation
* One API to maintain
* Consistent behavior
* Best quality (OpenAI)

**Cons:**
* **Vendor lock-in:** Tied to OpenAI [Risk: dependency]
* **No privacy option:** All data goes to OpenAI [Privacy: no local option]
* **Cost only option:** Can't use free alternatives [Cost: no choice]
* **No flexibility:** Users can't choose [UX: limiting]
* **Against philosophy:** Project values user choice

### Option 3: Bring-Your-Own-Embeddings

Users provide pre-computed vectors (don't handle embedding generation).

**Pros:**
* Zero provider integration
* Ultimate flexibility (users choose anything)
* No API dependencies

**Cons:**
* **Poor UX:** Users must generate embeddings externally [UX: terrible]
* **Complex workflow:** Extra tooling required [Complexity: high]
* **No seeding script:** Can't provide hybrid_fast_seed.ts [Problem: core feature]
* **Against goal:** System should be turnkey [Philosophy: ease of use]

### Option 4: Multiple Forks

Separate codebase versions per provider.

**Pros:**
* No configuration complexity
* Optimized per provider
* Simple per version

**Cons:**
* **Maintenance nightmare:** Must maintain N codebases [Maintenance: unsustainable]
* **Feature divergence:** Versions drift apart [Risk: inconsistency]
* **User confusion:** Which version to use? [UX: confusing]
* **Code duplication:** 90% code duplicated [Problem: DRY violation]

### Option 5: Keep Simple Hash Only

Don't add real embeddings.

**Pros:**
* Zero cost
* Fast
* No API dependencies
* Works offline

**Cons:**
* **Poor semantic quality:** Hash embeddings are weak [Quality: insufficient]
* **Limited understanding:** Can't capture meaning [Problem: not semantic]
* **Production inadequate:** Not suitable for real semantic search [Goal: quality matters]
* **Why fork?:** If keeping simple, fork pointless [Philosophy: purpose]

## Implementation Notes

### Provider Configuration

**Simple (Default):**
```bash
# No configuration needed (default)
EMBEDDING_PROVIDER=simple
```

**OpenAI:**
```bash
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

**Ollama (Local):**
```bash
EMBEDDING_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=nomic-embed-text
```

### Dimension Handling

**Target:** 384 dimensions (consistent) [Source: `01-implementation-plan.md`, line 119]

**Strategies:**
- **OpenAI (1536d):** Project to 384d using PCA or truncation
- **Voyage AI (1024d):** Project to 384d
- **Ollama (varies):** Use 384d models (all-MiniLM-L6-v2)
- **Simple (384d):** Already 384d

### Migration Strategy

**No Re-seeding Required:** [Design: backward compatible]
- Can switch providers for new documents
- Existing embeddings remain valid
- Mixed embeddings work (not ideal, but functional)

**Full Re-seeding (Optional):**
- For consistent embeddings across corpus
- Use new provider for all documents
- Improve search quality

## Related Decisions

- [ADR-0002: LanceDB](adr0002-lancedb-vector-storage.md) - Storage supports any 384d vectors
- [ADR-0007: Concept Extraction](adr0007-concept-extraction-llm.md) - Concepts also have embeddings
- [ADR-0018: DI Container](adr0018-dependency-injection-container.md) - Factory registered in container

## References

### Related Decisions
- [ADR-0002: LanceDB](adr0002-lancedb-vector-storage.md)
- [ADR-0018: DI Container](adr0018-dependency-injection-container.md)

---

**Confidence Level:** HIGH
**Attribution:**
- Planning docs: November 15, 2024
- Git commit: b05192e1

**Traceability:** .ai/planning/2025-11-15-alternative-embedding-providers/
