import { Document } from "@langchain/core/documents";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { IDocumentLoader } from './document-loader.js';

/**
 * PDF Document Loader - Wrapper for LangChain's PDFLoader.
 * 
 * This class adapts the existing LangChain PDFLoader to our IDocumentLoader
 * interface, maintaining backward compatibility while enabling the new
 * document loader abstraction.
 * 
 * **Design Pattern**: Adapter
 * - Wraps existing PDFLoader without modifying it
 * - Provides consistent interface with other document loaders
 * - Preserves all existing PDF processing functionality
 * 
 * **Features Preserved**:
 * - pdf-parse for text extraction
 * - Metadata extraction (page numbers, etc.)
 * - Multi-page document handling
 * - Error handling for corrupted PDFs
 * 
 * @example
 * ```typescript
 * const loader = new PDFDocumentLoader();
 * const docs = await loader.load('/path/to/document.pdf');
 * console.log(docs.length); // Number of pages
 * console.log(docs[0].pageContent); // First page text
 * ```
 */
export class PDFDocumentLoader implements IDocumentLoader {
  
  /**
   * Check if this loader can handle the given file.
   * 
   * Supports .pdf extension (case-insensitive).
   * 
   * @param filePath - Path to the document file
   * @returns true if file has .pdf extension
   */
  canHandle(filePath: string): boolean {
    return filePath.toLowerCase().endsWith('.pdf');
  }
  
  /**
   * Load and parse PDF file.
   * 
   * Uses LangChain's PDFLoader which internally uses pdf-parse to:
   * - Extract text from each page
   * - Preserve page structure
   * - Extract basic metadata
   * 
   * **Returns**: Array of Documents, typically one per page.
   * Each document includes:
   * - `pageContent`: Extracted text from the page
   * - `metadata.loc.pageNumber`: Page number (if available)
   * - `metadata.pdf`: Additional PDF metadata
   * 
   * **Error Handling**: Throws on:
   * - File not found
   * - Corrupted PDF
   * - Encrypted/password-protected PDF
   * - Invalid PDF structure
   * 
   * @param filePath - Path to the PDF file
   * @returns Promise resolving to array of Documents (one per page)
   * @throws {Error} If PDF cannot be read or parsed
   * 
   * @example
   * ```typescript
   * try {
   *   const docs = await loader.load('/path/to/document.pdf');
   *   console.log(`Loaded ${docs.length} pages`);
   * } catch (error) {
   *   console.error('Failed to load PDF:', error.message);
   * }
   * ```
   */
  async load(filePath: string): Promise<Document[]> {
    const loader = new PDFLoader(filePath);
    return await loader.load();
  }
  
  /**
   * Get supported file extensions.
   * 
   * @returns Array containing '.pdf'
   */
  getSupportedExtensions(): string[] {
    return ['.pdf'];
  }
}

