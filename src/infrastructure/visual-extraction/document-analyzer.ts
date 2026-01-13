/**
 * Document Analyzer
 * 
 * Analyzes PDF documents to determine their type:
 * - native: Contains embedded image objects (diagrams, charts)
 * - scanned: Pages are stored as full-page images (OCR scanned)
 * - mixed: Contains both native and scanned content
 * 
 * This determines the extraction strategy:
 * - native → pdfimages + classify
 * - scanned → render pages + detect regions + crop
 */

import * as fs from 'fs';
import { 
  extractPdfImages, 
  getPdfPageDimensions, 
  analyzeImageVsPageSize,
  getPdfPageCount
} from './pdf-page-renderer.js';

/**
 * Document type classification.
 */
export type DocumentType = 'native' | 'scanned' | 'mixed';

/**
 * Result of document analysis.
 */
export interface DocumentAnalysisResult {
  /** Document type */
  type: DocumentType;
  /** Total number of pages */
  pageCount: number;
  /** Number of embedded images found */
  imageCount: number;
  /** Number of page-sized images (indicates scanning) */
  pageSizedImages: number;
  /** Ratio of page-sized images to total images */
  scanRatio: number;
  /** Confidence in the classification (0-1) */
  confidence: number;
}

/**
 * Options for document analysis.
 */
export interface AnalysisOptions {
  /** Maximum number of images to sample (default: 20) */
  sampleSize?: number;
  /** Threshold for classifying as scanned (default: 0.6) */
  scannedThreshold?: number;
  /** Threshold for classifying as mixed (default: 0.2) */
  mixedThreshold?: number;
}

/**
 * Analyze a PDF to determine if it's native or scanned.
 * 
 * Samples embedded images and checks if they match page dimensions.
 * Documents with mostly page-sized images are classified as scanned.
 * 
 * @param pdfPath - Path to the PDF file
 * @param options - Analysis options
 * @returns Analysis result with document type and confidence
 */
export async function analyzeDocumentType(
  pdfPath: string,
  options: AnalysisOptions = {}
): Promise<DocumentAnalysisResult> {
  const {
    sampleSize = 20,
    scannedThreshold = 0.6,
    mixedThreshold = 0.2
  } = options;

  // Verify PDF exists
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF not found: ${pdfPath}`);
  }

  // Get page count and dimensions
  const pageCount = getPdfPageCount(pdfPath);
  const pageDimensions = getPdfPageDimensions(pdfPath);
  
  // Create lookup map for page dimensions
  const pageDimMap = new Map<number, { width: number; height: number }>();
  for (const dim of pageDimensions) {
    pageDimMap.set(dim.pageNumber, { width: dim.width, height: dim.height });
  }

  // Extract embedded images (sample only)
  let extractionResult;
  try {
    extractionResult = await extractPdfImages(pdfPath, {
      minWidth: 50,  // Lower threshold to catch more images
      minHeight: 50
    });
  } catch (err) {
    // If extraction fails, assume it might be scanned
    return {
      type: 'scanned',
      pageCount,
      imageCount: 0,
      pageSizedImages: 0,
      scanRatio: 1,
      confidence: 0.5
    };
  }

  const totalImages = extractionResult.images.length;

  // No embedded images = definitely scanned
  if (totalImages === 0) {
    return {
      type: 'scanned',
      pageCount,
      imageCount: 0,
      pageSizedImages: 0,
      scanRatio: 1,
      confidence: 0.9
    };
  }

  // Sample images for analysis
  const samplesToCheck = Math.min(totalImages, sampleSize);
  const sampleImages = extractionResult.images.slice(0, samplesToCheck);

  // Count page-sized images
  let pageSizedCount = 0;
  
  for (const img of sampleImages) {
    const pageDim = pageDimMap.get(img.pageNumber);
    
    if (pageDim) {
      const analysis = analyzeImageVsPageSize(
        img.width,
        img.height,
        pageDim.width,
        pageDim.height
      );
      
      // Consider it page-sized if it covers significant area
      if (analysis.shouldSkip && analysis.areaCoverage > 0.7) {
        pageSizedCount++;
      }
    }
  }

  // Calculate scan ratio
  const scanRatio = pageSizedCount / samplesToCheck;

  // Determine document type
  let type: DocumentType;
  let confidence: number;

  if (scanRatio >= scannedThreshold) {
    type = 'scanned';
    confidence = Math.min(0.5 + scanRatio * 0.5, 0.95);
  } else if (scanRatio >= mixedThreshold) {
    type = 'mixed';
    confidence = 0.6 + (0.3 * (1 - Math.abs(scanRatio - 0.4) / 0.4));
  } else {
    type = 'native';
    confidence = Math.min(0.5 + (1 - scanRatio) * 0.5, 0.95);
  }

  return {
    type,
    pageCount,
    imageCount: totalImages,
    pageSizedImages: pageSizedCount,
    scanRatio,
    confidence
  };
}

/**
 * Quick check if a document is likely scanned.
 * 
 * Faster than full analysis, just checks first few images.
 * 
 * @param pdfPath - Path to the PDF file
 * @returns true if document appears to be scanned
 */
export async function isLikelyScanned(pdfPath: string): Promise<boolean> {
  const result = await analyzeDocumentType(pdfPath, { sampleSize: 5 });
  return result.type === 'scanned';
}

