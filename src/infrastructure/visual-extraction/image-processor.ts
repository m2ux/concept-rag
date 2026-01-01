/**
 * Image Processor
 * 
 * Handles image processing operations for visual extraction:
 * - Cropping regions from page images
 * - Converting to grayscale
 * - Saving as optimized PNG
 * - Embedding metadata in PNG tEXt chunks
 * 
 * Uses sharp for high-performance image processing.
 */

import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import type { BoundingBox } from './types.js';

/**
 * Metadata to embed in PNG images.
 */
export interface ImageEmbeddedMetadata {
  title?: string;
  author?: string;
  year?: number;
  pageNumber: number;
  imageIndex: number;
  catalogId: number;
  source?: string;
}

/**
 * Image metadata from sharp.
 */
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  channels: number;
}

/**
 * Get image metadata.
 * 
 * @param imagePath - Path to the image file
 * @returns Image metadata
 */
export async function getImageMetadata(imagePath: string): Promise<ImageMetadata> {
  const metadata = await sharp(imagePath).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    channels: metadata.channels || 0
  };
}

/**
 * Crop a region from an image and convert to grayscale.
 * 
 * @param sourcePath - Path to the source image
 * @param outputPath - Path to save the cropped image
 * @param boundingBox - Normalized bounding box (0-1 coordinates)
 * @param options - Processing options
 * @returns Metadata of the cropped image
 */
export async function cropAndGrayscale(
  sourcePath: string,
  outputPath: string,
  boundingBox: BoundingBox,
  options: {
    pngCompression?: number;  // 0-9, higher = smaller file
  } = {}
): Promise<ImageMetadata> {
  const { pngCompression = 6 } = options;

  // Get source image dimensions
  const metadata = await getImageMetadata(sourcePath);
  
  // Convert normalized coordinates to pixels
  const left = Math.round(boundingBox.x * metadata.width);
  const top = Math.round(boundingBox.y * metadata.height);
  const width = Math.round(boundingBox.width * metadata.width);
  const height = Math.round(boundingBox.height * metadata.height);

  // Ensure valid crop dimensions
  const cropWidth = Math.max(1, Math.min(width, metadata.width - left));
  const cropHeight = Math.max(1, Math.min(height, metadata.height - top));

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Crop, convert to grayscale, and save
  await sharp(sourcePath)
    .extract({
      left: Math.max(0, left),
      top: Math.max(0, top),
      width: cropWidth,
      height: cropHeight
    })
    .grayscale()
    .png({ compressionLevel: pngCompression })
    .toFile(outputPath);

  // Return metadata of the output image
  return getImageMetadata(outputPath);
}

/**
 * Build PNG tEXt chunks from embedded metadata.
 * 
 * PNG tEXt chunks are key-value pairs stored in the image file.
 * Standard keys: Title, Author, Description, Copyright, Creation Time, Software
 * Custom keys are also supported.
 * 
 * @param metadata - Metadata to embed
 * @returns Object with tEXt chunk key-value pairs
 */
function buildPngTextChunks(metadata: ImageEmbeddedMetadata): Record<string, string> {
  const chunks: Record<string, string> = {};
  
  if (metadata.title) {
    chunks['Title'] = metadata.title;
  }
  if (metadata.author) {
    chunks['Author'] = metadata.author;
  }
  if (metadata.year) {
    chunks['Creation Time'] = String(metadata.year);
  }
  if (metadata.source) {
    chunks['Source'] = metadata.source;
  }
  
  // Custom metadata fields
  chunks['Page'] = String(metadata.pageNumber);
  chunks['ImageIndex'] = String(metadata.imageIndex);
  chunks['CatalogId'] = String(metadata.catalogId);
  chunks['Software'] = 'concept-rag visual extractor';
  
  return chunks;
}

/**
 * Convert a full page image to grayscale and save.
 * 
 * Used when extracting the entire page as a visual.
 * 
 * @param sourcePath - Path to the source image
 * @param outputPath - Path to save the grayscale image
 * @param options - Processing options
 * @returns Metadata of the output image
 */
export async function convertToGrayscale(
  sourcePath: string,
  outputPath: string,
  options: {
    pngCompression?: number;
    maxWidth?: number;  // Resize if larger than this
    embeddedMetadata?: ImageEmbeddedMetadata;
  } = {}
): Promise<ImageMetadata> {
  const { pngCompression = 6, maxWidth, embeddedMetadata } = options;

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let pipeline = sharp(sourcePath).grayscale();

  // Resize if maxWidth specified and image is larger
  if (maxWidth) {
    const metadata = await getImageMetadata(sourcePath);
    if (metadata.width > maxWidth) {
      pipeline = pipeline.resize(maxWidth, null, { withoutEnlargement: true });
    }
  }

  // Build PNG options with optional text chunks
  const pngOptions: sharp.PngOptions = { compressionLevel: pngCompression };
  
  if (embeddedMetadata) {
    const textChunks = buildPngTextChunks(embeddedMetadata);
    // Sharp doesn't directly support tEXt chunks in png(), so we use withMetadata
    // and write a separate function for full metadata embedding
  }

  await pipeline
    .png(pngOptions)
    .toFile(outputPath);

  // If metadata was requested, re-process to embed it
  if (embeddedMetadata) {
    await embedMetadataInPng(outputPath, embeddedMetadata);
  }

  return getImageMetadata(outputPath);
}

/**
 * Embed metadata into an existing PNG file.
 * 
 * Uses sharp to read and rewrite the image with metadata.
 * This is a two-pass operation: read, then write with metadata.
 * 
 * @param imagePath - Path to the PNG file
 * @param metadata - Metadata to embed
 */
export async function embedMetadataInPng(
  imagePath: string,
  metadata: ImageEmbeddedMetadata
): Promise<void> {
  // Read the existing image
  const imageBuffer = await fs.promises.readFile(imagePath);
  
  // Build EXIF-compatible metadata
  // Sharp supports a subset of EXIF fields via withMetadata
  const exifData: sharp.WriteableMetadata = {};
  
  // Build comment string with all metadata
  const metadataLines = [
    metadata.title ? `Title: ${metadata.title}` : null,
    metadata.author ? `Author: ${metadata.author}` : null,
    metadata.year ? `Year: ${metadata.year}` : null,
    `Page: ${metadata.pageNumber}`,
    `Image Index: ${metadata.imageIndex}`,
    `Catalog ID: ${metadata.catalogId}`,
    metadata.source ? `Source: ${metadata.source}` : null,
    'Software: concept-rag visual extractor'
  ].filter(Boolean).join('\n');

  // Sharp's PNG support for metadata is limited
  // Use EXIF comment field which is preserved in PNG via iTXt/tEXt
  exifData.exif = {
    IFD0: {
      ImageDescription: metadataLines,
      Artist: metadata.author || undefined,
      Software: 'concept-rag visual extractor',
      Copyright: metadata.title ? `From: ${metadata.title}` : undefined,
    }
  };

  // Write back with metadata
  await sharp(imageBuffer)
    .withMetadata(exifData)
    .png({ compressionLevel: 6 })
    .toFile(imagePath + '.tmp');

  // Replace original with new file
  await fs.promises.rename(imagePath + '.tmp', imagePath);
}

/**
 * Get the file size of an image in bytes.
 * 
 * @param imagePath - Path to the image file
 * @returns File size in bytes
 */
export function getImageFileSize(imagePath: string): number {
  const stats = fs.statSync(imagePath);
  return stats.size;
}

/**
 * Check if an image meets minimum size requirements.
 * 
 * @param imagePath - Path to the image file
 * @param minWidth - Minimum width in pixels
 * @param minHeight - Minimum height in pixels
 * @returns True if image meets requirements
 */
export async function meetsMinimumSize(
  imagePath: string,
  minWidth: number,
  minHeight: number
): Promise<boolean> {
  const metadata = await getImageMetadata(imagePath);
  return metadata.width >= minWidth && metadata.height >= minHeight;
}

/**
 * Load an image as a base64 string for sending to Vision LLM.
 * 
 * @param imagePath - Path to the image file
 * @returns Base64-encoded image with data URL prefix
 */
export async function loadImageAsBase64(imagePath: string): Promise<string> {
  const buffer = await fs.promises.readFile(imagePath);
  const base64 = buffer.toString('base64');
  
  // Determine MIME type from extension
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 
                   ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                   'image/png';
  
  return `data:${mimeType};base64,${base64}`;
}

