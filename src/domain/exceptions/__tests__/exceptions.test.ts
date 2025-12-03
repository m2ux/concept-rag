import { describe, it, expect } from 'vitest';
import {
  ConceptRAGError,
  ValidationError,
  RequiredFieldError,
  InvalidFormatError,
  ValueOutOfRangeError,
  DatabaseError,
  RecordNotFoundError,
  DuplicateRecordError,
  ConnectionError,
  TransactionError,
  EmbeddingError,
  EmbeddingProviderError,
  RateLimitError,
  InvalidEmbeddingDimensionsError,
  SearchError,
  InvalidQueryError,
  SearchTimeoutError,
  NoResultsError,
  ConfigurationError,
  MissingConfigError,
  InvalidConfigError,
  DocumentError,
  UnsupportedFormatError,
  DocumentParseError,
  DocumentTooLargeError
} from '../index.js';

describe('ConceptRAGError Base Class', () => {
  class TestError extends ConceptRAGError {
    constructor(message: string, cause?: Error) {
      super(message, 'TEST_ERROR', { testField: 'testValue' }, cause);
    }
  }

  it('should create error with message and code', () => {
    const error = new TestError('Test message');
    
    expect(error.message).toBe('Test message');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.name).toBe('TestError');
  });

  it('should include context in error', () => {
    const error = new TestError('Test message');
    
    expect(error.context).toEqual({ testField: 'testValue' });
  });

  it('should include timestamp', () => {
    const before = new Date();
    const error = new TestError('Test message');
    const after = new Date();
    
    expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(error.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should support cause chain', () => {
    const cause = new Error('Original error');
    const error = new TestError('Wrapped error', cause);
    
    expect(error.cause).toBe(cause);
  });

  it('should serialize to JSON correctly', () => {
    const error = new TestError('Test message');
    const json = error.toJSON();
    
    expect(json.name).toBe('TestError');
    expect(json.message).toBe('Test message');
    expect(json.code).toBe('TEST_ERROR');
    expect(json.context).toEqual({ testField: 'testValue' });
    expect(json.timestamp).toBeDefined();
    expect(json.stack).toBeDefined();
  });

  it('should check error type with is() method', () => {
    const error = new TestError('Test message');
    
    expect(error.is(TestError)).toBe(true);
    expect(error.is(ValidationError)).toBe(false);
  });
});

describe('ValidationError', () => {
  it('should create RequiredFieldError with field name', () => {
    const error = new RequiredFieldError('email');
    
    expect(error.message).toContain('email');
    expect(error.code).toBe('VALIDATION_EMAIL_INVALID');
    expect(error.context.field).toBe('email');
    expect(error.context.value).toBeUndefined();
  });

  it('should create InvalidFormatError with expected format', () => {
    const error = new InvalidFormatError('phone', '123', 'XXX-XXX-XXXX');
    
    expect(error.message).toContain('phone');
    expect(error.message).toContain('XXX-XXX-XXXX');
    expect(error.context.field).toBe('phone');
    expect(error.context.value).toBe('123');
    expect(error.context.expectedFormat).toBe('XXX-XXX-XXXX');
  });

  it('should create ValueOutOfRangeError with min/max', () => {
    const error = new ValueOutOfRangeError('limit', 150, 1, 100);
    
    expect(error.message).toContain('150');
    expect(error.message).toContain('[1, 100]');
    expect(error.context.field).toBe('limit');
    expect(error.context.value).toBe(150);
    expect(error.context.min).toBe(1);
    expect(error.context.max).toBe(100);
  });
});

describe('DatabaseError', () => {
  it('should create RecordNotFoundError with entity and identifier', () => {
    const error = new RecordNotFoundError('User', 'john@example.com');
    
    expect(error.message).toContain('User');
    expect(error.message).toContain('john@example.com');
    expect(error.code).toBe('DATABASE_QUERY_FAILED');
    expect(error.context.entity).toBe('User');
    expect(error.context.identifier).toBe('john@example.com');
  });

  it('should create DuplicateRecordError with entity and field', () => {
    const error = new DuplicateRecordError('User', 'email', 'john@example.com');
    
    expect(error.message).toContain('User');
    expect(error.message).toContain('email');
    expect(error.message).toContain('john@example.com');
    expect(error.context.entity).toBe('User');
    expect(error.context.field).toBe('email');
    expect(error.context.value).toBe('john@example.com');
  });

  it('should create ConnectionError', () => {
    const cause = new Error('Network timeout');
    const error = new ConnectionError(cause);
    
    expect(error.message).toContain('connect');
    expect(error.code).toBe('DATABASE_CONNECTION_FAILED');
    expect(error.cause).toBe(cause);
  });

  it('should create TransactionError with operation', () => {
    const error = new TransactionError('commit');
    
    expect(error.message).toContain('commit');
    expect(error.code).toBe('DATABASE_TRANSACTION_FAILED');
    expect(error.context.transactionOp).toBe('commit');
  });
});

describe('EmbeddingError', () => {
  it('should create EmbeddingProviderError with provider and status code', () => {
    const error = new EmbeddingProviderError('openai', 429);
    
    expect(error.message).toContain('openai');
    expect(error.code).toBe('EMBEDDING_OPENAI_ERROR');
    expect(error.context.provider).toBe('openai');
    expect(error.context.statusCode).toBe(429);
  });

  it('should create RateLimitError with retry-after', () => {
    const error = new RateLimitError('openai', 60000);
    
    expect(error.message).toContain('Rate limit');
    expect(error.message).toContain('openai');
    expect(error.context.retryAfter).toBe(60000);
  });

  it('should create InvalidEmbeddingDimensionsError', () => {
    const error = new InvalidEmbeddingDimensionsError('openai', 384, 512);
    
    expect(error.message).toContain('384');
    expect(error.message).toContain('512');
    expect(error.context.expected).toBe(384);
    expect(error.context.actual).toBe(512);
  });
});

describe('SearchError', () => {
  it('should create InvalidQueryError with reason', () => {
    const error = new InvalidQueryError('Query too short', 'ai');
    
    expect(error.message).toContain('Query too short');
    expect(error.code).toBe('SEARCH_VALIDATION_ERROR');
    expect(error.context.reason).toBe('Query too short');
    expect(error.context.query).toBe('ai');
  });

  it('should create SearchTimeoutError with timeout duration', () => {
    const error = new SearchTimeoutError('vector', 5000);
    
    expect(error.message).toContain('5000');
    expect(error.code).toBe('SEARCH_VECTOR_ERROR');
    expect(error.context.timeoutMs).toBe(5000);
  });

  it('should create NoResultsError with query', () => {
    const error = new NoResultsError('nonexistent concept');
    
    expect(error.message).toContain('No results');
    expect(error.context.query).toBe('nonexistent concept');
  });
});

describe('ConfigurationError', () => {
  it('should create MissingConfigError', () => {
    const error = new MissingConfigError('database_url');
    
    expect(error.message).toContain('database_url');
    expect(error.code).toBe('CONFIG_DATABASE_URL_ERROR');
    expect(error.context.configKey).toBe('database_url');
  });

  it('should create InvalidConfigError with reason', () => {
    const error = new InvalidConfigError('port', 'abc', 'must be a number');
    
    expect(error.message).toContain('port');
    expect(error.message).toContain('must be a number');
    expect(error.context.configKey).toBe('port');
    expect(error.context.value).toBe('abc');
    expect(error.context.reason).toBe('must be a number');
  });
});

describe('DocumentError', () => {
  it('should create UnsupportedFormatError', () => {
    const error = new UnsupportedFormatError('/path/doc.xyz', 'xyz');
    
    expect(error.message).toContain('xyz');
    expect(error.code).toBe('DOCUMENT_PROCESSING_ERROR');
    expect(error.context.filePath).toBe('/path/doc.xyz');
    expect(error.context.format).toBe('xyz');
  });

  it('should create DocumentParseError with cause', () => {
    const cause = new Error('Invalid PDF structure');
    const error = new DocumentParseError('/path/doc.pdf', cause);
    
    expect(error.message).toContain('parse');
    expect(error.context.filePath).toBe('/path/doc.pdf');
    expect(error.cause).toBe(cause);
  });

  it('should create DocumentTooLargeError with sizes', () => {
    const error = new DocumentTooLargeError('/path/huge.pdf', 50000000, 10000000);
    
    expect(error.message).toContain('50000000');
    expect(error.message).toContain('10000000');
    expect(error.context.sizeBytes).toBe(50000000);
    expect(error.context.maxSizeBytes).toBe(10000000);
  });
});
