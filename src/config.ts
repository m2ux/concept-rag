import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Database configuration
export const CATALOG_TABLE_NAME = "catalog";
export const CHUNKS_TABLE_NAME = "chunks";
export const CONCEPTS_TABLE_NAME = "concepts";
export const CATEGORIES_TABLE_NAME = "categories";
export const DATABASE_URL = "~/.concept_rag";

// LLM API configuration (OpenRouter-compatible)
export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export const OPENROUTER_SUMMARY_MODEL = "x-ai/grok-4-fast"; // Fast summarization
export const OPENROUTER_CONCEPT_MODEL = "anthropic/claude-sonnet-4.5"; // Comprehensive concept extraction

// Prompt configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROMPT_TEMPLATE = fs.readFileSync(
    path.join(__dirname, '../prompts/concept-extraction.txt'), 
    'utf-8'
).trim();

/**
 * Build concept extraction prompt by inserting content
 */
export function buildConceptExtractionPrompt(content: string): string {
    return PROMPT_TEMPLATE.replace('{CONTENT}', content);
}