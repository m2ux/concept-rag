# Contributing to Concept-RAG

Thank you for your interest in contributing to Concept-RAG! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

Before creating an issue, please:

1. **Search existing issues** to avoid duplicates
2. **Include relevant details**:
   - Node.js version (`node --version`)
   - Operating system
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages or logs
   - Sample documents (if applicable)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please:

1. **Check the roadmap** to see if it's already planned
2. **Describe the use case** - explain why this would be useful
3. **Provide examples** - show how it would work
4. **Consider backwards compatibility** - how it affects existing users

### Pull Requests

We love pull requests! Here's the process:

#### Before You Start

1. **Discuss major changes** - Open an issue first for significant changes
2. **Check existing PRs** - Someone might already be working on it
3. **Review the codebase** - Understand the existing patterns and architecture

#### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/concept-rag.git
cd concept-rag

# Install dependencies
npm install

# Build the project
npm run build

# Setup WordNet (required for development)
pip3 install nltk
python3 -c "import nltk; nltk.download('wordnet'); nltk.download('omw-1.4')"

# Configure environment
cp .env.example .env
# Edit .env and add your OpenRouter API key
```

#### Making Changes

1. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Follow code style**:
   - Use TypeScript strict mode
   - Follow existing naming conventions
   - Add type definitions for all functions
   - Use meaningful variable and function names
   - Keep functions focused and concise

3. **Write tests** (when applicable):
   ```bash
   # Run tests
   npm test
   ```

4. **Update documentation**:
   - Update README.md if adding features
   - Update USAGE.md for user-facing changes
   - Add JSDoc comments for new functions
   - Update [api-reference.md](docs/api-reference.md) if adding/modifying tools

5. **Test your changes**:
   ```bash
   # Build
   npm run build
   
   # Test with sample documents
   npx tsx hybrid_fast_seed.ts --dbpath ./test-db --filesdir sample-docs --overwrite
   
   # Test with MCP Inspector
   npx @modelcontextprotocol/inspector dist/conceptual_index.js ./test-db
   ```

#### Commit Guidelines

Write clear, descriptive commit messages:

```bash
# Good examples
git commit -m "Add support for markdown document processing"
git commit -m "Fix concept extraction for documents >200k tokens"
git commit -m "Update README with new tool examples"

# Less helpful
git commit -m "Update code"
git commit -m "Fix bug"
git commit -m "Changes"
```

**Format**: `<type>: <description>`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

#### Submitting Your PR

1. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create the pull request**:
   - Use a clear, descriptive title
   - Reference related issues (e.g., "Fixes #123")
   - Describe what changed and why
   - Include screenshots/examples if relevant
   - List any breaking changes

3. **PR checklist**:
   - [ ] Code builds successfully (`npm run build`)
   - [ ] Tests pass (if applicable)
   - [ ] Documentation updated
   - [ ] No API keys or secrets in code
   - [ ] Follows existing code style
   - [ ] Breaking changes documented

## 🏗️ Architecture Overview

### Project Structure

```
concept-rag/
├── src/
│   ├── conceptual_index.ts          # MCP server entry point
│   ├── concepts/                    # Concept extraction & management
│   │   ├── concept_extractor.ts     # LLM-based extraction
│   │   ├── concept_index.ts         # Concept indexing
│   │   ├── concept_chunk_matcher.ts # Matching concepts to chunks
│   │   └── query_expander.ts        # Query expansion with WordNet
│   ├── lancedb/                     # Database clients
│   │   └── conceptual_search_client.ts
│   ├── wordnet/                     # WordNet integration
│   │   └── wordnet_service.ts       # Python NLTK bridge
│   └── tools/                       # MCP tools
│       ├── conceptual_registry.ts   # Tool registration
│       └── operations/              # Individual tools
├── hybrid_fast_seed.ts              # Database seeding script
├── prompts/                         # LLM prompts (editable!)
│   └── concept-extraction.txt       # Concept extraction prompt
└── scripts/                         # CLI utilities
    ├── extract_concepts.ts
    ├── rebuild_indexes.ts
    └── repair_missing_concepts.ts
```

### Key Components

1. **Concept Extraction** (`src/concepts/concept_extractor.ts`)
   - Uses Claude Sonnet 4.5 for extraction
   - Multi-pass processing for large documents
   - Formal concept model for quality

2. **Search Engine** (`src/lancedb/conceptual_search_client.ts`)
   - Multi-signal hybrid ranking
   - Vector + BM25 + concept + WordNet
   - LanceDB for vector storage

3. **MCP Tools** (`src/tools/operations/`)
   - Each tool is a separate operation
   - Registered in `conceptual_registry.ts`
   - Follow BaseTool interface

4. **WordNet Integration** (`src/wordnet/wordnet_service.ts`)
   - Python subprocess bridge
   - Synonym expansion
   - Hierarchical concept navigation

### Design Principles

1. **Modularity**: Each component has a single responsibility
2. **Type Safety**: Full TypeScript with strict mode
3. **Error Handling**: Graceful degradation and clear error messages
4. **Performance**: Incremental processing, efficient indexing
5. **Extensibility**: Easy to add new tools or modify extraction

## 📝 Code Style Guidelines

### TypeScript

```typescript
// ✅ Good: Clear types, descriptive names
export async function extractConcepts(
  content: string,
  model: string = DEFAULT_MODEL
): Promise<ExtractedConcepts> {
  // Implementation
}

// ❌ Avoid: Unclear types, vague names
export async function extract(c: string, m?: string): Promise<any> {
  // Implementation
}
```

### Error Handling

```typescript
// ✅ Good: Specific error messages
try {
  await processDocument(path);
} catch (error) {
  console.error(`Failed to process document ${path}:`, error.message);
  throw new Error(`Document processing failed: ${error.message}`);
}

// ❌ Avoid: Silent failures or generic errors
try {
  await processDocument(path);
} catch (error) {
  // Silent failure
}
```

### Documentation

```typescript
// ✅ Good: Clear JSDoc with examples
/**
 * Extracts concepts from document content using LLM.
 * 
 * @param content - Document text to analyze
 * @param model - OpenRouter model name (default: Claude Sonnet 4.5)
 * @returns Extracted concepts organized by type
 * 
 * @example
 * ```ts
 * const concepts = await extractConcepts(documentText);
 * console.log(concepts.primary_concepts);
 * ```
 */
export async function extractConcepts(
  content: string,
  model: string = DEFAULT_MODEL
): Promise<ExtractedConcepts> {
  // Implementation
}
```

## 🧪 Testing Guidelines

### Manual Testing

1. **Test with sample documents**:
   - Use `sample-docs/` for testing
   - Test with various PDF types (text, scanned, corrupted)
   - Verify concept extraction quality

2. **Test MCP integration**:
   - Use MCP Inspector for interactive testing
   - Test all 10 tools
   - Verify error handling

3. **Test edge cases**:
   - Empty documents
   - Very large documents (>100k tokens)
   - Documents with special characters
   - Corrupted PDFs

### Adding Tests

When adding tests (future feature):

```typescript
// test/concept_extraction.test.ts
describe('Concept Extraction', () => {
  it('should extract concepts from sample document', async () => {
    const concepts = await extractConcepts(sampleText);
    expect(concepts.primary_concepts.length).toBeGreaterThan(0);
  });
});
```

## 🔐 Security Guidelines

### API Keys

**Never commit API keys!**

```bash
# ✅ Good: Use environment variables
const apiKey = process.env.OPENROUTER_API_KEY;

# ✅ Good: Add to .gitignore
echo ".env" >> .gitignore
```

### Dependencies

- Review dependencies before adding
- Use `npm audit` to check for vulnerabilities
- Keep dependencies up to date

### User Data

- Never log document content
- Sanitize file paths in logs
- Be mindful of PII in error messages

## 📚 Areas for Contribution

### High Priority

- [ ] Add automated tests
- [ ] Support for more document formats (DOCX, TXT, Markdown)
- [ ] Performance benchmarks
- [ ] CLI improvements
- [ ] Better error recovery

### Medium Priority

- [ ] Support for other embedding models
- [ ] Configurable concept extraction prompts
- [ ] Export formats (CSV, Excel)
- [ ] Visualization tools for concepts
- [ ] Integration with other MCP clients

### Documentation

- [ ] Video tutorials
- [ ] More examples
- [ ] API reference
- [ ] Architecture diagrams
- [ ] Performance optimization guide

### Nice to Have

- [ ] Web UI for exploring concepts
- [ ] Concept similarity analysis
- [ ] Document clustering
- [ ] Multi-language support
- [ ] Incremental re-indexing

## 🎯 Contribution Ideas by Skill Level

### Beginner Friendly

- Improve documentation and examples
- Add more test cases
- Fix typos or formatting
- Update dependencies
- Add code comments

### Intermediate

- Add support for new document formats
- Improve error handling
- Optimize database queries
- Add CLI features
- Refactor existing code

### Advanced

- Implement new MCP tools
- Enhance concept extraction algorithms
- Add new search ranking signals
- Optimize performance
- Design new features

## 💬 Communication

### Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and ideas
- **Pull Requests**: For code review and feedback

### Response Times

- Issues: We'll respond within 2-3 days
- Pull requests: We'll review within 1 week
- Security issues: We'll respond within 24 hours

## 📜 Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the project
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information
- Other unprofessional conduct

## 📄 License

By contributing to Concept-RAG, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be:
- Credited in release notes
- Recognized in the project README

Thank you for contributing to Concept-RAG! 🎉

