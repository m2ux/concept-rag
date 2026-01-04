/**
 * EPUB Image Extractor
 * 
 * Extracts images from EPUB files for visual classification and storage.
 * 
 * EPUB Structure:
 * - EPUB files are ZIP archives containing XHTML content + images
 * - Images are listed in the OPF manifest with media-type 'image/*'
 * - Images are referenced from XHTML chapters via <img> tags
 * 
 * Extraction Strategy:
 * 1. Parse EPUB using 'epub' package
 * 2. Extract all images from manifest
 * 3. Map images to chapters by parsing XHTML for <img> references
 * 4. Apply pre-filters (cover, icons, decorative)
 * 5. Return candidate images for classification
 */

import EPub from 'epub';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import sharp from 'sharp';

/**
 * An image extracted from an EPUB file.
 */
export interface EpubImage {
  /** Image ID from manifest */
  manifestId: string;
  /** Image path within EPUB (e.g., "images/figure1.png") */
  href: string;
  /** MIME type (e.g., "image/png") */
  mimeType: string;
  /** Chapter index where image is first referenced (0-based), -1 if not referenced */
  chapterIndex: number;
  /** Chapter title if available */
  chapterTitle?: string;
  /** Image index within chapter (0-based) */
  imageIndex: number;
  /** Path to temp file containing the image */
  tempPath: string;
  /** Image dimensions */
  width: number;
  height: number;
}

/**
 * Pre-filter result for an image.
 */
export interface PreFilterResult {
  /** Whether to skip this image */
  skip: boolean;
  /** Reason for skipping */
  reason?: 'cover' | 'tooSmall' | 'decorative' | 'unsupportedFormat';
}

/**
 * Result of EPUB image extraction.
 */
export interface EpubImageExtractionResult {
  /** Total images in manifest */
  totalImages: number;
  /** Images extracted (passed pre-filters) */
  extractedImages: EpubImage[];
  /** Temp directory containing extracted images */
  tempDir: string;
  /** Images skipped by pre-filter */
  skipped: {
    cover: number;
    tooSmall: number;
    decorative: number;
    unsupportedFormat: number;
  };
  /** Errors encountered */
  errors: string[];
}

/**
 * Options for EPUB image extraction.
 */
export interface EpubExtractionOptions {
  /** Minimum image width in pixels (default: 100) */
  minWidth?: number;
  /** Minimum image height in pixels (default: 100) */
  minHeight?: number;
  /** Skip cover image detection (default: false) */
  skipCoverDetection?: boolean;
}

/**
 * EPUB Image Extractor
 * 
 * Extracts and filters images from EPUB files for visual classification.
 */
export class EpubImageExtractor {
  
  /**
   * Check if a file is an EPUB.
   */
  static isEpub(filePath: string): boolean {
    return filePath.toLowerCase().endsWith('.epub');
  }

  /**
   * Extract all candidate images from an EPUB file.
   * 
   * @param epubPath - Path to the EPUB file
   * @param options - Extraction options
   * @returns Extraction result with candidate images
   */
  async extract(
    epubPath: string,
    options: EpubExtractionOptions = {}
  ): Promise<EpubImageExtractionResult> {
    const {
      minWidth = 100,
      minHeight = 100,
      skipCoverDetection = false
    } = options;

    const result: EpubImageExtractionResult = {
      totalImages: 0,
      extractedImages: [],
      tempDir: '',
      skipped: {
        cover: 0,
        tooSmall: 0,
        decorative: 0,
        unsupportedFormat: 0
      },
      errors: []
    };

    // Create temp directory for extracted images
    result.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'epub-images-'));

    try {
      // Parse EPUB
      const epub = await this.parseEpub(epubPath);
      
      // Get all images from manifest
      const manifestImages = this.getManifestImages(epub);
      result.totalImages = manifestImages.length;

      if (manifestImages.length === 0) {
        return result;
      }

      // Build image-to-chapter mapping
      const chapterMap = await this.buildImageChapterMap(epub);
      
      // Track image index per chapter
      const chapterImageCounts = new Map<number, number>();

      // Process each image
      for (const manifestItem of manifestImages) {
        try {
          // Get image data
          const imageData = await this.getImageData(epub, manifestItem.id);
          
          if (!imageData || imageData.length === 0) {
            result.errors.push(`Empty image data: ${manifestItem.href}`);
            continue;
          }

          // Save to temp file
          const ext = this.getExtensionFromMimeType(manifestItem.mediaType);
          if (!ext) {
            result.skipped.unsupportedFormat++;
            continue;
          }
          
          const tempPath = path.join(result.tempDir, `${manifestItem.id}${ext}`);
          fs.writeFileSync(tempPath, imageData);

          // Get image dimensions
          let width = 0, height = 0;
          try {
            const metadata = await sharp(tempPath).metadata();
            width = metadata.width || 0;
            height = metadata.height || 0;
          } catch {
            result.errors.push(`Failed to read dimensions: ${manifestItem.href}`);
            fs.unlinkSync(tempPath);
            continue;
          }

          // Get chapter info
          const chapterIndex = chapterMap.get(manifestItem.id) ?? -1;
          const currentIndex = chapterImageCounts.get(chapterIndex) || 0;
          chapterImageCounts.set(chapterIndex, currentIndex + 1);

          const epubImage: EpubImage = {
            manifestId: manifestItem.id,
            href: manifestItem.href,
            mimeType: manifestItem.mediaType,
            chapterIndex,
            imageIndex: currentIndex,
            tempPath,
            width,
            height
          };

          // Apply pre-filters
          const preFilter = this.shouldSkipImage(
            epubImage,
            manifestImages,
            { minWidth, minHeight, skipCoverDetection }
          );

          if (preFilter.skip) {
            if (preFilter.reason === 'cover') result.skipped.cover++;
            else if (preFilter.reason === 'tooSmall') result.skipped.tooSmall++;
            else if (preFilter.reason === 'decorative') result.skipped.decorative++;
            
            // Clean up temp file for skipped images
            fs.unlinkSync(tempPath);
            continue;
          }

          result.extractedImages.push(epubImage);

        } catch (err: any) {
          result.errors.push(`Failed to extract ${manifestItem.href}: ${err.message}`);
        }
      }

    } catch (err: any) {
      result.errors.push(`EPUB parsing failed: ${err.message}`);
    }

    return result;
  }

  /**
   * Clean up temporary files from extraction.
   */
  cleanup(result: EpubImageExtractionResult): void {
    if (result.tempDir && fs.existsSync(result.tempDir)) {
      try {
        const files = fs.readdirSync(result.tempDir);
        for (const file of files) {
          try {
            fs.unlinkSync(path.join(result.tempDir, file));
          } catch {
            // Ignore individual file errors
          }
        }
        fs.rmdirSync(result.tempDir);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Parse EPUB file and return parsed instance.
   */
  private parseEpub(epubPath: string): Promise<EPub> {
    return new Promise((resolve, reject) => {
      const epub = new EPub(epubPath);
      
      epub.on('error', (err: Error) => {
        reject(new Error(`Failed to parse EPUB: ${err.message}`));
      });
      
      epub.on('end', () => {
        resolve(epub);
      });
      
      epub.parse();
    });
  }

  /**
   * Get all image items from the EPUB manifest.
   */
  private getManifestImages(epub: EPub): Array<{ id: string; href: string; mediaType: string }> {
    const images: Array<{ id: string; href: string; mediaType: string }> = [];
    
    const manifest = epub.manifest as Record<string, any>;
    
    for (const [id, item] of Object.entries(manifest)) {
      const mediaType = item['media-type'] || '';
      if (mediaType.startsWith('image/')) {
        images.push({
          id,
          href: item.href || id,
          mediaType
        });
      }
    }
    
    return images;
  }

  /**
   * Build mapping from image manifest ID to chapter index.
   */
  private async buildImageChapterMap(epub: EPub): Promise<Map<string, number>> {
    const imageChapterMap = new Map<string, number>();
    
    // epub.flow contains chapters in reading order
    const chapters = epub.flow || [];
    
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      
      try {
        // Get chapter content to find image references
        const chapterContent = await this.getChapterContent(epub, chapter.id);
        
        // Find all image references in the chapter
        const imageRefs = this.extractImageReferences(chapterContent);
        
        for (const ref of imageRefs) {
          // Normalize the reference to match manifest IDs
          const manifestId = this.findManifestIdForReference(epub, ref);
          
          if (manifestId && !imageChapterMap.has(manifestId)) {
            imageChapterMap.set(manifestId, i);
          }
        }
      } catch {
        // Skip chapters that can't be read
      }
    }
    
    return imageChapterMap;
  }

  /**
   * Get chapter content as raw HTML.
   */
  private getChapterContent(epub: EPub, chapterId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      epub.getChapter(chapterId, (err: Error | null, content: string) => {
        if (err) {
          reject(err);
        } else {
          resolve(content);
        }
      });
    });
  }

  /**
   * Extract image references from HTML content.
   */
  private extractImageReferences(html: string): string[] {
    const refs: string[] = [];
    
    // Match <img src="..."> tags
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;
    
    while ((match = imgRegex.exec(html)) !== null) {
      refs.push(match[1]);
    }
    
    // Also match xlink:href for SVG images
    const xlinkRegex = /xlink:href=["']([^"']+)["']/gi;
    while ((match = xlinkRegex.exec(html)) !== null) {
      refs.push(match[1]);
    }
    
    return refs;
  }

  /**
   * Find manifest ID for an image reference.
   */
  private findManifestIdForReference(epub: EPub, ref: string): string | undefined {
    const manifest = epub.manifest as Record<string, any>;
    
    // Normalize the reference (remove path prefixes, decode URI)
    const normalizedRef = this.normalizeImagePath(ref);
    
    for (const [id, item] of Object.entries(manifest)) {
      const mediaType = item['media-type'] || '';
      if (!mediaType.startsWith('image/')) continue;
      
      const normalizedHref = this.normalizeImagePath(item.href || '');
      
      // Check for exact match or filename match
      if (normalizedHref === normalizedRef || 
          normalizedHref.endsWith(normalizedRef) ||
          normalizedRef.endsWith(normalizedHref)) {
        return id;
      }
    }
    
    return undefined;
  }

  /**
   * Normalize image path for comparison.
   */
  private normalizeImagePath(pathStr: string): string {
    // Decode URI components
    let normalized = decodeURIComponent(pathStr);
    
    // Remove leading path components like ../
    normalized = normalized.replace(/^\.\.\/+/g, '');
    
    // Remove leading OEBPS/ or similar
    normalized = normalized.replace(/^(OEBPS|OPS|Content)\//i, '');
    
    return normalized.toLowerCase();
  }

  /**
   * Get image data from EPUB.
   */
  private getImageData(epub: EPub, imageId: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      epub.getImage(imageId, (err: Error | null, data: Buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   * Get file extension from MIME type.
   */
  private getExtensionFromMimeType(mimeType: string): string | null {
    const mimeMap: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'image/bmp': '.bmp'
    };
    
    return mimeMap[mimeType.toLowerCase()] || null;
  }

  /**
   * Determine if an image should be skipped.
   */
  private shouldSkipImage(
    image: EpubImage,
    allImages: Array<{ id: string; href: string; mediaType: string }>,
    options: { minWidth: number; minHeight: number; skipCoverDetection: boolean }
  ): PreFilterResult {
    const { minWidth, minHeight, skipCoverDetection } = options;

    // 1. Skip if too small
    if (image.width < minWidth || image.height < minHeight) {
      return { skip: true, reason: 'tooSmall' };
    }

    // 2. Skip cover images (unless disabled)
    if (!skipCoverDetection && this.isCoverImage(image, allImages)) {
      return { skip: true, reason: 'cover' };
    }

    // 3. Skip decorative images (filename patterns)
    if (this.isDecorativeImage(image)) {
      return { skip: true, reason: 'decorative' };
    }

    return { skip: false };
  }

  /**
   * Detect if an image is likely a cover image.
   */
  private isCoverImage(
    image: EpubImage,
    allImages: Array<{ id: string; href: string; mediaType: string }>
  ): boolean {
    const href = image.href.toLowerCase();
    const id = image.manifestId.toLowerCase();
    
    // Check filename/ID patterns
    const coverPatterns = ['cover', 'title', 'front', 'titlepage'];
    if (coverPatterns.some(p => href.includes(p) || id.includes(p))) {
      return true;
    }
    
    // Check if it's the first image and significantly larger than others
    // (covers are typically portrait and larger than content images)
    if (allImages.length > 0 && allImages[0].id === image.manifestId) {
      const isPortrait = image.height > image.width;
      const isLarge = image.width > 400 && image.height > 600;
      if (isPortrait && isLarge) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Detect if an image is decorative.
   */
  private isDecorativeImage(image: EpubImage): boolean {
    const href = image.href.toLowerCase();
    
    // Check filename patterns for decorative elements
    const decorativePatterns = [
      'divider', 'ornament', 'separator', 'border', 'line',
      'bullet', 'icon', 'arrow', 'button', 'logo',
      'spacer', 'dingbat', 'decoration', 'flourish'
    ];
    
    return decorativePatterns.some(p => href.includes(p));
  }
}

