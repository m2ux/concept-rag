/**
 * Document Processing Service with Result Types
 * 
 * This service demonstrates using Result types for error handling
 * in a document processing pipeline.
 */

import { Result, Ok, Err } from '../functional/result.js';
import * as Railway from '../functional/railway.js';
import * as Option from '../functional/option.js';
import { fromNullable } from '../functional/option.js';

/**
 * Document metadata
 */
export interface DocumentMetadata {
  title: string;
  author?: string;
  pageCount?: number;
  format: 'pdf' | 'epub' | 'md' | 'txt';
}

/**
 * Processed document
 */
export interface ProcessedDocument {
  path: string;
  metadata: DocumentMetadata;
  content: string;
  wordCount: number;
}

/**
 * Document processing errors
 */
export type DocumentError =
  | { type: 'invalid_path'; path: string }
  | { type: 'unsupported_format'; format: string }
  | { type: 'read_error'; path: string; message: string }
  | { type: 'parse_error'; message: string }
  | { type: 'too_large'; size: number; maxSize: number };

/**
 * Document processing service using Result types
 */
export class DocumentProcessingService {
  private readonly maxSizeBytes = 10 * 1024 * 1024; // 10MB
  
  /**
   * Validate document path
   */
  validatePath(path: string): Result<string, DocumentError> {
    if (!path || path.trim().length === 0) {
      return Err({ type: 'invalid_path', path });
    }
    
    // Check for valid characters
    if (!/^[\w\-./\\]+$/.test(path)) {
      return Err({ type: 'invalid_path', path });
    }
    
    return Ok(path);
  }
  
  /**
   * Extract file format from path
   */
  extractFormat(path: string): Result<DocumentMetadata['format'], DocumentError> {
    const ext = path.split('.').pop()?.toLowerCase();
    const supportedFormats: DocumentMetadata['format'][] = ['pdf', 'epub', 'md', 'txt'];
    
    if (!ext || !supportedFormats.includes(ext as any)) {
      return Err({ type: 'unsupported_format', format: ext || 'unknown' });
    }
    
    return Ok(ext as DocumentMetadata['format']);
  }
  
  /**
   * Simulate reading file content
   */
  readFile(path: string): Result<string, DocumentError> {
    // Simulate file reading (in real implementation, this would be async)
    try {
      // Simulate content based on format
      const format = path.split('.').pop()?.toLowerCase();
      
      if (format === 'txt' || format === 'md') {
        return Ok('Sample content from ' + path);
      }
      
      if (format === 'pdf') {
        return Ok('PDF content extracted from ' + path);
      }
      
      if (format === 'epub') {
        return Ok('EPUB content extracted from ' + path);
      }
      
      return Err({ type: 'read_error', path, message: 'Unknown format' });
    } catch (error) {
      return Err({
        type: 'read_error',
        path,
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Parse document metadata
   */
  parseMetadata(path: string, content: string): Result<DocumentMetadata, DocumentError> {
    const format = path.split('.').pop()?.toLowerCase() as DocumentMetadata['format'];
    
    // Extract title from path
    const filename = path.split('/').pop() || path;
    const title = filename.replace(/\.[^.]+$/, '');
    
    // Count words (simple approximation)
    const wordCount = content.split(/\s+/).length;
    
    return Ok({
      title,
      format,
      pageCount: Math.ceil(wordCount / 300) // Rough estimate
    });
  }
  
  /**
   * Validate document size
   */
  validateSize(content: string): Result<string, DocumentError> {
    const sizeBytes = new Blob([content]).size;
    
    if (sizeBytes > this.maxSizeBytes) {
      return Err({
        type: 'too_large',
        size: sizeBytes,
        maxSize: this.maxSizeBytes
      });
    }
    
    return Ok(content);
  }
  
  /**
   * Count words in content
   */
  countWords(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }
  
  /**
   * Process a document using railway-oriented programming
   */
  processDocument(path: string): Result<ProcessedDocument, DocumentError> {
    // Validate path
    const pathResult = this.validatePath(path);
    if (!pathResult.ok) return pathResult;
    
    const validPath = pathResult.value;
    
    // Check format first
    const formatResult = this.extractFormat(validPath);
    if (!formatResult.ok) return formatResult;
    
    // Read file
    const contentResult = this.readFile(validPath);
    if (!contentResult.ok) return contentResult;
    
    // Validate size
    const sizeResult = this.validateSize(contentResult.value);
    if (!sizeResult.ok) return sizeResult;
    
    // Parse metadata
    const metadataResult = this.parseMetadata(validPath, contentResult.value);
    if (!metadataResult.ok) return metadataResult;
    
    // Build result
    return Ok({
      path: validPath,
      metadata: metadataResult.value,
      content: contentResult.value,
      wordCount: this.countWords(contentResult.value)
    });
  }
  
  /**
   * Find author in document (returns Option)
   */
  findAuthor(metadata: DocumentMetadata): Option<string> {
    return fromNullable(metadata.author);
  }
  
  /**
   * Get page count with default (using Option)
   */
  getPageCount(metadata: DocumentMetadata, defaultCount: number = 0): number {
    const pageCountOption = fromNullable(metadata.pageCount);
    return Option.getOrElse(pageCountOption, defaultCount);
  }
  
  /**
   * Process multiple documents, collecting all results
   */
  async processDocuments(
    paths: string[]
  ): Promise<Result<ProcessedDocument[], DocumentError[]>> {
    const results = paths.map(path => this.processDocument(path));
    
    const errors: DocumentError[] = [];
    const documents: ProcessedDocument[] = [];
    
    for (const result of results) {
      if (result.ok) {
        documents.push(result.value);
      } else {
        errors.push(result.error);
      }
    }
    
    if (errors.length > 0) {
      return Err(errors);
    }
    
    return Ok(documents);
  }
  
  /**
   * Process document with retry on failure
   */
  async processDocumentWithRetry(
    path: string,
    maxAttempts: number = 3
  ): Promise<Result<ProcessedDocument, DocumentError>> {
    return Railway.retry(
      async () => Promise.resolve(this.processDocument(path)),
      {
        maxAttempts,
        delayMs: 100,
        shouldRetry: (error, attempt) => {
          // Retry on read errors, but not on validation errors
          return error.type === 'read_error' && attempt < maxAttempts;
        }
      }
    );
  }
  
  /**
   * Process documents with fallback strategy
   */
  async processWithFallback(
    primaryPath: string,
    fallbackPath: string
  ): Promise<Result<ProcessedDocument, DocumentError[]>> {
    return Railway.firstSuccess([
      async () => Promise.resolve(this.processDocument(primaryPath)),
      async () => Promise.resolve(this.processDocument(fallbackPath))
    ]);
  }
}

