# LLM Consumption Patterns for Concept Retrieval

**Date**: 2025-11-27  
**Status**: Design Reference

## Overview

This document describes how an LLM (the tool caller) typically synthesizes the results of hierarchical concept retrieval into useful responses for end users.

## The Tool Caller Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER QUERY                                   │
│  "How should I implement dependency injection in my Node.js app?"   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LLM (Claude/GPT)                                │
│  1. Identifies need for domain knowledge                            │
│  2. Calls: concept_search("dependency injection")                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      TOOL RESPONSE                                  │
│  {                                                                  │
│    concept: "dependency injection",                                 │
│    summary: "A technique for achieving IoC...",                     │
│    sources: [                                                       │
│      { doc: "Clean Architecture", pages: [11-15],                   │
│        passages: ["DI allows components to...", "Constructor..."]}, │
│      { doc: "Design Patterns", pages: [87-89],                      │
│        passages: ["The Factory pattern enables...", ...] }          │
│    ],                                                               │
│    related: ["inversion of control", "SOLID principles"]            │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LLM SYNTHESIS                                   │
│  - Uses passages as grounding for response                          │
│  - Cites sources for credibility                                    │
│  - Combines with user's specific context (Node.js)                  │
│  - May call additional tools for related concepts                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FINAL RESPONSE                                  │
│  "Based on Clean Architecture (Ch. 3), dependency injection in      │
│   Node.js can be implemented using constructor injection:           │
│   [example code]. Robert Martin notes that 'DI allows components    │
│   to be loosely coupled...' This aligns with SOLID principles..."   │
└─────────────────────────────────────────────────────────────────────┘
```

## Optimal Response Format for LLM Consumption

The tool should return data that enables the LLM to:

### 1. Ground its response (avoid hallucination)

```json
{
  "passages": [
    {
      "text": "Dependency injection is a technique whereby one object supplies the dependencies of another object.",
      "source": "Clean Architecture",
      "page": 11,
      "confidence": "high"
    }
  ]
}
```

### 2. Cite sources (credibility)

```json
{
  "sources": [
    {
      "title": "Clean Architecture",
      "author": "Robert C. Martin",
      "relevance_score": 0.95
    }
  ]
}
```

### 3. Explore related topics (follow-up potential)

```json
{
  "related_concepts": [
    { "name": "inversion of control", "relationship": "broader_term" },
    { "name": "constructor injection", "relationship": "narrower_term" }
  ]
}
```

### 4. Understand context (where in the document)

```json
{
  "context": {
    "chapter": "Design Principles",
    "section": "Dependency Management",
    "pages": "11-15"
  }
}
```

## Recommended Tool Output Structure

```typescript
interface ConceptDeepDiveResponse {
  // Quick summary for LLM to understand the concept
  concept: string;
  definition: string;  // One-sentence summary
  
  // Grounding material - the actual text to cite
  sources: Array<{
    document: {
      title: string;
      author?: string;
      category: string;
    };
    locations: Array<{
      pages: number[];
      section?: string;
    }>;
    passages: Array<{
      text: string;           // The actual content
      page: number;           // For citation
      relevance: number;      // 0-1 score
    }>;
  }>;
  
  // For follow-up exploration
  related_concepts: Array<{
    name: string;
    relationship: 'broader' | 'narrower' | 'related';
    summary: string;
  }>;
  
  // Metadata for the LLM's reasoning
  coverage: {
    total_sources: number;
    total_passages: number;
    confidence: 'high' | 'medium' | 'low';
  };
}
```

## Example Tool Response

```json
{
  "concept": "dependency injection",
  "definition": "A technique where an object receives its dependencies from external sources rather than creating them internally.",
  
  "sources": [
    {
      "document": {
        "title": "Clean Architecture",
        "author": "Robert C. Martin",
        "category": "software architecture"
      },
      "locations": [
        { 
          "pages": [11, 12, 13, 14, 15], 
          "section": "Chapter 3: Design Principles" 
        }
      ],
      "passages": [
        {
          "text": "Dependency injection allows components to be loosely coupled. Instead of a class creating its own dependencies, they are 'injected' from outside, typically through the constructor.",
          "page": 11,
          "relevance": 0.95
        },
        {
          "text": "The key insight is that high-level modules should not depend on low-level modules. Both should depend on abstractions.",
          "page": 12,
          "relevance": 0.88
        }
      ]
    }
  ],
  
  "related_concepts": [
    { 
      "name": "inversion of control", 
      "relationship": "broader", 
      "summary": "The general principle that DI implements" 
    },
    { 
      "name": "constructor injection", 
      "relationship": "narrower", 
      "summary": "A specific DI technique using constructors" 
    },
    { 
      "name": "SOLID principles", 
      "relationship": "related", 
      "summary": "DI supports the D in SOLID (Dependency Inversion)" 
    }
  ],
  
  "coverage": {
    "total_sources": 3,
    "total_passages": 8,
    "confidence": "high"
  }
}
```

## How the LLM Uses This

The LLM will typically:

1. **Read the definition** to understand the concept
2. **Use passages as quotes** in its response
3. **Cite sources** for credibility ("According to Clean Architecture...")
4. **Combine with user context** (Node.js specific implementation)
5. **Suggest related concepts** for follow-up ("You might also want to look at...")

## Key Design Principles

| Principle | Why | How |
|-----------|-----|-----|
| **Grounded text** | Prevents hallucination | Include actual passages, not summaries |
| **Source attribution** | Enables citation | Include doc title, author, page numbers |
| **Relevance scores** | Helps prioritization | LLM can focus on high-relevance passages |
| **Related concepts** | Enables exploration | LLM can suggest or call for more info |
| **Structured format** | Easy parsing | JSON with consistent schema |

## Anti-Patterns to Avoid

### 1. Returning only summaries (no grounding)

```json
// BAD - LLM has nothing to quote
{
  "concept": "dependency injection",
  "summary": "A useful technique for decoupling"
}
```

### 2. Missing source attribution

```json
// BAD - LLM can't cite sources
{
  "passages": ["DI allows components to be loosely coupled..."]
}
```

### 3. Unstructured text blobs

```json
// BAD - Hard to parse and prioritize
{
  "result": "Dependency injection is mentioned in Clean Architecture on pages 11-15 where Martin discusses..."
}
```

### 4. Too much data without relevance ranking

```json
// BAD - LLM doesn't know what's important
{
  "passages": [/* 50 passages with no scores */]
}
```

## Token Budget Considerations

LLMs have context limits. The tool response should:

1. **Limit passages** to top 5-10 most relevant
2. **Truncate long passages** (500 chars max)
3. **Prioritize by relevance score**
4. **Include summary** for quick understanding before detailed passages

## Conclusion

The goal of the tool response format is to give the LLM **everything it needs to write an authoritative, well-sourced response** without needing to make things up. The hierarchical structure (concept → sources → passages) mirrors how a human researcher would approach the same task.

