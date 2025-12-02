/**
 * Utility functions for parsing LanceDB field data
 */

/**
 * Parse JSON field from database (handles string, array, or already parsed)
 * 
 * @param field - Field value from database
 * @returns Parsed array or empty array if invalid
 */
export function parseJsonField<T = string>(field: any): T[] {
  if (!field) return [];
  if (Array.isArray(field)) return field as T[];
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
 * Escape single quotes for SQL WHERE clauses (prevents SQL injection)
 * 
 * @param input - User input string
 * @returns Escaped string safe for SQL interpolation
 */
export function escapeSqlString(input: string): string {
  return input.replace(/'/g, "''");
}


