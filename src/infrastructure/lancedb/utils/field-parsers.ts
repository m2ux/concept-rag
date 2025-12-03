/**
 * Utility functions for parsing LanceDB field data
 */

/**
 * Parse array field from database.
 * 
 * Handles multiple formats returned by LanceDB:
 * - Native JavaScript arrays
 * - Apache Arrow Vector objects (with .toArray() method)
 * - JSON-encoded strings
 * - null/undefined values
 * 
 * @param field - Field value from database
 * @returns Parsed array or empty array if invalid
 * 
 * @example
 * // Native array
 * parseArrayField([1, 2, 3]) // [1, 2, 3]
 * 
 * // Arrow Vector
 * parseArrayField(arrowVector) // Array.from(arrowVector.toArray())
 * 
 * // JSON string
 * parseArrayField('["a", "b"]') // ["a", "b"]
 */
export function parseArrayField<T = any>(field: any): T[] {
  if (!field) return [];
  if (Array.isArray(field)) return field as T[];
  // Handle Apache Arrow Vector objects (LanceDB returns these for array columns)
  if (typeof field === 'object' && 'toArray' in field && typeof field.toArray === 'function') {
    return Array.from(field.toArray()) as T[];
  }
  if (typeof field === 'string') {
    try {
      return JSON.parse(field) as T[];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * @deprecated Use parseArrayField instead. Alias kept for backward compatibility.
 */
export const parseJsonField = parseArrayField;

/**
 * Escape single quotes for SQL WHERE clauses (prevents SQL injection)
 * 
 * @param input - User input string
 * @returns Escaped string safe for SQL interpolation
 */
export function escapeSqlString(input: string): string {
  return input.replace(/'/g, "''");
}


