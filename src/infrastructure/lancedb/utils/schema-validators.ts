/**
 * Validation utilities for LanceDB row data.
 * 
 * These validators ensure data retrieved from LanceDB matches expected schema.
 * They are READ-ONLY validators - they never modify the database.
 * 
 * **Purpose**:
 * - Catch schema mismatches early
 * - Provide actionable error messages
 * - Validate embedding dimensions
 * - Check required fields
 * 
 * **Safety**: All validators are non-destructive; they only read data.
 */

import { SchemaValidationError, InvalidEmbeddingsError } from '../../../domain/exceptions.js';

/**
 * Expected embedding dimension for all vectors in the system.
 */
export const EXPECTED_EMBEDDING_DIMENSION = 384;

/**
 * Validate that a row has valid embedding vector.
 * 
 * Checks:
 * - Vector field exists
 * - Vector is an array
 * - Vector has correct dimensionality (384)
 * - Vector contains valid numbers (no NaN/Infinity)
 * 
 * @param row - Database row to validate
 * @param vectorFieldName - Name of vector field ('vector' or 'embeddings')
 * @param entityName - Name of entity for error messages (e.g., 'chunk', 'concept')
 * @throws {SchemaValidationError} If vector field is missing or wrong type
 * @throws {InvalidEmbeddingsError} If vector has wrong dimension or invalid values
 * 
 * @example
 * ```typescript
 * validateEmbeddings(row, 'vector', 'chunk');
 * // If validation fails, throws descriptive error
 * ```
 */
export function validateEmbeddings(
  row: any,
  vectorFieldName: 'vector' | 'embeddings',
  entityName: string
): void {
  const vector = row[vectorFieldName];
  
  // Check field exists
  if (vector === null || vector === undefined) {
    throw new SchemaValidationError(
      vectorFieldName,
      'array',
      typeof vector,
      { entityName, rowId: row.id }
    );
  }
  
  // Check is array (or Arrow Vector object)
  const isArrowVector = typeof vector === 'object' && 'length' in vector && typeof vector.length === 'number';
  const isArray = Array.isArray(vector);
  
  if (!isArray && !isArrowVector) {
    throw new SchemaValidationError(
      vectorFieldName,
      'array or Vector',
      typeof vector,
      { entityName, rowId: row.id }
    );
  }
  
  // Check dimensionality
  if (vector.length !== EXPECTED_EMBEDDING_DIMENSION) {
    throw new InvalidEmbeddingsError(
      row.id || entityName,
      vector.length,
      { expectedDimension: EXPECTED_EMBEDDING_DIMENSION, rowId: row.id }
    );
  }
  
  // Check for invalid numbers (NaN, Infinity) - only for plain arrays
  if (isArray && vector.some(v => !Number.isFinite(v))) {
    throw new SchemaValidationError(
      vectorFieldName,
      'valid numbers',
      'contains NaN or Infinity',
      { entityName, rowId: row.id }
    );
  }
}

/**
 * Validate that required string fields are present and non-empty.
 * 
 * @param row - Database row to validate
 * @param requiredFields - Array of required field names
 * @param entityName - Name of entity for error messages
 * @throws {SchemaValidationError} If any required field is missing or empty
 * 
 * @example
 * ```typescript
 * validateRequiredFields(row, ['id', 'text', 'source'], 'chunk');
 * ```
 */
export function validateRequiredFields(
  row: any,
  requiredFields: string[],
  entityName: string
): void {
  for (const fieldName of requiredFields) {
    const value = row[fieldName];
    
    if (value === null || value === undefined) {
      throw new SchemaValidationError(
        fieldName,
        'string',
        typeof value,
        { entityName, rowId: row.id, message: 'Required field is missing' }
      );
    }
    
    if (typeof value === 'string' && value.trim().length === 0) {
      throw new SchemaValidationError(
        fieldName,
        'non-empty string',
        'empty string',
        { entityName, rowId: row.id, message: 'Required field is empty' }
      );
    }
  }
}

/**
 * Validate JSON field can be parsed.
 * 
 * **Note**: This is a lenient validator - it allows null/undefined
 * since JSON fields are often optional.
 * 
 * @param row - Database row
 * @param fieldName - Name of JSON field
 * @param entityName - Name of entity for error messages
 * @returns Parsed JSON value or undefined if field is null/undefined
 * @throws {SchemaValidationError} If JSON is malformed
 * 
 * @example
 * ```typescript
 * const concepts = validateJsonField(row, 'concepts', 'chunk');
 * // Returns parsed array or undefined
 * ```
 */
export function validateJsonField(
  row: any,
  fieldName: string,
  entityName: string
): any {
  const value = row[fieldName];
  
  // Allow null/undefined for optional fields
  if (value === null || value === undefined) {
    return undefined;
  }
  
  // Already parsed
  if (typeof value === 'object') {
    return value;
  }
  
  // Try to parse string
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new SchemaValidationError(
        fieldName,
        'valid JSON',
        'malformed JSON',
        {
          entityName,
          rowId: row.id,
          value: value.substring(0, 100),  // First 100 chars for debugging
          parseError: (error as Error).message
        }
      );
    }
  }
  
  // Unexpected type
  throw new SchemaValidationError(
    fieldName,
    'string or object',
    typeof value,
    { entityName, rowId: row.id }
  );
}

/**
 * Check if row has vector in either 'vector' or 'embeddings' field.
 * 
 * **Purpose**: Handle the naming inconsistency between LanceDB (uses 'vector')
 * and domain models (use 'embeddings').
 * 
 * @param row - Database row
 * @returns 'vector' if row.vector exists, 'embeddings' if row.embeddings exists, null otherwise
 * 
 * @example
 * ```typescript
 * const vectorField = detectVectorField(row);
 * if (vectorField) {
 *   validateEmbeddings(row, vectorField, 'chunk');
 *   embeddings = row[vectorField];
 * }
 * ```
 */
export function detectVectorField(row: any): 'vector' | 'embeddings' | null {
  if (row.vector !== null && row.vector !== undefined) {
    return 'vector';
  }
  if (row.embeddings !== null && row.embeddings !== undefined) {
    return 'embeddings';
  }
  return null;
}

/**
 * Validate chunk row has all required fields with correct types.
 * 
 * **Validation Rules**:
 * - Required: id, text, source, hash
 * - Vector: Must be 384-dimensional array
 * - JSON fields: concepts, concept_categories (optional but must be valid JSON if present)
 * 
 * @param row - Chunk row from LanceDB
 * @throws {SchemaValidationError} If validation fails
 * @throws {InvalidEmbeddingsError} If embeddings are invalid
 * 
 * @example
 * ```typescript
 * const row = await chunksTable.query().limit(1).toArray()[0];
 * validateChunkRow(row);  // Throws if invalid
 * const chunk = mapRowToChunk(row);  // Safe to map
 * ```
 */
export function validateChunkRow(row: any): void {
  // Validate required fields (id and hash are optional as they may be auto-generated)
  validateRequiredFields(row, ['text', 'source'], 'chunk');
  
  // Validate vector field
  const vectorField = detectVectorField(row);
  if (!vectorField) {
    throw new SchemaValidationError(
      'vector or embeddings',
      'array',
      'missing',
      { entityName: 'chunk', rowId: row.id, message: 'No vector field found' }
    );
  }
  validateEmbeddings(row, vectorField, 'chunk');
  
  // Validate JSON fields (optional but must be valid if present)
  if (row.concepts !== null && row.concepts !== undefined) {
    validateJsonField(row, 'concepts', 'chunk');
  }
  if (row.concept_ids !== null && row.concept_ids !== undefined) {
    validateJsonField(row, 'concept_ids', 'chunk');
  }
  if (row.concept_categories !== null && row.concept_categories !== undefined) {
    validateJsonField(row, 'concept_categories', 'chunk');
  }
}

/**
 * Validate concept row has all required fields with correct types.
 * 
 * **Validation Rules**:
 * - Required: concept, concept_type, category
 * - Vector: Must be 384-dimensional array
 * - JSON fields: sources, related_concepts, synonyms, etc. (optional)
 * 
 * @param row - Concept row from LanceDB
 * @throws {SchemaValidationError} If validation fails
 * @throws {InvalidEmbeddingsError} If embeddings are invalid
 */
export function validateConceptRow(row: any): void {
  // Validate required fields (concept_type is optional for backward compatibility)
  validateRequiredFields(row, ['concept', 'category'], 'concept');
  
  // Validate vector field
  const vectorField = detectVectorField(row);
  if (!vectorField) {
    throw new SchemaValidationError(
      'vector or embeddings',
      'array',
      'missing',
      {
        entityName: 'concept',
        conceptName: row.concept,
        message: 'No vector field found - concept cannot be used for vector search'
      }
    );
  }
  validateEmbeddings(row, vectorField, row.concept || 'concept');
  
  // Validate JSON fields (all optional for concepts)
  const jsonFields = ['sources', 'catalog_ids', 'related_concepts', 'synonyms', 'broader_terms', 'narrower_terms'];
  for (const field of jsonFields) {
    if (row[field] !== null && row[field] !== undefined) {
      validateJsonField(row, field, 'concept');
    }
  }
}

/**
 * Validate catalog row has all required fields.
 * 
 * Note: Catalog uses same structure as chunks but with rich concepts object.
 * 
 * @param row - Catalog row from LanceDB
 * @throws {SchemaValidationError} If validation fails
 */
export function validateCatalogRow(row: any): void {
  // Same validation as chunks
  validateChunkRow(row);
  
  // Note: Catalog's concepts field is a rich object, not simple array
  // We already validated it's valid JSON in validateChunkRow
}

