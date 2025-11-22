# ADR 0037: Functional Validation Layer Pattern

**Status**: Accepted  
**Date**: 2025-11-22  
**Deciders**: Development Team  
**Related ADRs**: [adr0034](adr0034-comprehensive-error-handling.md), [adr0016](adr0016-layered-architecture-refactoring.md)

## Context

The concept-rag project implemented comprehensive error handling ([adr0034](adr0034-comprehensive-error-handling.md)) with an `InputValidator` service that throws exceptions for validation failures. While this provides robust input validation, several additional needs emerged:

1. **Multiple Validation Errors**: Need to accumulate all validation errors, not just the first failure
2. **Composable Validations**: Need to combine validation rules without complex conditional logic
3. **Non-Throwing Validation**: Some use cases prefer result types over exceptions
4. **Reusable Rules**: Common validation patterns (required, range, format) repeated across validators
5. **Type Safety**: Validation results need strong typing for success/failure cases
6. **Testing Complexity**: Exception-based validation harder to test than pure functions

The existing `InputValidator` works well for fail-fast validation at system boundaries (MCP tools), but a complementary functional validation layer would provide flexibility for different validation scenarios:

- **Accumulating errors** for form validation
- **Conditional validation** based on other field values
- **Composing complex rules** from simple ones
- **Testing validation logic** without exception handling

## Decision

Implement a functional validation layer alongside the existing exception-based `InputValidator`:

### 1. ValidationResult Type

Define a discriminated union for validation results:

```typescript
/**
 * Result of a validation operation.
 * Either successful (with no errors) or failed (with error messages).
 */
export type ValidationResult = 
  | { valid: true; errors: [] }
  | { valid: false; errors: string[] };

/**
 * Create a successful validation result.
 */
export function success(): ValidationResult {
  return { valid: true, errors: [] };
}

/**
 * Create a failed validation result with error messages.
 */
export function failure(...errors: string[]): ValidationResult {
  return { valid: false, errors };
}
```

### 2. ValidationRule Interface

Define a composable validation rule:

```typescript
/**
 * A validation rule that checks a value and returns a result.
 * Rules are composable and can be combined using combinators.
 */
export interface ValidationRule<T> {
  /**
   * Validate the given value.
   * @param value - The value to validate
   * @returns ValidationResult indicating success or failure with errors
   */
  validate(value: T): ValidationResult;
}
```

### 3. Common Validation Rules

Create a library of reusable validation rules:

```typescript
export class CommonValidations {
  /**
   * Validates that a value is not null or undefined.
   */
  static required<T>(fieldName: string): ValidationRule<T | null | undefined> {
    return {
      validate(value: T | null | undefined): ValidationResult {
        if (value === null || value === undefined) {
          return failure(`${fieldName} is required`);
        }
        return success();
      }
    };
  }
  
  /**
   * Validates that a string is not empty.
   */
  static nonEmpty(fieldName: string): ValidationRule<string> {
    return {
      validate(value: string): ValidationResult {
        if (!value || value.trim().length === 0) {
          return failure(`${fieldName} cannot be empty`);
        }
        return success();
      }
    };
  }
  
  /**
   * Validates that a number is within a range.
   */
  static inRange(
    fieldName: string,
    min: number,
    max: number
  ): ValidationRule<number> {
    return {
      validate(value: number): ValidationResult {
        if (value < min || value > max) {
          return failure(
            `${fieldName} must be between ${min} and ${max}, got ${value}`
          );
        }
        return success();
      }
    };
  }
  
  /**
   * Validates that a string matches a regex pattern.
   */
  static matchesPattern(
    fieldName: string,
    pattern: RegExp,
    description: string
  ): ValidationRule<string> {
    return {
      validate(value: string): ValidationResult {
        if (!pattern.test(value)) {
          return failure(
            `${fieldName} must match ${description}, got '${value}'`
          );
        }
        return success();
      }
    };
  }
  
  /**
   * Validates that a string length is within bounds.
   */
  static lengthBetween(
    fieldName: string,
    min: number,
    max: number
  ): ValidationRule<string> {
    return {
      validate(value: string): ValidationResult {
        const len = value.length;
        if (len < min || len > max) {
          return failure(
            `${fieldName} length must be between ${min} and ${max}, got ${len}`
          );
        }
        return success();
      }
    };
  }
  
  /**
   * Validates that a value is one of allowed options.
   */
  static oneOf<T>(
    fieldName: string,
    options: T[]
  ): ValidationRule<T> {
    return {
      validate(value: T): ValidationResult {
        if (!options.includes(value)) {
          return failure(
            `${fieldName} must be one of: ${options.join(', ')}, got ${value}`
          );
        }
        return success();
      }
    };
  }
  
  /**
   * Validates an array has minimum length.
   */
  static minLength<T>(
    fieldName: string,
    min: number
  ): ValidationRule<T[]> {
    return {
      validate(value: T[]): ValidationResult {
        if (value.length < min) {
          return failure(
            `${fieldName} must have at least ${min} items, got ${value.length}`
          );
        }
        return success();
      }
    };
  }
  
  /**
   * Validates that a value satisfies a custom predicate.
   */
  static satisfies<T>(
    fieldName: string,
    predicate: (value: T) => boolean,
    errorMessage: string
  ): ValidationRule<T> {
    return {
      validate(value: T): ValidationResult {
        if (!predicate(value)) {
          return failure(`${fieldName} ${errorMessage}`);
        }
        return success();
      }
    };
  }
}
```

### 4. Validation Combinators

Implement combinators for composing validation rules:

```typescript
/**
 * Combine multiple rules with AND logic.
 * All rules must pass for validation to succeed.
 * Accumulates all error messages.
 */
export function all<T>(
  ...rules: ValidationRule<T>[]
): ValidationRule<T> {
  return {
    validate(value: T): ValidationResult {
      const errors: string[] = [];
      
      for (const rule of rules) {
        const result = rule.validate(value);
        if (!result.valid) {
          errors.push(...result.errors);
        }
      }
      
      return errors.length > 0 ? failure(...errors) : success();
    }
  };
}

/**
 * Combine multiple rules with OR logic.
 * At least one rule must pass for validation to succeed.
 */
export function any<T>(
  ...rules: ValidationRule<T>[]
): ValidationRule<T> {
  return {
    validate(value: T): ValidationResult {
      for (const rule of rules) {
        const result = rule.validate(value);
        if (result.valid) {
          return success();
        }
      }
      
      return failure('No validation rules passed');
    }
  };
}

/**
 * Negate a validation rule.
 */
export function not<T>(
  rule: ValidationRule<T>,
  errorMessage: string
): ValidationRule<T> {
  return {
    validate(value: T): ValidationResult {
      const result = rule.validate(value);
      if (result.valid) {
        return failure(errorMessage);
      }
      return success();
    }
  };
}

/**
 * Conditional validation - only validate if condition is true.
 */
export function when<T>(
  condition: (value: T) => boolean,
  rule: ValidationRule<T>
): ValidationRule<T> {
  return {
    validate(value: T): ValidationResult {
      if (condition(value)) {
        return rule.validate(value);
      }
      return success();
    }
  };
}
```

### 5. Usage Examples

**Simple Validation**:
```typescript
const nameValidator = all(
  CommonValidations.required('name'),
  CommonValidations.nonEmpty('name'),
  CommonValidations.lengthBetween('name', 1, 100)
);

const result = nameValidator.validate(userData.name);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

**Complex Composition**:
```typescript
const searchParamsValidator = all(
  CommonValidations.required('text'),
  CommonValidations.nonEmpty('text'),
  CommonValidations.lengthBetween('text', 1, 10000),
  when(
    (params) => params.limit !== undefined,
    CommonValidations.inRange('limit', 1, 100)
  )
);

const result = searchParamsValidator.validate(params);
// Returns all validation errors at once
```

**Object Validation**:
```typescript
function validateSearchQuery(params: SearchQueryParams): ValidationResult {
  const textResult = all(
    CommonValidations.required('text'),
    CommonValidations.nonEmpty('text'),
    CommonValidations.lengthBetween('text', 1, 10000)
  ).validate(params.text);
  
  const limitResult = params.limit
    ? CommonValidations.inRange('limit', 1, 100).validate(params.limit)
    : success();
  
  // Combine results
  const allErrors = [
    ...textResult.errors,
    ...limitResult.errors
  ];
  
  return allErrors.length > 0 ? failure(...allErrors) : success();
}
```

### 6. Integration with Exception-Based Validation

The functional validation layer complements the existing `InputValidator`:

```typescript
export class InputValidator {
  // Existing exception-based methods (unchanged)
  validateSearchQuery(params: SearchQueryParams): void {
    if (!params.text || params.text.trim().length === 0) {
      throw new RequiredFieldError('text');
    }
    // ... more validations
  }
  
  // New: Convert functional validation to exceptions
  validateSearchQueryFunctional(params: SearchQueryParams): void {
    const result = searchParamsValidator.validate(params);
    if (!result.valid) {
      throw new ValidationError(
        result.errors.join('; '),
        'searchQuery',
        params
      );
    }
  }
}
```

## Implementation

**Date**: 2025-11-22  
**Time**: ~20 minutes agentic implementation

### Files Created

**Domain Layer** (`src/domain/validation/`):
- `validation.ts` - ValidationResult type, ValidationRule interface, combinators
- `common-validations.ts` - CommonValidations library (8 reusable rules)
- `index.ts` - Public exports

### Components Implemented

**Core Types**:
- `ValidationResult` - Discriminated union for success/failure
- `ValidationRule<T>` - Generic validation rule interface
- `success()` - Helper to create successful result
- `failure()` - Helper to create failed result

**Common Validations** (8 rules):
1. `required<T>` - Value not null/undefined
2. `nonEmpty` - String not empty
3. `inRange` - Number within bounds
4. `matchesPattern` - String matches regex
5. `lengthBetween` - String length in range
6. `oneOf` - Value in allowed set
7. `minLength` - Array has minimum items
8. `satisfies` - Custom predicate

**Combinators** (4 functions):
1. `all()` - AND logic, accumulates errors
2. `any()` - OR logic, succeeds if any passes
3. `not()` - Negation
4. `when()` - Conditional validation

### Code Statistics

**Lines of Code**: ~300 lines
- `validation.ts`: ~150 lines
- `common-validations.ts`: ~140 lines
- `index.ts`: ~10 lines

**Time Investment**: ~20 minutes

## Consequences

### Positive

1. **Composability**
   - Validation rules combine naturally
   - Complex validations from simple building blocks
   - Reusable validation logic

2. **Error Accumulation**
   - Collect all validation errors at once
   - Better user experience (fix all issues together)
   - Useful for form validation

3. **Type Safety**
   - ValidationResult is type-safe discriminated union
   - Generic ValidationRule<T> preserves types
   - Compiler enforces exhaustive checking

4. **Testability**
   - Pure functions easy to test
   - No exception handling in tests
   - Clear input/output contracts

5. **Flexibility**
   - Choose exception-based or functional validation
   - Convert between styles as needed
   - Gradual adoption possible

6. **Reusability**
   - Common validations used across project
   - DRY principle applied
   - Consistent validation patterns

7. **No Breaking Changes**
   - Existing InputValidator unchanged
   - Additive enhancement
   - Zero migration required

### Negative

1. **Two Validation Approaches**
   - Need to choose between functional and exception-based
   - Potential confusion for developers
   - Mitigation: Clear guidelines on when to use each

2. **Learning Curve**
   - Developers must learn functional patterns
   - Combinators may be unfamiliar
   - Mitigation: Good documentation and examples

3. **Code Duplication**
   - Some validation logic duplicated between approaches
   - Mitigation: Use functional validation in InputValidator

### Neutral

1. **Performance**: Functional validation slightly faster (no exceptions) but negligible difference
2. **Bundle Size**: Minimal increase (~300 lines)
3. **Dependencies**: No new external dependencies

## Alternatives Considered

### 1. Replace Exception-Based with Functional Only

**Approach**: Remove InputValidator, use only functional validation

**Pros**:
- Single validation approach
- No exceptions for control flow
- More functional style

**Cons**:
- Breaking change to all tools
- Exception-based is idiomatic for fail-fast
- Requires massive refactoring

**Decision**: Rejected - Breaking change not justified

### 2. Validation Library (Zod, Yup, joi)

**Approach**: Use third-party validation library

**Pros**:
- Battle-tested solutions
- Rich feature sets
- Schema definitions
- Runtime type validation

**Cons**:
- External dependency
- Learning curve
- Bundle size increase
- May be overkill for needs

**Decision**: Rejected - Simple needs don't justify dependency

### 3. Decorator-Based Validation (class-validator)

**Approach**: Use decorators for validation

```typescript
class SearchParams {
  @IsNotEmpty()
  @Length(1, 10000)
  text: string;
  
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;
}
```

**Pros**:
- Declarative validation
- Integrated with class definitions
- Popular pattern

**Cons**:
- Requires decorators (experimental)
- Tight coupling to classes
- External dependency
- Doesn't work with plain objects

**Decision**: Rejected - Decorators not stable, classes not always used

### 4. Validation Context Pattern

**Approach**: Pass validation context for complex scenarios

```typescript
interface ValidationContext {
  allowEmpty?: boolean;
  customRules?: Rule[];
}

validate(value: T, context: ValidationContext): ValidationResult
```

**Pros**:
- Very flexible
- Can customize per validation
- Supports complex scenarios

**Cons**:
- More complex API
- Harder to understand
- Context management overhead

**Decision**: Rejected - Over-engineered for current needs

### 5. Async Validation

**Approach**: Support async validation rules

```typescript
interface AsyncValidationRule<T> {
  validate(value: T): Promise<ValidationResult>;
}
```

**Pros**:
- Can validate against database
- Can call external APIs
- More powerful

**Cons**:
- More complex implementation
- All validation becomes async
- Not needed for current use cases

**Decision**: Deferred - Can add if needed in future

## Evidence

### Implementation Artifacts

1. **Planning Document**: `.ai/planning/2025-11-22-architecture-refinement/03-validation-layer.md`
2. **Implementation**: `src/domain/validation/validation.ts`
3. **Common Validations**: `src/domain/validation/common-validations.ts`

### Code Statistics

**Files Created**: 3 files
**Lines of Code**: ~300 lines
**Validation Rules**: 8 reusable rules
**Combinators**: 4 composition functions
**Time Investment**: ~20 minutes

### Test Coverage

**Potential Tests** (not yet implemented):
- Unit tests for each common validation (8 tests)
- Combinator tests (all, any, not, when) (12 tests)
- Integration tests with InputValidator (5 tests)
- Property-based tests for commutativity (5 tests)

**Estimated Coverage**: 80%+ when tests added

### Knowledge Base Sources

This decision was informed by:
- "Functional Programming" - Pure functions, composability
- "Domain-Driven Design" - Validation in domain layer
- "Railway Oriented Programming" - Result types for validation
- TypeScript patterns for discriminated unions

## Related Decisions

- [adr0034](adr0034-comprehensive-error-handling.md) - Exception-based validation integrated
- [adr0016](adr0016-layered-architecture-refactoring.md) - Validation in domain layer
- [adr0020](adr0020-typescript-strict-mode.md) - Type safety enables strong validation types

## Future Considerations

1. **Async Validation**: Add async validation rules if needed
2. **Schema Validation**: Add JSON Schema validation for complex objects
3. **Custom Error Types**: Rich error types beyond string messages
4. **Validation Context**: Add context for conditional validation
5. **Localization**: i18n support for validation messages
6. **Validation Middleware**: Express/Fastify middleware for HTTP validation
7. **Form Validation**: React integration for form validation

## Notes

This ADR documents the addition of a functional validation layer that complements the existing exception-based validation. The functional approach provides composability, error accumulation, and type safety, while the exception-based approach remains ideal for fail-fast validation at system boundaries.

The two approaches coexist harmoniously, each suited to different use cases:
- **Exception-based** (`InputValidator`): Fail-fast at system boundaries (MCP tools)
- **Functional** (`ValidationRule`): Accumulate errors, compose rules, test easily

The implementation took only 20 minutes but provides a powerful, extensible validation framework that can evolve with project needs.

---

**References**:
- Implementation: `.ai/planning/2025-11-22-architecture-refinement/03-validation-layer.md`
- Validation Module: `src/domain/validation/`
- Time Investment: ~20 minutes
- Breaking Changes: None (additive)

