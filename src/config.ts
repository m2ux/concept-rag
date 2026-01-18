/**
 * @deprecated Use Configuration service from 'application/config' instead
 * 
 * This file is maintained for backward compatibility.
 * New code should use:
 * ```typescript
 * import { Configuration } from './application/config/index.js';
 * const config = Configuration.initialize(process.env);
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Database configuration
/** @deprecated Use config.database.tables.catalog */
export const CATALOG_TABLE_NAME = "catalog";

/** @deprecated Use config.database.tables.chunks */
export const CHUNKS_TABLE_NAME = "chunks";

/** @deprecated Use config.database.tables.concepts */
export const CONCEPTS_TABLE_NAME = "concepts";

/** @deprecated Use config.database.tables.categories */
export const CATEGORIES_TABLE_NAME = "categories";

/** @deprecated Use config.database.url */
export const DATABASE_URL = "~/.concept_rag";

// LLM API configuration (OpenRouter-compatible)
/** @deprecated Use config.llm.baseUrl */
export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/** @deprecated Use config.llm.summaryModel */
export const OPENROUTER_SUMMARY_MODEL = "google/gemini-3-flash-preview"; // Fast summarization

/** @deprecated Use config.llm.conceptModel */
export const OPENROUTER_CONCEPT_MODEL = "google/gemini-3-flash-preview"; // Comprehensive concept extraction

// Prompt configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROMPT_TEMPLATE = fs.readFileSync(
    path.join(__dirname, '../prompts/concept-extraction.txt'), 
    'utf-8'
).trim();

/**
 * Build concept extraction prompt by inserting content
 * @deprecated This will be moved to a dedicated prompt service
 */
export function buildConceptExtractionPrompt(content: string): string {
    return PROMPT_TEMPLATE.replace('{CONTENT}', content);
}
