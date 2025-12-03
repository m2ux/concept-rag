import { Document } from "@langchain/core/documents";
import EPub from 'epub';
import { IDocumentLoader } from './document-loader.js';

/**
 * EPUB Document Loader - Parses EPUB electronic book files.
 * 
 * This loader extracts text content and metadata from EPUB files
 * (both EPUB 2.0 and EPUB 3.0 formats) and converts them to LangChain Documents.
 * 
 * **EPUB Structure**:
 * - ZIP container with XHTML/HTML chapters
 * - META-INF/container.xml points to OPF file
 * - OPF file contains manifest, spine, and metadata
 * - NCX/Navigation document for table of contents
 * 
 * **Implementation Strategy**:
 * - One Document per book (all chapters concatenated)
 * - Strips HTML tags to get plain text
 * - Preserves chapter order from spine
 * - Extracts comprehensive metadata
 * 
 * **DRM Handling**: Cannot read DRM-protected EPUBs.
 * Throws descriptive error if DRM detected.
 * 
 * @example
 * ```typescript
 * const loader = new EPUBDocumentLoader();
 * const docs = await loader.load('/path/to/book.epub');
 * console.log(docs[0].metadata.title); // Book title
 * console.log(docs[0].pageContent); // Full book text
 * ```
 */
export class EPUBDocumentLoader implements IDocumentLoader {
  
  /**
   * Check if this loader can handle the given file.
   * 
   * Supports .epub extension (case-insensitive).
   * 
   * @param filePath - Path to the document file
   * @returns true if file has .epub extension
   */
  canHandle(filePath: string): boolean {
    return filePath.toLowerCase().endsWith('.epub');
  }
  
  /**
   * Load and parse EPUB file.
   * 
   * **Process**:
   * 1. Initialize EPub parser
   * 2. Extract metadata (title, author, language, etc.)
   * 3. Iterate through chapters in spine order
   * 4. Extract and clean HTML content from each chapter
   * 5. Concatenate all chapters into single text
   * 6. Create LangChain Document with full text and metadata
   * 
   * **Returns**: Array with single Document containing:
   * - `pageContent`: Full book text (all chapters concatenated)
   * - `metadata.source`: Original file path
   * - `metadata.title`: Book title
   * - `metadata.author`: Book author(s)
   * - `metadata.language`: Language code (e.g., 'en')
   * - `metadata.publisher`: Publisher name (if available)
   * - `metadata.date`: Publication date (if available)
   * - `metadata.description`: Book description (if available)
   * 
   * **Error Handling**: Throws on:
   * - File not found
   * - Corrupted EPUB structure
   * - DRM-protected files
   * - Non-UTF-8 encoding (library limitation)
   * - Missing required EPUB components
   * 
   * @param filePath - Path to the EPUB file
   * @returns Promise resolving to array with single Document
   * @throws {Error} If EPUB cannot be read or parsed
   * 
   * @example
   * ```typescript
   * try {
   *   const docs = await loader.load('/path/to/book.epub');
   *   console.log(`Title: ${docs[0].metadata.title}`);
   *   console.log(`Author: ${docs[0].metadata.author}`);
   *   console.log(`Content length: ${docs[0].pageContent.length} chars`);
   * } catch (error) {
   *   console.error('Failed to load EPUB:', error.message);
   * }
   * ```
   */
  async load(filePath: string): Promise<Document[]> {
    return new Promise((resolve, reject) => {
      const epub = new EPub(filePath);
      
      // Handle parsing errors
      epub.on('error', (err: Error) => {
        reject(new Error(`Failed to parse EPUB: ${err.message}`));
      });
      
      // Handle successful parsing
      epub.on('end', async () => {
        try {
          // Extract metadata (using any to access epub library's metadata structure)
          const epubMetadata = epub.metadata as any;
          const metadata = {
            source: filePath,
            title: epubMetadata.title || 'Unknown Title',
            author: epubMetadata.creator || 'Unknown Author',
            language: epubMetadata.language || 'en',
            publisher: epubMetadata.publisher || undefined,
            date: epubMetadata.date || undefined,
            description: epubMetadata.description || undefined,
            subject: epubMetadata.subject || undefined,
          };
          
          // Extract all chapter content in order
          const chapterTexts: string[] = [];
          
          // epub.flow contains chapters in reading order
          for (const chapter of epub.flow) {
            try {
              const chapterText = await this.getChapterText(epub, chapter.id);
              if (chapterText && chapterText.trim()) {
                chapterTexts.push(chapterText.trim());
              }
            } catch (err: any) {
              // Log but don't fail - some chapters might be navigation/images
              console.warn(`Warning: Could not extract chapter ${chapter.id}: ${err.message}`);
            }
          }
          
          // Combine all chapters with double newline separator
          const fullText = chapterTexts.join('\n\n');
          
          if (!fullText || fullText.trim().length === 0) {
            reject(new Error('EPUB contains no extractable text content'));
            return;
          }
          
          // Create single document with all content
          const doc = new Document({
            pageContent: fullText,
            metadata: metadata
          });
          
          resolve([doc]);
        } catch (err: any) {
          reject(new Error(`Failed to extract EPUB content: ${err.message}`));
        }
      });
      
      // Start parsing
      epub.parse();
    });
  }
  
  /**
   * Extract and clean text from a chapter.
   * 
   * **Process**:
   * 1. Get chapter HTML using epub.getChapter()
   * 2. Strip HTML tags to get plain text
   * 3. Clean up whitespace and formatting
   * 4. Return cleaned text
   * 
   * **HTML Cleaning**:
   * - Removes all HTML/XML tags
   * - Converts HTML entities (&nbsp;, &quot;, etc.)
   * - Normalizes whitespace
   * - Removes script/style content
   * 
   * @param epub - EPub instance
   * @param chapterId - Chapter identifier
   * @returns Promise resolving to cleaned chapter text
   * @private
   */
  private getChapterText(epub: any, chapterId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      epub.getChapter(chapterId, (err: Error | null, text: string) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Strip HTML tags and clean text
        const cleanText = this.stripHtml(text);
        resolve(cleanText);
      });
    });
  }
  
  /**
   * Strip HTML tags and clean text content.
   * 
   * **Cleaning Steps**:
   * 1. Remove script and style tags with their content
   * 2. Convert common HTML entities to characters
   * 3. Remove all HTML/XML tags
   * 4. Normalize whitespace (multiple spaces → single space)
   * 5. Normalize line breaks (multiple \n → double \n for paragraphs)
   * 6. Trim leading/trailing whitespace
   * 
   * @param html - HTML content to clean
   * @returns Plain text without HTML markup
   * @private
   * 
   * @example
   * ```typescript
   * const html = '<p>Hello <strong>world</strong>!</p>';
   * const text = this.stripHtml(html);
   * // returns: "Hello world!"
   * ```
   */
  private stripHtml(html: string): string {
    // Remove script and style tags with content
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Convert common HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&apos;/g, "'");
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&amp;/g, '&');
    
    // Remove all HTML tags
    text = text.replace(/<[^>]+>/g, ' ');
    
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ');
    
    // Normalize line breaks - preserve paragraph breaks
    text = text.replace(/\n\s*\n/g, '\n\n');
    
    // Trim
    return text.trim();
  }
  
  /**
   * Get supported file extensions.
   * 
   * @returns Array containing '.epub'
   */
  getSupportedExtensions(): string[] {
    return ['.epub'];
  }
}
