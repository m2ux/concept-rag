# Concept Extraction Prompt

This directory contains the prompt used for extracting concepts from documents. This is a plain text file that can be edited by anyone, no programming knowledge required.

## File

```
prompts/
├── concept-extraction.txt    # The concept extraction prompt
└── README.md                 # This file
```

## How to Edit the Prompt

### Step 1: Open the File

Open `concept-extraction.txt` in any text editor:
```bash
# Command line
nano prompts/concept-extraction.txt

# Or in VS Code
code prompts/concept-extraction.txt

# Or just double-click in your file manager
```

### Step 2: Make Your Changes

**The prompt uses a placeholder `{CONTENT}` which gets replaced with the actual document text.**

**Important**: 
- Keep the `{CONTENT}` placeholder exactly as-is
- Keep the format consistent (e.g., keep bullet points as bullet points)
- Use UTF-8 encoding (most editors do this by default)

### Step 3: Test Your Changes

After editing, rebuild the project:

```bash
cd /home/mike/projects/dev/concept-rag
npm run build
```

Then test concept extraction on a sample document to verify your changes work as expected.

## Common Edits

### Add a New Example

**File**: `inclusion_rules.txt` or `exclusion_rules.txt`

Simply add your example to the list:

```
✅ DO EXTRACT:
- All three levels above
- Both single-word and multi-word concepts
- Your new example here
```

### Adjust Concept Levels

**File**: `extraction_strategy.txt`

Modify the quantities in parentheses:

```
🔺 LEVEL 1 - Thematic (10-20): ...  ← Change these numbers
```

### Change Category Examples

**File**: `category_guidance.txt`

Add or modify examples:

```
- Good: "innovation methodology", "your new example"
- Bad: "too vague example"
```

## Tips for Effective Prompts

1. **Be Specific**: Use concrete examples rather than abstract instructions
2. **Use Test Questions**: "Could this be a book title?" helps guide the AI
3. **Show Good and Bad**: Examples of what TO extract vs what NOT to extract
4. **Keep Consistent**: Both chunk/ and single-pass/ should be very similar

## Impact of Changes

After editing prompts:
- **Existing database** - Unchanged until you re-extract concepts
- **New documents** - Will use the new prompts immediately
- **Re-extraction** - Use `repair_missing_concepts.ts` to re-extract existing documents

## Troubleshooting

### Problem: Concepts Not Being Extracted

**Check**:
1. `exclusion_rules.txt` - Make sure you're not excluding what you want
2. `extraction_strategy.txt` - Ensure the level is clearly described
3. Add explicit examples to `inclusion_rules.txt`

### Problem: Too Many Irrelevant Concepts

**Check**:
1. `exclusion_rules.txt` - Add rules for what to skip
2. `extraction_strategy.txt` - Make the test questions more strict
3. `formal_definition.txt` - Clarify what "reusable" means

### Problem: Inconsistent Categories

**Check**:
1. `category_guidance.txt` - Add more examples of good/bad categories
2. Specify the level of abstraction (not too broad, not too specific)

## Version History

| Date | Version | Description |
|------|---------|-------------|
| 2025-11-13 | 2.0 | Option C - Hierarchical extraction with test questions |
| 2025-11-13 | 1.5 | Removed "generic single words" constraint |
| (earlier) | 1.0 | Original prompts |

## Questions?

See the main project documentation or contact the development team.

For technical details about how these prompts are used, see:
- `src/concepts/prompts.config.ts` - Loads these files
- `src/concepts/concept_extractor.ts` - Uses the prompts
- `.ai/planning/prompt-refactoring-implementation.md` - Full technical docs

