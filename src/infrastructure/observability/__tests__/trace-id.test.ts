import { describe, it, expect } from 'vitest';
import { generateTraceId, setTraceId, getTraceId, clearTraceId, withTraceId } from '../trace-id';

describe('Trace ID utilities', () => {
  describe('generateTraceId', () => {
    it('should generate a unique trace ID', () => {
      const id1 = generateTraceId();
      const id2 = generateTraceId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });
    
    it('should generate 32-character hex string', () => {
      const id = generateTraceId();
      
      expect(id).toHaveLength(32);
      expect(id).toMatch(/^[0-9a-f]{32}$/);
    });
  });
  
  describe('trace ID storage', () => {
    it('should set and get trace ID', () => {
      const id = 'test-trace-id-123';
      
      setTraceId(id);
      expect(getTraceId()).toBe(id);
    });
    
    it('should clear trace ID', () => {
      setTraceId('test-id');
      expect(getTraceId()).toBe('test-id');
      
      clearTraceId();
      expect(getTraceId()).toBeUndefined();
    });
    
    it('should return undefined if no trace ID set', () => {
      clearTraceId();
      expect(getTraceId()).toBeUndefined();
    });
  });
  
  describe('withTraceId', () => {
    it('should execute function with trace ID', async () => {
      let capturedId: string | undefined;
      
      await withTraceId(async () => {
        capturedId = getTraceId();
        return 'result';
      });
      
      expect(capturedId).toBeDefined();
      expect(capturedId).toMatch(/^[0-9a-f]{32}$/);
    });
    
    it('should clear trace ID after execution', async () => {
      await withTraceId(async () => {
        expect(getTraceId()).toBeDefined();
        return 'result';
      });
      
      expect(getTraceId()).toBeUndefined();
    });
    
    it('should clear trace ID even if function throws', async () => {
      try {
        await withTraceId(async () => {
          throw new Error('Test error');
        });
      } catch (error) {
        // Expected
      }
      
      expect(getTraceId()).toBeUndefined();
    });
    
    it('should return the function result', async () => {
      const result = await withTraceId(async () => {
        return { data: 'test' };
      });
      
      expect(result).toEqual({ data: 'test' });
    });
    
    it('should propagate errors from the function', async () => {
      await expect(
        withTraceId(async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
    });
  });
});


