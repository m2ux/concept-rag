# Alternative Embedding Providers - Configuration Guide

**Date**: November 15, 2025  
**Status**: Complete  
**Branch**: `feature/alternative-embedding-providers`

---

## Overview

This document provides detailed configuration instructions for using alternative embedding providers in Concept-RAG. All configuration is done via environment variables, making it easy to switch providers without code changes.

---

## Supported Providers

| Provider | API Required | Cost | Quality | Best For |
|----------|--------------|------|---------|----------|
| **Simple** | No | Free | Basic | Development/Testing |
| **OpenAI** | Yes | ~$0.02/1M tokens | Excellent | Production, high accuracy |
| **OpenRouter** | Yes | Variable | High | Multi-model access |
| **HuggingFace** | Optional | Free/Paid | Excellent | Privacy, local inference |

---

## Configuration Details

### Simple Embedding Service (Default)

**When to Use**:
- Development and testing
- No API costs acceptable
- Basic semantic search sufficient

**Configuration**:
```bash
# In .env file or environment
EMBEDDING_PROVIDER=simple  # or leave unset (default)
```

**Characteristics**:
- Hash-based embeddings (deterministic)
- 384 dimensions
- No external API calls
- Instant response time (~1ms)
- Limited semantic understanding

**No Additional Dependencies Required**

---

### OpenAI Embedding Service

**When to Use**:
- Production systems requiring high-quality embeddings
- Need industry-standard semantic search
- Budget allows API costs

**Configuration**:
```bash
# Required
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...

# Optional (with defaults)
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_BASE_URL=https://api.openai.com/v1
```

**Environment Variables**:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMBEDDING_PROVIDER` | Yes | - | Must be set to `openai` |
| `OPENAI_API_KEY` | Yes | - | Your OpenAI API key from platform.openai.com |
| `OPENAI_EMBEDDING_MODEL` | No | `text-embedding-3-small` | OpenAI embedding model to use |
| `OPENAI_BASE_URL` | No | `https://api.openai.com/v1` | API endpoint (for Azure or custom) |

**Available Models**:
- `text-embedding-3-small`: 1536 dims, $0.02/1M tokens (recommended)
- `text-embedding-3-large`: 3072 dims, $0.13/1M tokens (highest quality)
- `text-embedding-ada-002`: 1536 dims (legacy, not recommended)

**Characteristics**:
- 1536-dimensional embeddings (projected to 384)
- ~50-200ms latency per request
- Excellent semantic understanding
- Requires internet connection

**Getting an API Key**:
1. Sign up at https://platform.openai.com
2. Navigate to API Keys section
3. Create new secret key
4. Copy and save securely (won't be shown again)
5. Add to `.env` file

**Cost Estimation**:
- ~$0.02 per 1M tokens
- Average document (5000 tokens): ~$0.0001
- 10,000 documents: ~$1.00
- Very cost-effective for most use cases

---

### OpenRouter Embedding Service

**When to Use**:
- Need access to multiple embedding models
- Want unified billing across models
- Prefer OpenRouter's usage tracking

**Configuration**:
```bash
# Required
EMBEDDING_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...

# Optional (with defaults)
OPENROUTER_EMBEDDING_MODEL=openai/text-embedding-3-small
OPENROUTER_EMBEDDING_BASE_URL=https://openrouter.ai/api/v1
```

**Environment Variables**:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMBEDDING_PROVIDER` | Yes | - | Must be set to `openrouter` |
| `OPENROUTER_API_KEY` | Yes | - | Your OpenRouter API key from openrouter.ai/keys |
| `OPENROUTER_EMBEDDING_MODEL` | No | `openai/text-embedding-3-small` | Model identifier (provider/model format) |
| `OPENROUTER_EMBEDDING_BASE_URL` | No | `https://openrouter.ai/api/v1` | OpenRouter API endpoint |

**Available Models** (check openrouter.ai/docs for current list):
- `openai/text-embedding-3-small`: Standard OpenAI model
- `openai/text-embedding-3-large`: High-quality OpenAI model
- Additional models as OpenRouter adds support

**Characteristics**:
- OpenAI-compatible API
- Unified API for multiple providers
- Usage tracking and analytics
- ~100-300ms latency per request
- Automatic model availability checks

**Getting an API Key**:
1. Sign up at https://openrouter.ai
2. Navigate to Keys section
3. Generate new API key
4. Add credits to account (pay-as-you-go)
5. Add key to `.env` file

**Benefits Over Direct OpenAI**:
- Single API key for multiple models
- Usage dashboard and analytics
- Model availability fallbacks
- Competitive pricing

**Cost**: Variable by model (check openrouter.ai/docs/pricing)

---

### HuggingFace Embedding Service

**When to Use**:
- Privacy requirements (local inference)
- No internet connection available
- Want to avoid per-request API costs
- Open-source model preferences

**Configuration**:

#### API Mode (Requires API Key)
```bash
EMBEDDING_PROVIDER=huggingface
HUGGINGFACE_API_KEY=hf_...
HUGGINGFACE_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

#### Local Mode (Privacy-First, No API Key)
```bash
EMBEDDING_PROVIDER=huggingface
HUGGINGFACE_USE_LOCAL=true
HUGGINGFACE_MODEL=Xenova/all-MiniLM-L6-v2
```

**Environment Variables**:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMBEDDING_PROVIDER` | Yes | - | Must be set to `huggingface` |
| `HUGGINGFACE_API_KEY` | Conditional | - | Required for API mode, optional for local |
| `HUGGINGFACE_MODEL` | No | `sentence-transformers/all-MiniLM-L6-v2` | Model identifier from HuggingFace Hub |
| `HUGGINGFACE_USE_LOCAL` | No | `false` | Set to `true` for local inference |

**Recommended Models**:

**For API Mode**:
- `sentence-transformers/all-MiniLM-L6-v2`: 384 dims (recommended, native dimension)
- `sentence-transformers/all-mpnet-base-v2`: 768 dims (higher quality)
- `BAAI/bge-small-en-v1.5`: 384 dims (excellent quality)

**For Local Mode** (optimized for transformers.js):
- `Xenova/all-MiniLM-L6-v2`: 384 dims (recommended)
- Other Xenova/ models compatible with transformers.js

**Characteristics**:
- 384-dimensional embeddings (native, no projection needed)
- API Mode: ~100-500ms latency
- Local Mode: ~50-200ms after model load (first run: 1-2s)
- Excellent semantic understanding
- Open-source models

**Getting an API Key** (for API mode):
1. Sign up at https://huggingface.co
2. Navigate to Settings → Access Tokens
3. Create new token with read access
4. Copy and add to `.env` file

**Local Mode Setup** (currently requires additional dependency):
```bash
# Note: Local inference requires @xenova/transformers
npm install @xenova/transformers

# First run will download model (~90MB for all-MiniLM-L6-v2)
# Subsequent runs use cached model
```

**Cost**:
- API Mode: Free tier available, then ~$0.001 per 1K requests
- Local Mode: Free (uses CPU/memory, ~200MB RAM for model)

**Privacy Benefits of Local Mode**:
- ✅ No data sent to external servers
- ✅ Works offline
- ✅ GDPR/HIPAA compliance friendly
- ✅ No usage tracking
- ✅ Unlimited requests

---

## Configuration Examples

### Example 1: Development Setup (Default)

```bash
# .env file
# No embedding configuration needed - uses Simple provider
```

**Output on startup**:
```
🔌 Embedding Provider: simple
⚠️  Using SimpleEmbeddingService (development/testing only - not production-grade)
✅ Container initialized with 5 tool(s)
```

### Example 2: Production with OpenAI

```bash
# .env file
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

**Output on startup**:
```
🔌 Embedding Provider: openai
   Model: text-embedding-3-small
✅ Container initialized with 5 tool(s)
```

### Example 3: Privacy-First with Local HuggingFace

```bash
# .env file
EMBEDDING_PROVIDER=huggingface
HUGGINGFACE_USE_LOCAL=true
HUGGINGFACE_MODEL=Xenova/all-MiniLM-L6-v2
```

**Output on startup**:
```
🔌 Embedding Provider: huggingface
   Model: Xenova/all-MiniLM-L6-v2
   Mode: Local
✅ Container initialized with 5 tool(s)
```

### Example 4: Multi-Model Access with OpenRouter

```bash
# .env file
EMBEDDING_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-abcdefghijklmnopqrstuvwxyz
OPENROUTER_EMBEDDING_MODEL=openai/text-embedding-3-large
```

**Output on startup**:
```
🔌 Embedding Provider: openrouter
   Model: openai/text-embedding-3-large
✅ Container initialized with 5 tool(s)
```

---

## Switching Providers

To switch embedding providers:

1. **Stop the MCP server** (close Claude/Cursor)
2. **Update `.env` file** with new provider configuration
3. **Rebuild embeddings** (optional but recommended):
   ```bash
   npx tsx hybrid_fast_seed.ts \
     --dbpath ~/.concept_rag \
     --filesdir ~/Documents/my-pdfs \
     --overwrite
   ```
4. **Restart MCP client** (reopen Claude/Cursor)

**Note**: Different embedding providers create incompatible embeddings. If you switch providers, you should rebuild your database for optimal search quality.

---

## Troubleshooting

### Error: "API key invalid or missing"

**OpenAI**:
```bash
# Verify API key is set
echo $OPENAI_API_KEY

# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**OpenRouter**:
```bash
# Verify API key is set
echo $OPENROUTER_API_KEY

# Check account credits at openrouter.ai
```

**HuggingFace**:
```bash
# Verify API key is set
echo $HUGGINGFACE_API_KEY

# Test API key
curl -H "Authorization: Bearer $HUGGINGFACE_API_KEY" \
  https://huggingface.co/api/whoami
```

### Error: "Insufficient credits" (OpenRouter)

1. Log in to openrouter.ai
2. Navigate to Credits
3. Add credits via payment method
4. Retry request

### Error: "Model not found"

- Check model name spelling
- Verify model is available for your provider
- Consult provider documentation for current model list

### Slow Performance (API Modes)

- Check internet connection
- Verify API endpoint is reachable
- Consider switching to local HuggingFace mode for offline use

### Local HuggingFace: "@xenova/transformers not installed"

```bash
# Install additional dependency
npm install @xenova/transformers

# Restart MCP server
```

---

## Performance Comparison

| Provider | Latency | Quality | Cost | Offline |
|----------|---------|---------|------|---------|
| Simple | ~1ms | Basic | Free | ✅ Yes |
| OpenAI | ~50-200ms | Excellent | ~$0.02/1M | ❌ No |
| OpenRouter | ~100-300ms | High | Variable | ❌ No |
| HF API | ~100-500ms | Excellent | ~$0.001/1K | ❌ No |
| HF Local | ~50-200ms* | Excellent | Free | ✅ Yes |

*After model load (first run: 1-2s)

---

## Security Best Practices

### API Key Management

1. **Never commit API keys to version control**
   ```bash
   # .env should be in .gitignore
   echo ".env" >> .gitignore
   ```

2. **Use environment variables, not hardcoded values**
   ```bash
   # Good: Read from environment
   OPENAI_API_KEY=$OPENAI_API_KEY
   
   # Bad: Hardcode in config
   OPENAI_API_KEY=sk-proj-123456789...
   ```

3. **Rotate keys regularly**
   - OpenAI: platform.openai.com → API Keys → Revoke + Create new
   - OpenRouter: openrouter.ai/keys → Revoke + Generate new
   - HuggingFace: huggingface.co/settings/tokens → Revoke + Create new

4. **Use separate keys for development and production**

5. **Set usage limits** (where available)
   - OpenAI: Set monthly spending limits
   - OpenRouter: Set per-key spending limits

### Local vs. Cloud Considerations

**Choose Local (HuggingFace) if**:
- Processing sensitive/confidential data
- GDPR/HIPAA compliance required
- No internet connection available
- Want to avoid per-request costs

**Choose Cloud (OpenAI/OpenRouter) if**:
- Need highest quality embeddings
- Don't have sufficient local compute
- Want managed infrastructure
- API costs are acceptable

---

## References

### Official Documentation
- OpenAI Embeddings: https://platform.openai.com/docs/guides/embeddings
- OpenRouter API: https://openrouter.ai/docs
- HuggingFace Inference: https://huggingface.co/docs/api-inference/
- sentence-transformers: https://www.sbert.net/

### Related Files
- `src/config.ts`: Configuration definitions
- `src/application/container.ts`: Provider factory implementation
- `src/infrastructure/embeddings/`: Provider implementations

---

**Document Status**: ✅ Complete  
**Last Updated**: November 15, 2025

