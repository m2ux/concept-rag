# Meta Content Detection - Navigation

## Quick Links

| Document | Purpose |
|----------|---------|
| [START-HERE.md](START-HERE.md) | Executive summary and status |
| [01-work-package-plan.md](01-work-package-plan.md) | Detailed implementation plan with tasks |
| [02-kb-research.md](02-kb-research.md) | Knowledge base and web research findings |
| [03-implementation-analysis.md](03-implementation-analysis.md) | Current implementation analysis |

## Issue Reference

- **GitHub Issue:** [#47 - Exclude title and meta content from discovery](https://github.com/m2ux/concept-rag/issues/47)

## Current Phase

📋 **Planning Complete** → Ready for implementation

## Task Overview

1. Create MetaContentDetector class with detection patterns
2. Add schema fields to chunks table
3. Integrate detection into seeding pipeline
4. Add excludeMetaContent filter to search options
5. Create migration script for existing chunks

## Commands

```bash
# After creating feature branch, run tests
npm test

# Seed test database with new detection
npm run seed -- --filesdir ./sample-docs --dbdir ./db/test --overwrite

# Run migration script (after implementation)
npx tsx scripts/populate-meta-content.ts ./db/prod
```





