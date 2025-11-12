// Database configuration
export const CATALOG_TABLE_NAME = "catalog";
export const CHUNKS_TABLE_NAME = "chunks";
export const CONCEPTS_TABLE_NAME = "concepts";
export const DATABASE_URL = "~/.concept_rag";

// LLM API configuration (OpenRouter-compatible)
export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export const OPENROUTER_SUMMARY_MODEL = "x-ai/grok-4-fast"; // Fast summarization
export const OPENROUTER_CONCEPT_MODEL = "anthropic/claude-sonnet-4.5"; // Comprehensive concept extraction