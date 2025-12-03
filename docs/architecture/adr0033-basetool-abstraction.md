# 33. BaseTool Abstraction Pattern

**Date:** ~2024-2025 (Evolved from lance-mcp)  
**Status:** Accepted (Inherited and Enhanced)  
**Original Deciders:** adiom-data team (lance-mcp)  
**Enhanced By:** concept-rag team  
**Technical Story:** Tool abstraction pattern for MCP tools

**Sources:**
- Git Commit: 082c38e2429a8c9074a9a176dd0b1defc84a5ae2 (November 19, 2024, lance-mcp upstream)

## Context and Problem Statement

MCP tools share common functionality (parameter validation, error handling, result formatting) [Pattern: common behavior]. Without abstraction, each tool would duplicate validation logic, error handling, and response formatting [Problem: duplication]. A base class pattern provides code reuse while enforcing consistent tool structure [Solution: inheritance].

**The Core Problem:** How to share common tool functionality while allowing specialization for each tool type? [Design: reuse vs. specialization]

**Decision Drivers:**
* 3 tools share validation and error handling [Scope: all tools]
* MCP protocol requires consistent response format [Requirement: protocol compliance]
* TypeScript supports abstract classes well [Language: OOP support]
* DRY principle (don't repeat yourself) [Principle: reuse]
* Type safety for tool implementations [Quality: TypeScript]

## Alternative Options

* **Option 1: Abstract Base Class (BaseTool)** - Inheritance pattern
* **Option 2: Utility Functions** - Shared helper functions
* **Option 3: Decorators** - Wrap tools with common behavior
* **Option 4: Mixins** - Compose behavior from multiple sources
* **Option 5: No Abstraction** - Each tool standalone

## Decision Outcome

**Chosen option:** "Abstract Base Class (BaseTool) (Option 1)"

### BaseTool Implementation

**File:** `src/tools/base/tool.ts` [Source: Code file, 69 lines]

**Abstract Interface:**
```typescript
export abstract class BaseTool<T extends ToolParams = ToolParams> {
  // Must implement in subclasses
  abstract name: string;
  abstract description: string;
  abstract inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  abstract execute(params: T): Promise<ToolResponse>;
  
  // Shared validation methods
  protected validateDatabase(database: unknown): string { }
  protected validateCollection(collection: unknown): string { }
  protected validateObject(value: unknown, name: string): Record<string, unknown> { }
  
  // Shared error handling
  protected handleError(error: unknown): ToolResponse { }
}
```
[Source: `src/tools/base/tool.ts`, lines 16-68]

**Shared Functionality:**
1. **Validation Methods** - Type checking and validation
2. **Error Handling** - Consistent error response formatting
3. **Type Safety** - Generic parameter type `<T extends ToolParams>`

**Tool Implementation Example:**
```typescript
export class CatalogSearchTool extends BaseTool<CatalogSearchParams> {
  name = "catalog_search";
  description = "Search for relevant documents in the catalog";
  
  inputSchema = {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" }
    },
    required: ["query"]
  };
  
  async execute(params: CatalogSearchParams): Promise<ToolResponse> {
    try {
      // Tool-specific logic
      const results = await this.search(params.query);
      return this.formatResults(results);
    } catch (error) {
      return this.handleError(error);  // Use base class error handling
    }
  }
}
```

### Consequences

**Positive:**
* **Code reuse:** Validation and error handling shared [Benefit: DRY]
* **Consistent structure:** All tools follow same pattern [Consistency: standard]
* **Type safety:** Abstract methods enforced by TypeScript [Safety: compile-time]
* **Easy to extend:** New tool = extend BaseTool [UX: clear pattern]
* **3 tools:** Pattern used by all tools [Validation: working]
* **Centralized fixes:** Fix base class = fixes all tools [Maintenance: leverage]

**Negative:**
* **Inheritance coupling:** Tools coupled to base class [Trade-off: inheritance]
* **Limited reuse:** Can only extend one base class [Limitation: single inheritance]
* **Override confusion:** Subclasses can override protected methods [Risk: unexpected behavior]

**Neutral:**
* **OOP pattern:** Traditional object-oriented inheritance [Pattern: classic]
* **TypeScript-friendly:** Works well with TS abstract classes [Fit: language]

### Confirmation

**Production Usage:**
- **3 tools:** All extend BaseTool [Implementation: universal]
- **Consistent errors:** All tools return same error format [Consistency: validated]
- **Type-safe:** TypeScript enforces abstract method implementation [Safety: compiler]
- **Working:** All tools functioning in production [Result: successful]

## Pros and Cons of the Options

### Option 1: Abstract Base Class - Chosen

**Pros:**
* Code reuse (validation, error handling)
* Consistent structure
* TypeScript abstract class support
* Enforced implementation (abstract methods)
* 3 tools using successfully [Validated]
* Centralized fixes

**Cons:**
* Inheritance coupling
* Single inheritance limit
* Override risk

### Option 2: Utility Functions

Shared static functions for validation/errors.

**Pros:**
* No inheritance coupling
* Composition over inheritance
* Multiple function sources possible
* Simple imports

**Cons:**
* **No enforcement:** Tools may forget to call functions [Risk: inconsistency]
* **No structure:** Each tool structures differently [Problem: variance]
* **Type safety weak:** No abstract methods [Gap: enforcement]
* **Less discoverable:** Functions scattered [UX: harder to find]

### Option 3: Decorators

TypeScript decorators for common behavior.

**Pros:**
* Composition-based
* Clean separation
* Multiple decorators composable

**Cons:**
* **Experimental:** TypeScript decorators still experimental [Risk: stability]
* **Complexity:** Decorator syntax less familiar [Learning: curve]
* **Runtime:** Decorators run at runtime (vs. compile-time inheritance) [Performance: overhead]
* **Over-engineering:** Simpler patterns sufficient [Complexity: unnecessary]

### Option 4: Mixins

Multiple mixin composition.

**Pros:**
* Multiple behavior sources
* Flexible composition
* No single inheritance limit

**Cons:**
* **TypeScript support weak:** Mixins awkward in TS [Problem: language fit]
* **Complexity:** More complex than base class [Learning: steep]
* **Type safety issues:** TypeScript struggles with mixin types [Problem: type checking]
* **Simpler alternative:** Base class clearer [Simplicity: better]

### Option 5: No Abstraction

Each tool standalone, copy-paste common code.

**Pros:**
* No coupling
* Complete control per tool
* Simple to understand

**Cons:**
* **Massive duplication:** Validation × 8, error handling × 8 [Problem: DRY violation]
* **Inconsistency:** Tools format errors differently [Problem: variance]
* **Maintenance nightmare:** Fix must be made 8 times [Maintenance: terrible]
* **This is the anti-pattern:** Why abstractions exist [Philosophy: wrong]

## Implementation Notes

### Tool Types

**Type Definitions:** [Source: `tool.ts`, lines 3-14]
```typescript
export interface ToolResponse {
  content: {
    type: "text";
    text: string;
  }[];
  isError: boolean;
  _meta?: Record<string, unknown>;
}

export type ToolParams = {
  [key: string]: unknown;
};
```

### Validation Helpers

**Protected Methods:** [Source: lines 27-55]
- `validateDatabase()` - Ensures database param is string
- `validateCollection()` - Ensures collection param is string
- `validateObject()` - Type checks object parameters
- `handleError()` - Formats errors consistently

**Usage:**
```typescript
// In tool execute method
const db = this.validateDatabase(params.database);  // Throws if invalid
const obj = this.validateObject(params.options, 'options');  // Type-safe
```

### Error Response Format

**Consistent Structure:** [Source: `handleError()`, lines 57-67]
```typescript
{
  content: [{
    type: "text",
    text: error.message  // Or String(error)
  }],
  isError: true
}
```

**All tools return errors in same format** [Consistency: MCP protocol]

### Evolution

**Inherited from lance-mcp:** [Source: upstream]
- Basic BaseTool structure (2024)
- name, description, inputSchema abstract members
- execute() abstract method

**Enhanced in concept-rag:**
- Added validation helpers
- Improved error handling
- Type-safe generics `<T extends ToolParams>`

## Related Decisions

- [ADR-0003: MCP Protocol](adr0003-mcp-protocol.md) - Tool protocol requirements
- [ADR-0031: Eight Specialized Tools](adr0031-eight-specialized-tools-strategy.md) - 8 tools using pattern
- [ADR-0032: Tool Selection Guide](adr0032-tool-selection-guide.md) - Tool documentation

## References

### Related Decisions
- [ADR-0003: MCP Protocol](adr0003-mcp-protocol.md)

---

**Confidence Level:** MEDIUM (Inherited)  
**Attribution:**
- Inherited from upstream lance-mcp (adiom-data team)
- Evidence: Git clone commit 082c38e2
