import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StructuredLogger, createLogger, LogLevel } from '../logger';

describe('StructuredLogger', () => {
  let logger: StructuredLogger;
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  
  beforeEach(() => {
    logger = new StructuredLogger();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  
  afterEach(() => {
    consoleSpy.mockRestore();
  });
  
  describe('basic logging', () => {
    it('should log info messages with structured format', () => {
      logger.info('Test message', { foo: 'bar' });
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
      
      expect(logEntry.level).toBe('info');
      expect(logEntry.message).toBe('Test message');
      expect(logEntry.foo).toBe('bar');
      expect(logEntry.timestamp).toBeDefined();
    });
    
    it('should log debug messages', () => {
      const debugLogger = new StructuredLogger({}, 'debug');
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      debugLogger.debug('Debug message', { test: true });
      
      const logEntry = JSON.parse(spy.mock.calls[0][0]);
      expect(logEntry.level).toBe('debug');
      expect(logEntry.message).toBe('Debug message');
      
      spy.mockRestore();
    });
    
    it('should log warning messages', () => {
      logger.warn('Warning message', { reason: 'test' });
      
      const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(logEntry.level).toBe('warn');
      expect(logEntry.message).toBe('Warning message');
      expect(logEntry.reason).toBe('test');
    });
    
    it('should log error messages with error details', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.ts:10';
      (error as any).code = 'TEST_ERROR';
      
      logger.error('Error occurred', error, { context: 'test' });
      
      const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
      
      expect(logEntry.level).toBe('error');
      expect(logEntry.message).toBe('Error occurred');
      expect(logEntry.error.name).toBe('Error');
      expect(logEntry.error.message).toBe('Test error');
      expect(logEntry.error.stack).toBeDefined();
      expect(logEntry.error.code).toBe('TEST_ERROR');
      expect(logEntry.context).toBe('test');
    });
    
    it('should log errors without error object', () => {
      logger.error('Error without exception', undefined, { context: 'test' });
      
      const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(logEntry.level).toBe('error');
      expect(logEntry.message).toBe('Error without exception');
      expect(logEntry.error).toBeUndefined();
    });
  });
  
  describe('operation logging', () => {
    it('should log operations with duration', () => {
      logger.logOperation('search', 123.45, { query: 'test' });
      
      const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
      
      expect(logEntry.operation).toBe('search');
      expect(logEntry.duration).toBe(123.45);
      expect(logEntry.query).toBe('test');
      expect(logEntry.message).toContain('search');
    });
    
    it('should mark slow operations with warning level', () => {
      logger.logOperation('slow_operation', 1500, {}); // >1s
      
      const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
      
      expect(logEntry.level).toBe('warn');
      expect(logEntry.slow).toBe(true);
      expect(logEntry.duration).toBe(1500);
    });
    
    it('should mark fast operations with info level', () => {
      logger.logOperation('fast_operation', 50, {}); // <1s
      
      const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
      
      expect(logEntry.level).toBe('info');
      expect(logEntry.slow).toBe(false);
      expect(logEntry.duration).toBe(50);
    });
  });
  
  describe('child loggers', () => {
    it('should create child loggers with additional context', () => {
      const childLogger = logger.child({ userId: '123', requestId: 'abc' });
      childLogger.info('Child log message');
      
      const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
      
      expect(logEntry.userId).toBe('123');
      expect(logEntry.requestId).toBe('abc');
      expect(logEntry.message).toBe('Child log message');
    });
    
    it('should inherit parent context', () => {
      const parentLogger = new StructuredLogger({ service: 'test-service' });
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const childLogger = parentLogger.child({ operation: 'test-op' });
      childLogger.info('Test');
      
      const logEntry = JSON.parse(spy.mock.calls[0][0]);
      expect(logEntry.service).toBe('test-service');
      expect(logEntry.operation).toBe('test-op');
      
      spy.mockRestore();
    });
    
    it('should override parent context with child context', () => {
      const parentLogger = new StructuredLogger({ key: 'parent' });
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const childLogger = parentLogger.child({ key: 'child' });
      childLogger.info('Test');
      
      const logEntry = JSON.parse(spy.mock.calls[0][0]);
      expect(logEntry.key).toBe('child');
      
      spy.mockRestore();
    });
  });
  
  describe('log level filtering', () => {
    it('should respect minimum log level', () => {
      const warnLogger = new StructuredLogger({}, 'warn');
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      warnLogger.debug('Debug message');
      warnLogger.info('Info message');
      warnLogger.warn('Warn message');
      warnLogger.error('Error message');
      
      expect(spy).toHaveBeenCalledTimes(2); // Only warn and error
      
      const warnEntry = JSON.parse(spy.mock.calls[0][0]);
      const errorEntry = JSON.parse(spy.mock.calls[1][0]);
      
      expect(warnEntry.level).toBe('warn');
      expect(errorEntry.level).toBe('error');
      
      spy.mockRestore();
    });
    
    it('should log all levels when minLevel is debug', () => {
      const debugLogger = new StructuredLogger({}, 'debug');
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      debugLogger.debug('Debug');
      debugLogger.info('Info');
      debugLogger.warn('Warn');
      debugLogger.error('Error');
      
      expect(spy).toHaveBeenCalledTimes(4);
      
      spy.mockRestore();
    });
  });
  
  describe('createLogger factory', () => {
    it('should create a logger with context', () => {
      const newLogger = createLogger({ service: 'test' });
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      newLogger.info('Test');
      
      const logEntry = JSON.parse(spy.mock.calls[0][0]);
      expect(logEntry.service).toBe('test');
      
      spy.mockRestore();
    });
    
    it('should create a logger with custom min level', () => {
      const newLogger = createLogger({}, 'error');
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      newLogger.info('Should not log');
      newLogger.error('Should log');
      
      expect(spy).toHaveBeenCalledTimes(1);
      
      spy.mockRestore();
    });
  });
  
  describe('timestamp format', () => {
    it('should use ISO 8601 format for timestamps', () => {
      logger.info('Test');
      
      const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
      const timestamp = new Date(logEntry.timestamp);
      
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toISOString()).toBe(logEntry.timestamp);
    });
  });
  
  describe('context merging', () => {
    it('should merge logger context with call context', () => {
      const contextLogger = new StructuredLogger({ service: 'test', version: '1.0' });
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      contextLogger.info('Test', { requestId: '123' });
      
      const logEntry = JSON.parse(spy.mock.calls[0][0]);
      expect(logEntry.service).toBe('test');
      expect(logEntry.version).toBe('1.0');
      expect(logEntry.requestId).toBe('123');
      
      spy.mockRestore();
    });
    
    it('should allow call context to override logger context', () => {
      const contextLogger = new StructuredLogger({ key: 'original' });
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      contextLogger.info('Test', { key: 'override' });
      
      const logEntry = JSON.parse(spy.mock.calls[0][0]);
      expect(logEntry.key).toBe('override');
      
      spy.mockRestore();
    });
  });
});


