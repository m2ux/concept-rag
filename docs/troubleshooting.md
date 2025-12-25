# Troubleshooting

Solutions to common issues with Concept-RAG.

---

## Installation Issues

### "node: command not found"

Node.js not installed or not in PATH.

=== "Ubuntu/Debian"
    ```bash
    sudo apt update
    sudo apt install nodejs npm
    ```

=== "macOS"
    ```bash
    brew install node
    ```

=== "Manual"
    Download from [nodejs.org](https://nodejs.org/)

### "npm install" fails

Clear cache and reinstall:

```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Python/NLTK not found

```bash
# Install NLTK
pip3 install nltk

# Download WordNet data
python3 -c "import nltk; nltk.download('wordnet'); nltk.download('omw-1.4')"

# Verify
python3 -c "from nltk.corpus import wordnet as wn; print(f'✅ WordNet: {len(list(wn.all_synsets()))} synsets')"
```

---

## Seeding Problems

### "Error: OPENROUTER_API_KEY not set"

```bash
# Create .env file
echo "OPENROUTER_API_KEY=your_key_here" > .env

# Or export directly
export OPENROUTER_API_KEY="your_key_here"

# Get key at: https://openrouter.ai/keys
```

### "No PDF files found"

!!! tip "Check your paths"
    ```bash
    # Verify directory exists
    ls -la ~/Documents/pdfs
    
    # Find PDFs
    find ~/Documents/pdfs -name "*.pdf"
    
    # Use absolute path
    npx tsx hybrid_fast_seed.ts \
      --dbpath ~/.concept_rag \
      --filesdir /absolute/path/to/pdfs
    ```

### PDF parsing failed

**Possible causes:**

- Corrupted PDF
- Password-protected PDF
- Unusual encoding

**Solutions:**

1. OCR fallback handles scanned PDFs automatically
2. Re-save PDF using another tool
3. Check if PDF opens in a reader
4. Try converting to PDF/A format

### Out of memory during seeding

```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npx tsx hybrid_fast_seed.ts \
  --dbpath ~/.concept_rag \
  --filesdir ~/docs
```

Or process documents in smaller batches.

---

## Search Issues

### No results found

1. **Verify documents are indexed:**
   ```bash
   npx tsx scripts/health-check.ts
   ```

2. **Try different search tools:**
   - `concept_search` → `broad_chunks_search`
   - `catalog_search` → `chunks_search`

3. **Check query phrasing:**
   | ❌ Bad | ✅ Good |
   |--------|---------|
   | "show me innovation stuff" | "innovation" |
   | "stuff about AI" | "machine learning applications" |

### Search returns irrelevant results

Use the right tool for your goal:

| Goal | Use | Not |
|------|-----|-----|
| Find by concept | `concept_search` | `broad_chunks_search` |
| Search in document | `chunks_search` | `catalog_search` |

See [Tool Selection Guide](tool-selection-guide.md).

### Slow search queries

```bash
# Rebuild indexes
npx tsx scripts/rebuild_indexes.ts

# Check database size
du -sh ~/.concept_rag

# Restart MCP client
```

---

## MCP Integration

### MCP server not connecting

!!! warning "Checklist"
    1. ✅ Paths are **absolute** (not relative)
    2. ✅ Project is built (`npm run build`)
    3. ✅ Database path exists
    4. ✅ Client restarted after config changes

**Verify paths:**
```bash
# Get absolute path
cd /path/to/concept-rag && pwd

# Check database
ls -la ~/.concept_rag

# Check build
ls -la dist/conceptual_index.js
```

### MCP tools not appearing

1. **Check configuration syntax:**
   ```bash
   python3 -m json.tool ~/.cursor/mcp.json
   ```

2. **Test with MCP Inspector:**
   ```bash
   npx @modelcontextprotocol/inspector \
     dist/conceptual_index.js \
     ~/.concept_rag
   ```

3. **Check for conflicting servers** — remove others temporarily

### Permission denied errors

```bash
# Fix permissions
chmod +x /path/to/concept-rag/dist/conceptual_index.js
chmod -R 755 ~/.concept_rag

# Fix ownership
sudo chown -R $USER:$USER ~/.concept_rag
```

---

## Data Issues

### Incomplete catalog records

**Symptoms:**
- "Mapped X/Y sources" where X < Y
- Duplicate source path warnings

**Solution:**
```bash
npx tsx hybrid_fast_seed.ts \
  --filesdir ~/Documents \
  --auto-reseed
```

### Missing concepts for document

```bash
# Re-extract concepts
npx tsx scripts/repair_missing_concepts.ts --min-concepts 50

# Or full re-seed
npx tsx hybrid_fast_seed.ts --dbpath ~/.concept_rag --filesdir ~/docs --overwrite
```

---

## Error Messages

| Error | Solution |
|-------|----------|
| `Cannot find module '@lancedb/lancedb'` | `npm install && npm run build` |
| `ENOENT: no such file or directory` | Create directory: `mkdir -p ~/.concept_rag` |
| `Table not found: catalog` | Seed the database first |
| `spawn python3 ENOENT` | Install Python or add to PATH |

---

## Debug Mode

Enable verbose logging:

```bash
export LOG_LEVEL=debug
npx tsx hybrid_fast_seed.ts --dbpath ~/.concept_rag --filesdir ~/docs
```

Check log files:

```bash
# View latest log
ls -t logs/seed-*.log | head -1 | xargs cat

# Search for errors
grep ERROR logs/seed-*.log
```

---

## Quick Fixes Checklist

When something doesn't work, try in order:

- [ ] Restart Claude/Cursor
- [ ] Rebuild: `npm run build`
- [ ] Check paths are absolute
- [ ] Verify API key is set
- [ ] Test with MCP Inspector
- [ ] Rebuild indexes: `npx tsx scripts/rebuild_indexes.ts`
- [ ] Check database exists: `ls -la ~/.concept_rag`
- [ ] Verify Python/NLTK installed
- [ ] Clear and reinstall: `rm -rf node_modules && npm install`

---

## Get Help

- 💬 [GitHub Discussions](https://github.com/m2ux/concept-rag/discussions)
- 🐛 [Report an Issue](https://github.com/m2ux/concept-rag/issues)
- 📖 [FAQ](faq.md)

