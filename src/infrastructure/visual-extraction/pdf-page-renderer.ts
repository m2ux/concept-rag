/**
 * PDF Page Renderer
 * 
 * Renders PDF pages to PNG images using pdftoppm (from poppler-utils).
 * This is the same approach used by the OCR module.
 * 
 * Requirements:
 * - Ubuntu/Debian: sudo apt install poppler-utils
 * - macOS: brew install poppler
 */

import { spawn, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Result of rendering PDF pages.
 */
export interface RenderResult {
  /** Directory containing the rendered page images */
  outputDir: string;
  /** Paths to rendered page images (sorted by page number) */
  pageImages: string[];
  /** Total number of pages in the PDF */
  pageCount: number;
}

/**
 * Check if poppler-utils (pdftoppm) is available.
 */
export function isPdfToolsAvailable(): boolean {
  try {
    execSync('which pdftoppm', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the number of pages in a PDF file.
 * 
 * @param pdfPath - Path to the PDF file
 * @returns Number of pages, or 1 if cannot be determined
 */
export function getPdfPageCount(pdfPath: string): number {
  try {
    const output = execSync(`pdfinfo "${pdfPath}" 2>/dev/null | grep "^Pages:" | awk '{print $2}'`, {
      encoding: 'utf-8',
      timeout: 30000
    });
    const count = parseInt(output.trim(), 10);
    return isNaN(count) ? 1 : count;
  } catch {
    return 1;
  }
}

/**
 * PDF page dimensions.
 */
export interface PdfPageDimensions {
  /** Page number (1-indexed) */
  pageNumber: number;
  /** Width in points (72 points = 1 inch) */
  width: number;
  /** Height in points */
  height: number;
}

/**
 * Get page dimensions for all pages in a PDF.
 * 
 * Uses pdfinfo to extract MediaBox dimensions.
 * 
 * @param pdfPath - Path to the PDF file
 * @returns Array of page dimensions
 */
export function getPdfPageDimensions(pdfPath: string): PdfPageDimensions[] {
  const dimensions: PdfPageDimensions[] = [];
  
  try {
    // Use pdfinfo with -f and -l to get per-page info
    const pageCount = getPdfPageCount(pdfPath);
    
    // Get page sizes using pdfinfo -f first -l last
    const output = execSync(
      `pdfinfo -f 1 -l ${pageCount} "${pdfPath}" 2>/dev/null | grep "Page.*size:"`,
      { encoding: 'utf-8', timeout: 30000 }
    );
    
    // Parse lines like "Page    1 size: 612 x 792 pts (letter)"
    const lines = output.trim().split('\n');
    for (const line of lines) {
      const match = line.match(/Page\s+(\d+)\s+size:\s+([\d.]+)\s+x\s+([\d.]+)/);
      if (match) {
        dimensions.push({
          pageNumber: parseInt(match[1], 10),
          width: parseFloat(match[2]),
          height: parseFloat(match[3])
        });
      }
    }
  } catch {
    // Fallback: try to get just the first page size
    try {
      const output = execSync(
        `pdfinfo "${pdfPath}" 2>/dev/null | grep "Page size:"`,
        { encoding: 'utf-8', timeout: 10000 }
      );
      const match = output.match(/Page size:\s+([\d.]+)\s+x\s+([\d.]+)/);
      if (match) {
        const width = parseFloat(match[1]);
        const height = parseFloat(match[2]);
        const pageCount = getPdfPageCount(pdfPath);
        // Assume all pages are same size
        for (let i = 1; i <= pageCount; i++) {
          dimensions.push({ pageNumber: i, width, height });
        }
      }
    } catch {
      // Ignore fallback errors
    }
  }
  
  return dimensions;
}

/**
 * Result of page-size analysis.
 */
export interface PageSizeAnalysis {
  /** Whether image should be skipped (too close to page size) */
  shouldSkip: boolean;
  /** Reason for skipping */
  reason?: string;
  /** Coverage percentage (0-1) of the page area */
  areaCoverage: number;
}

/**
 * Check if an image is likely a full page scan.
 * 
 * Compares image dimensions against page dimensions to detect
 * page-sized images (common in OCR-scanned documents).
 * 
 * @param imageWidth - Image width in pixels
 * @param imageHeight - Image height in pixels
 * @param pageWidth - Page width in points
 * @param pageHeight - Page height in points
 * @param dpi - Assumed rendering DPI (default 150)
 * @returns Analysis result
 */
export function analyzeImageVsPageSize(
  imageWidth: number,
  imageHeight: number,
  pageWidth: number,
  pageHeight: number,
  dpi: number = 150
): PageSizeAnalysis {
  // Convert page dimensions from points to pixels at the given DPI
  // 72 points = 1 inch
  const pageWidthPx = (pageWidth / 72) * dpi;
  const pageHeightPx = (pageHeight / 72) * dpi;
  
  // Calculate how much of the page this image covers
  const widthRatio = imageWidth / pageWidthPx;
  const heightRatio = imageHeight / pageHeightPx;
  const areaCoverage = widthRatio * heightRatio;
  
  // Skip if image covers >70% of page (likely a page scan)
  if (areaCoverage > 0.7) {
    return {
      shouldSkip: true,
      reason: `Image covers ${(areaCoverage * 100).toFixed(0)}% of page (likely full-page scan)`,
      areaCoverage
    };
  }
  
  // Skip if image dimensions match page dimensions closely
  // (within 5% on both dimensions = likely the full page)
  if (widthRatio > 0.95 && heightRatio > 0.95) {
    return {
      shouldSkip: true,
      reason: 'Image matches page dimensions (full-page scan)',
      areaCoverage
    };
  }
  
  // Skip horizontal strips that span the page width (headers/footers)
  if (widthRatio > 0.9 && heightRatio < 0.15) {
    return {
      shouldSkip: true,
      reason: 'Horizontal page-width strip (header/footer)',
      areaCoverage
    };
  }
  
  return {
    shouldSkip: false,
    areaCoverage
  };
}

/**
 * Render a PDF file's pages to PNG images.
 * 
 * Uses pdftoppm from poppler-utils for high-quality rendering.
 * Images are saved to a temporary directory.
 * 
 * @param pdfPath - Path to the PDF file
 * @param options - Rendering options
 * @returns Promise resolving to render result
 */
export async function renderPdfPages(
  pdfPath: string,
  options: {
    dpi?: number;
    outputDir?: string;
    pages?: number[];  // Specific pages to render (1-indexed), or all if undefined
    onProgress?: (current: number, total: number) => void;
    timeout?: number;
  } = {}
): Promise<RenderResult> {
  const {
    dpi = 150,
    outputDir = path.join(os.tmpdir(), `pdf-render-${Date.now()}`),
    pages,
    onProgress,
    timeout = 600000
  } = options;

  // Verify tools are available
  if (!isPdfToolsAvailable()) {
    throw new Error(
      'pdftoppm not found. Install poppler-utils:\n' +
      '  Ubuntu/Debian: sudo apt install poppler-utils\n' +
      '  macOS: brew install poppler'
    );
  }

  // Verify PDF exists
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF file not found: ${pdfPath}`);
  }

  // Create output directory
  fs.mkdirSync(outputDir, { recursive: true });

  const pageCount = getPdfPageCount(pdfPath);
  const outputPrefix = path.join(outputDir, 'page');

  // Build pdftoppm command
  const args = [
    '-png',
    '-r', dpi.toString()
  ];

  // Add page range if specific pages requested
  if (pages && pages.length > 0) {
    const minPage = Math.min(...pages);
    const maxPage = Math.max(...pages);
    args.push('-f', minPage.toString(), '-l', maxPage.toString());
  }

  args.push(pdfPath, outputPrefix);

  // Run pdftoppm
  await new Promise<void>((resolve, reject) => {
    const process = spawn('pdftoppm', args);
    
    let stderr = '';
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    const timeoutId = setTimeout(() => {
      process.kill();
      reject(new Error(`PDF rendering timed out after ${timeout}ms`));
    }, timeout);

    process.on('close', (code) => {
      clearTimeout(timeoutId);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`pdftoppm failed with code ${code}: ${stderr}`));
      }
    });

    process.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });

  // Collect rendered page images
  const files = fs.readdirSync(outputDir)
    .filter(f => f.startsWith('page-') && f.endsWith('.png'))
    .sort((a, b) => {
      // Extract page number from filename (page-01.png, page-02.png, etc.)
      const numA = parseInt(a.match(/page-(\d+)\.png/)?.[1] || '0', 10);
      const numB = parseInt(b.match(/page-(\d+)\.png/)?.[1] || '0', 10);
      return numA - numB;
    });

  const pageImages = files.map(f => path.join(outputDir, f));

  // Report progress
  if (onProgress) {
    onProgress(pageImages.length, pageCount);
  }

  return {
    outputDir,
    pageImages,
    pageCount
  };
}

/**
 * Clean up rendered page images.
 * 
 * @param renderResult - Result from renderPdfPages
 */
export function cleanupRenderedPages(renderResult: RenderResult): void {
  try {
    // Delete all files in the output directory
    for (const imagePath of renderResult.pageImages) {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    // Remove the directory if empty
    if (fs.existsSync(renderResult.outputDir)) {
      const remaining = fs.readdirSync(renderResult.outputDir);
      if (remaining.length === 0) {
        fs.rmdirSync(renderResult.outputDir);
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Result of extracting embedded images from PDF.
 */
export interface ImageExtractionResult {
  /** Directory containing extracted images */
  outputDir: string;
  /** Extracted images with page info */
  images: ExtractedImage[];
}

/**
 * Extracted image metadata.
 */
export interface ExtractedImage {
  /** Path to the image file */
  imagePath: string;
  /** Page number (1-indexed) */
  pageNumber: number;
  /** Image index on the page (0-indexed) */
  imageIndex: number;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
}

/**
 * Check if pdfimages is available.
 */
export function isPdfImagesAvailable(): boolean {
  try {
    execSync('which pdfimages', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract embedded images from a PDF file using pdfimages.
 * 
 * This extracts the actual image objects embedded in the PDF,
 * not rendered pages. Much more accurate for finding diagrams.
 * 
 * @param pdfPath - Path to the PDF file
 * @param options - Extraction options
 * @returns Promise resolving to extraction result
 */
export async function extractPdfImages(
  pdfPath: string,
  options: {
    outputDir?: string;
    minWidth?: number;
    minHeight?: number;
    timeout?: number;
  } = {}
): Promise<ImageExtractionResult> {
  const {
    outputDir = path.join(os.tmpdir(), `pdf-images-${Date.now()}`),
    minWidth = 100,
    minHeight = 100,
    timeout = 300000
  } = options;

  // Verify pdfimages is available
  if (!isPdfImagesAvailable()) {
    throw new Error(
      'pdfimages not found. Install poppler-utils:\n' +
      '  Ubuntu/Debian: sudo apt install poppler-utils\n' +
      '  macOS: brew install poppler'
    );
  }

  // Verify PDF exists
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF file not found: ${pdfPath}`);
  }

  // Create output directory
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPrefix = path.join(outputDir, 'img');

  // First, get image list with metadata using -list
  let imageList = '';
  try {
    imageList = execSync(`pdfimages -list "${pdfPath}" 2>/dev/null`, {
      encoding: 'utf-8',
      timeout: 30000
    });
  } catch {
    // pdfimages -list may fail on some PDFs, continue with extraction
  }

  // Parse image list to get page numbers
  const pageMap = new Map<string, number>();  // image index -> page number
  if (imageList) {
    const lines = imageList.split('\n').slice(2);  // Skip header
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const page = parseInt(parts[0], 10);
        const imgNum = parseInt(parts[1], 10);
        if (!isNaN(page) && !isNaN(imgNum)) {
          pageMap.set(imgNum.toString().padStart(3, '0'), page);
        }
      }
    }
  }

  // Extract images as PNG
  await new Promise<void>((resolve, reject) => {
    const process = spawn('pdfimages', ['-png', pdfPath, outputPrefix]);
    
    let stderr = '';
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    const timeoutId = setTimeout(() => {
      process.kill();
      reject(new Error(`Image extraction timed out after ${timeout}ms`));
    }, timeout);

    process.on('close', (code) => {
      clearTimeout(timeoutId);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`pdfimages failed with code ${code}: ${stderr}`));
      }
    });

    process.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });

  // Collect extracted images and filter by size
  const files = fs.readdirSync(outputDir)
    .filter(f => f.startsWith('img-') && f.endsWith('.png'))
    .sort();

  const images: ExtractedImage[] = [];
  const pageImageCounts = new Map<number, number>();  // Track image index per page

  for (const file of files) {
    const imagePath = path.join(outputDir, file);
    
    // Get image dimensions
    let width = 0, height = 0;
    try {
      const result = execSync(`identify -format "%w %h" "${imagePath}"`, {
        encoding: 'utf-8',
        timeout: 5000
      });
      const [w, h] = result.trim().split(' ');
      width = parseInt(w, 10);
      height = parseInt(h, 10);
    } catch {
      // Skip images we can't read
      continue;
    }

    // Filter by minimum size
    if (width < minWidth || height < minHeight) {
      fs.unlinkSync(imagePath);  // Clean up small images
      continue;
    }

    // Extract image number from filename (img-000.png, img-001.png, etc.)
    const match = file.match(/img-(\d+)\.png/);
    const imgNumStr = match?.[1] || '000';
    
    // Get page number from the list output, or default to 1
    let pageNumber = pageMap.get(imgNumStr) || 1;
    
    // Track image index per page
    const currentIndex = pageImageCounts.get(pageNumber) || 0;
    pageImageCounts.set(pageNumber, currentIndex + 1);

    images.push({
      imagePath,
      pageNumber,
      imageIndex: currentIndex,
      width,
      height
    });
  }

  return {
    outputDir,
    images
  };
}

/**
 * Clean up extracted images.
 * 
 * @param result - Result from extractPdfImages
 */
export function cleanupExtractedImages(result: ImageExtractionResult): void {
  try {
    for (const img of result.images) {
      if (fs.existsSync(img.imagePath)) {
        fs.unlinkSync(img.imagePath);
      }
    }
    // Clean any remaining files
    if (fs.existsSync(result.outputDir)) {
      const remaining = fs.readdirSync(result.outputDir);
      for (const f of remaining) {
        fs.unlinkSync(path.join(result.outputDir, f));
      }
      fs.rmdirSync(result.outputDir);
    }
  } catch {
    // Ignore cleanup errors
  }
}

