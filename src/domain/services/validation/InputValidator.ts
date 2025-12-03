import {
  RequiredFieldError,
  InvalidFormatError,
  ValueOutOfRangeError,
  UnsupportedFormatError
} from '../../exceptions/index.js';

/**
 * Input validator for concept-RAG operations.
 * Provides consistent validation across all entry points.
 */
export class InputValidator {
  /**
   * Validate search query parameters.
   * @throws {RequiredFieldError} if text is missing
   * @throws {ValueOutOfRangeError} if text length or limit is out of range
   */
  validateSearchQuery(params: {
    text?: string;
    limit?: number;
    source?: string;
  }): void {
    // Validate required text field
    if (!params.text || params.text.trim().length === 0) {
      throw new RequiredFieldError('text');
    }
    
    // Validate text length (max 10000 chars)
    if (params.text.length > 10000) {
      throw new ValueOutOfRangeError('text.length', params.text.length, 1, 10000);
    }
    
    // Validate limit if provided
    if (params.limit !== undefined) {
      if (!Number.isInteger(params.limit)) {
        throw new InvalidFormatError('limit', params.limit, 'integer');
      }
      if (params.limit < 1 || params.limit > 100) {
        throw new ValueOutOfRangeError('limit', params.limit, 1, 100);
      }
    }
  }
  
  /**
   * Validate concept search parameters.
   * @throws {RequiredFieldError} if concept is missing
   * @throws {ValueOutOfRangeError} if limit is out of range
   */
  validateConceptSearch(params: {
    concept?: string;
    limit?: number;
    source_filter?: string;
  }): void {
    // Validate required concept field
    if (!params.concept || params.concept.trim().length === 0) {
      throw new RequiredFieldError('concept');
    }
    
    // Validate concept length
    if (params.concept.length > 1000) {
      throw new ValueOutOfRangeError('concept.length', params.concept.length, 1, 1000);
    }
    
    // Validate limit if provided
    if (params.limit !== undefined) {
      if (!Number.isInteger(params.limit)) {
        throw new InvalidFormatError('limit', params.limit, 'integer');
      }
      if (params.limit < 1 || params.limit > 100) {
        throw new ValueOutOfRangeError('limit', params.limit, 1, 100);
      }
    }
  }
  
  /**
   * Validate catalog search parameters.
   * @throws {RequiredFieldError} if text is missing
   * @throws {InvalidFormatError} if debug is not boolean
   */
  validateCatalogSearch(params: {
    text?: string;
    debug?: boolean;
  }): void {
    // Validate required text field
    if (!params.text || params.text.trim().length === 0) {
      throw new RequiredFieldError('text');
    }
    
    // Validate text length
    if (params.text.length > 1000) {
      throw new ValueOutOfRangeError('text.length', params.text.length, 1, 1000);
    }
    
    // Validate debug flag if provided
    if (params.debug !== undefined && typeof params.debug !== 'boolean') {
      throw new InvalidFormatError('debug', params.debug, 'boolean');
    }
  }
  
  /**
   * Validate chunks search parameters.
   * @throws {RequiredFieldError} if required fields are missing
   * @throws {InvalidFormatError} if types are incorrect
   */
  validateChunksSearch(params: {
    text?: string;
    source?: string;
    debug?: boolean;
  }): void {
    // Validate required text field
    if (!params.text || params.text.trim().length === 0) {
      throw new RequiredFieldError('text');
    }
    
    // Validate required source field
    if (!params.source || params.source.trim().length === 0) {
      throw new RequiredFieldError('source');
    }
    
    // Validate text length
    if (params.text.length > 10000) {
      throw new ValueOutOfRangeError('text.length', params.text.length, 1, 10000);
    }
    
    // Validate debug flag if provided
    if (params.debug !== undefined && typeof params.debug !== 'boolean') {
      throw new InvalidFormatError('debug', params.debug, 'boolean');
    }
  }
  
  /**
   * Validate document path and format.
   * @throws {RequiredFieldError} if path is missing
   * @throws {UnsupportedFormatError} if format is not supported
   */
  validateDocumentPath(path?: string): void {
    if (!path || path.trim().length === 0) {
      throw new RequiredFieldError('path');
    }
    
    const ext = path.split('.').pop()?.toLowerCase();
    const supportedFormats = ['pdf', 'epub', 'md', 'txt'];
    
    if (!ext || !supportedFormats.includes(ext)) {
      throw new UnsupportedFormatError(path, ext || 'unknown');
    }
  }
  
  /**
   * Validate extract concepts parameters.
   * @throws {RequiredFieldError} if document_query is missing
   * @throws {InvalidFormatError} if format or include_summary have wrong types
   */
  validateExtractConcepts(params: {
    document_query?: string;
    format?: string;
    include_summary?: boolean;
  }): void {
    // Validate required document_query field
    if (!params.document_query || params.document_query.trim().length === 0) {
      throw new RequiredFieldError('document_query');
    }
    
    // Validate format if provided
    if (params.format !== undefined) {
      const validFormats = ['json', 'markdown'];
      if (!validFormats.includes(params.format)) {
        throw new InvalidFormatError('format', params.format, 'json or markdown');
      }
    }
    
    // Validate include_summary if provided
    if (params.include_summary !== undefined && typeof params.include_summary !== 'boolean') {
      throw new InvalidFormatError('include_summary', params.include_summary, 'boolean');
    }
  }
  
  /**
   * Validate category search parameters.
   * @throws {RequiredFieldError} if category is missing
   * @throws {InvalidFormatError} if types are incorrect
   */
  validateCategorySearch(params: {
    category?: string;
    includeChildren?: boolean;
    limit?: number;
  }): void {
    // Validate required category field
    if (!params.category || params.category.trim().length === 0) {
      throw new RequiredFieldError('category');
    }
    
    // Validate includeChildren if provided
    if (params.includeChildren !== undefined && typeof params.includeChildren !== 'boolean') {
      throw new InvalidFormatError('includeChildren', params.includeChildren, 'boolean');
    }
    
    // Validate limit if provided
    if (params.limit !== undefined) {
      if (!Number.isInteger(params.limit)) {
        throw new InvalidFormatError('limit', params.limit, 'integer');
      }
      if (params.limit < 1 || params.limit > 100) {
        throw new ValueOutOfRangeError('limit', params.limit, 1, 100);
      }
    }
  }
  
  /**
   * Validate list categories parameters.
   * @throws {InvalidFormatError} if types are incorrect
   * @throws {ValueOutOfRangeError} if limit is out of range
   */
  validateListCategories(params: {
    limit?: number;
    search?: string;
    sortBy?: string;
  }): void {
    // Validate limit if provided
    if (params.limit !== undefined) {
      if (!Number.isInteger(params.limit)) {
        throw new InvalidFormatError('limit', params.limit, 'integer');
      }
      if (params.limit < 1 || params.limit > 200) {
        throw new ValueOutOfRangeError('limit', params.limit, 1, 200);
      }
    }
    
    // Validate sortBy if provided
    if (params.sortBy !== undefined) {
      const validSortBy = ['name', 'popularity', 'documentCount'];
      if (!validSortBy.includes(params.sortBy)) {
        throw new InvalidFormatError('sortBy', params.sortBy, 'name, popularity, or documentCount');
      }
    }
  }
}
