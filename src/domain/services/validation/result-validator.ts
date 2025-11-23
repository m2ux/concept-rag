/**
 * Result-based validation functions
 * 
 * Provides functional validation that returns Result types instead of throwing exceptions.
 * Use these when you want to compose validations or accumulate errors.
 */

import { Result, Ok, Err } from '../../functional/result.js';
import { validateAll } from '../../functional/railway.js';

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Create a validation error
 */
function validationError(field: string, message: string, value?: unknown): ValidationError {
  return { field, message, value };
}

/**
 * Validate that a field is present and not empty
 */
export function validateRequired(
  field: string,
  value: unknown
): Result<unknown, ValidationError> {
  if (value === null || value === undefined) {
    return Err(validationError(field, `${field} is required`));
  }
  
  if (typeof value === 'string' && value.trim().length === 0) {
    return Err(validationError(field, `${field} is required`));
  }
  
  return Ok(value);
}

/**
 * Validate string length
 */
export function validateStringLength(
  field: string,
  value: string,
  min?: number,
  max?: number
): Result<string, ValidationError> {
  const length = value.length;
  
  if (min !== undefined && length < min) {
    return Err(validationError(
      field,
      `${field} must be at least ${min} characters`,
      value
    ));
  }
  
  if (max !== undefined && length > max) {
    return Err(validationError(
      field,
      `${field} must not exceed ${max} characters`,
      value
    ));
  }
  
  return Ok(value);
}

/**
 * Validate number range
 */
export function validateNumberRange(
  field: string,
  value: number,
  min?: number,
  max?: number
): Result<number, ValidationError> {
  if (!Number.isFinite(value)) {
    return Err(validationError(field, `${field} must be a valid number`, value));
  }
  
  if (min !== undefined && value < min) {
    return Err(validationError(
      field,
      `${field} must be at least ${min}`,
      value
    ));
  }
  
  if (max !== undefined && value > max) {
    return Err(validationError(
      field,
      `${field} must not exceed ${max}`,
      value
    ));
  }
  
  return Ok(value);
}

/**
 * Validate integer
 */
export function validateInteger(
  field: string,
  value: number
): Result<number, ValidationError> {
  if (!Number.isInteger(value)) {
    return Err(validationError(
      field,
      `${field} must be an integer`,
      value
    ));
  }
  
  return Ok(value);
}

/**
 * Validate boolean
 */
export function validateBoolean(
  field: string,
  value: unknown
): Result<boolean, ValidationError> {
  if (typeof value !== 'boolean') {
    return Err(validationError(
      field,
      `${field} must be a boolean`,
      value
    ));
  }
  
  return Ok(value);
}

/**
 * Validate value is one of allowed values
 */
export function validateOneOf<T>(
  field: string,
  value: T,
  allowedValues: T[],
  description?: string
): Result<T, ValidationError> {
  if (!allowedValues.includes(value)) {
    const desc = description || allowedValues.join(', ');
    return Err(validationError(
      field,
      `${field} must be one of: ${desc}`,
      value
    ));
  }
  
  return Ok(value);
}

/**
 * Validate email format (basic)
 */
export function validateEmail(
  field: string,
  value: string
): Result<string, ValidationError> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(value)) {
    return Err(validationError(
      field,
      `${field} must be a valid email address`,
      value
    ));
  }
  
  return Ok(value);
}

/**
 * Validate URL format (basic)
 */
export function validateUrl(
  field: string,
  value: string
): Result<string, ValidationError> {
  try {
    new URL(value);
    return Ok(value);
  } catch {
    return Err(validationError(
      field,
      `${field} must be a valid URL`,
      value
    ));
  }
}

/**
 * Validate search query parameters
 */
export interface SearchQueryParams {
  text?: string;
  limit?: number;
  source?: string;
}

export function validateSearchQuery(
  params: SearchQueryParams
): Result<Required<Pick<SearchQueryParams, 'text' | 'limit'>> & Pick<SearchQueryParams, 'source'>, ValidationError[]> {
  // Use railway pattern to accumulate all validation errors
  const validators = [
    (): Result<SearchQueryParams, string> => {
      const textResult = validateRequired('text', params.text);
      if (!textResult.ok) return Err(textResult.error.message);
      
      const lengthResult = validateStringLength('text', params.text as string, 1, 10000);
      if (!lengthResult.ok) return Err(lengthResult.error.message);
      
      return Ok(params);
    },
    (): Result<SearchQueryParams, string> => {
      if (params.limit === undefined) return Ok(params);
      
      const intResult = validateInteger('limit', params.limit);
      if (!intResult.ok) return Err(intResult.error.message);
      
      const rangeResult = validateNumberRange('limit', params.limit, 1, 100);
      if (!rangeResult.ok) return Err(rangeResult.error.message);
      
      return Ok(params);
    }
  ];
  
  const result = validateAll(params, validators);
  
  if (!result.ok) {
    return Err(result.error.map(msg => ({ field: 'params', message: msg })));
  }
  
  return Ok({
    text: params.text!,
    limit: params.limit ?? 10,
    source: params.source
  });
}

/**
 * Validate catalog search parameters
 */
export interface CatalogSearchParams {
  text?: string;
  debug?: boolean;
}

export function validateCatalogSearch(
  params: CatalogSearchParams
): Result<Required<Pick<CatalogSearchParams, 'text'>> & Pick<CatalogSearchParams, 'debug'>, ValidationError[]> {
  const errors: ValidationError[] = [];
  
  // Validate text
  const textResult = validateRequired('text', params.text);
  if (!textResult.ok) {
    errors.push(textResult.error);
  } else {
    const lengthResult = validateStringLength('text', params.text as string, 1, 1000);
    if (!lengthResult.ok) {
      errors.push(lengthResult.error);
    }
  }
  
  // Validate debug if provided
  if (params.debug !== undefined) {
    const debugResult = validateBoolean('debug', params.debug);
    if (!debugResult.ok) {
      errors.push(debugResult.error);
    }
  }
  
  if (errors.length > 0) {
    return Err(errors);
  }
  
  return Ok({
    text: params.text!,
    debug: params.debug
  });
}

/**
 * Validate concept search parameters
 */
export interface ConceptSearchParams {
  concept?: string;
  limit?: number;
  source_filter?: string;
}

export function validateConceptSearch(
  params: ConceptSearchParams
): Result<Required<Pick<ConceptSearchParams, 'concept'>> & Partial<Pick<ConceptSearchParams, 'limit' | 'source_filter'>>, ValidationError[]> {
  const errors: ValidationError[] = [];
  
  // Validate concept
  const conceptResult = validateRequired('concept', params.concept);
  if (!conceptResult.ok) {
    errors.push(conceptResult.error);
  } else {
    const lengthResult = validateStringLength('concept', params.concept as string, 1, 1000);
    if (!lengthResult.ok) {
      errors.push(lengthResult.error);
    }
  }
  
  // Validate limit if provided
  if (params.limit !== undefined) {
    const intResult = validateInteger('limit', params.limit);
    if (!intResult.ok) {
      errors.push(intResult.error);
    } else {
      const rangeResult = validateNumberRange('limit', params.limit, 1, 100);
      if (!rangeResult.ok) {
        errors.push(rangeResult.error);
      }
    }
  }
  
  if (errors.length > 0) {
    return Err(errors);
  }
  
  return Ok({
    concept: params.concept!,
    limit: params.limit,
    source_filter: params.source_filter
  });
}

