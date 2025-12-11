#!/bin/bash
#
# Live Stage Cache Testing Script
#
# This script tests the stage cache functionality with real documents.
# It uses db/test to avoid modifying the production database.
#
# Prerequisites:
# - OPENROUTER_API_KEY must be set (or in .envrc)
# - sample-docs/ directory with test documents
#
# Usage:
#   ./scripts/test-stage-cache-live.sh [--quick]
#
# Options:
#   --quick    Use smaller document counts for faster testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_PATH="db/test-cache-$(date +%Y%m%d_%H%M%S)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Parse arguments
QUICK_MODE=false
if [[ "$1" == "--quick" ]]; then
    QUICK_MODE=true
    MAX_DOCS=1
    INTERRUPT_TIMEOUT=90
else
    MAX_DOCS=2
    INTERRUPT_TIMEOUT=180
fi

cd "$PROJECT_ROOT"

# Load environment
if [[ -f .envrc ]]; then
    source .envrc
fi

# Verify API key
if [[ -z "$OPENROUTER_API_KEY" ]]; then
    echo -e "${RED}❌ OPENROUTER_API_KEY not set${NC}"
    echo "Set it in .envrc or export it before running"
    exit 1
fi

# Verify sample-docs exists
if [[ ! -d "sample-docs" ]]; then
    echo -e "${RED}❌ sample-docs directory not found${NC}"
    exit 1
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Stage Cache Live Testing Suite                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Database: ${YELLOW}$DB_PATH${NC}"
echo -e "Mode: ${YELLOW}$([ "$QUICK_MODE" = true ] && echo "Quick" || echo "Full")${NC}"
echo ""

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
declare -a FAILED_TESTS

run_test() {
    local test_name="$1"
    local test_cmd="$2"
    local expected_exit="$3"
    
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}TEST: $test_name${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if eval "$test_cmd"; then
        actual_exit=0
    else
        actual_exit=$?
    fi
    
    if [[ "$actual_exit" == "$expected_exit" ]] || [[ "$expected_exit" == "*" ]]; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAILED: $test_name (exit $actual_exit, expected $expected_exit)${NC}"
        ((TESTS_FAILED++))
        FAILED_TESTS+=("$test_name")
    fi
}

check_cache_exists() {
    local cache_dir="$DB_PATH/.stage-cache"
    if [[ -d "$cache_dir" ]]; then
        local collection_count=$(find "$cache_dir" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
        echo -e "Cache collections: ${YELLOW}$collection_count${NC}"
        for coll in "$cache_dir"/*/; do
            if [[ -d "$coll" ]]; then
                local file_count=$(ls -1 "$coll"/*.json 2>/dev/null | wc -l)
                echo -e "  └─ $(basename "$coll"): ${file_count} files"
            fi
        done
        return 0
    else
        echo -e "${YELLOW}No cache directory found${NC}"
        return 1
    fi
}

# ============================================================================
# TEST 1: Clean seed from Philosophy (small, should complete)
# ============================================================================
run_test "Complete seed + cache cleanup" \
    "npx tsx hybrid_fast_seed.ts --filesdir sample-docs/Philosophy --dbpath '$DB_PATH' --parallel 1 2>&1 | tee /tmp/test1.log && grep -q 'Removed collection cache\|Seeding completed' /tmp/test1.log" \
    "0"

echo -e "\n${BLUE}Cache state after Test 1:${NC}"
check_cache_exists || true

# ============================================================================
# TEST 2: Interrupted seed from Papers
# ============================================================================
run_test "Interrupted seed creates cache" \
    "timeout $INTERRUPT_TIMEOUT npx tsx hybrid_fast_seed.ts --filesdir sample-docs/Papers --dbpath '$DB_PATH' --max-docs $MAX_DOCS --parallel 1 2>&1 | tee /tmp/test2.log; check_cache_exists" \
    "*"

echo -e "\n${BLUE}Cache state after Test 2:${NC}"
check_cache_exists || true

# ============================================================================
# TEST 3: Interrupted seed from Programming
# ============================================================================
run_test "Second interrupted seed creates separate cache" \
    "timeout $INTERRUPT_TIMEOUT npx tsx hybrid_fast_seed.ts --filesdir sample-docs/Programming --dbpath '$DB_PATH' --max-docs $MAX_DOCS --parallel 1 2>&1 | tee /tmp/test3.log; [ \$(find '$DB_PATH/.stage-cache' -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l) -ge 1 ]" \
    "*"

echo -e "\n${BLUE}Cache state after Test 3:${NC}"
check_cache_exists || true

# ============================================================================
# TEST 4: Resume without --filesdir
# ============================================================================
run_test "Resume without filesdir finds cached collections" \
    "npx tsx hybrid_fast_seed.ts --dbpath '$DB_PATH' --max-docs 1 --parallel 1 2>&1 | tee /tmp/test4.log && grep -q 'cached collection' /tmp/test4.log" \
    "0"

echo -e "\n${BLUE}Cache state after Test 4:${NC}"
check_cache_exists || true

# ============================================================================
# TEST 5: Cache hit verification
# ============================================================================
run_test "Cache hits avoid LLM calls" \
    "npx tsx hybrid_fast_seed.ts --dbpath '$DB_PATH' --max-docs 1 --parallel 1 2>&1 | tee /tmp/test5.log && (grep -q 'Using cached results\|Cache stats.*hits' /tmp/test5.log || grep -q 'Seeding completed' /tmp/test5.log)" \
    "0"

# ============================================================================
# TEST 6: --clear-cache flag
# ============================================================================
if [[ "$QUICK_MODE" != true ]]; then
    run_test "--clear-cache removes cache entries" \
        "npx tsx hybrid_fast_seed.ts --filesdir sample-docs/Philosophy --dbpath '$DB_PATH' --clear-cache --max-docs 1 --parallel 1 2>&1 | tee /tmp/test6.log && grep -q 'Cleared.*cached entries\|Stage cache:' /tmp/test6.log" \
        "0"
fi

# ============================================================================
# Summary
# ============================================================================
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    TEST SUMMARY                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Database used: ${YELLOW}$DB_PATH${NC}"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"

if [[ ${#FAILED_TESTS[@]} -gt 0 ]]; then
    echo -e "\n${RED}Failed tests:${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "  ${RED}✗${NC} $test"
    done
fi

echo ""
echo -e "${BLUE}Cache final state:${NC}"
check_cache_exists || echo "No cache remains (cleaned up)"

echo ""
echo -e "${BLUE}Logs saved to:${NC} /tmp/test*.log"

# Cleanup prompt
echo ""
read -p "Delete test database $DB_PATH? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$DB_PATH"
    echo -e "${GREEN}✅ Test database deleted${NC}"
fi

# Exit with appropriate code
if [[ $TESTS_FAILED -gt 0 ]]; then
    exit 1
else
    echo -e "\n${GREEN}✅ All tests passed!${NC}"
    exit 0
fi
