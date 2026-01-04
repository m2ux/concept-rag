/**
 * Visual Extractor
 * 
 * Orchestrates the visual extraction pipeline:
 * 1. Analyze document type (native vs scanned)
 * 2. Extract/render images
 * 3. Classify using LOCAL model (no API cost)
 * 4. Save semantic diagrams as grayscale
 * 
 * Classification is done locally using LayoutParser.
 * Vision LLM is only used for description generation (separate step).
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  extractPdfImages, 
  cleanupExtractedImages, 
  cleanupRenderedPages,
  isPdfImagesAvailable,
  isPdfToolsAvailable,
  getPdfPageDimensions,
  analyzeImageVsPageSize,
  renderPdfPages,
  type ExtractedImage,
  type PdfPageDimensions
} from './pdf-page-renderer.js';
import { convertToGrayscale, getImageMetadata, type ImageEmbeddedMetadata } from './image-processor.js';
import { classifyImage, detectRegions, isLocalClassifierAvailable } from './local-classifier.js';
import { analyzeDocumentType, type DocumentType } from './document-analyzer.js';
import { cropRegion } from './region-cropper.js';
import { EpubImageExtractor, type EpubImage } from './epub-image-extractor.js';
import type { ExtractedVisual, VisualExtractionConfig, VisualExtractionProgressCallback } from './types.js';
import { DEFAULT_VISUAL_EXTRACTION_CONFIG } from './types.js';
import type { VisualType } from '../../domain/models/visual.js';
import { slugifyDocument, formatVisualFilename, type DocumentInfo } from '../utils/slugify.js';

/** Supported document formats for visual extraction */
export type DocumentFormat = 'pdf' | 'epub';

/** Batch size for parallel classification */
const CLASSIFICATION_BATCH_SIZE = 5;

/**
 * Result of visual extraction for a document.
 */
export interface VisualExtractionResult {
  /** Catalog ID of the source document */
  catalogId: number;
  /** Path to source document */
  sourcePath: string;
  /** Human-readable folder slug (e.g., "martin_clean-architecture_2017") */
  folderSlug: string;
  /** Document format (pdf or epub) */
  documentFormat: DocumentFormat;
  /** Document type detected (for PDFs: native/scanned, for EPUBs: always 'native') */
  documentType: DocumentType;
  /** Extracted visuals */
  visuals: ExtractedVisual[];
  /** Pages/chapters processed */
  pagesProcessed: number;
  /** Pages/chapters skipped (no visuals) */
  pagesSkipped: number;
  /** Images classified as non-semantic (not stored) */
  imagesFiltered: number;
  /** Images skipped by pre-filter (page-sized for PDF, cover/decorative for EPUB) */
  imagesPreFiltered: number;
  /** Errors encountered */
  errors: string[];
}

/**
 * Options for visual extraction.
 */
export interface VisualExtractionOptions {
  /** Configuration overrides */
  config?: Partial<VisualExtractionConfig>;
  /** Progress callback */
  onProgress?: VisualExtractionProgressCallback;
  /** Specific pages to process (1-indexed), or all if undefined */
  pages?: number[];
  /** Force document type instead of auto-detecting */
  forceDocumentType?: DocumentType;
  /** Minimum confidence score for classification (0-1, default: 0.5) */
  minClassificationScore?: number;
}

/**
 * Visual Extractor for extracting diagrams from PDF documents.
 * 
 * Uses local classification model for filtering (no API cost).
 * Supports both native PDFs (embedded images) and scanned PDFs (page images).
 */
export class VisualExtractor {
  private config: VisualExtractionConfig;
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
    } = {}
  ) {
    this.config = {
      ...DEFAULT_VISUAL_EXTRACTION_CONFIG,
      ...options.config
    };

    this.imagesDir = path.join(dbPath, 'images');
    
    // Ensure images directory exists
    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true });
    }
  }

  /**
   * Extract visuals from a PDF document.
   * 
   * Automatically detects document type and uses appropriate strategy:
   * - Native PDF: Extract embedded images → classify → save
   * - Scanned PDF: Render pages → detect regions → crop → save
   * 
   * @param pdfPath - Path to the PDF file
   * @param catalogId - Catalog ID for the document
   * @param documentInfo - Document metadata for folder naming
   * @param options - Extraction options
   * @returns Extraction result
   */
  async extractFromPdf(
    pdfPath: string,
    catalogId: number,
    documentInfo: DocumentInfo,
    options: VisualExtractionOptions = {}
  ): Promise<VisualExtractionResult> {
    const { onProgress, forceDocumentType, minClassificationScore = 0.5 } = options;
    
    // Generate human-readable folder slug
    const folderSlug = slugifyDocument({ ...documentInfo, id: catalogId });
    
    // Initialize result
    const result: VisualExtractionResult = {
      catalogId,
      sourcePath: pdfPath,
      folderSlug,
      documentFormat: 'pdf',
      documentType: 'native',
      visuals: [],
      pagesProcessed: 0,
      pagesSkipped: 0,
      imagesFiltered: 0,
      imagesPreFiltered: 0,
      errors: []
    };

    // Verify PDF tools are available
    if (!isPdfImagesAvailable()) {
      result.errors.push('pdfimages not found. Install poppler-utils.');
      return result;
    }

    // Create document-specific images directory
    const catalogImagesDir = path.join(this.imagesDir, folderSlug);
    if (!fs.existsSync(catalogImagesDir)) {
      fs.mkdirSync(catalogImagesDir, { recursive: true });
    }

    try {
      // Step 0: Determine document type
      if (onProgress) {
        onProgress('extracting', 0, 1, 'Analyzing document type...');
      }

      let documentType: DocumentType;
      if (forceDocumentType) {
        documentType = forceDocumentType;
      } else {
        const analysis = await analyzeDocumentType(pdfPath);
        documentType = analysis.type;
      }
      result.documentType = documentType;

      if (onProgress) {
        onProgress('extracting', 0, 1, `Document type: ${documentType}`);
      }

      // Route to appropriate extraction method
      if (documentType === 'scanned') {
        // Skip extraction for scanned documents - OCR text detection is unreliable
        if (onProgress) {
          onProgress('extracting', 1, 1, 'Skipping scanned document');
        }
        result.pagesSkipped = 1;
      } else {
        await this.extractFromNativePdf(
          pdfPath, catalogId, documentInfo, catalogImagesDir, result,
          { onProgress, minScore: minClassificationScore }
        );

        // If ALL images were page-sized (pre-filtered), this is likely a scanned PDF
        // packaged as native - skip it rather than attempting region detection
        if (result.imagesPreFiltered > 0 && 
            result.visuals.length === 0 && 
            result.imagesFiltered === 0) {
          if (onProgress) {
            onProgress('extracting', 1, 1, 'Skipping (all images page-sized, likely scanned)');
          }
          result.documentType = 'scanned';
        }
      }

    } catch (error: any) {
      result.errors.push(`Extraction failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Extract visuals from a native PDF (embedded image objects).
   * 
   * Uses pdfimages to extract embedded images, pre-filters page-sized images,
   * then classifies remaining images using local model.
   */
  private async extractFromNativePdf(
    pdfPath: string,
    catalogId: number,
    documentInfo: DocumentInfo,
    outputDir: string,
    result: VisualExtractionResult,
    options: { onProgress?: VisualExtractionProgressCallback; minScore: number }
  ): Promise<void> {
    const { onProgress, minScore } = options;
    const folderSlug = result.folderSlug;

    let extractionResult;
    try {
      // Get PDF page dimensions for pre-filtering
      const pageDimensions = getPdfPageDimensions(pdfPath);
      const pageDimMap = new Map<number, PdfPageDimensions>();
      for (const dim of pageDimensions) {
        pageDimMap.set(dim.pageNumber, dim);
      }

      // Extract embedded images
      if (onProgress) {
        onProgress('extracting', 0, 1, 'Extracting embedded images...');
      }

      extractionResult = await extractPdfImages(pdfPath, {
        minWidth: this.config.minWidth,
        minHeight: this.config.minHeight
      });

      const totalImages = extractionResult.images.length;

      if (totalImages === 0) {
        result.pagesSkipped = 1;
        return;
      }

      if (onProgress) {
        onProgress('extracting', 1, 1, `Found ${totalImages} embedded images`);
      }

      // Pre-filter page-sized images
      const candidateImages: ExtractedImage[] = [];
      
      for (const img of extractionResult.images) {
        const pageDim = pageDimMap.get(img.pageNumber);
        
        if (pageDim) {
          const analysis = analyzeImageVsPageSize(
            img.width,
            img.height,
            pageDim.width,
            pageDim.height
          );
          
          if (analysis.shouldSkip) {
            result.imagesPreFiltered++;
            continue;
          }
        }
        
        candidateImages.push(img);
      }

      if (onProgress && result.imagesPreFiltered > 0) {
        onProgress('extracting', 1, 1, 
          `Pre-filtered ${result.imagesPreFiltered} page-sized, ${candidateImages.length} candidates`);
      }

      // Classify candidates using local model
      const totalCandidates = candidateImages.length;
      
      for (let batchStart = 0; batchStart < totalCandidates; batchStart += CLASSIFICATION_BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + CLASSIFICATION_BATCH_SIZE, totalCandidates);
        const batch = candidateImages.slice(batchStart, batchEnd);

        if (onProgress) {
          onProgress('classifying', batchStart + 1, totalCandidates, 
            `Classifying ${batchStart + 1}-${batchEnd} of ${totalCandidates}`);
        }

        // Process batch in parallel using LOCAL classifier
        const batchResults = await Promise.all(
          batch.map(async (img) => {
            try {
              const classification = await classifyImage(img.imagePath, { minScore });
              return { img, classification, error: null };
            } catch (err: any) {
              return { img, classification: null, error: err.message };
            }
          })
        );

        // Process batch results
        for (const { img, classification, error } of batchResults) {
          if (error) {
            result.errors.push(`Image p${img.pageNumber}_v${img.imageIndex}: ${error}`);
            continue;
          }

          if (!classification || classification.skip) {
            result.imagesFiltered++;
            continue;
          }

          // Save as grayscale with embedded metadata
          await this.saveExtractedImage(
            img.imagePath,
            img.pageNumber,
            img.imageIndex,
            classification.type as VisualType,
            catalogId,
            documentInfo,
            outputDir,
            folderSlug,
            result
          );
        }
      }

    } finally {
      // Clean up temp files
      if (extractionResult) {
        cleanupExtractedImages(extractionResult);
      }
    }
  }

  /**
   * Extract visuals from a scanned PDF (pages stored as images).
   * 
   * Renders each page, detects diagram regions using local model,
   * then crops and saves each detected region.
   */
  private async extractFromScannedPdf(
    pdfPath: string,
    catalogId: number,
    documentInfo: DocumentInfo,
    outputDir: string,
    result: VisualExtractionResult,
    options: { onProgress?: VisualExtractionProgressCallback; minScore: number }
  ): Promise<void> {
    const { onProgress, minScore } = options;
    const folderSlug = result.folderSlug;

    // Check if local classifier is available
    if (!isLocalClassifierAvailable()) {
      result.errors.push(
        'Local classifier not available. Run: cd scripts/python && ./setup.sh'
      );
      return;
    }

    // Check if pdftoppm is available
    if (!isPdfToolsAvailable()) {
      result.errors.push('pdftoppm not found. Install poppler-utils.');
      return;
    }

    let renderResult;
    try {
      // Render PDF pages to images
      if (onProgress) {
        onProgress('extracting', 0, 1, 'Rendering PDF pages...');
      }

      renderResult = await renderPdfPages(pdfPath, {
        dpi: this.config.renderDpi || 150
      });

      const totalPages = renderResult.pageImages.length;

      if (totalPages === 0) {
        result.pagesSkipped = 1;
        return;
      }

      if (onProgress) {
        onProgress('extracting', 1, 1, `Rendered ${totalPages} pages`);
      }

      // Process each page
      for (let i = 0; i < totalPages; i++) {
        const pageImage = renderResult.pageImages[i];
        const pageNumber = i + 1;

        if (onProgress) {
          onProgress('classifying', pageNumber, totalPages, 
            `Detecting regions on page ${pageNumber}`);
        }

        try {
          // Detect diagram regions in this page
          const regions = await detectRegions(pageImage, { minScore });

          if (regions.length === 0) {
            result.pagesSkipped++;
            continue;
          }

          // Crop and save each detected region
          for (let j = 0; j < regions.length; j++) {
            const region = regions[j];
            const outputFilename = formatVisualFilename(pageNumber, j);
            const outputPath = path.join(outputDir, outputFilename);

            // Build embedded metadata
            const embeddedMetadata: ImageEmbeddedMetadata = {
              title: documentInfo.title,
              author: documentInfo.author,
              year: documentInfo.year,
              pageNumber,
              imageIndex: j,
              catalogId
            };

            try {
              const cropResult = await cropRegion(pageImage, region, {
                outputPath,
                grayscale: true,
                maxWidth: 1200,
                pngCompression: this.config.pngCompression,
                embeddedMetadata
              });

              const extractedVisual: ExtractedVisual = {
                pageNumber,
                visualIndex: j,
                type: region.type as VisualType,
                imagePath: path.join('images', folderSlug, outputFilename),
                boundingBox: region.bbox,
                width: cropResult.width,
                height: cropResult.height
              };

              result.visuals.push(extractedVisual);
              result.pagesProcessed++;

            } catch (cropError: any) {
              result.errors.push(`Crop p${pageNumber}_v${j}: ${cropError.message}`);
            }
          }

        } catch (detectError: any) {
          result.errors.push(`Page ${pageNumber}: ${detectError.message}`);
          result.pagesSkipped++;
        }
      }

    } finally {
      // Clean up rendered pages
      if (renderResult) {
        cleanupRenderedPages(renderResult);
      }
    }
  }

  /**
   * Save an extracted image with grayscale conversion and metadata.
   */
  private async saveExtractedImage(
    sourcePath: string,
    pageNumber: number,
    imageIndex: number,
    visualType: VisualType,
    catalogId: number,
    documentInfo: DocumentInfo,
    outputDir: string,
    folderSlug: string,
    result: VisualExtractionResult
  ): Promise<void> {
    const outputFilename = formatVisualFilename(pageNumber, imageIndex);
    const outputPath = path.join(outputDir, outputFilename);

    // Build embedded metadata
    const embeddedMetadata: ImageEmbeddedMetadata = {
      title: documentInfo.title,
      author: documentInfo.author,
      year: documentInfo.year,
      pageNumber,
      imageIndex,
      catalogId
    };

    try {
      await convertToGrayscale(sourcePath, outputPath, {
        pngCompression: this.config.pngCompression,
        maxWidth: 1200,
        embeddedMetadata
      });

      const outputMetadata = await getImageMetadata(outputPath);

      const extractedVisual: ExtractedVisual = {
        pageNumber,
        visualIndex: imageIndex,
        type: visualType,
        imagePath: path.join('images', folderSlug, outputFilename),
        boundingBox: { x: 0, y: 0, width: 1, height: 1 },
        width: outputMetadata.width,
        height: outputMetadata.height
      };

      result.visuals.push(extractedVisual);
      result.pagesProcessed++;

    } catch (saveError: any) {
      result.errors.push(`Save p${pageNumber}_v${imageIndex}: ${saveError.message}`);
    }
  }

  /**
   * Get the path to a stored visual image.
   * 
   * @param folderSlug - Document folder slug (e.g., "martin_clean-architecture_2017")
   * @param pageNumber - Page number (1-indexed)
   * @param visualIndex - Visual index on the page (0-indexed)
   * @returns Full path to the image file
   */
  getVisualPath(folderSlug: string, pageNumber: number, visualIndex: number): string {
    const filename = formatVisualFilename(pageNumber, visualIndex);
    return path.join(this.imagesDir, folderSlug, filename);
  }

  /**
   * Delete all extracted visuals for a document.
   * 
   * @param folderSlug - Document folder slug
   * @returns Number of files deleted
   */
  async deleteVisualsForDocument(folderSlug: string): Promise<number> {
    const docDir = path.join(this.imagesDir, folderSlug);
    
    if (!fs.existsSync(docDir)) {
      return 0;
    }

    const files = fs.readdirSync(docDir);
    let deleted = 0;

    for (const file of files) {
      try {
        fs.unlinkSync(path.join(docDir, file));
        deleted++;
      } catch {
        // Ignore individual file errors
      }
    }

    // Try to remove the directory if empty
    try {
      const remaining = fs.readdirSync(docDir);
      if (remaining.length === 0) {
        fs.rmdirSync(docDir);
      }
    } catch {
      // Ignore directory removal errors
    }

    return deleted;
  }

  /**
   * List all document folders in the images directory.
   * 
   * @returns Array of folder slugs
   */
  listDocumentFolders(): string[] {
    if (!fs.existsSync(this.imagesDir)) {
      return [];
    }
    
    return fs.readdirSync(this.imagesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  }

  /**
   * Extract visuals from a document (auto-detects format).
   * 
   * Routes to appropriate extraction method based on file extension.
   * 
   * @param filePath - Path to the document file (PDF or EPUB)
   * @param catalogId - Catalog ID for the document
   * @param documentInfo - Document metadata for folder naming
   * @param options - Extraction options
   * @returns Extraction result
   */
  async extract(
    filePath: string,
    catalogId: number,
    documentInfo: DocumentInfo,
    options: VisualExtractionOptions = {}
  ): Promise<VisualExtractionResult> {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.pdf') {
      return this.extractFromPdf(filePath, catalogId, documentInfo, options);
    } else if (ext === '.epub') {
      return this.extractFromEpub(filePath, catalogId, documentInfo, options);
    } else {
      throw new Error(`Unsupported document format: ${ext}. Supported formats: .pdf, .epub`);
    }
  }

  /**
   * Extract visuals from an EPUB document.
   * 
   * Extracts images from EPUB, classifies them using local model,
   * and saves semantic diagrams as grayscale images.
   * 
   * @param epubPath - Path to the EPUB file
   * @param catalogId - Catalog ID for the document
   * @param documentInfo - Document metadata for folder naming
   * @param options - Extraction options
   * @returns Extraction result
   */
  async extractFromEpub(
    epubPath: string,
    catalogId: number,
    documentInfo: DocumentInfo,
    options: VisualExtractionOptions = {}
  ): Promise<VisualExtractionResult> {
    const { onProgress, minClassificationScore = 0.5 } = options;
    
    // Generate human-readable folder slug
    const folderSlug = slugifyDocument({ ...documentInfo, id: catalogId });
    
    // Initialize result
    const result: VisualExtractionResult = {
      catalogId,
      sourcePath: epubPath,
      folderSlug,
      documentFormat: 'epub',
      documentType: 'native',  // EPUBs are always "native"
      visuals: [],
      pagesProcessed: 0,
      pagesSkipped: 0,
      imagesFiltered: 0,
      imagesPreFiltered: 0,
      errors: []
    };

    // Create document-specific images directory
    const catalogImagesDir = path.join(this.imagesDir, folderSlug);
    if (!fs.existsSync(catalogImagesDir)) {
      fs.mkdirSync(catalogImagesDir, { recursive: true });
    }

    const epubExtractor = new EpubImageExtractor();
    let extractionResult;

    try {
      // Step 1: Extract images from EPUB
      if (onProgress) {
        onProgress('extracting', 0, 1, 'Extracting images from EPUB...');
      }

      extractionResult = await epubExtractor.extract(epubPath, {
        minWidth: this.config.minWidth,
        minHeight: this.config.minHeight
      });

      // Track pre-filtered images
      result.imagesPreFiltered = 
        extractionResult.skipped.cover + 
        extractionResult.skipped.tooSmall + 
        extractionResult.skipped.decorative +
        extractionResult.skipped.unsupportedFormat;

      const totalImages = extractionResult.extractedImages.length;

      if (totalImages === 0) {
        if (onProgress) {
          onProgress('extracting', 1, 1, 'No candidate images found');
        }
        result.pagesSkipped = 1;
        return result;
      }

      if (onProgress) {
        onProgress('extracting', 1, 1, 
          `Found ${totalImages} candidate images (${result.imagesPreFiltered} pre-filtered)`);
      }

      // Step 2: Classify candidates using local model
      for (let batchStart = 0; batchStart < totalImages; batchStart += CLASSIFICATION_BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + CLASSIFICATION_BATCH_SIZE, totalImages);
        const batch = extractionResult.extractedImages.slice(batchStart, batchEnd);

        if (onProgress) {
          onProgress('classifying', batchStart + 1, totalImages, 
            `Classifying ${batchStart + 1}-${batchEnd} of ${totalImages}`);
        }

        // Process batch in parallel using LOCAL classifier
        const batchResults = await Promise.all(
          batch.map(async (img) => {
            try {
              const classification = await classifyImage(img.tempPath, { minScore: minClassificationScore });
              return { img, classification, error: null };
            } catch (err: any) {
              return { img, classification: null, error: err.message };
            }
          })
        );

        // Process batch results
        for (const { img, classification, error } of batchResults) {
          if (error) {
            result.errors.push(`Image ${img.manifestId}: ${error}`);
            continue;
          }

          if (!classification || classification.skip) {
            result.imagesFiltered++;
            continue;
          }

          // Save as grayscale with embedded metadata
          await this.saveEpubImage(
            img,
            classification.type as VisualType,
            catalogId,
            documentInfo,
            catalogImagesDir,
            folderSlug,
            result
          );
        }
      }

      // Add extraction errors
      if (extractionResult.errors.length > 0) {
        result.errors.push(...extractionResult.errors);
      }

    } catch (error: any) {
      result.errors.push(`EPUB extraction failed: ${error.message}`);
    } finally {
      // Clean up temp files
      if (extractionResult) {
        epubExtractor.cleanup(extractionResult);
      }
    }

    return result;
  }

  /**
   * Save an extracted EPUB image with grayscale conversion and metadata.
   */
  private async saveEpubImage(
    epubImage: EpubImage,
    visualType: VisualType,
    catalogId: number,
    documentInfo: DocumentInfo,
    outputDir: string,
    folderSlug: string,
    result: VisualExtractionResult
  ): Promise<void> {
    // Use chapter index for naming (since EPUBs don't have pages)
    // Add 1 to make it 1-indexed like PDF pages
    const chapterNum = epubImage.chapterIndex >= 0 ? epubImage.chapterIndex + 1 : 0;
    const outputFilename = formatVisualFilename(chapterNum, epubImage.imageIndex);
    const outputPath = path.join(outputDir, outputFilename);

    // Build embedded metadata
    const embeddedMetadata: ImageEmbeddedMetadata = {
      title: documentInfo.title,
      author: documentInfo.author,
      year: documentInfo.year,
      pageNumber: chapterNum,  // Use chapter as "page"
      imageIndex: epubImage.imageIndex,
      catalogId,
      source: epubImage.href
    };

    try {
      await convertToGrayscale(epubImage.tempPath, outputPath, {
        pngCompression: this.config.pngCompression,
        maxWidth: 1200,
        embeddedMetadata
      });

      const outputMetadata = await getImageMetadata(outputPath);

      const extractedVisual: ExtractedVisual = {
        pageNumber: chapterNum,  // Store chapter as page number for compatibility
        chapterIndex: epubImage.chapterIndex >= 0 ? epubImage.chapterIndex : undefined,
        chapterTitle: epubImage.chapterTitle,
        visualIndex: epubImage.imageIndex,
        type: visualType,
        imagePath: path.join('images', folderSlug, outputFilename),
        boundingBox: { x: 0, y: 0, width: 1, height: 1 },
        width: outputMetadata.width,
        height: outputMetadata.height
      };

      result.visuals.push(extractedVisual);
      result.pagesProcessed++;

    } catch (saveError: any) {
      result.errors.push(`Save ${epubImage.manifestId}: ${saveError.message}`);
    }
  }
}
