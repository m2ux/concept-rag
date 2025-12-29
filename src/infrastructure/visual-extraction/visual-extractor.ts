/**
 * Visual Extractor
 * 
 * Orchestrates the visual extraction pipeline:
 * 1. Render PDF pages to images
 * 2. Send to Vision LLM for classification
 * 3. Extract and save semantic diagrams as grayscale
 * 
 * Only diagrams with semantic meaning are stored.
 * Photos, screenshots, and decorative images are filtered out.
 */

import * as fs from 'fs';
import * as path from 'path';
import { extractPdfImages, cleanupExtractedImages, isPdfImagesAvailable } from './pdf-page-renderer.js';
import { convertToGrayscale, getImageMetadata } from './image-processor.js';
import { VisionLLMService, createVisionLLMService } from './vision-llm-service.js';
import type { ExtractedVisual, VisualExtractionConfig, VisualExtractionProgressCallback } from './types.js';
import { DEFAULT_VISUAL_EXTRACTION_CONFIG } from './types.js';
import type { VisualType } from '../../domain/models/visual.js';

/**
 * Result of visual extraction for a document.
 */
export interface VisualExtractionResult {
  /** Catalog ID of the source document */
  catalogId: number;
  /** Path to source PDF */
  sourcePath: string;
  /** Extracted visuals */
  visuals: ExtractedVisual[];
  /** Pages processed */
  pagesProcessed: number;
  /** Pages skipped (no visuals) */
  pagesSkipped: number;
  /** Images classified as non-semantic (not stored) */
  imagesFiltered: number;
  /** Errors encountered */
  errors: string[];
}

/**
 * Options for visual extraction.
 */
export interface VisualExtractionOptions {
  /** Configuration overrides */
  config?: Partial<VisualExtractionConfig>;
  /** API key for Vision LLM */
  apiKey?: string;
  /** Vision model to use */
  visionModel?: string;
  /** Progress callback */
  onProgress?: VisualExtractionProgressCallback;
  /** Specific pages to process (1-indexed), or all if undefined */
  pages?: number[];
}

/**
 * Visual Extractor for extracting diagrams from PDF documents.
 */
export class VisualExtractor {
  private config: VisualExtractionConfig;
  private visionService: VisionLLMService;
  private imagesDir: string;

  /**
   * Create a new VisualExtractor.
   * 
   * @param dbPath - Path to the database directory (for images folder)
   * @param options - Extraction options
   */
  constructor(
    dbPath: string,
    options: {
      config?: Partial<VisualExtractionConfig>;
      apiKey?: string;
      visionModel?: string;
    } = {}
  ) {
    this.config = {
      ...DEFAULT_VISUAL_EXTRACTION_CONFIG,
      ...options.config
    };

    this.visionService = createVisionLLMService({
      apiKey: options.apiKey,
      model: options.visionModel
    });

    this.imagesDir = path.join(dbPath, 'images');
    
    // Ensure images directory exists
    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true });
    }
  }

  /**
   * Extract visuals from a PDF document.
   * 
   * Uses pdfimages to extract embedded images from the PDF,
   * then classifies each image to filter out photos/decorative images.
   * 
   * @param pdfPath - Path to the PDF file
   * @param catalogId - Catalog ID for the document
   * @param options - Extraction options
   * @returns Extraction result
   */
  async extractFromPdf(
    pdfPath: string,
    catalogId: number,
    options: {
      onProgress?: VisualExtractionProgressCallback;
      pages?: number[];
    } = {}
  ): Promise<VisualExtractionResult> {
    const { onProgress } = options;
    
    const result: VisualExtractionResult = {
      catalogId,
      sourcePath: pdfPath,
      visuals: [],
      pagesProcessed: 0,
      pagesSkipped: 0,
      imagesFiltered: 0,
      errors: []
    };

    // Verify pdfimages is available
    if (!isPdfImagesAvailable()) {
      result.errors.push('pdfimages not found. Install poppler-utils.');
      return result;
    }

    // Create catalog-specific images directory
    const catalogImagesDir = path.join(this.imagesDir, catalogId.toString());
    if (!fs.existsSync(catalogImagesDir)) {
      fs.mkdirSync(catalogImagesDir, { recursive: true });
    }

    let extractionResult;
    try {
      // Step 1: Extract embedded images from PDF
      if (onProgress) {
        onProgress('extracting', 0, 1, 'Extracting images from PDF...');
      }

      extractionResult = await extractPdfImages(pdfPath, {
        minWidth: this.config.minWidth,
        minHeight: this.config.minHeight
      });

      const totalImages = extractionResult.images.length;

      if (totalImages === 0) {
        result.pagesSkipped = 1;
        return result;
      }

      if (onProgress) {
        onProgress('extracting', 1, 1, `Found ${totalImages} images`);
      }

      // Step 2: Classify and process each extracted image
      for (let i = 0; i < totalImages; i++) {
        const img = extractionResult.images[i];

        if (onProgress) {
          onProgress('classifying', i + 1, totalImages, `Classifying image ${i + 1}`);
        }

        try {
          // Classify the image
          const classification = await this.visionService.classifyImage(img.imagePath);

          if (classification.type === 'skip') {
            result.imagesFiltered++;
            continue;
          }

          // Step 3: Save as grayscale with consistent naming
          const outputFilename = `p${img.pageNumber}_v${img.imageIndex}.png`;
          const outputPath = path.join(catalogImagesDir, outputFilename);

          await convertToGrayscale(img.imagePath, outputPath, {
            pngCompression: this.config.pngCompression,
            maxWidth: 1200  // Limit max width for storage
          });

          const outputMetadata = await getImageMetadata(outputPath);

          const extractedVisual: ExtractedVisual = {
            pageNumber: img.pageNumber,
            visualIndex: img.imageIndex,
            type: classification.type as VisualType,
            imagePath: path.join('images', catalogId.toString(), outputFilename),
            boundingBox: { x: 0, y: 0, width: 1, height: 1 },  // Full image
            width: outputMetadata.width,
            height: outputMetadata.height
          };

          result.visuals.push(extractedVisual);
          result.pagesProcessed++;

        } catch (imgError: any) {
          result.errors.push(`Image ${i + 1}: ${imgError.message}`);
        }
      }

    } catch (error: any) {
      result.errors.push(`Extraction failed: ${error.message}`);
    } finally {
      // Clean up extracted images from temp directory
      if (extractionResult) {
        cleanupExtractedImages(extractionResult);
      }
    }

    return result;
  }

  /**
   * Get the path to a stored visual image.
   * 
   * @param catalogId - Catalog ID
   * @param pageNumber - Page number (1-indexed)
   * @param visualIndex - Visual index on the page (0-indexed)
   * @returns Full path to the image file
   */
  getVisualPath(catalogId: number, pageNumber: number, visualIndex: number): string {
    const filename = `p${pageNumber}_v${visualIndex}.png`;
    return path.join(this.imagesDir, catalogId.toString(), filename);
  }

  /**
   * Delete all extracted visuals for a catalog entry.
   * 
   * @param catalogId - Catalog ID
   * @returns Number of files deleted
   */
  async deleteVisualsForCatalog(catalogId: number): Promise<number> {
    const catalogDir = path.join(this.imagesDir, catalogId.toString());
    
    if (!fs.existsSync(catalogDir)) {
      return 0;
    }

    const files = fs.readdirSync(catalogDir);
    let deleted = 0;

    for (const file of files) {
      try {
        fs.unlinkSync(path.join(catalogDir, file));
        deleted++;
      } catch {
        // Ignore individual file errors
      }
    }

    // Try to remove the directory if empty
    try {
      const remaining = fs.readdirSync(catalogDir);
      if (remaining.length === 0) {
        fs.rmdirSync(catalogDir);
      }
    } catch {
      // Ignore directory removal errors
    }

    return deleted;
  }
}

