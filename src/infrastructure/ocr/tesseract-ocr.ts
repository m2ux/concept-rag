/**
 * Tesseract OCR Service
 * 
 * Provides OCR processing for scanned PDF documents using local Tesseract installation.
 * Converts PDFs to images using pdftoppm, then processes each page with Tesseract.
 * 
 * Requirements:
 * - Ubuntu/Debian: sudo apt install poppler-utils tesseract-ocr
 * - macOS: brew install poppler tesseract
 * - Windows: Install from official sources
 */

import { Document } from "@langchain/core/documents";
import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * OCR processing statistics
 */
export interface OcrStats {
  totalPages: number;
  totalChars: number;
  success: boolean;
}

/**
 * OCR processing result
 */
export interface OcrResult {
  documents: Document[];
  ocrStats: OcrStats;
}

/**
 * Progress callback for OCR processing
 */
export type OcrProgressCallback = (stage: 'converting' | 'processing', current: number, total: number) => void;

/**
 * Draw ASCII progress bar for OCR processing stages
 * 
 * @param stage - Current processing stage ('converting' or 'processing')
 * @param current - Current page number
 * @param total - Total page count
 * @param width - Progress bar width in characters (default: 40)
 * @returns Formatted progress bar string
 */
export function drawOcrProgressBar(
  stage: 'converting' | 'processing',
  current: number,
  total: number,
  width: number = 40
): string {
  let percentage: number;
  let statusText: string;
  
  if (stage === 'converting') {
    // PDF conversion progress: 0% to 15%
    if (current >= total) {
      percentage = 15;
      statusText = `Converted ${total} pages to images`;
    } else {
      percentage = current === 0 ? 1 : Math.round((current / Math.max(total, 1)) * 15);
      statusText = `Converting page ${current}/${total} to images`;
    }
  } else {
    // OCR processing: 15% to 100% (85% of total work)
    const ocrProgress = (current / total) * 85;
    percentage = Math.round(15 + ocrProgress);
    statusText = `OCR processing page ${current}/${total}`;
  }
  
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const progress = `🔍 OCR Progress: [${bar}] ${percentage}% (${statusText})`;
  
  // Pad with spaces to ensure complete line overwrite
  return progress.padEnd(120, ' ');
}

/**
 * Convert PDF file to base64 string
 * 
 * @param filePath - Path to PDF file
 * @returns Base64-encoded PDF content
 */
export function pdfToBase64(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return fileBuffer.toString('base64');
}

/**
 * Check if required OCR tools are installed
 * 
 * @throws Error if required tools are missing
 */
export function checkOcrToolsAvailable(): void {
  try {
    execSync('pdftoppm --help', { stdio: 'ignore' });
    execSync('tesseract --help', { stdio: 'ignore' });
    execSync('pdfinfo -h', { stdio: 'ignore' });
  } catch {
    throw new Error(
      'Required tools missing. Install: sudo apt install poppler-utils tesseract-ocr (Ubuntu) ' +
      'or brew install poppler tesseract (macOS)'
    );
  }
}

/**
 * Get PDF page count using pdfinfo
 * 
 * @param pdfPath - Path to PDF file
 * @returns Page count, or 1 if detection fails
 */
export function getPdfPageCount(pdfPath: string): number {
  try {
    const pdfInfo = execSync(`pdfinfo "${pdfPath}"`, { encoding: 'utf-8', stdio: 'pipe' });
    const pageMatch = pdfInfo.match(/Pages:\s*(\d+)/);
    if (pageMatch) {
      return parseInt(pageMatch[1]);
    }
  } catch {
    // If pdfinfo fails, return default
  }
  return 1;
}

/**
 * Process a PDF file with Tesseract OCR
 * 
 * Converts PDF pages to images using pdftoppm, then processes each image
 * with Tesseract to extract text. Returns Document objects compatible with
 * LangChain document processing.
 * 
 * @param pdfPath - Path to the PDF file to process
 * @param options - Optional configuration
 * @param options.showProgress - Whether to show progress bar (default: true)
 * @param options.debug - Whether to show debug output (default: false)
 * @param options.conversionTimeout - Timeout for PDF conversion in ms (default: 600000)
 * @param options.pageTimeout - Timeout per page OCR in ms (default: 60000)
 * @returns OCR result with documents and statistics
 */
export async function processWithTesseract(
  pdfPath: string,
  options: {
    showProgress?: boolean;
    debug?: boolean;
    conversionTimeout?: number;
    pageTimeout?: number;
  } = {}
): Promise<OcrResult> {
  const {
    showProgress = true,
    debug = process.env.DEBUG_OCR === 'true',
    conversionTimeout = 600000,
    pageTimeout = 60000
  } = options;

  const tempDir = os.tmpdir();
  const fileName = path.basename(pdfPath, '.pdf');
  const tempImagePrefix = path.join(tempDir, `ocr_${fileName}`);

  try {
    // Step 1: Check if required tools are available
    checkOcrToolsAvailable();

    // Step 2: Get page count first
    const pageCount = getPdfPageCount(pdfPath);

    // Show conversion start
    if (showProgress) {
      process.stdout.write('\r' + drawOcrProgressBar('converting', 0, pageCount));
    }

    // Step 3: Convert PDF to PNG images with real-time progress monitoring
    await new Promise<void>((resolve, reject) => {
      const pdftoppm = spawn('pdftoppm', ['-png', '-r', '150', pdfPath, tempImagePrefix]);

      let conversionError = '';

      if (debug) {
        pdftoppm.stderr?.on('data', (data) => {
          console.log(`\n🔧 pdftoppm: ${data}`);
        });
      }

      pdftoppm.stderr?.on('data', (data) => {
        conversionError += data.toString();
      });

      // Monitor progress by checking generated files
      const progressCheckInterval = setInterval(() => {
        try {
          const currentFiles = fs.readdirSync(tempDir)
            .filter((file: string) => file.startsWith(path.basename(tempImagePrefix)) && file.endsWith('.png'));

          if (currentFiles.length > 0 && showProgress) {
            process.stdout.write('\r' + drawOcrProgressBar('converting', currentFiles.length, pageCount));
          }
        } catch {
          // Ignore errors during progress check
        }
      }, 500);

      pdftoppm.on('close', (code) => {
        clearInterval(progressCheckInterval);

        if (code === 0) {
          if (showProgress) {
            process.stdout.write('\r' + drawOcrProgressBar('converting', pageCount, pageCount));
          }
          resolve();
        } else {
          reject(new Error(`PDF conversion failed with code ${code}: ${conversionError}`));
        }
      });

      pdftoppm.on('error', (err) => {
        clearInterval(progressCheckInterval);
        reject(new Error(`Failed to start pdftoppm: ${err.message}`));
      });

      // Set timeout
      setTimeout(() => {
        clearInterval(progressCheckInterval);
        pdftoppm.kill();
        reject(new Error('PDF conversion timeout (>10 minutes)'));
      }, conversionTimeout);
    });

    // Step 4: Find all generated image files
    const imageFiles = fs.readdirSync(tempDir)
      .filter((file: string) => file.startsWith(path.basename(tempImagePrefix)) && file.endsWith('.png'))
      .sort()
      .map((file: string) => path.join(tempDir, file));

    if (imageFiles.length === 0) {
      throw new Error('No image files generated from PDF conversion');
    }

    // Step 5: OCR each image with Tesseract
    const documents: Document[] = [];
    let totalChars = 0;
    let errorCount = 0;

    for (let i = 0; i < imageFiles.length; i++) {
      const imageFile = imageFiles[i];
      const pageNumber = i + 1;

      // Update progress bar
      if (showProgress) {
        process.stdout.write('\r' + drawOcrProgressBar('processing', pageNumber, imageFiles.length));
      }

      try {
        // Run tesseract on the image
        const ocrText = execSync(`tesseract "${imageFile}" stdout`, {
          encoding: 'utf-8',
          timeout: pageTimeout,
          stdio: ['pipe', 'pipe', 'ignore']
        });

        if (ocrText && ocrText.trim().length > 10) {
          const cleanText = ocrText.trim();
          totalChars += cleanText.length;

          documents.push(new Document({
            pageContent: cleanText,
            metadata: {
              source: pdfPath,
              page_number: pageNumber,
              ocr_processed: true,
              ocr_method: 'tesseract_local',
              ocr_confidence: 'good'
            }
          }));
        } else {
          // Still create a document to maintain page structure
          documents.push(new Document({
            pageContent: '[No text content detected on this page]',
            metadata: {
              source: pdfPath,
              page_number: pageNumber,
              ocr_processed: true,
              ocr_method: 'tesseract_local',
              ocr_confidence: 'low'
            }
          }));
        }
      } catch (pageError: any) {
        errorCount++;

        // Create error document to maintain page structure
        documents.push(new Document({
          pageContent: `[OCR failed for this page: ${pageError.message}]`,
          metadata: {
            source: pdfPath,
            page_number: pageNumber,
            ocr_processed: false,
            ocr_method: 'tesseract_local',
            ocr_error: pageError.message
          }
        }));
      }

      // Clean up the temporary image file
      try {
        fs.unlinkSync(imageFile);
      } catch {
        // Ignore cleanup errors
      }
    }

    // Clear progress line and show completion
    if (showProgress) {
      process.stdout.write('\r' + ' '.repeat(120) + '\r');
      console.log(`✅ OCR completed: ${imageFiles.length} pages, ${totalChars} chars${errorCount > 0 ? `, ${errorCount} errors` : ''}`);
    }

    return {
      documents,
      ocrStats: {
        totalPages: documents.length,
        totalChars: totalChars,
        success: documents.length > 0 && totalChars > 50
      }
    };
  } catch (error: any) {
    if (showProgress) {
      console.log(`❌ Tesseract OCR failed: ${error.message}`);
    }

    // Clean up any remaining temporary files
    cleanupTempFiles(tempDir, tempImagePrefix);

    // Return fallback placeholder
    const placeholderText = `Tesseract OCR failed for this PDF.
File: ${path.basename(pdfPath)}
Error: ${error.message}

To fix this, ensure you have installed:
- Ubuntu/Debian: sudo apt install poppler-utils tesseract-ocr
- macOS: brew install poppler tesseract
- Windows: Install from official sources

Alternative: Process manually with other OCR tools.`;

    return {
      documents: [new Document({
        pageContent: placeholderText,
        metadata: {
          source: pdfPath,
          page_number: 1,
          ocr_processed: false,
          ocr_method: 'tesseract_failed',
          ocr_error: error.message
        }
      })],
      ocrStats: {
        totalPages: 1,
        totalChars: placeholderText.length,
        success: false
      }
    };
  }
}

/**
 * Clean up temporary files created during OCR processing
 */
function cleanupTempFiles(tempDir: string, tempImagePrefix: string): void {
  try {
    const tempFiles = fs.readdirSync(tempDir)
      .filter((file: string) => file.startsWith(path.basename(tempImagePrefix)))
      .map((file: string) => path.join(tempDir, file));

    tempFiles.forEach((file: string) => {
      try {
        fs.unlinkSync(file);
      } catch {
        // Ignore cleanup errors
      }
    });
  } catch {
    // Ignore errors
  }
}

