#!/usr/bin/env bash
# Setup engineering documentation and agent resources in the current checkout
#
# This script clones the engineering branch content and initializes its
# submodules, making everything accessible from a single directory.
#
# Structure after running:
#   concept-rag/
#   ├── src/                          # Code (main branch)
#   └── .engineering/                 # Engineering docs (from engineering branch)
#       ├── artifacts/
#       ├── agent/
#       │   ├── workflows/            # Public (m2ux/agent-workflows)
#       │   └── metadata/             # Private (m2ux/ai-metadata) - optional
#       └── scripts/
#
# Usage: ./scripts/setup-engineering.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$REPO_ROOT"

echo "=== Setting up engineering resources ==="
echo ""

# --- Engineering branch content ---
ENGINEERING_DIR="$REPO_ROOT/.engineering"

if [ -d "$ENGINEERING_DIR" ]; then
    echo "Engineering directory already exists. Updating..."
    cd "$ENGINEERING_DIR"
    git pull origin engineering
    cd "$REPO_ROOT"
else
    echo "Cloning engineering branch..."
    git clone --single-branch --branch engineering \
        https://github.com/m2ux/concept-rag.git "$ENGINEERING_DIR"
fi

echo "✓ Engineering docs available at: .engineering/"
echo ""

# --- Initialize submodules within engineering ---
cd "$ENGINEERING_DIR"

# Agent workflows (public)
WORKFLOWS_DIR="$ENGINEERING_DIR/agent/workflows"

if [ -d "$WORKFLOWS_DIR" ] && [ "$(ls -A "$WORKFLOWS_DIR" 2>/dev/null)" ]; then
    echo "Agent workflows already initialized. Updating..."
    cd "$WORKFLOWS_DIR"
    git fetch --tags
    git checkout v0.1.0 2>/dev/null || echo "  (already at v0.1.0)"
    cd "$ENGINEERING_DIR"
else
    echo "Initializing agent/workflows submodule..."
    git submodule update --init agent/workflows
    cd "$WORKFLOWS_DIR"
    git fetch --tags
    git checkout v0.1.0
    cd "$ENGINEERING_DIR"
fi

echo "✓ Agent workflows available at: .engineering/agent/workflows/"
echo ""

# Agent metadata (private - optional)
METADATA_DIR="$ENGINEERING_DIR/agent/metadata"

if [ -d "$METADATA_DIR" ] && [ "$(ls -A "$METADATA_DIR" 2>/dev/null)" ]; then
    echo "Agent metadata already initialized. Updating..."
    cd "$METADATA_DIR"
    git pull origin concept-rag_metadata 2>/dev/null || echo "  (update skipped - may not have access)"
    cd "$ENGINEERING_DIR"
else
    echo "Attempting to initialize agent/metadata submodule (private repo)..."
    if git submodule update --init agent/metadata 2>/dev/null; then
        
        # Setup sparse checkout for just this project's content
        cd "$METADATA_DIR"
        git sparse-checkout init --cone
        git sparse-checkout set projects/concept-rag
        git checkout concept-rag_metadata 2>/dev/null || true
        cd "$ENGINEERING_DIR"
        
        echo "✓ Agent metadata available at: .engineering/agent/metadata/"
    else
        echo "⚠ Agent metadata skipped (private repo - access denied)"
        echo "  This is expected for non-collaborators."
    fi
fi

cd "$REPO_ROOT"

echo ""
echo "=== Setup complete ==="
echo ""
echo "Structure:"
echo "  .engineering/                - Engineering docs, ADRs, specs"
echo "  .engineering/agent/workflows - Reusable agent workflows"
if [ -d "$METADATA_DIR" ] && [ "$(ls -A "$METADATA_DIR" 2>/dev/null)" ]; then
    echo "  .engineering/agent/metadata  - Private agent metadata"
fi
echo ""
echo "Note: The .engineering/ folder is gitignored and won't affect your commits."
