import { IDocumentLoader } from './document-loader.js';

/**
 * Document Loader Factory - Manages document loader registration and selection.
 * 
 * This factory implements the **Factory Pattern** to:
 * 1. Register multiple document loaders for different formats
 * 2. Select the appropriate loader based on file type
 * 3. Provide centralized access to all supported file extensions
 * 
 * **Design Benefits**:
 * - **Open-Closed Principle**: Add new formats without modifying existing code
 * - **Single Responsibility**: Each loader handles one format
 * - **Testability**: Easy to test with fake loaders
 * - **Extensibility**: New formats require only registration
 * 
 * @example
 * ```typescript
 * const factory = new DocumentLoaderFactory();
 * factory.registerLoader(new PDFDocumentLoader());
 * factory.registerLoader(new EPUBDocumentLoader());
 * factory.registerLoader(new MOBIDocumentLoader());
 * 
 * const loader = factory.getLoader('/path/to/book.epub');
 * const docs = await loader.load('/path/to/book.epub');
 * ```
 */
export class DocumentLoaderFactory {
  private loaders: IDocumentLoader[] = [];
  
  /**
   * Register a document loader.
   * 
   * Loaders are checked in registration order when selecting a loader.
   * Register more specific loaders before more general ones if there's overlap.
   * 
   * **Idempotency**: Can register same loader type multiple times,
   * but typically each format has one loader.
   * 
   * @param loader - Document loader instance to register
   * 
   * @example
   * ```typescript
   * factory.registerLoader(new PDFDocumentLoader());
   * factory.registerLoader(new EPUBDocumentLoader());
   * ```
   */
  registerLoader(loader: IDocumentLoader): void {
    this.loaders.push(loader);
  }
  
  /**
   * Get the appropriate document loader for a file.
   * 
   * Searches registered loaders in registration order and returns the first
   * loader whose `canHandle()` method returns true.
   * 
   * **Selection Strategy**:
   * - Iterates through loaders in registration order
   * - Returns first matching loader
   * - Returns null if no loader can handle the file
   * 
   * @param filePath - Path to the document file
   * @returns Loader that can handle the file, or null if none found
   * 
   * @example
   * ```typescript
   * const loader = factory.getLoader('/path/to/book.epub');
   * if (!loader) {
   *   throw new Error('Unsupported file format');
   * }
   * const docs = await loader.load('/path/to/book.epub');
   * ```
   */
  getLoader(filePath: string): IDocumentLoader | null {
    for (const loader of this.loaders) {
      if (loader.canHandle(filePath)) {
        return loader;
      }
    }
    return null;
  }
  
  /**
   * Get all supported file extensions across all registered loaders.
   * 
   * Combines extensions from all loaders and removes duplicates.
   * Useful for file discovery and validation.
   * 
   * @returns Array of unique file extensions (e.g., ['.pdf', '.epub', '.mobi'])
   * 
   * @example
   * ```typescript
   * const extensions = factory.getSupportedExtensions();
   * // returns ['.pdf', '.epub', '.mobi']
   * 
   * // Use for file discovery
   * const files = findFilesWithExtensions(directory, extensions);
   * ```
   */
  getSupportedExtensions(): string[] {
    const extensions = new Set<string>();
    for (const loader of this.loaders) {
      for (const ext of loader.getSupportedExtensions()) {
        extensions.add(ext);
      }
    }
    return Array.from(extensions);
  }
  
  /**
   * Get count of registered loaders.
   * 
   * Useful for debugging and validation that loaders are properly registered.
   * 
   * @returns Number of registered loaders
   * 
   * @example
   * ```typescript
   * console.log(`Registered ${factory.getLoaderCount()} loaders`);
   * // Output: Registered 3 loaders
   * ```
   */
  getLoaderCount(): number {
    return this.loaders.length;
  }
}
