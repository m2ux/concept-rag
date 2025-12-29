# Agent Rules for Document Research

This document provides explicit guidance for AI agents using the concept-rag MCP tools to answer user questions. Following these rules will improve answer quality, reduce unnecessary tool calls, and ensure users receive synthesized answers rather than search status updates.

---

## ⚠️ IMPORTANT: Read the Tool Selection Guide First

**Before starting any research task, review the [Tool Selection Guide](../docs/tool-selection-guide.md).**

The guide provides:
- **Decision tree** for choosing the correct tool for each query type
- **USE THIS WHEN / DO NOT USE** criteria for all 11 tools
- **Common workflow patterns** (e.g., catalog_search → chunks_search)
- **Validation examples** to test your understanding

Correct tool selection is critical for efficient research. Using the wrong tool leads to wasted calls and poor results.

To retrieve the full guide, call `get_guidance` with `topic='tool-selection'` or `topic='all'`.

---

## Core Principle: Answer First, Search Second

**Your goal is to ANSWER the user's question, not to report on your search process.**

Users don't want to know what you searched for or what you're planning to search next. They want an answer to their question based on the available documents.

## Rule 1: Recognize When You Have Enough Data

### You Have Enough Data When:

- You found **at least one relevant chunk** that addresses the question
- You can identify **key points** that answer the user's question
- The search results contain **specific information** (quotes, definitions, examples)

### Stop Searching Immediately If:

- You've made **3+ searches** and found relevant content
- The same documents/chunks keep appearing in results
- You're reformulating the same query with synonyms

### Example - Sufficient Data:

```
User: "What is the Dependency Rule in Clean Architecture?"

After 1-2 searches, you find:
- A chunk explaining "dependencies must point inward"
- A chunk about "inner circles not knowing about outer circles"

✅ STOP SEARCHING. Synthesize the answer now.
```

## Rule 2: Synthesize, Don't Summarize Your Search

### ❌ BAD Response (Search Status):
```
"Let me search for more information about the Dependency Rule..."
"I found several chunks but let me look for the specific definition..."
"The search returned 5 results. Let me refine my query..."
```

### ✅ GOOD Response (Synthesized Answer):
```
"The Dependency Rule in Clean Architecture states that source code 
dependencies must point inward, toward higher-level policies. 

Key principles:
1. Inner circles should not know about outer circles
2. Business rules should not depend on UI or database details
3. Dependencies always point toward abstractions

This ensures that changes to external concerns (UI, database) don't 
affect core business logic.

Source: Clean Architecture by Robert C. Martin"
```

## Rule 3: Use the Right Tool for the Task

**⚠️ CRITICAL: Review the [Tool Selection Guide](../docs/tool-selection-guide.md) before making tool calls.**

The guide contains:
- Detailed decision tree for all 11 MCP tools
- ✅ USE THIS WHEN / ❌ DO NOT USE criteria for each tool
- Common workflow patterns
- Validation test cases

**Wrong tool = wasted calls + poor results.** When in doubt, consult the guide.

### Quick Reference (Most Common Tools):

| Question Type | Tool |
|---------------|------|
| "What documents about X?" | `catalog_search` |
| "Search within [document]" | `chunks_search` |
| "What do all docs say about X?" | `broad_chunks_search` |
| "Where is [concept] discussed?" | `concept_search` or `source_concepts` |
| "What categories exist?" | `list_categories` |
| "Documents in [category]?" | `category_search` |

### Key Principle: Start Broad, Then Narrow

1. Use `catalog_search` to find relevant documents
2. Use `chunks_search` to dive into specific content
3. Don't skip step 1 unless you already know the document

## Rule 4: Limit Tool Calls

### Maximum Tool Calls by Task Complexity:

| Task Type | Max Calls | Example |
|-----------|-----------|---------|
| Simple lookup | 2-3 | "What is X?" |
| Document finding | 3-4 | "Which books discuss X?" |
| Cross-document synthesis | 5-6 | "Compare X across documents" |
| Complex research | 8-10 | "Find connections between X and Y" |

### After Each Tool Call, Ask Yourself:

1. Did I get information that helps answer the question?
2. Can I formulate at least a partial answer now?
3. Would another search add meaningful new information?

**If you can answer "yes" to #1 and #2, STOP and synthesize.**

## Rule 5: Handle "Not Found" Gracefully

### When Information Isn't Found:

After 2-3 searches with no relevant results:

```
✅ GOOD:
"Based on my search of your document library, I couldn't find 
specific information about [topic]. Your library contains documents 
on [related topics], but [topic] doesn't appear to be covered.

Would you like me to search for related concepts like [suggestion]?"
```

```
❌ BAD:
"Let me try another search..."
"I'll reformulate my query..."
[Makes 5 more searches with no new information]
```

## Rule 6: Structure Your Answers

### Answer Template:

```markdown
## [Direct Answer to the Question]

[2-3 sentence summary answering the core question]

### Key Points

1. [First key point with specifics]
2. [Second key point with specifics]
3. [Third key point if relevant]

### Source(s)

- [Document title] by [Author] - [relevant chapter/section if known]
```

### For Quote Requests:

```markdown
> "[Exact quote from the document]"

— [Author], *[Document Title]*

This quote [brief context explaining its significance].
```

### For Comparison Questions:

```markdown
## Comparison: [Topic A] vs [Topic B]

| Aspect | [Source 1] | [Source 2] |
|--------|------------|------------|
| [Aspect 1] | [View] | [View] |
| [Aspect 2] | [View] | [View] |

### Key Differences
[Summary of main differences]

### Common Ground
[What both sources agree on]
```

## Rule 7: Cite Your Sources

Always include source attribution:

- **Document title** and author when available
- **Specific location** (chapter, section) if mentioned in results
- **Multiple sources** if synthesizing across documents

### Citation Format:

```
According to [Document Title] by [Author], [information].

[Author] argues that [point] in [Document Title].

This principle appears in multiple sources:
- [Source 1]: [brief summary]
- [Source 2]: [brief summary]
```

## Rule 8: Answer Even with Partial Information

### Partial Information is Valuable:

If you found some but not all requested information:

```
✅ GOOD:
"Based on my search, I found information about [aspect 1] and 
[aspect 2], but couldn't locate specific details about [aspect 3].

Here's what I found:

[Synthesized answer for what was found]

Regarding [aspect 3], this doesn't appear to be covered in your 
current library."
```

```
❌ BAD:
"I couldn't find complete information. Let me search more..."
[Continues searching indefinitely]
```

## Quick Reference Card

### Before Each Response, Check:

- [ ] Am I providing an ANSWER or just reporting search status?
- [ ] Have I synthesized the information into a coherent response?
- [ ] Did I cite my sources?
- [ ] Is this the minimum number of tool calls needed?
- [ ] Would the user be satisfied with this response?

### Red Flags (Stop and Synthesize):

- You've made 4+ tool calls
- You're about to search with a very similar query
- The same chunks keep appearing
- You're thinking "let me try one more search"

### Green Flags (Ready to Answer):

- You found at least one chunk with relevant content
- You can state 2-3 key points about the topic
- You know which document(s) the information came from

---

*These rules are designed to improve agent performance on document research tasks. They address common issues identified through Agent-in-the-Loop testing.*

