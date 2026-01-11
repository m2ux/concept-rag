#!/usr/bin/env bash
# Update the metadata submodule to the latest HEAD
#
# Note: This script requires access to the private ai-metadata repository.
# It will fail for non-collaborators.
#
# Usage: ./scripts/update-metadata.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$REPO_ROOT"

echo "Updating agent-metadata submodule to latest HEAD..."

if ! git submodule update --remote agent-metadata 2>&1; then
    echo ""
    echo "Error: Failed to update metadata submodule"
    echo "This is expected if you don't have access to the private repository."
    exit 1
fi

git add agent-metadata

NEW_COMMIT=$(cd agent-metadata && git rev-parse --short HEAD)

echo ""
echo "Updated metadata to $NEW_COMMIT"
echo "Run the following to commit:"
echo "  git commit -m \"chore: update metadata to latest\""
