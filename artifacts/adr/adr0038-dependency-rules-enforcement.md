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
- Can integrate with CI/CD pipelines
- Supports TypeScript
- Zero runtime overhead (dev-only)
- Actively maintained

**Why madge**:
- Generates visual dependency graphs
- Fast circular dependency detection
- Simple CLI interface
- Good for documentation and debugging

### 2. Define Architecture Rules

Create `.dependency-cruiser.cjs` configuration with core architectural rules:

```javascript
module.exports = {
  forbidden: [
    {
      name: 'domain-independence',
      comment: 'Domain layer must not depend on infrastructure or application layers',
      severity: 'error',
      from: { path: '^src/domain' },
      to: {
        path: '^src/(infrastructure|application|tools)',
        pathNot: '^src/domain'
      }
    },
    {
      name: 'infrastructure-to-tools',
      comment: 'Infrastructure should not depend on tools (MCP layer)',
      severity: 'error',
      from: { path: '^src/infrastructure' },
      to: { path: '^src/tools' }
    },
    {
      name: 'no-circular-dependencies',
      comment: 'Circular dependencies are forbidden',
      severity: 'error',
      from: {},
      to: {},
      circular: true
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json'
    },
    reporterOptions: {
      dot: {
        collapsePattern: '^src/[^/]+',
        theme: {
          graph: { splines: 'ortho' },
          modules: [
            {
              criteria: { matchesFocus: true },
              attributes: { fillcolor: '#ccffcc', penwidth: 2 }
            },
            {
              criteria: { source: '^src/domain' },
              attributes: { fillcolor: '#ffcccc' }
            },
            {
              criteria: { source: '^src/infrastructure' },
              attributes: { fillcolor: '#ccccff' }
            },
            {
              criteria: { source: '^src/application' },
              attributes: { fillcolor: '#ffffcc' }
            },
            {
              criteria: { source: '^src/tools' },
              attributes: { fillcolor: '#ffccff' }
            }
          ]
        }
      }
    }
  }
};
```

**Key Rules Configured**:
1. **Domain Independence**: Domain layer cannot depend on infrastructure, application, or tools
2. **Infrastructure to Tools**: Infrastructure cannot depend on tools (MCP) layer
3. **No Circular Dependencies**: Strict prohibition on circular dependencies
4. **Visual Reporting**: Color-coded dependency graph generation

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
- `package.json` - Added dependency-cruiser and madge dev dependencies

### Tools Installed

**Dependencies** (dev):
- `dependency-cruiser@^17.3.1` - Rule enforcement
- `madge@^8.0.0` - Circular dependency detection

### Validation Usage

**Manual Validation**:
```bash
# Validate all architecture rules
npx dependency-cruiser --validate .dependency-cruiser.cjs src/

# Check for circular dependencies
npx madge --circular --extensions ts src/

# Generate visual dependency graph
npx madge --image deps.png --extensions ts src/
```

## Consequences

### Positive

1. **Automated Enforcement Available**
   - Architecture rules can be validated with simple command
   - No reliance on manual code review alone
   - Clear error messages explain violations

2. **Prevented Violations**
   - Developers can validate locally before committing
   - Circular dependencies caught immediately
   - Accidental imports from wrong layers detected

3. **Documentation**
   - Rules explicitly documented in configuration
   - Clear error messages explain violations
   - Visual graphs show actual dependencies

4. **Developer Experience**
   - Fast local validation (< 5 seconds)
   - Clear error messages with file paths
   - Can be integrated with IDE workflows

5. **Architecture Visibility**
   - Can generate dependency graphs for documentation
   - Track architecture evolution over time
   - Identify hotspots and coupling

6. **Refactoring Confidence**
   - Rules ensure refactorings don't violate architecture
   - Safe to move files between layers
   - Breaking changes caught immediately

7. **Onboarding**
   - New developers can learn architecture rules quickly
   - Automated feedback teaches correct patterns
   - Documentation always up-to-date

### Negative

1. **Manual Execution Required**
   - Developers must remember to run validation
   - Not yet integrated into CI pipeline
   - Mitigation: Can add to pre-commit hooks or CI later

2. **Configuration Maintenance**
   - Rules may need updates as architecture evolves
   - Mitigation: Clear documentation, infrequent changes

3. **False Positives**
   - May flag legitimate dependencies as violations
   - Mitigation: Rules tunable, can adjust as needed

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
**Lines of Configuration**: ~85 lines
**Rules Defined**: 3 core rules (domain independence, infrastructure-to-tools, no circular dependencies)
**Time Investment**: ~25 minutes

### Validation Results

**Initial Validation** (2025-11-22):
```bash
$ npx dependency-cruiser --validate .dependency-cruiser.cjs src/
✔ no dependency violations found

$ npx madge --circular --extensions ts src/
✔ no circular dependencies found
```

**Performance**:
- Validation time: ~4-5 seconds
- Circular check: ~2 seconds
- Total: ~6-7 seconds

### Rules Configured

**Core Architecture Rules** (3 rules):
1. Domain independence (cannot depend on infrastructure/application/tools)
2. Infrastructure to tools (prohibited)
3. No circular dependencies

**Features**:
- TypeScript pre-compilation dependency analysis
- Color-coded visual dependency graph generation
- Clear error messages with file paths

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

1. **NPM Scripts**: Add convenience scripts to package.json for easier execution
2. **CI Integration**: Add architecture validation to GitHub Actions CI pipeline
3. **Pre-commit Hooks**: Add optional pre-commit validation with husky
4. **Module Boundaries**: Add finer-grained module boundaries within layers
5. **Coupling Metrics**: Track coupling metrics over time
6. **Architecture Tests**: Add explicit architecture tests in test suite
7. **IDE Integration**: VSCode extension for real-time feedback
8. **Dashboard**: Visualize architecture evolution over time
9. **Additional Rules**: Consider rules for infrastructure-to-application, application-to-tools, orphans, deprecated modules

## Notes

This ADR documents the addition of automated architecture enforcement tooling to complement the layered architecture established in [adr0016](adr0016-layered-architecture-refactoring.md). The dependency-cruiser tool provides fast, reliable validation with clear error messages.

The configuration implements 3 core rules covering layer boundaries (Clean Architecture) and code quality (no circular dependencies). The tools are installed and configured but not yet integrated into CI or npm scripts, allowing for manual validation during development.

The implementation took only 25 minutes but provides substantial foundation for architecture integrity. The automated validation can be run locally before committing changes, and can be easily integrated into CI pipelines when desired.

---

**References**:
- Implementation: `.ai/planning/2025-11-22-architecture-refinement/02-dependency-analysis.md`
- Configuration: `.dependency-cruiser.cjs`
- Core Rules: 3 (domain independence, infrastructure-to-tools, no circular dependencies)
- Validation Time: ~5 seconds
- Breaking Changes: None

