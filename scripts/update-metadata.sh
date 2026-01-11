#!/usr/bin/env bash
# Update the agent/metadata submodule to the latest HEAD of master branch
#
# This script also configures sparse checkout to only include
# the projects/concept-rag folder, reducing clutter from other projects.
#
# Note: This script requires access to the private ai-metadata repository.
# It will fail for non-collaborators.
#
# Usage: ./scripts/update-metadata.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
SUBMODULE_PATH="$REPO_ROOT/agent/metadata"

cd "$REPO_ROOT"

echo "Updating agent/metadata submodule..."

# Initialize submodule if not already done
if [ ! -d "$SUBMODULE_PATH/.git" ] && [ ! -f "$SUBMODULE_PATH/.git" ]; then
    echo "Initializing submodule..."
    if ! git submodule update --init agent/metadata 2>&1; then
        echo ""
        echo "Error: Failed to initialize agent/metadata submodule"
        echo "This is expected if you don't have access to the private repository."
        exit 1
    fi
fi

cd "$SUBMODULE_PATH"

# Setup sparse checkout if not already configured
if [ ! -f ".git/info/sparse-checkout" ] && [ ! -f "$(git rev-parse --git-dir)/info/sparse-checkout" ]; then
    echo "Configuring sparse checkout..."
    git sparse-checkout init --cone
    git sparse-checkout set projects/concept-rag
fi

# Fetch and checkout latest
echo "Fetching latest from master..."
git fetch origin master

echo "Checking out master..."
git checkout master 2>/dev/null || git checkout -b master origin/master

echo "Pulling latest changes..."
git pull origin master

cd "$REPO_ROOT"
git add agent/metadata

NEW_COMMIT=$(cd "$SUBMODULE_PATH" && git rev-parse --short HEAD)

echo ""
echo "Updated agent/metadata to $NEW_COMMIT"
echo "Sparse checkout: projects/concept-rag only"
echo ""
echo "Run the following to commit:"
echo "  git commit -m \"chore: update metadata to latest\""
