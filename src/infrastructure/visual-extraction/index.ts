/**
 * Visual Extraction Module
 * 
 * Provides visual extraction capabilities for PDF documents:
 * - Automatic document type detection (native vs scanned)
 * - Local classification using LayoutParser (no API cost)
 * - PDF page rendering and region detection
 * - Grayscale image extraction and storage
 * - Vision LLM for semantic description generation (separate step)
 * 
 * Only diagrams with semantic meaning are stored.
 * Photos, screenshots, and decorative images are filtered out.
 */

// Main extractor
export { VisualExtractor, type VisualExtractionResult, type VisualExtractionOptions } from './visual-extractor.js';

// Local classifier (no API cost)
export { classifyImage, detectRegions, isLocalClassifierAvailable, type ClassificationResult, type DetectedRegion, type ClassifierOptions } from './local-classifier.js';

// Document analysis
export { analyzeDocumentType, isLikelyScanned, type DocumentType, type DocumentAnalysisResult, type AnalysisOptions } from './document-analyzer.js';

// Region cropping
export { cropRegion, cropRegions, type CropOptions, type CropResult } from './region-cropper.js';

// Vision LLM (for descriptions only)
export { VisionLLMService, createVisionLLMService, type VisionLLMConfig, type DescriptionResult } from './vision-llm-service.js';

// PDF utilities
export { renderPdfPages, cleanupRenderedPages, getPdfPageCount, isPdfToolsAvailable, extractPdfImages, cleanupExtractedImages, getPdfPageDimensions, analyzeImageVsPageSize, type RenderResult, type ImageExtractionResult, type ExtractedImage, type PdfPageDimensions, type PageSizeAnalysis } from './pdf-page-renderer.js';

// Image processing
export { cropAndGrayscale, convertToGrayscale, getImageMetadata, loadImageAsBase64, getImageFileSize, meetsMinimumSize, embedMetadataInPng, type ImageMetadata, type ImageEmbeddedMetadata } from './image-processor.js';

// Types
export { type BoundingBox, type DetectedVisual, type ExtractedVisual, type PageDetectionResult, type VisualExtractionConfig, type VisualExtractionProgressCallback, DEFAULT_VISUAL_EXTRACTION_CONFIG } from './types.js';

