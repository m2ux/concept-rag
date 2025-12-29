/**
 * Visual Extraction Module
 * 
 * Provides visual extraction capabilities for PDF documents:
 * - PDF page rendering to images
 * - Vision LLM classification (diagram vs photo)
 * - Grayscale image extraction and storage
 * - Semantic description generation
 * 
 * Only diagrams with semantic meaning are stored.
 * Photos, screenshots, and decorative images are filtered out.
 */

export { VisualExtractor, type VisualExtractionResult, type VisualExtractionOptions } from './visual-extractor.js';
export { VisionLLMService, createVisionLLMService, type VisionLLMConfig, type ClassificationResult, type DescriptionResult } from './vision-llm-service.js';
export { renderPdfPages, cleanupRenderedPages, getPdfPageCount, isPdfToolsAvailable, type RenderResult } from './pdf-page-renderer.js';
export { cropAndGrayscale, convertToGrayscale, getImageMetadata, loadImageAsBase64, getImageFileSize, meetsMinimumSize, type ImageMetadata } from './image-processor.js';
export { type BoundingBox, type DetectedVisual, type ExtractedVisual, type PageDetectionResult, type VisualExtractionConfig, type VisualExtractionProgressCallback, DEFAULT_VISUAL_EXTRACTION_CONFIG } from './types.js';

