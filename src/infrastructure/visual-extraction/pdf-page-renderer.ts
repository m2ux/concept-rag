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

