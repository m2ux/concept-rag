# Troubleshooting Guide

Complete troubleshooting guide for Concept-RAG. Most issues can be resolved quickly with these solutions.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Seeding Problems](#seeding-problems)
- [Search Issues](#search-issues)
- [MCP Integration](#mcp-integration)
- [Performance Problems](#performance-problems)
- [Error Messages](#error-messages)
- [Data Issues](#data-issues)
- [Advanced Debugging](#advanced-debugging)

---

## Installation Issues

### "node: command not found"

**Problem**: Node.js not installed or not in PATH

**Solution**:
```bash
# Check if Node.js is installed
node --version

# If not installed, install Node.js 18+
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm

# macOS (with Homebrew)
brew install node

# Or download from: https://nodejs.org/
```

### "npm install" fails

**Problem**: Dependency installation errors

**Solutions**:

1. **Clear npm cache**:
   ```bash
   npm cache clean --force
   npm install
   ```

2. **Delete node_modules and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Use specific Node.js version**:
   ```bash
   # Install nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   
   # Install Node.js 18
   nvm install 18
   nvm use 18
   npm install
   ```

### "Python not found" or "NLTK import error"

**Problem**: Python or NLTK not properly installed

**Solution**:
```bash
# Check Python version (need 3.9+)
python3 --version

# Install NLTK
pip3 install nltk

# Download WordNet data
python3 -c "import nltk; nltk.download('wordnet'); nltk.download('omw-1.4')"

# Verify installation
python3 -c "from nltk.corpus import wordnet as wn; print(f'✅ WordNet ready: {len(list(wn.all_synsets()))} synsets')"
```

If Python is not installed:
```bash
# Ubuntu/Debian
sudo apt install python3 python3-pip

# macOS (with Homebrew)
brew install python3
```

### "npm run build" fails

**Problem**: TypeScript compilation errors

**Solutions**:

1. **Check TypeScript version**:
   ```bash
   npx tsc --version
   ```

2. **Clean build**:
   ```bash
   rm -rf dist/
   npm run build
   ```

3. **Check for syntax errors**:
   ```bash
   npx tsc --noEmit
   ```

---

## Seeding Problems

### "Error: OPENROUTER_API_KEY not set"

**Problem**: API key not configured

**Solution**:
```bash
# Create .env file
echo "OPENROUTER_API_KEY=your_key_here" > .env

# Or export directly (temporary)
export OPENROUTER_API_KEY="your_key_here"

# Verify
echo $OPENROUTER_API_KEY

# Get API key at: https://openrouter.ai/keys
```

### "No PDF files found"

**Problem**: Wrong directory path or no PDFs in directory

**Solutions**:

1. **Verify directory path**:
   ```bash
   ls -la ~/Documents/pdfs
   ```

2. **Check for PDF files**:
   ```bash
   find ~/Documents/pdfs -name "*.pdf"
   ```

3. **Use absolute path**:
   ```bash
   npx tsx hybrid_fast_seed.ts \
     --dbpath ~/.concept_rag \
     --filesdir /absolute/path/to/pdfs \
     --overwrite
   ```

### "PDF parsing failed" for specific file

**Problem**: Corrupted, password-protected, or unusual PDF

**Solutions**:

1. **Check if PDF opens normally**:
   ```bash
   # Try opening in a PDF reader
   xdg-open problem_file.pdf  # Linux
   open problem_file.pdf      # macOS
   ```

2. **Re-save PDF**:
   - Open in PDF reader
   - Save As → PDF
   - Try seeding again

3. **Convert to PDF/A**:
   ```bash
   # Using Ghostscript
   gs -dPDFA -dBATCH -dNOPAUSE -sProcessColorModel=DeviceCMYK \
      -sDEVICE=pdfwrite -sOutputFile=output.pdf input.pdf
   ```

4. **Skip problematic file**:
   - Move file out of directory
   - Seed without it
   - Investigate separately

### "Out of memory" during seeding

**Problem**: Processing very large documents or too many at once

**Solutions**:

1. **Increase Node.js memory**:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npx tsx hybrid_fast_seed.ts \
     --dbpath ~/.concept_rag \
     --filesdir ~/docs
   ```

2. **Process in batches**:
   ```bash
   # Create subdirectories
   mkdir batch1 batch2 batch3
   # Move files into batches
   # Process each batch separately
   ```

3. **Monitor memory usage**:
   ```bash
   # While seeding, in another terminal
   watch -n 1 'ps aux | grep node'
   ```

### "API rate limit exceeded"

**Problem**: Too many requests to OpenRouter

**Solutions**:

1. **Add delay between documents** (modify code):
   ```typescript
   // In hybrid_fast_seed.ts, add delay
   await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second
   ```

2. **Process fewer documents at a time**

3. **Check OpenRouter limits**: https://openrouter.ai/docs/limits

### Seeding is very slow

**Problem**: Large documents or slow API responses

**Solutions**:

1. **Use incremental seeding** (don't re-process existing files):
   ```bash
   # Omit --overwrite flag
   npx tsx hybrid_fast_seed.ts --dbpath ~/.concept_rag --filesdir ~/docs
   ```

2. **Check document sizes**:
   ```bash
   # Find large PDFs
   find ~/docs -name "*.pdf" -size +10M
   ```

3. **Monitor progress**:
   - Watch console output
   - Each document shows progress
   - Concept extraction takes 10-30 seconds per doc

---

## Search Issues

### "No results found" when searching

**Problem**: Documents not properly indexed or wrong query

**Solutions**:

1. **Verify documents are indexed**:
   ```bash
   # Check catalog
   npx tsx scripts/extract_concepts.ts "document name"
   ```

2. **Try different search tools**:
   ```bash
   # If concept_search returns nothing, try:
   # broad_chunks_search for same query
   ```

3. **Check query phrasing**:
   ```
   ❌ "show me innovation stuff"
   ✅ "innovation" (for concept_search)
   ✅ "documents about innovation" (for catalog_search)
   ✅ "how do organizations innovate?" (for broad_chunks_search)
   ```

4. **Re-index documents**:
   ```bash
   npx tsx hybrid_fast_seed.ts --dbpath ~/.concept_rag --filesdir ~/docs --overwrite
   ```

### "No concepts found for document"

**Problem**: Document wasn't processed with concept extraction

**Solutions**:

1. **Check if document is in database**:
   ```bash
   # List all documents
   npx tsx -e "
   import { connect } from '@lancedb/lancedb';
   const db = await connect(process.env.CONCEPT_RAG_DB || '~/.concept_rag');
   const catalog = await db.openTable('catalog');
   const docs = await catalog.query().limit(100).toArray();
   docs.forEach(d => console.log(d.source));
   "
   ```

2. **Re-extract concepts**:
   ```bash
   npx tsx scripts/repair_missing_concepts.ts --min-concepts 10
   ```

3. **Full re-seed**:
   ```bash
   npx tsx hybrid_fast_seed.ts --dbpath ~/.concept_rag --filesdir ~/docs --overwrite
   ```

### Search returns irrelevant results

**Problem**: Wrong tool or query formulation

**Solutions**:

1. **Use concept_search for concepts**:
   ```
   Query: "innovation"
   Tool: concept_search (not broad_chunks_search)
   ```

2. **Be more specific**:
   ```
   ❌ "stuff about AI"
   ✅ "machine learning applications"
   ```

3. **Use document-specific search**:
   ```
   1. catalog_search → find document
   2. chunks_search with source path → search within document
   ```

4. **See [tool-selection-guide.md](docs/tool-selection-guide.md)** for choosing the right tool

### Slow search queries

**Problem**: Database not optimized or too large

**Solutions**:

1. **Rebuild indexes**:
   ```bash
   npx tsx scripts/rebuild_indexes.ts
   ```

2. **Check database size**:
   ```bash
   du -sh ~/.concept_rag
   ```

3. **Restart MCP server** (restart Claude/Cursor)

4. **Reduce result count** (if using custom code):
   ```typescript
   // Change limit from 100 to 10
   .limit(10)
   ```

---

## MCP Integration

### "MCP server not connecting" in Claude/Cursor

**Problem**: Configuration or path issues

**Solutions**:

1. **Verify MCP config file exists**:
   ```bash
   # Cursor
   cat ~/.cursor/mcp.json
   
   # Claude Desktop (macOS)
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Claude Desktop (Windows)
   type %APPDATA%\Claude\claude_desktop_config.json
   ```

2. **Check paths are absolute**:
   ```json
   {
     "mcpServers": {
       "concept-rag": {
         "command": "node",
         "args": [
           "/absolute/path/to/concept-rag/dist/conceptual_index.js",
           "/absolute/path/to/.concept_rag"
         ]
       }
     }
   }
   ```

3. **Verify paths exist**:
   ```bash
   ls -la /path/to/concept-rag/dist/conceptual_index.js
   ls -la ~/.concept_rag
   ```

4. **Check project is built**:
   ```bash
   cd /path/to/concept-rag
   npm run build
   ls -la dist/conceptual_index.js
   ```

5. **Restart application**:
   - Close Claude Desktop / Cursor completely
   - Reopen
   - Check MCP status in settings

### "Permission denied" errors

**Problem**: File permissions issue

**Solutions**:

1. **Fix permissions**:
   ```bash
   chmod +x /path/to/concept-rag/dist/conceptual_index.js
   chmod -R 755 ~/.concept_rag
   ```

2. **Check ownership**:
   ```bash
   ls -la ~/.concept_rag
   # Should show your username as owner
   ```

3. **Fix ownership if needed**:
   ```bash
   sudo chown -R $USER:$USER ~/.concept_rag
   ```

### MCP tools not appearing

**Problem**: Server not registered or not starting

**Solutions**:

1. **Check MCP logs**:
   - Claude Desktop: Look for logs in app
   - Cursor: Check Output panel → MCP

2. **Test with MCP Inspector**:
   ```bash
   npx @modelcontextprotocol/inspector \
     dist/conceptual_index.js \
     ~/.concept_rag
   ```

3. **Verify configuration syntax**:
   ```bash
   # JSON must be valid
   python3 -m json.tool ~/.cursor/mcp.json
   ```

4. **Check for conflicting servers**:
   - Remove other MCP servers temporarily
   - Test if concept-rag works alone

---

## Performance Problems

### High memory usage

**Problem**: Large database or memory leak

**Solutions**:

1. **Check database size**:
   ```bash
   du -sh ~/.concept_rag
   du -sh ~/.concept_rag/*
   ```

2. **Restart MCP server** (restart Claude/Cursor)

3. **Optimize database**:
   ```bash
   npx tsx scripts/rebuild_indexes.ts
   ```

4. **Monitor memory**:
   ```bash
   # While using MCP
   ps aux | grep node
   ```

### Slow startup

**Problem**: Loading large database on first query

**Solutions**:

1. **Expected behavior**: First query loads database (1-3 seconds)

2. **Subsequent queries are fast** (<1 second)

3. **If consistently slow**:
   ```bash
   # Rebuild indexes
   npx tsx scripts/rebuild_indexes.ts
   ```

### High API costs

**Problem**: Unexpected OpenRouter charges

**Solutions**:

1. **Understand cost model**:
   - **Seeding**: ~$0.048 per document (one-time)
   - **Searching**: $0 (local only)

2. **Use incremental seeding**:
   ```bash
   # Don't use --overwrite
   npx tsx hybrid_fast_seed.ts --dbpath ~/.concept_rag --filesdir ~/docs
   ```

3. **Monitor API usage**: Check OpenRouter dashboard

4. **Avoid re-seeding** unless necessary

---

## Error Messages

### "Cannot find module '@lancedb/lancedb'"

**Solution**:
```bash
npm install
npm run build
```

### "ENOENT: no such file or directory"

**Solution**:
```bash
# Create directory if it doesn't exist
mkdir -p ~/.concept_rag

# Or use different path
npx tsx hybrid_fast_seed.ts --dbpath /path/that/exists --filesdir ~/docs
```

### "JSON parse error" during concept extraction

**Problem**: LLM returned malformed JSON

**Solutions**:

1. **Retry the document**:
   ```bash
   npx tsx scripts/repair_missing_concepts.ts
   ```

2. **Check API status**: https://openrouter.ai/status

3. **Try different model** (modify code):
   ```typescript
   // In src/concepts/concept_extractor.ts
   // Change model to different one
   ```

### "spawn python3 ENOENT"

**Problem**: Python not found in PATH

**Solution**:
```bash
# Find Python
which python3

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="/usr/bin:$PATH"

# Or create symlink
sudo ln -s /usr/bin/python3 /usr/local/bin/python3
```

### "Table not found: catalog"

**Problem**: Database not initialized

**Solution**:
```bash
# Seed the database
npx tsx hybrid_fast_seed.ts \
  --dbpath ~/.concept_rag \
  --filesdir ~/docs \
  --overwrite
```

---

## Data Issues

### Missing documents in search

**Problem**: Documents not indexed or database corruption

**Solutions**:

1. **Verify files exist**:
   ```bash
   ls -la ~/Documents/pdfs/*.pdf
   ```

2. **Check database**:
   ```bash
   # Count documents in catalog
   npx tsx -e "
   import { connect } from '@lancedb/lancedb';
   const db = await connect('~/.concept_rag');
   const catalog = await db.openTable('catalog');
   const count = await catalog.countRows();
   console.log('Documents:', count);
   "
   ```

3. **Re-seed specific documents**:
   ```bash
   # Move problem documents to separate folder
   # Seed just those
   npx tsx hybrid_fast_seed.ts --dbpath ~/.concept_rag --filesdir ~/problem_docs
   ```

### Outdated document content

**Problem**: Document was updated but database not refreshed

**Solution**:
```bash
# Re-seed with overwrite
npx tsx hybrid_fast_seed.ts \
  --dbpath ~/.concept_rag \
  --filesdir ~/docs \
  --overwrite
```

### Incorrect concepts extracted

**Problem**: Concept extraction quality issues

**Solutions**:

1. **Check document quality**:
   - Is PDF readable?
   - Is text extractable (not just images)?

2. **Customize extraction prompt**:
   - Edit `prompts/concept-extraction.txt`
   - See `prompts/README.md` for guidance

3. **Re-extract concepts**:
   ```bash
   npm run build
   npx tsx scripts/repair_missing_concepts.ts --min-concepts 50
   ```

### Incomplete Catalog Records / Duplicate Source Paths

**Problem**: You see warnings during `--rebuild-concepts` about:
- Incomplete catalog records (missing ID or source)
- Duplicate source paths (same file, multiple IDs)
- Mapped X/Y sources (X < Y)

**Symptoms**:
```
⚠️  Found 8 duplicate source paths (same file path, different IDs):
   1. /path/to/document.pdf...
      → Existing ID: 0, Duplicate ID: 0 [hash1234]

✅ Mapped 255/263 sources to catalog IDs
```

**Causes**:
- Re-seeding without `--overwrite` created duplicate entries
- Interrupted seeding left incomplete records
- Database corruption or migration issues

**Solution 1: Auto-Reseed** (Recommended):
```bash
npx tsx hybrid_fast_seed.ts \
  --filesdir ~/Documents \
  --auto-reseed
```

This will:
- Detect incomplete records (missing/invalid IDs)
- Remove them from the catalog
- Re-process those documents properly

**Solution 2: Full Rebuild**:
```bash
npx tsx hybrid_fast_seed.ts \
  --filesdir ~/Documents \
  --overwrite
```

**Check Logs**: Look in `logs/seed-YYYY-MM-DDTHH-MM-SS.log` for detailed diagnostics.

---

## Advanced Debugging

### Enable debug logging

**Method 1: Environment variable**:
```bash
export LOG_LEVEL=debug
npx tsx hybrid_fast_seed.ts ...
```

**Method 2: Code modification**:
```typescript
// Add to beginning of file
console.log = (...args) => {
  const timestamp = new Date().toISOString();
  process.stdout.write(`[${timestamp}] ${args.join(' ')}\n`);
};
```

### Inspect database directly

```bash
# Install dependencies
npm install -g tsx

# View catalog table
npx tsx -e "
import { connect } from '@lancedb/lancedb';
const db = await connect('~/.concept_rag');
const catalog = await db.openTable('catalog');
const docs = await catalog.query().limit(5).toArray();
console.log(JSON.stringify(docs, null, 2));
"

# View chunks table
npx tsx -e "
import { connect } from '@lancedb/lancedb';
const db = await connect('~/.concept_rag');
const chunks = await db.openTable('chunks');
const results = await chunks.query().limit(5).toArray();
console.log(JSON.stringify(results, null, 2));
"
```

### Test MCP tools directly

```bash
# Use MCP Inspector
npx @modelcontextprotocol/inspector \
  dist/conceptual_index.js \
  ~/.concept_rag

# Then interact with tools in browser UI
```

### Check API connectivity

```bash
# Test OpenRouter API
curl -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-3.5-sonnet",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### Profile performance

```bash
# Run with profiling
node --prof dist/conceptual_index.js ~/.concept_rag

# Process profiling output
node --prof-process isolate-*.log > profile.txt
```

### Debug WordNet issues

```bash
# Test WordNet directly
python3 << 'EOF'
from nltk.corpus import wordnet as wn

# Test synsets
print(f"Synsets: {len(list(wn.all_synsets()))}")

# Test lookup
synsets = wn.synsets('innovation')
print(f"Innovation synsets: {synsets}")

# Test synonyms
for syn in synsets[:3]:
    print(f"  {syn.name()}: {syn.definition()}")
    print(f"  Synonyms: {syn.lemma_names()}")
EOF
```

---

## Getting Help

### Before asking for help

1. **Check this troubleshooting guide**
2. **Review [FAQ.md](FAQ.md)**
3. **Search [GitHub Issues](https://github.com/m2ux/concept-rag/issues)**
4. **Check [Discussions](https://github.com/m2ux/concept-rag/discussions)**

### When asking for help, include

1. **Environment info**:
   ```bash
   node --version
   python3 --version
   cat package.json | grep version
   uname -a  # OS info
   ```

2. **Error messages**: Full error output, not just "it doesn't work"

3. **Steps to reproduce**:
   - What commands did you run?
   - What was the expected result?
   - What actually happened?

4. **Configuration**:
   - MCP config (with paths redacted)
   - Environment variables (without API keys!)

5. **What you've tried**: List solutions you've already attempted

### Where to ask

- **Bugs**: [GitHub Issues](https://github.com/m2ux/concept-rag/issues)
- **Questions**: [GitHub Discussions](https://github.com/m2ux/concept-rag/discussions)
- **Security**: See [SECURITY.md](SECURITY.md)

---

## Quick Fixes Checklist

When something doesn't work, try these in order:

- [ ] Restart Claude/Cursor
- [ ] Rebuild project: `npm run build`
- [ ] Check paths are absolute and correct
- [ ] Verify API key is set
- [ ] Test with MCP Inspector
- [ ] Rebuild indexes: `npx tsx scripts/rebuild_indexes.ts`
- [ ] Check database exists: `ls -la ~/.concept_rag`
- [ ] Verify Python/NLTK installed
- [ ] Clear and reinstall: `rm -rf node_modules && npm install`
- [ ] Check logs for specific error messages

**Still stuck?** Open a [GitHub Issue](https://github.com/m2ux/concept-rag/issues) with details!
