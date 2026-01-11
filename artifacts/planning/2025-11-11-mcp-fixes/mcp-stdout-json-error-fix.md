# MCP Tool Call JSON Parsing Error - Diagnosis and Fix

**Date:** November 11, 2025  
**Issue:** `Unexpected token '�', "📚 No Word"... is not valid JSON`

## Problem Diagnosis

### Root Cause
The MCP (Model Context Protocol) server communicates via **stdio** (stdin/stdout). When `console.log()` statements are used in code that executes during tool calls, they write to **stdout**, which is the same channel used for MCP's JSON protocol messages. This causes the JSON parser to fail because it receives console output mixed with protocol messages.

### Error Pattern
```
2025-11-11 17:07:41.031 [info] Handling CallTool action for tool 'broad_chunks_search'
2025-11-11 17:07:41.031 [info] Calling tool 'broad_chunks_search' with toolCallId: ...
2025-11-11 17:07:41.033 [error] Client error for command Unexpected token '�', "📚 No Word"... is not valid JSON
```

The error message "📚 No Word" was being cut off from "📚 No WordNet cache found, starting fresh" - a console.log statement with an emoji character.

### Why This Happens
- MCP server uses `StdioServerTransport` for communication
- `console.log()` writes to **stdout** (same as MCP protocol)
- `console.error()` writes to **stderr** (separate channel, safe for logging)
- When WordNetService initialized during a tool call, its console.log statements leaked into the protocol stream

## Solution

Changed all `console.log()` statements to `console.error()` in files that execute during MCP tool calls:

### Files Fixed

1. **`src/wordnet/wordnet_service.ts`**
   - Lines 26, 28: Cache loading messages
   - Line 38: Cache saving message

2. **`src/tools/operations/concept_search.ts`**
   - Line 75: Concept search debug message

3. **`src/tools/operations/document_concepts_extract.ts`**
   - Line 59: Document search debug message

4. **`src/lancedb/conceptual_search_client.ts`**
   - Lines 34-38: Query expansion debug output
   - Lines 224-237: Score debugging output

### Why This Works
- `console.error()` writes to **stderr**, keeping it separate from the MCP protocol channel (stdout)
- This matches the pattern used in the server files (`conceptual_index.ts`, `simple_index.ts`)
- Logging remains visible for debugging, but doesn't interfere with protocol communication

## Best Practices

### For MCP Servers
✅ **DO:** Use `console.error()` for informational/debug logging  
❌ **DON'T:** Use `console.log()` in any code that runs during tool execution  

### Reference Implementation
See `src/conceptual_index.ts` lines 16-17:
```typescript
console.error("🧠 Starting LanceDB MCP Server with Conceptual Search...");
console.error(`📂 Database: ${databaseUrl}`);
```

## Verification

After fix:
1. Rebuilt TypeScript: `npm run build`
2. Changes compiled to `dist/` directory
3. MCP server now properly separates logging from protocol communication

## Related Files

### Server Entry Points
- `src/conceptual_index.ts` - Main MCP server with conceptual search
- `src/simple_index.ts` - Simple MCP server

### Tool Operations (Runtime)
- All files in `src/tools/operations/`
- `src/lancedb/conceptual_search_client.ts`
- `src/wordnet/wordnet_service.ts`

### Indexing/Setup (Non-runtime)
Files like `src/concepts/concept_extractor.ts`, `src/concepts/concept_index.ts`, etc. still use `console.log()` since they run during setup/indexing, not during MCP tool calls. These could be changed for consistency but aren't causing the reported issue.

