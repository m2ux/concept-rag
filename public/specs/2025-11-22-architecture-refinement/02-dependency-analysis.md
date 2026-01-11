# Architecture Dependency Analysis

## Dependency Analysis Tools Setup

### Tools Installed ✅
- **madge**: Visualize module dependency graphs
- **dependency-cruiser**: Enforce architectural rules

### Usage

#### Check for Circular Dependencies
```bash
npx madge --circular src/
```

#### Visualize Dependency Graph
```bash
npx madge --image deps.png src/
```

#### Validate Architecture Rules
```bash
npx dependency-cruiser --validate .dependency-cruiser.cjs src/
```

#### Generate Architecture Diagram
```bash
npx dependency-cruiser --output-type dot src/ | dot -T svg > architecture.svg
```

## Architectural Rules

### Layer Dependencies (Enforced)

```
┌─────────────────────────────────────────────┐
│                   Tools                     │
│              (MCP Handlers)                 │
└────────────────┬────────────────────────────┘
                 │
      ┌──────────▼──────────────┐
      │     Application         │
      │   (DI Container)        │
      └──────┬─────────┬────────┘
             │         │
  ┌──────────▼───┐   ┌▼────────────────────┐
  │  Infrastructure │  Domain (Core)        │
  │   (Adapters)    │  - Models             │
  │   - LanceDB     │  - Interfaces         │
  │   - Loaders     │  - Services           │
  │   - Caches      │  - Exceptions         │
  └─────────────────┘  └────────────────────┘
                           │
                           │ (Domain is self-contained)
                           │
```

### Rules:

1. **Domain Independence** (STRICT)
   - Domain MUST NOT depend on infrastructure, application, or tools
   - Domain defines interfaces; infrastructure implements them
   - Violation: ERROR

2. **Infrastructure Boundaries**
   - Infrastructure MUST NOT depend on tools
   - Infrastructure MAY depend on domain interfaces
   - Violation: ERROR

3. **No Circular Dependencies** (STRICT)
   - No circular dependencies allowed anywhere
   - Violation: ERROR

4. **Dependency Flow**
   - Dependencies flow inward: Tools → Application → Infrastructure → Domain
   - Domain is innermost (most stable)
   - Tools are outermost (most volatile)

## Current Status

### ✅ Circular Dependencies: NONE FOUND

### ✅ Layer Violations: NONE FOUND

### Architecture Quality: 9/10

**Strengths**:
- Clean layer separation
- Domain independence maintained
- Repository pattern properly applied
- Dependency injection in use

**Improvements Made**:
- ✅ Cache interfaces extracted
- ✅ Configuration centralized
- ✅ Dependency rules configured

## CI Integration

Add to `.github/workflows/ci.yml`:

```yaml
- name: Check Architecture Rules
  run: npx dependency-cruiser --validate .dependency-cruiser.cjs src/
  
- name: Check Circular Dependencies
  run: npx madge --circular src/
```

## Maintenance

**Monthly**:
- Review dependency graph for emerging patterns
- Update rules if new layers are added
- Check for outdated dependencies

**Per PR**:
- Validate architecture rules
- Check for circular dependencies
- Review new cross-layer dependencies

