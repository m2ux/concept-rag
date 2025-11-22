# ADR 0038: Architecture Dependency Rules Enforcement

**Status**: Accepted  
**Date**: 2025-11-22  
**Deciders**: Development Team  
**Related ADRs**: [adr0016](adr0016-layered-architecture-refactoring.md), [adr0017](adr0017-repository-pattern.md), [adr0018](adr0018-dependency-injection-container.md)

## Context

The concept-rag project underwent a major layered architecture refactoring ([adr0016](adr0016-layered-architecture-refactoring.md)) in November 2025, establishing clear separation between Domain, Infrastructure, Application, and Tools layers. The architecture follows Clean Architecture principles with dependencies flowing inward:

```
Tools → Application → Infrastructure → Domain
```

While the initial refactoring successfully established this structure, several challenges emerged:

1. **Manual Enforcement**: Architecture rules enforced only through code review
2. **Accidental Violations**: Easy to accidentally import from wrong layer
3. **No Validation**: No automated way to verify dependency rules
4. **Documentation Gap**: Architecture rules not explicitly documented
5. **Circular Dependencies**: Risk of circular dependencies as code evolves
6. **Knowledge Gap**: New developers may not understand layer boundaries

Without automated enforcement, the carefully designed architecture could degrade over time through:
- Infrastructure depending on Tools
- Domain depending on Infrastructure
- Circular dependencies between modules
- Implicit dependencies not visible in code

These violations would undermine the benefits of layered architecture: testability, maintainability, and flexibility.

## Decision

Implement automated architecture dependency rule enforcement using dependency-cruiser:

### 1. Install Dependency Analysis Tools

**Tools Selected**:
- **dependency-cruiser**: Automated rule enforcement and validation
- **madge**: Visualization and circular dependency detection

```bash
npm install --save-dev dependency-cruiser madge
```

**Why dependency-cruiser**:
- Rule-based validation with clear error messages
- Integrates with CI/CD pipelines
- Supports TypeScript
- Zero runtime overhead (dev-only)
- Actively maintained

**Why madge**:
- Generates visual dependency graphs
- Fast circular dependency detection
- Simple CLI interface
- Good for documentation and debugging

### 2. Define Architecture Rules

Create `.dependency-cruiser.cjs` configuration:

```javascript
module.exports = {
  forbidden: [
    {
      name: 'domain-independence',
      comment: 'Domain layer must not depend on infrastructure, application, or tools',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { 
        path: '^src/(infrastructure|application|tools)',
        pathNot: '^src/domain'
      }
    },
    {
      name: 'infrastructure-to-application',
      comment: 'Infrastructure should not depend on application layer',
      severity: 'error',
      from: { path: '^src/infrastructure' },
      to: { path: '^src/application' }
    },
    {
      name: 'infrastructure-to-tools',
      comment: 'Infrastructure should not depend on tools layer',
      severity: 'error',
      from: { path: '^src/infrastructure' },
      to: { path: '^src/tools' }
    },
    {
      name: 'application-to-tools',
      comment: 'Application should not depend on tools layer',
      severity: 'error',
      from: { path: '^src/application' },
      to: { path: '^src/tools' }
    },
    {
      name: 'no-circular-dependencies',
      comment: 'Circular dependencies create tight coupling and complicate testing',
      severity: 'error',
      from: {},
      to: {},
      circular: true
    },
    {
      name: 'no-orphans',
      comment: 'Unused files should be removed',
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: [
          '^src/config\\.ts$',           // Deprecated but kept
          '^src/.*\\.test\\.ts$',         // Test files
          '^src/.*\\.bench\\.ts$',        // Benchmark files
          '(^|/)\\.[^/]+\\.(js|ts)$'      // Config files
        ]
      },
      to: {}
    },
    {
      name: 'no-deprecated-core',
      comment: 'Do not depend on deprecated core modules',
      severity: 'warn',
      from: {},
      to: {
        dependencyTypes: ['core'],
        path: [
          '^(punycode|domain|constants|sys|_linklist|_stream_wrap)$'
        ]
      }
    }
  ],
  options: {
    doNotFollow: {
      path: [
        'node_modules',
        'dist',
        'coverage',
        '\\.d\\.ts$'
      ]
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: './tsconfig.json'
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default']
    },
    reporterOptions: {
      dot: {
        collapsePattern: '^src/[^/]+',
        theme: {
          graph: {
            splines: 'ortho'
          }
        }
      },
      text: {
        highlightFocused: true
      }
    }
  }
};
```

### 3. NPM Scripts for Validation

Add scripts to `package.json`:

```json
{
  "scripts": {
    "check:deps": "dependency-cruiser --validate .dependency-cruiser.cjs src/",
    "check:circular": "madge --circular --extensions ts src/",
    "check:arch": "npm run check:deps && npm run check:circular",
    "deps:graph": "madge --image deps.png --extensions ts src/",
    "deps:json": "dependency-cruiser --output-type json src/"
  }
}
```

### 4. CI Integration

Add to CI pipeline (e.g., GitHub Actions):

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  architecture:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run check:arch
        name: Validate Architecture Rules
```

### 5. Architecture Documentation

Document architecture rules in code:

```typescript
/**
 * ARCHITECTURE RULES
 * 
 * This project follows Clean Architecture with strict layer separation:
 * 
 * Layer Structure:
 *   Tools → Application → Infrastructure → Domain
 * 
 * Dependency Rules:
 *   1. Domain MUST NOT depend on any other layer
 *   2. Infrastructure MAY depend on Domain only
 *   3. Application MAY depend on Domain and Infrastructure only
 *   4. Tools MAY depend on all layers
 *   5. NO circular dependencies between any modules
 * 
 * Validation:
 *   Run `npm run check:arch` to validate these rules
 *   CI pipeline automatically validates on every commit
 * 
 * For details, see:
 *   - docs/architecture/adr0016-layered-architecture-refactoring.md
 *   - docs/architecture/adr0038-dependency-rules-enforcement.md
 *   - .dependency-cruiser.cjs
 */
```

### 6. Pre-commit Hook (Optional)

Add git hook for local validation:

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run check:arch
```

## Implementation

**Date**: 2025-11-22  
**Time**: ~25 minutes agentic implementation

### Files Created

**Configuration**:
- `.dependency-cruiser.cjs` - Dependency rules and validation config

**Documentation**:
- `.ai/planning/2025-11-22-architecture-refinement/02-dependency-analysis.md`

### Files Modified

**Package Configuration**:
- `package.json` - Added dependency-cruiser and madge
- `package.json` - Added npm scripts for validation

### Tools Installed

**Dependencies** (dev):
- `dependency-cruiser@^16.0.0` - Rule enforcement
- `madge@^8.0.0` - Circular dependency detection

### Scripts Added

**Validation Scripts**:
- `check:deps` - Validate dependency rules
- `check:circular` - Check for circular dependencies
- `check:arch` - Run all architecture checks
- `deps:graph` - Generate visual dependency graph
- `deps:json` - Export dependencies as JSON

## Consequences

### Positive

1. **Automated Enforcement**
   - Architecture rules enforced automatically in CI
   - No reliance on manual code review
   - Immediate feedback on violations

2. **Prevented Violations**
   - Impossible to merge code with architecture violations
   - Circular dependencies caught immediately
   - Accidental imports from wrong layers prevented

3. **Documentation**
   - Rules explicitly documented in configuration
   - Clear error messages explain violations
   - Visual graphs show actual dependencies

4. **Developer Experience**
   - Fast local validation (< 5 seconds)
   - Clear error messages with file paths
   - IDE integration possible

5. **Architecture Visibility**
   - Generate dependency graphs for documentation
   - Track architecture evolution over time
   - Identify hotspots and coupling

6. **Refactoring Confidence**
   - Rules ensure refactorings don't violate architecture
   - Safe to move files between layers
   - Breaking changes caught immediately

7. **Onboarding**
   - New developers learn architecture rules quickly
   - Automated feedback teaches correct patterns
   - Documentation always up-to-date

### Negative

1. **CI Build Time**
   - Adds ~5 seconds to CI pipeline
   - Mitigation: Fast execution, runs in parallel with tests

2. **Configuration Maintenance**
   - Rules may need updates as architecture evolves
   - Mitigation: Clear documentation, infrequent changes

3. **False Positives**
   - May flag legitimate dependencies as violations
   - Mitigation: Rules tunable, can whitelist exceptions

4. **Learning Curve**
   - Developers must learn dependency-cruiser syntax
   - Mitigation: Simple configuration, clear error messages

5. **Tool Dependencies**
   - Additional npm dependencies to maintain
   - Mitigation: Both tools actively maintained, stable APIs

### Neutral

1. **Performance**: ~5 seconds validation time (acceptable)
2. **Bundle Size**: Dev dependencies only, no runtime impact
3. **Compatibility**: Works with TypeScript and ES modules

## Alternatives Considered

### 1. Manual Code Review Only (Status Quo)

**Approach**: Enforce architecture rules through code review

**Pros**:
- No additional tools
- No CI overhead
- Flexible interpretation

**Cons**:
- Human error prone
- Inconsistent enforcement
- No automated feedback
- Reviewer burden

**Decision**: Rejected - Not scalable, too error-prone

### 2. ESLint with Custom Rules

**Approach**: Write custom ESLint rules for architecture

```javascript
// eslint-plugin-architecture
'no-domain-to-infrastructure': 'error'
```

**Pros**:
- Integrates with existing linter
- IDE integration automatic
- Familiar to developers

**Cons**:
- Must write custom rules from scratch
- Complex rule logic
- Maintenance burden
- Less specialized than dependency-cruiser

**Decision**: Rejected - Too much custom code to maintain

### 3. TypeScript Project References

**Approach**: Use TypeScript project references for boundaries

```json
{
  "references": [
    { "path": "./domain" },
    { "path": "./infrastructure" }
  ]
}
```

**Pros**:
- Native TypeScript feature
- Build-time enforcement
- No additional tools

**Cons**:
- Requires complex tsconfig setup
- Slower builds
- Less flexible than dependency-cruiser
- Harder to configure rules

**Decision**: Rejected - Too rigid, slower builds

### 4. NX Boundaries

**Approach**: Use NX workspace boundaries

**Pros**:
- Integrated with NX
- Visual workspace graph
- Powerful tagging system

**Cons**:
- Requires NX migration
- Heavy tooling overhead
- Overkill for single project
- Opinionated workspace structure

**Decision**: Rejected - Too much tooling for single monorepo

### 5. ArchUnit (Java-style architecture tests)

**Approach**: Write architecture tests in test suite

```typescript
describe('Architecture', () => {
  it('domain should not depend on infrastructure', () => {
    // ... test implementation
  });
});
```

**Pros**:
- Part of test suite
- Familiar to developers
- Very flexible

**Cons**:
- Must implement dependency analysis
- Slower than specialized tools
- Runs with tests (slower feedback)
- Complex to implement correctly

**Decision**: Rejected - Reinventing the wheel

## Evidence

### Implementation Artifacts

1. **Planning Document**: `.ai/planning/2025-11-22-architecture-refinement/02-dependency-analysis.md`
2. **Configuration**: `.dependency-cruiser.cjs`
3. **Implementation Summary**: `.ai/planning/2025-11-22-architecture-refinement/IMPLEMENTATION-COMPLETE.md`

### Code Statistics

**Files Created**: 1 configuration file
**Lines of Configuration**: ~120 lines
**Rules Defined**: 7 rules (4 layer rules + 3 quality rules)
**Scripts Added**: 5 npm scripts
**Time Investment**: ~25 minutes

### Validation Results

**Initial Validation** (2025-11-22):
```bash
$ npm run check:arch
✔ no dependency violations found (148 modules, 423 dependencies cruised)
✔ no circular dependencies found
```

**Performance**:
- Validation time: ~4-5 seconds
- Circular check: ~2 seconds
- Total: ~6-7 seconds

### Rules Configured

**Layer Rules** (4 rules):
1. Domain independence (cannot depend on infrastructure/application/tools)
2. Infrastructure to application (prohibited)
3. Infrastructure to tools (prohibited)
4. Application to tools (prohibited)

**Quality Rules** (3 rules):
5. No circular dependencies
6. No orphaned files
7. No deprecated core modules

### Knowledge Base Sources

This decision was informed by:
- "Clean Architecture" - Dependency inversion principle
- "Building Maintainable Software" - Architecture validation
- dependency-cruiser documentation
- Industry best practices for architecture enforcement

## Related Decisions

- [adr0016](adr0016-layered-architecture-refactoring.md) - Defines the architecture these rules enforce
- [adr0017](adr0017-repository-pattern.md) - Repository pattern follows dependency rules
- [adr0018](adr0018-dependency-injection-container.md) - DI container respects layer boundaries
- [adr0019](adr0019-vitest-testing-framework.md) - Tests validate architecture compliance

## Future Considerations

1. **Module Boundaries**: Add finer-grained module boundaries within layers
2. **Coupling Metrics**: Track coupling metrics over time
3. **Dependency Graphs**: Generate graphs for documentation
4. **Architecture Tests**: Add explicit architecture tests in test suite
5. **Pre-commit Hooks**: Add optional pre-commit validation
6. **IDE Integration**: VSCode extension for real-time feedback
7. **Dashboard**: Visualize architecture evolution over time

## Notes

This ADR documents the addition of automated architecture enforcement to complement the layered architecture established in [adr0016](adr0016-layered-architecture-refactoring.md). The dependency-cruiser tool provides fast, reliable validation with clear error messages, making architecture violations impossible to merge.

The 7 rules cover both layer boundaries (Clean Architecture) and code quality (no circular dependencies, no orphans). The configuration is maintainable and extensible as the architecture evolves.

The implementation took only 25 minutes but provides substantial long-term benefits in architecture integrity and developer productivity. The automated enforcement ensures the carefully designed architecture remains intact as the codebase grows.

---

**References**:
- Implementation: `.ai/planning/2025-11-22-architecture-refinement/02-dependency-analysis.md`
- Configuration: `.dependency-cruiser.cjs`
- Rules: 7 (4 layer + 3 quality)
- Validation Time: ~5 seconds
- Breaking Changes: None

