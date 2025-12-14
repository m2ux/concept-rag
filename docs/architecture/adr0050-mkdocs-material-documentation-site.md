# ADR-0050: MkDocs Material Documentation Site

## Status

Proposed

## Date

2025-12-14

## Context

The concept-rag project has accumulated extensive documentation:
- 49 Architecture Decision Records (ADRs)
- API reference documentation
- Database schema documentation
- Tool selection guides
- Various operational guides (SETUP, USAGE, FAQ, TROUBLESHOOTING)

Currently, this documentation is only accessible via:
1. GitHub's web interface (browsing the repository)
2. Local file system (cloning the repository)

Neither approach provides:
- Full-text search across all documentation
- Consistent navigation and table of contents
- Mobile-friendly responsive design
- Offline access to a complete documentation site

The project follows a "docs like code" philosophy where documentation lives alongside code in version control. A static site generator would extend this pattern by automating the build and deployment of documentation.

## Decision

Adopt **MkDocs Material** as the documentation site generator with automated deployment to **GitHub Pages**.

### Implementation

1. **MkDocs Material** - Static site generator with Material Design theme
   - Configuration via `mkdocs.yml` at project root
   - Uses existing `docs/` folder structure (no migration required)
   - Built-in search functionality
   - Responsive, mobile-friendly design

2. **GitHub Pages** - Hosting platform
   - Free hosting for public repositories
   - Custom domain support available
   - Integrated with GitHub repository

3. **GitHub Actions** - Automated deployment
   - Deploys on push to `main` branch
   - Uses `mkdocs gh-deploy` for atomic deployments
   - Triggered only when documentation files change

### Alternatives Considered

| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Docusaurus | Modern React-based, versioning | Different tech stack, more complex setup | Rejected |
| Sphinx | Python ecosystem standard, extensive | RST preferred format, steeper learning curve | Rejected |
| GitHub Wiki | Zero configuration | No custom theming, separate from codebase | Rejected |
| Jekyll | GitHub Pages native | Less modern UX, slower builds | Rejected |

### Why MkDocs Material

1. **Markdown-native**: Works directly with existing `.md` files
2. **Minimal configuration**: Single `mkdocs.yml` file
3. **Modern UX**: Material Design, dark mode, responsive
4. **Search**: Built-in full-text search (client-side, no server required)
5. **GitHub Pages integration**: First-class support via `mkdocs gh-deploy`
6. **Active development**: Well-maintained with regular updates
7. **Python-based**: Aligns with existing Python tooling (NLTK in requirements.txt)

## Consequences

### Positive

- **Discoverability**: Full-text search across all documentation
- **Navigation**: Structured table of contents and breadcrumbs
- **Accessibility**: Mobile-friendly, responsive design
- **Automation**: Documentation updates deploy automatically on merge
- **Zero migration**: Existing `docs/` folder structure works as-is

### Negative

- **Python dependency**: Adds `mkdocs-material` to `requirements.txt`
- **Build step**: Documentation requires build (not just markdown viewing)
- **Learning curve**: Team needs basic MkDocs familiarity

### Neutral

- **No ADR required for content changes**: This ADR covers the infrastructure; content is managed via normal PR process

## Implementation Notes

### Files Created

- `mkdocs.yml` - Site configuration
- `docs/index.md` - Homepage
- `.github/workflows/docs.yml` - Deployment automation

### Files Modified

- `requirements.txt` - Add mkdocs-material
- `package.json` - Add npm scripts for local development

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Serve locally with hot reload
mkdocs serve

# Build static site
mkdocs build
```

### Deployment

Automated via GitHub Actions on push to `main` when documentation files change.

## References

- [MkDocs Documentation](https://www.mkdocs.org/)
- [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/)
- [GitHub Pages Deployment](https://squidfunk.github.io/mkdocs-material/publishing-your-site/)
- ADR-0031: Eight Specialized Tools Strategy (existing documentation pattern)
- ADR-0032: Tool Selection Guide (documentation for AI agents)
