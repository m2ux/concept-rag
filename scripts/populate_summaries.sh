#!/bin/bash
# Populate concept and category summaries using LLM
# Suppresses LanceDB native warnings that break the progress bar

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_PATH="${1:-$HOME/.concept_rag}"

npx tsx "$SCRIPT_DIR/populate_summaries.ts" "$DB_PATH" "${@:2}" 2>/dev/null

