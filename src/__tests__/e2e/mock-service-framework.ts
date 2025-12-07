/**
 * Mock Service Framework for E2E Testing
 * 
 * Provides controllable mock services for testing resilience patterns
 * with realistic failure scenarios.
 */

/**
 * Configuration for mock service behavior
 */
export interface MockServiceConfig {
  /** Whether the service is currently healthy */
  healthy: boolean;
  
  /** Artificial delay in milliseconds */
  responseDelay: number;
  
  /** Error to throw when unhealthy */
  errorToThrow?: Error;
  
  /** Probability of random failures (0-1) */
  failureProbability?: number;
}

/**
 * Mock service that can simulate various failure scenarios
 */
export class MockService<T = any> {
  private config: MockServiceConfig = {
    healthy: true,
    responseDelay: 0,
  };
  
  private callCount = 0;
  private successCount = 0;
  private failureCount = 0;
  
  constructor(
    private readonly name: string,
    private readonly defaultResponse: T
  ) {}
  
  /**
   * Execute the mock service operation
   */
  async call(): Promise<T> {
    this.callCount++;
    
    // Apply artificial delay
    if (this.config.responseDelay > 0) {
      await this.sleep(this.config.responseDelay);
    }
    
    // Check for random failures
    if (this.config.failureProbability && Math.random() < this.config.failureProbability) {
      this.failureCount++;
      throw this.config.errorToThrow || new Error(`${this.name} random failure`);
    }
    
    // Check health status
    if (!this.config.healthy) {
      this.failureCount++;
      throw this.config.errorToThrow || new Error(`${this.name} is unhealthy`);
    }
    
    this.successCount++;
    return this.defaultResponse;
  }
  
  /**
   * Set service health status
   */
  setHealthy(healthy: boolean): void {
    this.config.healthy = healthy;
  }
  
  /**
   * Set response delay
   */
  setResponseDelay(ms: number): void {
    this.config.responseDelay = ms;
  }
  
  /**
   * Set error to throw when unhealthy
   */
  setError(error: Error): void {
    this.config.errorToThrow = error;
  }
  
  /**
   * Set random failure probability
   */
  setFailureProbability(probability: number): void {
    this.config.failureProbability = probability;
  }
  
  /**
   * Reset service to healthy state
   */
  resetToHealthy(): void {
    this.config = {
      healthy: true,
      responseDelay: 0,
    };
  }
  
  /**
   * Get call statistics
   */
  getStats() {
    return {
      callCount: this.callCount,
      successCount: this.successCount,
      failureCount: this.failureCount,
      successRate: this.callCount > 0 ? this.successCount / this.callCount : 0,
    };
  }
  
  /**
   * Reset statistics
   */
  resetStats(): void {
    this.callCount = 0;
    this.successCount = 0;
    this.failureCount = 0;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Mock LLM service for concept extraction
 */
export class MockLLMService extends MockService<{ primary: string[]; technical: string[]; related: string[] }> {
  constructor() {
    super('MockLLMService', {
      primary: ['concept1', 'concept2'],
      technical: ['tech1'],
      related: ['related1'],
    });
  }
  
  async extractConcepts(text: string): Promise<{ primary: string[]; technical: string[]; related: string[] }> {
    return this.call();
  }
}

/**
 * Mock embedding service
 */
export class MockEmbeddingService extends MockService<number[]> {
  constructor() {
    super('MockEmbeddingService', Array.from({ length: 384 }, () => Math.random()));
  }
  
  async generateEmbedding(text: string): Promise<number[]> {
    return this.call();
  }
}

/**
 * Mock database service
 */
export class MockDatabaseService extends MockService<{ id: string; success: boolean }> {
  constructor() {
    super('MockDatabaseService', { id: 'mock-id-123', success: true });
  }
  
  async save(data: any): Promise<{ id: string; success: boolean }> {
    return this.call();
  }
}








