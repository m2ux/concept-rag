# ADR 0054: Deprecate Debug Flag from Tool Input Schemas

**Status**: Proposed  
**Date**: 2025-12-27  
**Deciders**: Development Team  
**Related ADRs**: [adr0036](adr0036-configuration-centralization.md)  
**Issue**: [#57](https://github.com/m2ux/concept-rag/issues/57)

## Context

The `debug` flag is duplicated across 4 tool input schemas:
- `catalog_search`
- `broad_chunks_search`
- `chunks_search`
- `concept_search`

This creates several problems:

1. **Schema Noise**: LLM agents see the `debug` parameter in every tool's schema, adding cognitive overhead when parsing tool definitions
2. **Per-Call Decision**: Agents must decide whether to pass `debug` on each call
3. **Duplication**: The same parameter defined in 4 places
4. **Underutilized Configuration**: A centralized `LoggingConfig.debugSearch` already exists (via `DEBUG_SEARCH` env var) but is not used by tools

## Decision

Remove the `debug` parameter from all tool input schemas and use the existing `Configuration.getInstance().logging.debugSearch` setting instead.

### Changes

1. **Remove from params interfaces**:
   ```typescript
   // Before
   export interface ConceptualCatalogSearchParams extends ToolParams {
     text: string;
     debug?: boolean;
   }
   
   // After
   export interface ConceptualCatalogSearchParams extends ToolParams {
     text: string;
   }
   ```

2. **Remove from input schemas**:
   ```typescript
   // Before
   inputSchema = {
     properties: {
       text: { ... },
       debug: {
         type: "boolean",
         description: "Show debug information",
         default: false
       }
     }
   };
   
   // After
   inputSchema = {
     properties: {
       text: { ... }
     }
   };
   ```

3. **Use configuration in execute methods**:
   ```typescript
   import { Configuration } from '../../application/config/index.js';
   
   async execute(params: ConceptualCatalogSearchParams) {
     const debugSearch = Configuration.getInstance().logging.debugSearch;
     
     const result = await this.service.search({
       text: params.text,
       limit: 10,
       debug: debugSearch  // From config, not params
     });
   }
   ```

4. **Update tool descriptions** to mention config-based debug:
   ```typescript
   description = `Search document summaries...
   
   Debug output can be enabled via DEBUG_SEARCH=true environment variable.`;
   ```

## Consequences

### Positive

1. **Cleaner Schemas**: Tools have fewer parameters for LLMs to parse
2. **Single Source of Truth**: Debug setting controlled via configuration
3. **Consistent Behavior**: All tools use the same debug setting
4. **Simpler Agent Logic**: LLMs don't need to consider debug on each call

### Negative

1. **No Per-Call Override**: Cannot enable debug for a single call via tool parameters
   - Mitigation: Use `DEBUG_SEARCH=true` env var for debug sessions
   - This is acceptable since debug is primarily for development/troubleshooting

### Neutral

1. **Service Interface Unchanged**: Services still accept `debug` parameter; only the tool layer changes
2. **Environment Variable Required**: Debug requires setting env var, not just passing parameter

## Alternatives Considered

### 1. Keep Debug Parameter, Ignore It

**Approach**: Keep `debug` in schema but always use config

**Pros**: No breaking change to schema

**Cons**: Still clutters schemas; misleading parameter

**Decision**: Rejected - Defeats the purpose

### 2. Inject Configuration via Constructor

**Approach**: Pass `IConfiguration` to tool constructors

**Pros**: More testable; explicit dependency

**Cons**: Requires modifying tool instantiation in container

**Decision**: Rejected for this change - Over-engineering for a simple parameter removal. Can be done in future refactoring.

## Affected Files

- `src/tools/operations/conceptual_catalog_search.ts`
- `src/tools/operations/conceptual_broad_chunks_search.ts`
- `src/tools/operations/conceptual_chunks_search.ts`
- `src/tools/operations/concept_search.ts`

## Related Decisions

- [adr0036](adr0036-configuration-centralization.md) - Introduced `LoggingConfig.debugSearch`
- [adr0031](adr0031-eight-specialized-tools-strategy.md) - Tool schema design principles

## Notes

This is a non-breaking change from the perspective of tool consumers. Tools will continue to work the same way; they simply won't advertise the `debug` parameter. Debug output is now controlled solely via the `DEBUG_SEARCH` environment variable.

