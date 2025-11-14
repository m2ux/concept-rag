# Test Directory

This directory contains integration tests and test-related scripts for the concept-rag project.

## Structure

```
test/
├── integration/          # Integration tests
│   └── live-integration.test.ts    # End-to-end tests for all MCP tools
├── scripts/              # Test utility scripts
│   └── seed-test-database.sh       # Creates test database with sample docs
└── README.md             # This file
```

## Unit Tests

Unit tests are co-located with source code in `src/**/__tests__/` directories:
- `src/infrastructure/embeddings/__tests__/` - Embedding service tests
- `src/infrastructure/lancedb/utils/__tests__/` - Utility tests
- `src/tools/operations/__tests__/` - Tool integration tests

## Running Tests

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
# First, create a test database
bash test/scripts/seed-test-database.sh

# Then run integration tests
npx tsx test/integration/live-integration.test.ts
```

## Test Database

The test database is created at `/tmp/concept_rag_test` and uses sample documents from `sample-docs/`. This ensures your main database at `~/.concept_rag` is never modified during testing.

## Test Coverage

- **32 unit tests** - Fast, isolated tests for utilities, services, and tools
- **5 integration tests** - End-to-end verification of all MCP tools with real database
- **Total: 37 tests** (100% passing)

