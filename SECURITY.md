# Security Policy

## Supported Versions

We actively support the following versions of Concept-RAG with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow responsible disclosure practices.

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please report security issues privately:

1. **Email**: Send details to the project maintainer via GitHub
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if you have one)
   - Your contact information for follow-up

### What to Expect

- **Acknowledgment**: Within 24 hours
- **Initial assessment**: Within 48 hours
- **Status update**: Within 1 week
- **Fix timeline**: Depends on severity
  - Critical: Within 1-3 days
  - High: Within 1-2 weeks
  - Medium: Within 1 month
  - Low: Next regular release

### Disclosure Policy

- We'll work with you to understand the vulnerability
- We'll develop and test a fix
- We'll prepare a security advisory
- We'll release a patched version
- We'll publicly disclose after the fix is released
- We'll credit you in the security advisory (unless you prefer anonymity)

## Security Considerations

### API Keys

**Critical**: Never commit API keys to the repository!

```bash
# ✅ Good: Use environment variables
export OPENROUTER_API_KEY="your-key-here"

# ✅ Good: Use .env file (gitignored)
echo "OPENROUTER_API_KEY=your-key" > .env

# ❌ Bad: Hardcode in source
const apiKey = "sk-or-v1-abc123..."; // NEVER DO THIS
```

### Document Privacy

**Your documents stay local**:
- PDFs are processed locally on your machine
- Concept extraction sends document **content** to OpenRouter (Claude/Grok)
- Vector embeddings are generated locally
- The database stays on your machine (`~/.concept_rag`)

**What gets sent to OpenRouter**:
- Document text for concept extraction (Claude Sonnet 4.5)
- Document text for summary generation (Grok-4-fast)

**What stays local**:
- Your PDF files
- Vector embeddings
- Search queries
- Database

### API Key Security

**OpenRouter API Key**:
- Stored in `.env` file (gitignored)
- Never logged or displayed
- Only used for API calls to OpenRouter
- Can be rotated at https://openrouter.ai/keys

**Best practices**:
```bash
# Set restrictive permissions on .env
chmod 600 .env

# Never share .env in screenshots or logs
# Always use .env.example for documentation
```

### Database Security

**Database location**: `~/.concept_rag` (or custom path)

**Security measures**:
- Uses local filesystem permissions
- No network access required for search
- No external database connections
- LanceDB stores data in Apache Arrow format

**Recommendations**:
```bash
# Set restrictive permissions
chmod 700 ~/.concept_rag

# Use encrypted filesystem for sensitive documents
# Consider full-disk encryption
```

### MCP Integration Security

**Claude Desktop / Cursor**:
- MCP server runs as local Node.js process
- Communicates via stdio (no network exposure)
- Uses system user permissions
- Can read files from specified database path

**Configuration file locations**:
- **Cursor**: `~/.cursor/mcp.json`
- **Claude Desktop (macOS)**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Claude Desktop (Windows)**: `%APPDATA%/Claude/claude_desktop_config.json`

**Configuration security**:
```json
{
  "mcpServers": {
    "concept-rag": {
      "command": "node",
      "args": [
        "/absolute/path/to/concept-rag/dist/conceptual_index.js",
        "/home/username/.concept_rag"
      ]
    }
  }
}
```

- Use absolute paths only
- Don't expose sensitive directories
- MCP server has read access to database path
- Verify paths before configuration

### Dependency Security

**Regular audits**:
```bash
# Check for vulnerabilities
npm audit

# Fix automatically when possible
npm audit fix

# Review all dependencies
npm ls
```

**Dependencies**:
- We use minimal, well-maintained dependencies
- LanceDB for vector storage (local)
- Langchain for embeddings (local models)
- MCP SDK from Anthropic
- pdf-parse for PDF processing

**Update policy**:
- Security patches: Applied immediately
- Minor updates: Reviewed and tested monthly
- Major updates: Reviewed carefully for breaking changes

### Network Security

**Outbound connections**:
- **OpenRouter API** (openrouter.ai): For concept extraction and summaries
- **Hugging Face** (huggingface.co): For downloading embedding models (first run only)

**No inbound connections**: The MCP server doesn't listen on any network ports

**Firewall recommendations**:
```bash
# Allow outbound HTTPS to OpenRouter
# Allow outbound HTTPS to Hugging Face (initial setup)
# No inbound rules needed
```

### Data Retention

**What we store**:
- Document text (in LanceDB)
- Extracted concepts
- Generated summaries
- Vector embeddings
- File paths and metadata

**What we don't store**:
- API keys (only in .env)
- User credentials
- Network logs
- API request history

**Deleting data**:
```bash
# Remove entire database
rm -rf ~/.concept_rag

# Remove specific document (requires manual database editing)
# Better: Re-seed without that document
```

### Code Execution

**Python subprocess**:
- WordNet service spawns Python subprocess
- Uses NLTK for synonym expansion
- No arbitrary code execution
- Fixed Python script (`src/wordnet/wordnet_service.ts`)

**Safety measures**:
- Input sanitization for Python calls
- No user-provided Python code execution
- Subprocess timeout protection

### Best Practices for Users

1. **API Keys**:
   - Rotate regularly
   - Use environment variables
   - Never share or commit

2. **Sensitive Documents**:
   - Be aware: Document content is sent to OpenRouter
   - Use local-only LLMs if documents are highly sensitive
   - Review OpenRouter privacy policy

3. **Database**:
   - Use encrypted filesystem
   - Regular backups
   - Secure permissions

4. **MCP Configuration**:
   - Verify file paths
   - Use absolute paths
   - Don't expose sensitive directories

5. **Updates**:
   - Keep Node.js updated
   - Run `npm audit` regularly
   - Update dependencies monthly

## Known Limitations

1. **Document privacy**: Content sent to OpenRouter for extraction
   - Mitigation: Use local LLMs or don't process sensitive docs

2. **API key storage**: Stored in plaintext `.env` file
   - Mitigation: Use OS keychain or secret management tools

3. **No authentication**: MCP server has full access to database path
   - Mitigation: Use system user permissions and file permissions

4. **PDF parsing**: Uses pdf-parse which may have vulnerabilities
   - Mitigation: Only process trusted PDFs, keep dependencies updated

## Security Checklist

Before deploying or using Concept-RAG:

- [ ] API key stored securely in `.env`
- [ ] `.env` file has restrictive permissions (600)
- [ ] `.gitignore` properly configured
- [ ] Database directory has appropriate permissions
- [ ] Dependencies audited (`npm audit`)
- [ ] Node.js is up to date
- [ ] Python NLTK is from trusted source
- [ ] MCP configuration uses absolute paths
- [ ] Understand data flow to OpenRouter
- [ ] Regular backup strategy for database
- [ ] Only processing trusted PDF files

## Security Resources

- **npm security advisories**: https://www.npmjs.com/advisories
- **Node.js security**: https://nodejs.org/en/security/
- **OpenRouter privacy**: https://openrouter.ai/privacy
- **MCP security**: https://modelcontextprotocol.io/docs/security

## Contact

For security-related questions (not vulnerabilities):
- Open a GitHub Discussion
- Tag with "security" label

For security vulnerabilities:
- Follow private disclosure process above
- Do not open public issues

## Acknowledgments

We appreciate security researchers who responsibly disclose vulnerabilities. All reporters will be credited in security advisories unless they prefer anonymity.

## Version History

| Date | Version | Security Updates |
|------|---------|------------------|
| 2025-11-13 | 1.0.0 | Initial release with security policy |

---

**Remember**: Security is a shared responsibility. Report vulnerabilities responsibly, follow best practices, and keep your system updated.
