#!/usr/bin/env bash
# Setup sparse checkout for the private agent/metadata submodule
#
# This script configures the metadata submodule to only checkout
# the projects/concept-rag folder, reducing clutter from other projects.
#
# Note: This script requires access to the private ai-metadata repository.
# It will fail for non-collaborators.
#
# Usage: ./scripts/setup-sparse-metadata.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
SUBMODULE_PATH="$REPO_ROOT/agent/metadata"

echo "Setting up sparse checkout for agent/metadata..."

# Initialize submodule without checkout if not already done
if [ ! -d "$SUBMODULE_PATH/.git" ] && [ ! -f "$SUBMODULE_PATH/.git" ]; then
    echo "Initializing submodule..."
    cd "$REPO_ROOT"
    git submodule update --init --no-checkout agent/metadata
fi

cd "$SUBMODULE_PATH"

# Enable sparse checkout
echo "Enabling sparse checkout..."
git sparse-checkout init --cone

# Set sparse checkout to only include projects/concept-rag
echo "Configuring sparse paths..."
git sparse-checkout set projects/concept-rag

# Checkout the master branch
echo "Checking out master branch..."
git checkout master

echo ""
echo "Sparse checkout complete!"
echo "Only projects/concept-rag/ is checked out from agent/metadata"
echo ""
echo "Contents:"
ls -la "$SUBMODULE_PATH"
