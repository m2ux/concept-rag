/**
 * Validation Result
 * 
 * Represents the outcome of a validation operation.
 * Follows functional programming pattern for error handling.
 */
export class ValidationResult {
  private constructor(
    private readonly success: boolean,
    private readonly errorMessages: string[]
  ) {}
  
  /**
   * Create a successful validation result
   */
  static ok(): ValidationResult {
    return new ValidationResult(true, []);
  }
  
  /**
   * Create a failed validation result with one error
   */
  static error(message: string): ValidationResult {
    return new ValidationResult(false, [message]);
  }
  
  /**
   * Create a failed validation result with multiple errors
   */
  static errors(messages: string[]): ValidationResult {
    return new ValidationResult(false, messages);
  }
  
  /**
   * Check if validation succeeded
   */
  get isValid(): boolean {
    return this.success;
  }
  
  /**
   * Get error messages (empty if valid)
   */
  get errors(): readonly string[] {
    return this.errorMessages;
  }
  
  /**
   * Get first error message (for simple error handling)
   */
  get firstError(): string | undefined {
    return this.errorMessages[0];
  }
  
  /**
   * Combine this result with another
   * Both must be valid for the combination to be valid
   */
  and(other: ValidationResult): ValidationResult {
    if (this.success && other.success) {
      return ValidationResult.ok();
    }
    return ValidationResult.errors([...this.errorMessages, ...other.errorMessages]);
  }
  
  /**
   * Map the validation result (if valid)
   * @param fn Function to apply if valid
   */
  map<T>(fn: () => T): T | undefined {
    return this.success ? fn() : undefined;
  }
  
  /**
   * Execute a function if validation failed
   */
  onError(fn: (errors: string[]) => void): this {
    if (!this.success) {
      fn(this.errorMessages);
    }
    return this;
  }
  
  /**
   * Convert to JSON for serialization
   */
  toJSON() {
    return {
      valid: this.success,
      errors: this.errorMessages
    };
  }
}

/**
 * Validation Rule
 * 
 * Encapsulates a single validation check that can be composed.
 */
export interface ValidationRule<T> {
  /**
   * Validate a value
   */
  validate(value: T): ValidationResult;
  
  /**
   * Optional name/description for this rule
   */
  name?: string;
}

/**
 * Base validator class with common validation utilities
 */
export abstract class BaseValidator<T> {
  /**
   * Validate a value against multiple rules
   */
  protected validateRules(value: T, rules: ValidationRule<T>[]): ValidationResult {
    const errors: string[] = [];
    
    for (const rule of rules) {
      const result = rule.validate(value);
      if (!result.isValid) {
        errors.push(...result.errors);
      }
    }
    
    return errors.length === 0 ? ValidationResult.ok() : ValidationResult.errors(errors);
  }
  
  /**
   * Create a validation rule from a predicate function
   */
  protected createRule(
    name: string,
    predicate: (value: T) => boolean,
    errorMessage: string | ((value: T) => string)
  ): ValidationRule<T> {
    return {
      name,
      validate: (value: T) => {
        if (predicate(value)) {
          return ValidationResult.ok();
        }
        const message = typeof errorMessage === 'function' ? errorMessage(value) : errorMessage;
        return ValidationResult.error(message);
      }
    };
  }
}

/**
 * Common validation rules that can be reused
 */
export class CommonValidations {
  /**
   * Validate that a string is not empty
   */
  static notEmpty(fieldName: string): ValidationRule<string> {
    return {
      name: 'notEmpty',
      validate: (value: string) => {
        if (!value || value.trim().length === 0) {
          return ValidationResult.error(`${fieldName} is required`);
        }
        return ValidationResult.ok();
      }
    };
  }
  
  /**
   * Validate string length
   */
  // @ts-expect-error - Type narrowing limitation
  static length(fieldName: string, min?: number, max?: number): ValidationRule<string> {
    return {
      name: 'length',
      validate: (value: string) => {
        const length = value?.length || 0;
        
        if (min !== undefined && length < min) {
          return ValidationResult.error(`${fieldName} must be at least ${min} characters`);
        }
        
        if (max !== undefined && length > max) {
          return ValidationResult.error(`${fieldName} must not exceed ${max} characters`);
        }
        
        return ValidationResult.ok();
      }
    };
  }
  
  /**
   * Validate number range
   */
  static range(fieldName: string, min?: number, max?: number): ValidationRule<number> {
    return {
      name: 'range',
      validate: (value: number) => {
        if (min !== undefined && value < min) {
          return ValidationResult.error(`${fieldName} must be at least ${min}`);
        }
        
        if (max !== undefined && value > max) {
          return ValidationResult.error(`${fieldName} must not exceed ${max}`);
        }
        
        return ValidationResult.ok();
      }
    };
  }
  
  /**
   * Validate that a number is positive
   */
  static positive(fieldName: string): ValidationRule<number> {
    return {
      name: 'positive',
      validate: (value: number) => {
        if (value <= 0) {
          return ValidationResult.error(`${fieldName} must be positive`);
        }
        return ValidationResult.ok();
      }
    };
  }
  
  /**
   * Validate that a value is one of allowed values
   */
  static oneOf<T>(fieldName: string, allowedValues: T[]): ValidationRule<T> {
    return {
      name: 'oneOf',
      validate: (value: T) => {
        if (!allowedValues.includes(value)) {
          return ValidationResult.error(
            `${fieldName} must be one of: ${allowedValues.join(', ')}`
          );
        }
        return ValidationResult.ok();
      }
    };
  }
  
  /**
   * Validate against a regex pattern
   */
  static pattern(fieldName: string, pattern: RegExp, message?: string): ValidationRule<string> {
    return {
      name: 'pattern',
      validate: (value: string) => {
        if (!pattern.test(value)) {
          return ValidationResult.error(
            message || `${fieldName} format is invalid`
          );
        }
        return ValidationResult.ok();
      }
    };
  }
  
  /**
   * Validate that array is not empty
   */
  static notEmptyArray<T>(fieldName: string): ValidationRule<T[]> {
    return {
      name: 'notEmptyArray',
      validate: (value: T[]) => {
        if (!value || value.length === 0) {
          return ValidationResult.error(`${fieldName} must not be empty`);
        }
        return ValidationResult.ok();
      }
    };
  }
  
  /**
   * Custom validation with predicate
   */
  static custom<T>(
    _fieldName: string,
    predicate: (value: T) => boolean,
    errorMessage: string
  ): ValidationRule<T> {
    return {
      name: 'custom',
      validate: (value: T) => {
        if (!predicate(value)) {
          return ValidationResult.error(errorMessage);
        }
        return ValidationResult.ok();
      }
    };
  }
}

