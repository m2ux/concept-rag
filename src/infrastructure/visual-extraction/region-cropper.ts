/**
 * Region Cropper
 * 
 * Crops detected regions from page images.
 * Used for extracting diagrams from scanned PDF pages.
 */

import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import type { DetectedRegion } from './local-classifier.js';
import type { ImageEmbeddedMetadata } from './image-processor.js';

/**
 * Options for cropping a region.
 */
export interface CropOptions {
  /** Output path for the cropped image */
  outputPath: string;
  /** Padding around the region in pixels (default: 10) */
  padding?: number;
  /** Maximum width for output (will scale down if larger) */
  maxWidth?: number;
  /** Convert to grayscale (default: true) */
  grayscale?: boolean;
  /** PNG compression level 0-9 (default: 6) */
  pngCompression?: number;
  /** Metadata to embed in the image */
  embeddedMetadata?: ImageEmbeddedMetadata;
}

/**
 * Result of cropping a region.
 */
export interface CropResult {
  /** Path to the cropped image */
  outputPath: string;
  /** Width of cropped image in pixels */
  width: number;
  /** Height of cropped image in pixels */
  height: number;
  /** Original region that was cropped */
  region: DetectedRegion;
}

/**
 * Crop a detected region from a page image.
 * 
 * Extracts the specified bounding box, optionally converts to grayscale,
 * and saves with embedded metadata.
 * 
 * @param pageImagePath - Path to the full page image
 * @param region - Detected region with bounding box
 * @param options - Crop options
 * @returns Crop result with output dimensions
 */
export async function cropRegion(
  pageImagePath: string,
  region: DetectedRegion,
  options: CropOptions
): Promise<CropResult> {
  const {
    outputPath,
    padding = 10,
    maxWidth = 1200,
    grayscale = true,
    pngCompression = 6,
    embeddedMetadata
  } = options;

  // Verify source image exists
  if (!fs.existsSync(pageImagePath)) {
    throw new Error(`Page image not found: ${pageImagePath}`);
  }

  // Get source image dimensions
  const metadata = await sharp(pageImagePath).metadata();
  const sourceWidth = metadata.width || 0;
  const sourceHeight = metadata.height || 0;

  // Calculate crop region with padding, bounded by image dimensions
  const x = Math.max(0, region.bbox.x - padding);
  const y = Math.max(0, region.bbox.y - padding);
  const width = Math.min(region.bbox.width + padding * 2, sourceWidth - x);
  const height = Math.min(region.bbox.height + padding * 2, sourceHeight - y);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Build the sharp pipeline
  let pipeline = sharp(pageImagePath)
    .extract({ left: x, top: y, width, height });

  // Convert to grayscale if requested
  if (grayscale) {
    pipeline = pipeline.grayscale();
  }

  // Scale down if too wide
  if (width > maxWidth) {
    pipeline = pipeline.resize(maxWidth, null, {
      withoutEnlargement: true,
      fit: 'inside'
    });
  }

  // Add metadata if provided
  if (embeddedMetadata) {
    const exifData: Record<string, string> = {};
    
    if (embeddedMetadata.title) {
      exifData['ImageDescription'] = embeddedMetadata.title;
    }
    if (embeddedMetadata.author) {
      exifData['Artist'] = embeddedMetadata.author;
    }
    if (embeddedMetadata.year !== undefined) {
      exifData['Copyright'] = `${embeddedMetadata.year}`;
    }
    
    // Build custom metadata string
    const customParts: string[] = [];
    if (embeddedMetadata.pageNumber !== undefined) {
      customParts.push(`page:${embeddedMetadata.pageNumber}`);
    }
    if (embeddedMetadata.imageIndex !== undefined) {
      customParts.push(`index:${embeddedMetadata.imageIndex}`);
    }
    if (embeddedMetadata.catalogId !== undefined) {
      customParts.push(`catalog:${embeddedMetadata.catalogId}`);
    }
    
    if (customParts.length > 0) {
      exifData['Software'] = `concept-rag ${customParts.join(' ')}`;
    }

    pipeline = pipeline.withMetadata({
      exif: {
        IFD0: exifData
      }
    });
  }

  // Save as PNG
  await pipeline
    .png({ compressionLevel: pngCompression })
    .toFile(outputPath);

  // Get output dimensions
  const outputMetadata = await sharp(outputPath).metadata();

  return {
    outputPath,
    width: outputMetadata.width || width,
    height: outputMetadata.height || height,
    region
  };
}

/**
 * Crop multiple regions from a single page image.
 * 
 * More efficient than calling cropRegion() in a loop as it
 * only reads the source image once.
 * 
 * @param pageImagePath - Path to the full page image
 * @param regions - Array of detected regions
 * @param outputDir - Directory to save cropped images
 * @param filenamePrefix - Prefix for output filenames (e.g., "p001")
 * @param options - Crop options (outputPath is ignored)
 * @returns Array of crop results
 */
export async function cropRegions(
  pageImagePath: string,
  regions: DetectedRegion[],
  outputDir: string,
  filenamePrefix: string,
  options: Omit<CropOptions, 'outputPath'> = {}
): Promise<CropResult[]> {
  const results: CropResult[] = [];

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    const filename = `${filenamePrefix}_v${i}.png`;
    const outputPath = path.join(outputDir, filename);

    const result = await cropRegion(pageImagePath, region, {
      ...options,
      outputPath
    });

    results.push(result);
  }

  return results;
}

