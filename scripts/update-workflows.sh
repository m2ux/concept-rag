#!/usr/bin/env bash
# Update the agent/workflows submodule to a specific version tag
#
# Usage: ./scripts/update-workflows.sh v0.2.0

set -e

VERSION="${1:-}"

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version-tag>"
    echo "Example: $0 v0.2.0"
    echo ""
    echo "Available tags:"
    cd "$(dirname "$0")/../agent/workflows"
    git fetch --tags --quiet
    git tag -l 'v*' | sort -V
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$REPO_ROOT/agent/workflows"

echo "Fetching tags..."
git fetch --tags --quiet

if ! git rev-parse "$VERSION" >/dev/null 2>&1; then
    echo "Error: Tag '$VERSION' not found"
    echo ""
    echo "Available tags:"
    git tag -l 'v*' | sort -V
    exit 1
fi

echo "Checking out $VERSION..."
git checkout "$VERSION" --quiet

cd "$REPO_ROOT"
git add agent/workflows

echo ""
echo "Updated agent/workflows to $VERSION"
echo "Run the following to commit:"
echo "  git commit -m \"chore: update workflows to $VERSION\""
