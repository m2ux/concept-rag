import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceInstrumentor, createInstrumentor } from '../instrumentation';
import { createLogger, ILogger } from '../logger';

describe('PerformanceInstrumentor', () => {
  let instrumentor: PerformanceInstrumentor;
  let mockLogger: ILogger;
  let logOperationSpy: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    logOperationSpy = vi.fn();
    errorSpy = vi.fn();
    
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: errorSpy,
      logOperation: logOperationSpy,
      child: vi.fn()
    };
    
    instrumentor = new PerformanceInstrumentor(mockLogger);
  });
  
  describe('measureAsync', () => {
    it('should measure async operation duration', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return 'result';
      };
      
      const result = await instrumentor.measureAsync('test_operation', operation);
      
      expect(result).toBe('result');
      expect(logOperationSpy).toHaveBeenCalledTimes(1);
      
      const [operationName, duration, context] = logOperationSpy.mock.calls[0];
      expect(operationName).toBe('test_operation');
      expect(duration).toBeGreaterThanOrEqual(0); // Just verify it's a number
    });
    
    it('should pass context to logger', async () => {
      const operation = async () => 'result';
      
      await instrumentor.measureAsync('test_op', operation, { query: 'test' });
      
      const [, , context] = logOperationSpy.mock.calls[0];
      expect(context).toEqual({ query: 'test' });
    });
    
    it('should log errors and rethrow', async () => {
      const error = new Error('Test error');
      const operation = async () => {
        throw error;
      };
      
      await expect(
        instrumentor.measureAsync('failing_op', operation, { context: 'test' })
      ).rejects.toThrow('Test error');
      
      expect(errorSpy).toHaveBeenCalledTimes(1);
      
      const [message, errorArg, context] = errorSpy.mock.calls[0];
      expect(message).toContain('failing_op');
      expect(errorArg).toBe(error);
      expect(context).toHaveProperty('duration');
      expect(context).toHaveProperty('context', 'test');
    });
    
    it('should measure duration even when operation fails', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        throw new Error('Failed');
      };
      
      try {
        await instrumentor.measureAsync('failing_op', operation);
      } catch (error) {
        // Expected
      }
      
      expect(errorSpy).toHaveBeenCalledTimes(1);
      const [, , context] = errorSpy.mock.calls[0];
      expect(context.duration).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('measureSync', () => {
    it('should measure sync operation duration', () => {
      const operation = () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };
      
      const result = instrumentor.measureSync('calculation', operation);
      
      expect(result).toBe(499500);
      expect(logOperationSpy).toHaveBeenCalledTimes(1);
      
      const [operationName, duration] = logOperationSpy.mock.calls[0];
      expect(operationName).toBe('calculation');
      expect(duration).toBeGreaterThanOrEqual(0);
    });
    
    it('should pass context to logger for sync operations', () => {
      const operation = () => 42;
      
      instrumentor.measureSync('sync_op', operation, { type: 'test' });
      
      const [, , context] = logOperationSpy.mock.calls[0];
      expect(context).toEqual({ type: 'test' });
    });
    
    it('should log errors and rethrow for sync operations', () => {
      const error = new Error('Sync error');
      const operation = () => {
        throw error;
      };
      
      expect(() => {
        instrumentor.measureSync('failing_sync', operation, { context: 'test' });
      }).toThrow('Sync error');
      
      expect(errorSpy).toHaveBeenCalledTimes(1);
      
      const [message, errorArg, context] = errorSpy.mock.calls[0];
      expect(message).toContain('failing_sync');
      expect(errorArg).toBe(error);
      expect(context).toHaveProperty('duration');
    });
  });
  
  describe('createInstrumentor factory', () => {
    it('should create an instrumentor with logger', () => {
      const logger = createLogger();
      const inst = createInstrumentor(logger);
      
      expect(inst).toBeInstanceOf(PerformanceInstrumentor);
    });
    
    it('should create an instrumentor with custom slow threshold', () => {
      const logger = createLogger();
      const inst = createInstrumentor(logger, 500);
      
      expect(inst).toBeInstanceOf(PerformanceInstrumentor);
    });
  });
  
  describe('slow operation detection', () => {
    it('should detect operations slower than threshold', async () => {
      const slowInstrumentor = new PerformanceInstrumentor(mockLogger, 50);
      
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'result';
      };
      
      await slowInstrumentor.measureAsync('slow_op', operation);
      
      expect(logOperationSpy).toHaveBeenCalledTimes(1);
      const [, duration] = logOperationSpy.mock.calls[0];
      expect(duration).toBeGreaterThanOrEqual(50);
    });
  });
});


