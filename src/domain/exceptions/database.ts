import { ConceptRAGError } from './base.js';

/**
 * Base class for database errors.
 * Thrown when database operations fail.
 */
export class DatabaseError extends ConceptRAGError {
  constructor(
    message: string,
    operation: string,
    cause?: Error
  ) {
    super(
      message,
      `DATABASE_${operation.toUpperCase()}_FAILED`,
      { operation },
      cause
    );
  }
}

/**
 * Thrown when a record is not found in the database.
 */
export class RecordNotFoundError extends DatabaseError {
  constructor(
    entity: string,
    identifier: string | number
  ) {
    super(
      `${entity} with identifier '${identifier}' not found`,
      'query'
    );
    this.context.entity = entity;
    this.context.identifier = identifier;
  }
}

/**
 * Thrown when attempting to insert a duplicate record.
 */
export class DuplicateRecordError extends DatabaseError {
  constructor(
    entity: string,
    field: string,
    value: unknown
  ) {
    super(
      `${entity} with ${field}='${value}' already exists`,
      'insert'
    );
    this.context.entity = entity;
    this.context.field = field;
    this.context.value = value;
  }
}

/**
 * Thrown when database connection fails.
 */
export class ConnectionError extends DatabaseError {
  constructor(cause?: Error) {
    super(
      'Failed to connect to database',
      'connection',
      cause
    );
  }
}

/**
 * Thrown when a database transaction fails.
 */
export class TransactionError extends DatabaseError {
  constructor(
    operation: string,
    cause?: Error
  ) {
    super(
      `Transaction ${operation} failed`,
      'transaction',
      cause
    );
    this.context.transactionOp = operation;
  }
}

