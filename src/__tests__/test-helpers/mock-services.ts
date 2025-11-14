/**
 * Mock Service Implementations (Test Doubles)
 * 
 * Provides "Fake" implementations of service interfaces for testing.
 * 
 * Based on "Test Doubles" pattern from:
 * - "Test Driven Development for Embedded C" (Grenning), Chapter 7
 */

import { EmbeddingService } from '../../domain/interfaces/services/embedding-service.js';
import { createTestEmbedding } from './test-data.js';

/**
 * Fake EmbeddingService for testing
 * 
 * Returns deterministic embeddings for consistent test results.
 * Much faster than real embedding generation.
 */
export class FakeEmbeddingService implements EmbeddingService {
  private embeddings: Map<string, number[]> = new Map();
  
  generateEmbedding(text: string): number[] {
    // Return cached embedding if available
    if (this.embeddings.has(text)) {
      return this.embeddings.get(text)!;
    }
    
    // Generate deterministic embedding based on text length and content
    // This is NOT a real embedding, just predictable test data
    const baseValue = text.length % 100 / 100;
    const embedding = createTestEmbedding(384, baseValue);
    
    this.embeddings.set(text, embedding);
    return embedding;
  }
  
  // Test helpers
  setEmbedding(text: string, embedding: number[]): void {
    this.embeddings.set(text, embedding);
  }
  
  clear(): void {
    this.embeddings.clear();
  }
}

