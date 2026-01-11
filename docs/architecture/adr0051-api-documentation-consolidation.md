# ADR-0051: API Documentation Separation of Concerns

## Status

Accepted

## Date

2025-12-14

## Context

The project maintains two documentation files for MCP tools:

1. **`docs/api-reference.md`** - API specifications
2. **`docs/tool-selection-guide.md`** - Usage guidance and selection criteria

Previously, these files had overlapping content (both contained some usage guidance and some schema information). Additionally, neither file included complete JSON response schemas.

## Decision

Establish a clear separation of concerns between the two documentation files:

### api-reference.md (Pure Schema Documentation)

Contains ONLY:
- JSON input schemas with parameter tables
- JSON output schemas with field descriptions
- Error schema
- Scoring weights
- Performance metrics

Does NOT contain:
- Usage recommendations
- Decision trees
- Examples of when to use/not use
- Patterns or anti-patterns

### tool-selection-guide.md (Pure Usage Guidance)

Contains ONLY:
- Tool comparison matrix
- Decision trees
- "When to Use" / "When NOT to Use" criteria
- Query examples (✅/❌)
- Decision logic examples
- Patterns and anti-patterns
- Common workflows
- Test cases for validation

Does NOT contain:
- JSON schemas
- Parameter tables
- Response field descriptions

### Rationale

1. **Clear responsibility**: Each document has a single purpose
2. **Easier maintenance**: Changes to schemas don't require touching usage docs and vice versa
3. **Better discoverability**: Developers seeking API specs go to one file; those seeking usage guidance go to another
4. **Complete coverage**: api-reference.md now includes full response schemas (previously missing)

## Consequences

### Positive

- **Single responsibility**: Each document has one purpose
- **Complete schemas**: api-reference.md now has full JSON I/O specifications
- **Clear guidance**: tool-selection-guide.md is focused purely on selection criteria
- **Cross-referencing**: Each document links to the other

### Negative

- **Two files to maintain**: Must keep both files when adding new tools
- **Potential drift**: Usage guidance and schemas could become inconsistent

### Mitigation

- Each document includes a prominent link to the other
- ADR-0032 remains accepted and applicable

## Implementation Notes

### api-reference.md Structure

```
- Document Discovery (catalog_search)
- Content Search (broad_chunks_search, chunks_search)
- Concept Analysis (concept_search, extract_concepts, source_concepts, concept_sources)
- Category Browsing (category_search, list_categories, list_concepts_in_category)
- Error Schema
- Scoring Weights
- Performance
```

### tool-selection-guide.md Structure

```
- Overview
- Tool Comparison Matrix
- Quick Decision Tree
- "3 Questions" Method
- Detailed Tool Selection Criteria (per tool)
- Decision Logic Examples
- Common Patterns and Anti-Patterns
- Common Workflows
- Test Cases
```

## Related Decisions

- [ADR-0031: Eight Specialized Tools Strategy](adr0031-eight-specialized-tools-strategy.md) - Tool architecture
- [ADR-0032: Tool Selection Guide](adr0032-tool-selection-guide.md) - Original guidance decision (remains valid)

## References

- Planning: [planning](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/planning/2025-12-14-api-documentation-consolidation/)
