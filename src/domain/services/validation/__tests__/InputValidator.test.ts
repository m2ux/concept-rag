import { describe, it, expect } from 'vitest';
import { InputValidator } from '../InputValidator.js';
import {
  RequiredFieldError,
  InvalidFormatError,
  ValueOutOfRangeError,
  UnsupportedFormatError
} from '../../../exceptions/index.js';

describe('InputValidator', () => {
  const validator = new InputValidator();

  describe('validateSearchQuery', () => {
    it('should validate valid search query', () => {
      expect(() => {
        validator.validateSearchQuery({ text: 'test query' });
      }).not.toThrow();
    });

    it('should throw RequiredFieldError for missing text', () => {
      expect(() => {
        validator.validateSearchQuery({ text: '' });
      }).toThrow(RequiredFieldError);
      
      expect(() => {
        validator.validateSearchQuery({ text: '   ' });
      }).toThrow(RequiredFieldError);
    });

    it('should throw ValueOutOfRangeError for text too long', () => {
      const longText = 'a'.repeat(10001);
      expect(() => {
        validator.validateSearchQuery({ text: longText });
      }).toThrow(ValueOutOfRangeError);
    });

    it('should throw InvalidFormatError for non-integer limit', () => {
      expect(() => {
        validator.validateSearchQuery({ text: 'test', limit: 5.5 });
      }).toThrow(InvalidFormatError);
    });

    it('should throw ValueOutOfRangeError for limit out of range', () => {
      expect(() => {
        validator.validateSearchQuery({ text: 'test', limit: 0 });
      }).toThrow(ValueOutOfRangeError);
      
      expect(() => {
        validator.validateSearchQuery({ text: 'test', limit: 1001 });
      }).toThrow(ValueOutOfRangeError);
    });
  });

  describe('validateConceptSearch', () => {
    it('should validate valid concept search', () => {
      expect(() => {
        validator.validateConceptSearch({ concept: 'innovation' });
      }).not.toThrow();
    });

    it('should throw RequiredFieldError for missing concept', () => {
      expect(() => {
        validator.validateConceptSearch({ concept: '' });
      }).toThrow(RequiredFieldError);
    });

    it('should throw ValueOutOfRangeError for concept too long', () => {
      const longConcept = 'a'.repeat(1001);
      expect(() => {
        validator.validateConceptSearch({ concept: longConcept });
      }).toThrow(ValueOutOfRangeError);
    });

    it('should validate limit parameter', () => {
      expect(() => {
        validator.validateConceptSearch({ concept: 'test', limit: 50 });
      }).not.toThrow();
      
      expect(() => {
        validator.validateConceptSearch({ concept: 'test', limit: 1001 });
      }).toThrow(ValueOutOfRangeError);
    });
  });

  describe('validateCatalogSearch', () => {
    it('should validate valid catalog search', () => {
      expect(() => {
        validator.validateCatalogSearch({ text: 'document title' });
      }).not.toThrow();
    });

    it('should throw RequiredFieldError for missing text', () => {
      expect(() => {
        validator.validateCatalogSearch({ text: '' });
      }).toThrow(RequiredFieldError);
    });

    it('should throw InvalidFormatError for non-boolean debug', () => {
      expect(() => {
        validator.validateCatalogSearch({ text: 'test', debug: 'true' as any });
      }).toThrow(InvalidFormatError);
    });

    it('should validate debug parameter', () => {
      expect(() => {
        validator.validateCatalogSearch({ text: 'test', debug: true });
      }).not.toThrow();
      
      expect(() => {
        validator.validateCatalogSearch({ text: 'test', debug: false });
      }).not.toThrow();
    });
  });

  describe('validateChunksSearch', () => {
    it('should validate valid chunks search', () => {
      expect(() => {
        validator.validateChunksSearch({
          text: 'search text',
          source: '/path/to/document.pdf'
        });
      }).not.toThrow();
    });

    it('should throw RequiredFieldError for missing text', () => {
      expect(() => {
        validator.validateChunksSearch({
          text: '',
          source: '/path/to/doc.pdf'
        });
      }).toThrow(RequiredFieldError);
    });

    it('should throw RequiredFieldError for missing source', () => {
      expect(() => {
        validator.validateChunksSearch({
          text: 'test',
          source: ''
        });
      }).toThrow(RequiredFieldError);
    });
  });

  describe('validateDocumentPath', () => {
    it('should validate supported document formats', () => {
      expect(() => validator.validateDocumentPath('doc.pdf')).not.toThrow();
      expect(() => validator.validateDocumentPath('doc.epub')).not.toThrow();
      expect(() => validator.validateDocumentPath('doc.md')).not.toThrow();
      expect(() => validator.validateDocumentPath('doc.txt')).not.toThrow();
    });

    it('should throw RequiredFieldError for missing path', () => {
      expect(() => {
        validator.validateDocumentPath('');
      }).toThrow(RequiredFieldError);
    });

    it('should throw UnsupportedFormatError for unsupported formats', () => {
      expect(() => {
        validator.validateDocumentPath('doc.docx');
      }).toThrow(UnsupportedFormatError);
      
      expect(() => {
        validator.validateDocumentPath('doc.xyz');
      }).toThrow(UnsupportedFormatError);
    });

    it('should handle paths without extensions', () => {
      expect(() => {
        validator.validateDocumentPath('document');
      }).toThrow(UnsupportedFormatError);
    });
  });

  describe('validateExtractConcepts', () => {
    it('should validate valid extract concepts params', () => {
      expect(() => {
        validator.validateExtractConcepts({
          document_query: 'Art of War'
        });
      }).not.toThrow();
    });

    it('should throw RequiredFieldError for missing document_query', () => {
      expect(() => {
        validator.validateExtractConcepts({ document_query: '' });
      }).toThrow(RequiredFieldError);
    });

    it('should validate format parameter', () => {
      expect(() => {
        validator.validateExtractConcepts({
          document_query: 'test',
          format: 'json'
        });
      }).not.toThrow();
      
      expect(() => {
        validator.validateExtractConcepts({
          document_query: 'test',
          format: 'markdown'
        });
      }).not.toThrow();
      
      expect(() => {
        validator.validateExtractConcepts({
          document_query: 'test',
          format: 'xml' as any
        });
      }).toThrow(InvalidFormatError);
    });

    it('should validate include_summary parameter', () => {
      expect(() => {
        validator.validateExtractConcepts({
          document_query: 'test',
          include_summary: true
        });
      }).not.toThrow();
      
      expect(() => {
        validator.validateExtractConcepts({
          document_query: 'test',
          include_summary: 'true' as any
        });
      }).toThrow(InvalidFormatError);
    });
  });

  describe('validateCategorySearch', () => {
    it('should validate valid category search', () => {
      expect(() => {
        validator.validateCategorySearch({ category: 'philosophy' });
      }).not.toThrow();
    });

    it('should throw RequiredFieldError for missing category', () => {
      expect(() => {
        validator.validateCategorySearch({ category: '' });
      }).toThrow(RequiredFieldError);
    });

    it('should validate includeChildren parameter', () => {
      expect(() => {
        validator.validateCategorySearch({
          category: 'test',
          includeChildren: true
        });
      }).not.toThrow();
      
      expect(() => {
        validator.validateCategorySearch({
          category: 'test',
          includeChildren: 'true' as any
        });
      }).toThrow(InvalidFormatError);
    });

    it('should validate limit parameter', () => {
      expect(() => {
        validator.validateCategorySearch({
          category: 'test',
          limit: 50
        });
      }).not.toThrow();
      
      expect(() => {
        validator.validateCategorySearch({
          category: 'test',
          limit: 1001
        });
      }).toThrow(ValueOutOfRangeError);
    });
  });

  describe('validateListCategories', () => {
    it('should validate valid list categories params', () => {
      expect(() => {
        validator.validateListCategories({});
      }).not.toThrow();
    });

    it('should validate limit parameter', () => {
      expect(() => {
        validator.validateListCategories({ limit: 100 });
      }).not.toThrow();
      
      expect(() => {
        validator.validateListCategories({ limit: 1001 });
      }).toThrow(ValueOutOfRangeError);
    });

    it('should validate sortBy parameter', () => {
      expect(() => {
        validator.validateListCategories({ sortBy: 'name' });
      }).not.toThrow();
      
      expect(() => {
        validator.validateListCategories({ sortBy: 'popularity' });
      }).not.toThrow();
      
      expect(() => {
        validator.validateListCategories({ sortBy: 'documentCount' });
      }).not.toThrow();
      
      expect(() => {
        validator.validateListCategories({ sortBy: 'invalid' as any });
      }).toThrow(InvalidFormatError);
    });
  });
});

