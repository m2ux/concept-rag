/**
 * Validation Module
 * 
 * Centralized validation logic for Concept-RAG.
 * Provides reusable validation rules and result types.
 */

export {
  ValidationResult,
  ValidationRule,
  BaseValidator,
  CommonValidations
} from './validation.js';

// Re-export existing InputValidator for backward compatibility
export { InputValidator } from '../services/validation/InputValidator.js';

