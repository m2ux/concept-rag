#!/usr/bin/env bash
# Setup engineering documentation and agent resources in the current checkout
#
# This script clones the engineering branch content and agent submodules
# into the current concept-rag checkout, making everything accessible
# from a single directory.
#
# Structure after running:
#   concept-rag/
#   ├── src/                    # Code (main branch)
#   ├── engineering/            # Engineering docs (from engineering branch)
#   │   ├── artifacts/
#   │   ├── scripts/
#   │   └── ...
#   └── agent/                  # Agent resources (submodules)
#       ├── workflows/          # Public (m2ux/agent-workflows)
#       └── metadata/           # Private (m2ux/ai-metadata) - optional
#
# Usage: ./scripts/setup-engineering.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$REPO_ROOT"

echo "=== Setting up engineering resources ==="
echo ""

# --- Engineering branch content ---
ENGINEERING_DIR="$REPO_ROOT/engineering"

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

echo "✓ Engineering docs available at: engineering/"
echo ""

# --- Agent workflows (public) ---
WORKFLOWS_DIR="$REPO_ROOT/agent/workflows"

if [ -d "$WORKFLOWS_DIR" ]; then
    echo "Agent workflows already exists. Updating..."
    cd "$WORKFLOWS_DIR"
    git fetch --tags
    git checkout v0.1.0 2>/dev/null || git pull origin main
    cd "$REPO_ROOT"
else
    echo "Cloning agent-workflows..."
    mkdir -p "$REPO_ROOT/agent"
    git clone https://github.com/m2ux/agent-workflows.git "$WORKFLOWS_DIR"
    cd "$WORKFLOWS_DIR"
    git checkout v0.1.0
    cd "$REPO_ROOT"
fi

echo "✓ Agent workflows available at: agent/workflows/"
echo ""

# --- Agent metadata (private - optional) ---
METADATA_DIR="$REPO_ROOT/agent/metadata"

if [ -d "$METADATA_DIR" ]; then
    echo "Agent metadata already exists. Updating..."
    cd "$METADATA_DIR"
    git pull origin concept-rag_metadata 2>/dev/null || echo "  (update skipped - may not have access)"
    cd "$REPO_ROOT"
else
    echo "Attempting to clone agent-metadata (private repo)..."
    if git clone --single-branch --branch concept-rag_metadata \
        https://github.com/m2ux/ai-metadata.git "$METADATA_DIR" 2>/dev/null; then
        
        # Setup sparse checkout for just this project's content
        cd "$METADATA_DIR"
        git sparse-checkout init --cone
        git sparse-checkout set projects/concept-rag
        cd "$REPO_ROOT"
        
        echo "✓ Agent metadata available at: agent/metadata/"
    else
        echo "⚠ Agent metadata skipped (private repo - access denied)"
        echo "  This is expected for non-collaborators."
    fi
fi

echo ""
echo "=== Setup complete ==="
echo ""
echo "Structure:"
echo "  engineering/     - Engineering docs, ADRs, specs"
echo "  agent/workflows/ - Reusable agent workflows"
if [ -d "$METADATA_DIR" ]; then
    echo "  agent/metadata/  - Private agent metadata"
fi
echo ""
echo "Note: These folders are gitignored and won't affect your commits."
