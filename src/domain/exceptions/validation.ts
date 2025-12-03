import { ConceptRAGError } from './base.js';

/**
 * Base class for validation errors.
 * Thrown when input validation fails.
 */
export class ValidationError extends ConceptRAGError {
  constructor(
    message: string,
    field: string,
    value: unknown,
    cause?: Error
  ) {
    super(
      message,
      `VALIDATION_${field.toUpperCase()}_INVALID`,
      { field, value },
      cause
    );
  }
}

/**
 * Thrown when a required field is missing.
 */
export class RequiredFieldError extends ValidationError {
  constructor(field: string) {
    super(
      `Required field '${field}' is missing`,
      field,
      undefined
    );
  }
}

/**
 * Thrown when a field has an invalid format.
 */
export class InvalidFormatError extends ValidationError {
  constructor(
    field: string,
    value: unknown,
    expectedFormat: string
  ) {
    super(
      `Field '${field}' has invalid format. Expected: ${expectedFormat}`,
      field,
      value
    );
    this.context.expectedFormat = expectedFormat;
  }
}

/**
 * Thrown when a value is out of the acceptable range.
 */
export class ValueOutOfRangeError extends ValidationError {
  constructor(
    field: string,
    value: number,
    min: number,
    max: number
  ) {
    super(
      `Field '${field}' value ${value} is out of range [${min}, ${max}]`,
      field,
      value
    );
    this.context.min = min;
    this.context.max = max;
  }
}
