/**
 * Visual Extraction Types
 * 
 * Shared types for the visual extraction pipeline.
 */

import type { VisualType } from '../../domain/models/visual.js';

/**
 * Bounding box for a detected visual region on a page.
 */
export interface BoundingBox {
  /** X coordinate (left edge) as fraction of page width (0-1) */
  x: number;
  /** Y coordinate (top edge) as fraction of page height (0-1) */
  y: number;
  /** Width as fraction of page width (0-1) */
  width: number;
  /** Height as fraction of page height (0-1) */
  height: number;
}

/**
 * A detected visual region on a page.
 */
export interface DetectedVisual {
  /** Classification of the visual */
  type: VisualType | 'skip';
  /** Bounding box (normalized 0-1 coordinates) */
  boundingBox: BoundingBox;
  /** Confidence score (0-1) */
  confidence: number;
  /** Brief description from detection (not full semantic description) */
  caption?: string;
}

/**
 * Result of visual detection on a single page.
 */
export interface PageDetectionResult {
  /** Page number (1-indexed) */
  pageNumber: number;
  /** Path to the rendered page image */
  pageImagePath: string;
  /** Detected visuals on this page */
  visuals: DetectedVisual[];
}

/**
 * Result of extracting a visual region.
 */
export interface ExtractedVisual {
  /** Page number (1-indexed) */
  pageNumber: number;
  /** Index of this visual on the page (0-indexed) */
  visualIndex: number;
  /** Classification of the visual */
  type: VisualType;
  /** Path to the saved image file */
  imagePath: string;
  /** Bounding box used for extraction */
  boundingBox: BoundingBox;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

/**
 * Configuration for visual extraction.
 */
export interface VisualExtractionConfig {
  /** Minimum width in pixels for a visual to be extracted */
  minWidth: number;
  /** Minimum height in pixels for a visual to be extracted */
  minHeight: number;
  /** Maximum number of visuals to extract per page */
  maxVisualsPerPage: number;
  /** DPI for PDF page rendering (higher = more detail, larger files) */
  renderDpi: number;
  /** PNG compression quality (0-9, higher = smaller file, slower) */
  pngCompression: number;
}

/**
 * Default configuration for visual extraction.
 */
export const DEFAULT_VISUAL_EXTRACTION_CONFIG: VisualExtractionConfig = {
  minWidth: 100,
  minHeight: 100,
  maxVisualsPerPage: 10,
  renderDpi: 150,
  pngCompression: 6
};

/**
 * Progress callback for visual extraction operations.
 */
export type VisualExtractionProgressCallback = (
  stage: 'rendering' | 'detecting' | 'extracting' | 'classifying',
  current: number,
  total: number,
  message?: string
) => void;

