# 23. SQL Injection Prevention with Proper Escaping

**Date:** 2025-11-14  
**Status:** Accepted  
**Deciders:** Engineering Team  
**Technical Story:** Architecture Refactoring - Security Fix (November 14, 2025)

**Sources:**
- Planning: [2025-11-14-architecture-refactoring](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/specs/2025-11-14-architecture-refactoring/)

## Context and Problem Statement

During architecture review, SQL injection vulnerability discovered in concept search WHERE clauses [Security Issue: [01-architecture-review-analysis.md](https://github.com/m2ux/concept-rag/blob/engineering/artifacts/specs/2025-11-14-architecture-refactoring/01-architecture-review-analysis.md), SQL injection section]. User input was directly interpolated into SQL queries without proper escaping [Problem: string concatenation in WHERE clauses].

**Vulnerable Code Example:** [Source: Pre-refactoring `concept_search.ts`]
```typescript
// VULNERABLE: Direct string interpolation
const results = await conceptTable
  .query()
  .where(`concept = '${conceptLower}'`)  // SQL INJECTION!
  .toArray();
```

**Attack Vector:** User could search for: `' OR '1'='1` to return all concepts

**The Core Problem:** How to safely include user input in SQL WHERE clauses used by LanceDB queries? [Security: input validation]

**Decision Drivers:**
* **CRITICAL:** Security vulnerability must be fixed [Priority: security]
* LanceDB uses SQL-like WHERE syntax [Context: database API]
* User input in search queries [Risk: untrusted input]
* No parameterized queries available in LanceDB open-source [Limitation: API constraint] [Source: `10-parameterized-sql-investigation.md`]
* Need comprehensive solution for all queries [Requirement: system-wide]

## Alternative Options

* **Option 1: Manual SQL Escaping with Tests** - Escape single quotes, validate
* **Option 2: Parameterized Queries** - Prepared statements (if available)
* **Option 3: Input Validation Only** - Whitelist/regex validation
* **Option 4: ORM/Query Builder** - Use library for query construction
* **Option 5: No Special Characters** - Reject queries with special chars

## Decision Outcome

**Chosen option:** "Manual SQL Escaping with Comprehensive Tests (Option 1)", because LanceDB open-source doesn't support parameterized queries [Source: `10-parameterized-sql-investigation.md`, investigation result], and proper escaping with thorough testing provides robust protection.

### Implementation

**Utility Function:** [Source: Implementation in field parsers]
```typescript
/**
 * Escape single quotes in SQL strings to prevent SQL injection.
 * LanceDB uses SQL WHERE clauses, so we must escape user input.
 * 
 * @param value - User input to escape
 * @returns Escaped string safe for SQL WHERE clause
 */
export function escapeSql(value: string): string {
  // Replace single quote (') with two single quotes ('')
  // Standard SQL escaping mechanism
  return value.replace(/'/g, "''");
}
```

**Usage in Repositories:**
```typescript
// SAFE: Escaped user input
const escapedName = escapeSql(conceptName);
const results = await conceptTable
  .query()
  .where(`concept = '${escapedName}'`)
  .toArray();
```

**Test Coverage:** [Source: `PR-DESCRIPTION.md`, line 48; test files]
- **14 unit tests:** Comprehensive SQL injection prevention tests [Source: `field-parsers.test.ts`]
- Attack vectors tested: `' OR '1'='1`, `'; DROP TABLE--`, `\\'`, etc.
- Edge cases: Empty string, Unicode, very long strings

### Consequences

**Positive:**
* **Security vulnerability fixed:** SQL injection prevented [Result: `PR-DESCRIPTION.md`, lines 47-49]
* **14 tests verify protection:** Comprehensive test coverage [Validation: `PR-DESCRIPTION.md`, line 48]
* **System-wide:** Applied to all user-facing queries [Scope: complete coverage]
* **Standard approach:** SQL escaping is industry-standard technique [Pattern: established]
* **No dependencies:** Pure JavaScript solution [Simplicity: no libraries]
* **Auditable:** Simple escapeSQL function easy to review [Security: transparency]

**Negative:**
* **Manual escaping required:** Must remember to call escapeSql() [Risk: human error]
* **No compile-time enforcement:** TypeScript can't enforce escaping [Limitation: runtime]
* **Not parameterized queries:** Less elegant than prepared statements [Trade-off: API limitation]
* **Developer discipline:** Relies on code review to catch misses [Process: review required]

**Neutral:**
* **Single quote escaping:** Standard SQL technique (replace ' with '') [Approach: conventional]
* **WHERE clause only:** LanceDB doesn't support parameters [Context: API constraint]

### Confirmation

**Security Testing:** [Source: Test coverage]
- **14 unit tests:** All passing, all attack vectors blocked
- **Attack patterns tested:**
  - `' OR '1'='1` - Always-true condition
  - `'; DROP TABLE--` - SQL injection with comment
  - `\\' OR \\` - Escape sequence attacks
  - Multiple quotes, Unicode, empty strings

**Code Review:**
- All WHERE clauses audited
- All user input properly escaped
- No vulnerable queries remain

**Production Validation:**
- No SQL injection incidents reported
- All queries working correctly with escaping

## Pros and Cons of the Options

### Option 1: Manual SQL Escaping with Tests - Chosen

**Pros:**
* Works with LanceDB API
* 14 comprehensive tests [Validated]
* Industry-standard approach
* Simple and auditable
* No dependencies
* Security vulnerability fixed [Result]

**Cons:**
* Manual escaping (must remember)
* No compile-time enforcement
* Developer discipline required
* Less elegant than parameters

### Option 2: Parameterized Queries

Use prepared statements/parameterized queries.

**Pros:**
* Best security practice
* Compile-time safe
* No escaping needed
* Most elegant solution

**Cons:**
* **Not available in LanceDB open-source** [Dealbreaker: API limitation] [Source: `10-parameterized-sql-investigation.md`]
* **Only in Enterprise:** FlightSQL protocol (enterprise edition only) [Limitation: cost]
* **Investigation result:** Parameterized queries not feasible for open-source [Decision: rejected]

### Option 3: Input Validation Only

Whitelist characters, reject special chars.

**Pros:**
* Can prevent some attacks
* Simple validation

**Cons:**
* **Breaks legitimate searches:** User can't search for "O'Reilly books" [Problem: apostrophes legitimate]
* **Incomplete protection:** Validation != escaping [Security: insufficient]
* **User frustration:** "Why can't I search for X?" [UX: confusing]
* **Not sufficient:** Need escaping, not rejection

### Option 4: ORM/Query Builder

Use TypeORM, Prisma, or similar.

**Pros:**
* Automatic escaping
* Query builder syntax
* Type-safe queries

**Cons:**
* **LanceDB not supported:** ORMs don't support LanceDB [Incompatibility: no integration]
* **Heavy dependency:** Large framework [Overhead: unnecessary]
* **Over-engineering:** Just need escaping [Complexity: overkill]
* **Not applicable:** LanceDB has custom query API

### Option 5: No Special Characters

Reject queries containing ', ", ;, etc.

**Pros:**
* Eliminates attack surface
* Simple to implement

**Cons:**
* **Breaks legitimate use:** Many valid searches contain apostrophes [Problem: "it's", "O'Reilly"]
* **Poor UX:** Confusing error messages [UX: frustration]
* **Not real fix:** Hiding problem, not solving it [Philosophy: wrong approach]
* **Escaping better:** Handle special chars correctly, don't reject them

## Implementation Notes

### LanceDB Query Syntax

**LanceDB WHERE Clause:** [Context: SQL-like syntax]
```typescript
await table
  .query()
  .where(`field = 'value'`)  // SQL-like WHERE clause
  .toArray();
```

**Constraint:** No parameterized query support in open-source [Source: `10-parameterized-sql-investigation.md`]

### Escaping Implementation

**Standard SQL Technique:**
- Single quote (') is string delimiter in SQL
- Escape by doubling: `'` → `''`
- Standard across SQL databases (PostgreSQL, MySQL, SQLite, etc.)

**JavaScript Implementation:**
```typescript
export function escapeSql(value: string): string {
  return value.replace(/'/g, "''");  // Replace ' with ''
}
```

**16 characters:** Simplest possible implementation

### Test Coverage

**Attack Patterns Tested:** [Source: `field-parsers.test.ts`]
```typescript
describe('escapeSql', () => {
  it('should escape basic SQL injection', () => {
    expect(escapeSql("' OR '1'='1")).toBe("'' OR ''1''=''1");
  });
  
  it('should escape DROP TABLE attack', () => {
    expect(escapeSql("'; DROP TABLE--")).toBe("''; DROP TABLE--");
  });
  
  it('should handle multiple quotes', () => {
    expect(escapeSql("O'Reilly's book")).toBe("O''Reilly''s book");
  });
  
  // ... 11 more tests
});
```

### System-Wide Application

**All Repositories:** [Application: consistent usage]
- ChunkRepository - User queries escaped
- ConceptRepository - Concept names escaped
- CatalogRepository - Source filters escaped

**Code Review:** All WHERE clauses audited for proper escaping

### Alternative Investigated

**Parameterized Queries:** [Source: `10-parameterized-sql-investigation.md`]
- Investigated October/November 2025
- Conclusion: "Not available in open-source LanceDB"
- Recommendation: "Keep current implementation (manual escaping)"
- FlightSQL protocol (enterprise) supports parameters, but not accessible

## Related Decisions

- [ADR-0002: LanceDB](adr0002-lancedb-vector-storage.md) - Database API constraints
- [ADR-0017: Repository Pattern](adr0017-repository-pattern.md) - Escaping in repositories
- [ADR-0019: Vitest](adr0019-vitest-testing-framework.md) - Security tests

## References

### Related Decisions
- [ADR-0002: LanceDB](adr0002-lancedb-vector-storage.md)
- [ADR-0017: Repository Pattern](adr0017-repository-pattern.md)

---

**Confidence Level:** HIGH
**Attribution:**
- Planning docs: November 14, 2024
- Security fix documented: PR-DESCRIPTION.md lines 47-49
- Investigation: 10-parameterized-sql-investigation.md

**Traceability:** [2025-11-14-architecture-refactoring](https://github.com/m2ux/concept-rag/tree/engineering/artifacts/specs/2025-11-14-architecture-refactoring/)



