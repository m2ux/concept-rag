/**
 * OCR Infrastructure Module
 * 
 * Provides OCR processing capabilities for scanned documents.
 */

export {
  processWithTesseract,
  drawOcrProgressBar,
  pdfToBase64,
  checkOcrToolsAvailable,
  getPdfPageCount,
  type OcrStats,
  type OcrResult,
  type OcrProgressCallback
} from './tesseract-ocr.js';


