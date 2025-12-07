#!/bin/bash

# Safe Test Database Setup
# Creates a separate test database from sample-docs
# ⚠️ NEVER touches the main database at ~/.concept_rag

set -e  # Exit on error

TEST_DB="./db/test"
SAMPLE_DOCS="./sample-docs"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     SAFE TEST DATABASE SETUP                                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  SAFETY GUARANTEE:"
echo "   ✅ Main database (~/.concept_rag) will NOT be touched"
echo "   ✅ Test database: $TEST_DB (relative to project root)"
echo "   ✅ Sample docs: $SAMPLE_DOCS"
echo ""

# Check if OPENROUTER_API_KEY is set
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "⚠️  WARNING: OPENROUTER_API_KEY not set"
    echo "   Concept extraction will be skipped"
    echo "   Tests will use basic vector search only"
    echo ""
    echo "   To enable concept extraction (optional):"
    echo "   export OPENROUTER_API_KEY=your_key_here"
    echo ""
fi

# Confirm with user
echo "Press ENTER to create test database, or Ctrl+C to cancel..."
read

# Remove old test database if exists
if [ -d "$TEST_DB" ]; then
    echo "🗑️  Removing old test database..."
    rm -rf "$TEST_DB"
fi

# Create test database
echo "📦 Creating test database with sample healthcare documents..."
echo ""

# Run seeding (will skip concept extraction if no API key)
npx tsx hybrid_fast_seed.ts \
    --dbpath "$TEST_DB" \
    --filesdir "$SAMPLE_DOCS" \
    --overwrite

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     TEST DATABASE READY                                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Test database created at: $TEST_DB"
echo "✅ Main database preserved at: ~/.concept_rag"
echo ""
echo "Next step: Run integration tests"
echo "  npx tsx src/__tests__/integration/live-integration.test.ts"
echo ""
