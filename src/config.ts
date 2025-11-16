import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Database configuration
export const CATALOG_TABLE_NAME = "catalog";
export const CHUNKS_TABLE_NAME = "chunks";
export const CONCEPTS_TABLE_NAME = "concepts";
export const DATABASE_URL = "~/.concept_rag";

// LLM API configuration (OpenRouter-compatible)
export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export const OPENROUTER_SUMMARY_MODEL = "x-ai/grok-4-fast"; // Fast summarization
export const OPENROUTER_CONCEPT_MODEL = "anthropic/claude-sonnet-4.5"; // Comprehensive concept extraction

// Embedding Provider Configuration
export type EmbeddingProvider = 'simple' | 'openai' | 'openrouter' | 'huggingface';

export interface OpenAIEmbeddingConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface OpenRouterEmbeddingConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface HuggingFaceEmbeddingConfig {
  apiKey?: string;
  model: string;
  useLocal: boolean;
}

export interface EmbeddingProviderConfig {
  provider: EmbeddingProvider;
  dimension: number;
  openai: OpenAIEmbeddingConfig;
  openrouter: OpenRouterEmbeddingConfig;
  huggingface: HuggingFaceEmbeddingConfig;
}

export const embeddingConfig: EmbeddingProviderConfig = {
  provider: (process.env.EMBEDDING_PROVIDER as EmbeddingProvider) || 'simple',
  dimension: 384,
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    baseUrl: process.env.OPENAI_BASE_URL
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_EMBEDDING_MODEL || 'openai/text-embedding-3-small',
    baseUrl: process.env.OPENROUTER_EMBEDDING_BASE_URL || 'https://openrouter.ai/api/v1'
  },
  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY,
    model: process.env.HUGGINGFACE_MODEL || 'sentence-transformers/all-MiniLM-L6-v2',
    useLocal: process.env.HUGGINGFACE_USE_LOCAL === 'true'
  }
};

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