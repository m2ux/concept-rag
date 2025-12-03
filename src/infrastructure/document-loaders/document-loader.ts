import { Document } from "@langchain/core/documents";

/**
 * Document Loader Interface - Abstraction for loading different document formats.
 * 
 * This interface defines a contract for document loaders that can parse and extract
 * content from various file formats (PDF, EPUB, MOBI, etc.) and convert them into
 * LangChain Document objects for further processing.
 * 
 * **Design Pattern**: Strategy
 * - Each document format implements this interface with its specific parsing logic
 * - Loaders are interchangeable based on file type
 * - DocumentLoaderFactory selects the appropriate loader at runtime
 * 
 * @example
 * ```typescript
 * class PDFDocumentLoader implements IDocumentLoader {
 *   canHandle(filePath: string): boolean {
 *     return filePath.toLowerCase().endsWith('.pdf');
 *   }
 *   
 *   async load(filePath: string): Promise<Document[]> {
 *     // PDF-specific parsing logic
 *   }
 * }
 * ```
 */
export interface IDocumentLoader {
  /**
   * Check if this loader can handle the given file.
   * 
   * Typically checks file extension, but could also inspect file headers
   * or MIME types for more robust detection.
   * 
   * @param filePath - Path to the document file
   * @returns true if this loader can handle the file, false otherwise
   * 
   * @example
   * ```typescript
   * const canHandle = loader.canHandle('/path/to/book.epub');
   * // returns true for EPUBDocumentLoader
   * ```
   */
  canHandle(filePath: string): boolean;
  
  /**
   * Load and parse the document file.
   * 
   * This method:
   * 1. Reads the file from disk
   * 2. Extracts text content using format-specific parser
   * 3. Extracts metadata (title, author, etc.)
   * 4. Converts to LangChain Document format
   * 5. Returns array of Documents (one per book, or per chapter depending on implementation)
   * 
   * **Error Handling**: Should throw descriptive errors for:
   * - File not found
   * - Corrupted/malformed files
   * - DRM-protected content
   * - Unsupported format variants
   * 
   * @param filePath - Path to the document file
   * @returns Promise resolving to array of LangChain Documents
   * @throws {Error} If file cannot be read or parsed
   * 
   * @example
   * ```typescript
   * const docs = await loader.load('/path/to/book.epub');
   * console.log(docs[0].pageContent); // Full book text
   * console.log(docs[0].metadata.title); // "Book Title"
   * ```
   */
  load(filePath: string): Promise<Document[]>;
  
  /**
   * Get list of file extensions this loader supports.
   * 
   * Used by DocumentLoaderFactory to determine which loader to use
   * and to build list of supported formats for file discovery.
   * 
   * Extensions should include the leading dot and be lowercase.
   * 
   * @returns Array of file extensions (e.g., ['.pdf', '.epub'])
   * 
   * @example
   * ```typescript
   * const extensions = loader.getSupportedExtensions();
   * // returns ['.epub'] for EPUBDocumentLoader
   * ```
   */
  getSupportedExtensions(): string[];
}
