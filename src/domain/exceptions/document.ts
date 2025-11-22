import { ConceptRAGError } from './base.js';

/**
 * Base class for document processing errors.
 * Thrown when document processing fails.
 */
export class DocumentError extends ConceptRAGError {
  constructor(
    message: string,
    filePath: string,
    cause?: Error
  ) {
    super(
      message,
      'DOCUMENT_PROCESSING_ERROR',
      { filePath },
      cause
    );
  }
}

/**
 * Thrown when a document format is not supported.
 */
export class UnsupportedFormatError extends DocumentError {
  constructor(
    filePath: string,
    format: string
  ) {
    super(
      `Unsupported document format: ${format}`,
      filePath
    );
    this.context.format = format;
  }
}

/**
 * Thrown when document parsing fails.
 */
export class DocumentParseError extends DocumentError {
  constructor(
    filePath: string,
    cause?: Error
  ) {
    super(
      `Failed to parse document`,
      filePath,
      cause
    );
  }
}

/**
 * Thrown when a document exceeds maximum size limits.
 */
export class DocumentTooLargeError extends DocumentError {
  constructor(
    filePath: string,
    sizeBytes: number,
    maxSizeBytes: number
  ) {
    super(
      `Document exceeds maximum size: ${sizeBytes} > ${maxSizeBytes} bytes`,
      filePath
    );
    this.context.sizeBytes = sizeBytes;
    this.context.maxSizeBytes = maxSizeBytes;
  }
}

