# Skill: Deep Research

## Capability

Synthesize knowledge across multiple documents to answer a user's question.

## Fulfills Intent

[understand-topic](../intents/understand-topic.md)

## Tool Workflow

```
1. catalog_search(query) → Find relevant documents
   ↓ preserve: document paths, titles
2. chunks_search(source, query) → Extract specific content (repeat per document)
   ↓ preserve: key findings, quotes
3. Synthesize → Combine findings into coherent answer
```

## Tool Details

### Step 1: Find Documents

```
Tool: catalog_search
Input: User's topic/question
Output: List of relevant documents with paths
```

**Preserve:** Document source paths for next step.

### Step 2: Extract Content

```
Tool: chunks_search
Input: source (from step 1), user's query
Output: Relevant text chunks with page numbers
```

**Repeat** for 1-3 most relevant documents.
**Preserve:** Key quotes, findings, page references.

### Step 3: Synthesize

Combine findings into a structured answer:

```markdown
## [Direct Answer]

[2-3 sentence summary]

### Key Points

1. [Point from Source A]
2. [Point from Source B]

### Sources

- [Document A] - [relevant section]
- [Document B] - [relevant section]
```

## Context to Preserve

| Item | Purpose |
|------|---------|
| Document paths | Required for chunks_search |
| Topic/query | Maintain focus across steps |
| Findings per source | Enable synthesis with citations |

## Stop Conditions

- Found 2-3 relevant documents with specific content
- Can answer the user's question with citations
- Maximum 5-6 tool calls reached

## Example

```
User: "What does Clean Architecture say about dependencies?"

1. catalog_search("Clean Architecture dependencies")
   → Found: Clean Architecture by Robert C. Martin

2. chunks_search(source="/path/to/clean-arch.pdf", text="dependencies")
   → Found: Dependency Rule explanation

3. Synthesize:
   "According to Clean Architecture, the Dependency Rule states that 
   source code dependencies must point inward..."
```
