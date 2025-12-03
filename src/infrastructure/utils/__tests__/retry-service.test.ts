import { describe, it, expect, vi } from 'vitest';
import { RetryService, DEFAULT_RETRY_CONFIG } from '../retry-service.js';
import { ValidationError, RateLimitError, EmbeddingError } from '../../../domain/exceptions/index.js';

describe('RetryService', () => {
  it('should execute operation successfully on first try', async () => {
    const retryService = new RetryService();
    const operation = vi.fn().mockResolvedValue('success');
    
    const result = await retryService.executeWithRetry(operation);
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed', async () => {
    const retryService = new RetryService();
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValueOnce('success');
    
    const result = await retryService.executeWithRetry(operation, {
      maxRetries: 3,
      initialDelayMs: 10
    });
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should exhaust retries and throw last error', async () => {
    const retryService = new RetryService();
    const error = new Error('Persistent failure');
    const operation = vi.fn().mockRejectedValue(error);
    
    await expect(
      retryService.executeWithRetry(operation, {
        maxRetries: 3,
        initialDelayMs: 10
      })
    ).rejects.toThrow('Persistent failure');
    
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should not retry ValidationError', async () => {
    const retryService = new RetryService();
    const error = new ValidationError('Invalid input', 'field', 'value');
    const operation = vi.fn().mockRejectedValue(error);
    
    await expect(
      retryService.executeWithRetry(operation, {
        maxRetries: 3,
        initialDelayMs: 10
      })
    ).rejects.toThrow(ValidationError);
    
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should use exponential backoff', async () => {
    const retryService = new RetryService();
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('Failure 1'))
      .mockRejectedValueOnce(new Error('Failure 2'))
      .mockResolvedValueOnce('success');
    
    const sleepSpy = vi.spyOn(retryService as any, 'sleep');
    
    await retryService.executeWithRetry(operation, {
      maxRetries: 3,
      initialDelayMs: 100,
      backoffMultiplier: 2
    });
    
    // First retry: 100ms, Second retry: 200ms
    expect(sleepSpy).toHaveBeenNthCalledWith(1, 100);
    expect(sleepSpy).toHaveBeenNthCalledWith(2, 200);
  });

  it('should respect maxDelayMs', async () => {
    const retryService = new RetryService();
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('Failure 1'))
      .mockRejectedValueOnce(new Error('Failure 2'))
      .mockResolvedValueOnce('success');
    
    const sleepSpy = vi.spyOn(retryService as any, 'sleep');
    
    await retryService.executeWithRetry(operation, {
      maxRetries: 3,
      initialDelayMs: 1000,
      backoffMultiplier: 10,
      maxDelayMs: 2000
    });
    
    // First retry: 1000ms, Second retry: capped at 2000ms instead of 10000ms
    expect(sleepSpy).toHaveBeenNthCalledWith(1, 1000);
    expect(sleepSpy).toHaveBeenNthCalledWith(2, 2000);
  });

  it('should use retry-after from RateLimitError', async () => {
    const retryService = new RetryService();
    const rateLimitError = new RateLimitError('openai', 5000);
    const operation = vi.fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce('success');
    
    const sleepSpy = vi.spyOn(retryService as any, 'sleep');
    
    await retryService.executeWithRetry(operation, {
      maxRetries: 3,
      initialDelayMs: 1000
    });
    
    // Should use 5000ms from rate limit error, not 1000ms from config
    expect(sleepSpy).toHaveBeenCalledWith(5000);
  });

  it('should only retry specified error types when configured', async () => {
    const retryService = new RetryService();
    const embeddingError = new EmbeddingError('Provider error', 'openai');
    const operation = vi.fn().mockRejectedValue(embeddingError);
    
    await expect(
      retryService.executeWithRetry(operation, {
        maxRetries: 3,
        initialDelayMs: 10,
        retryableErrors: [EmbeddingError]
      })
    ).rejects.toThrow(EmbeddingError);
    
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should not retry non-retryable error types when configured', async () => {
    const retryService = new RetryService();
    const genericError = new Error('Some error');
    const operation = vi.fn().mockRejectedValue(genericError);
    
    await expect(
      retryService.executeWithRetry(operation, {
        maxRetries: 3,
        initialDelayMs: 10,
        retryableErrors: [EmbeddingError]  // Only retry EmbeddingError
      })
    ).rejects.toThrow('Some error');
    
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should use default config when not specified', async () => {
    const retryService = new RetryService();
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('Failure 1'))
      .mockRejectedValueOnce(new Error('Failure 2'))
      .mockResolvedValueOnce('success');
    
    const result = await retryService.executeWithRetry(operation);
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });
});
