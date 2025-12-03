/**
 * Unit Tests for Tesseract OCR Service
 * 
 * Tests the OCR utility functions and progress bar display.
 * Note: Full integration tests require tesseract and poppler-utils installed.
 */

import { describe, it, expect } from 'vitest';
import { drawOcrProgressBar, pdfToBase64 } from '../tesseract-ocr.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('drawOcrProgressBar', () => {
  describe('converting stage', () => {
    it('should show 1% at start of conversion', () => {
      // EXERCISE
      const result = drawOcrProgressBar('converting', 0, 10);
      
      // VERIFY
      expect(result).toContain('1%');
      expect(result).toContain('Converting page 0/10');
    });
    
    it('should show 15% when conversion is complete', () => {
      // EXERCISE
      const result = drawOcrProgressBar('converting', 10, 10);
      
      // VERIFY
      expect(result).toContain('15%');
      expect(result).toContain('Converted 10 pages');
    });
    
    it('should show intermediate progress during conversion', () => {
      // EXERCISE
      const result = drawOcrProgressBar('converting', 5, 10);
      
      // VERIFY
      expect(result).toContain('Converting page 5/10');
      // Should be between 1% and 15%
      const percentMatch = result.match(/(\d+)%/);
      expect(percentMatch).toBeTruthy();
      const percent = parseInt(percentMatch![1]);
      expect(percent).toBeGreaterThanOrEqual(1);
      expect(percent).toBeLessThanOrEqual(15);
    });
  });
  
  describe('processing stage', () => {
    it('should show progress starting at 15%', () => {
      // EXERCISE
      const result = drawOcrProgressBar('processing', 1, 10);
      
      // VERIFY
      expect(result).toContain('OCR processing page 1/10');
      const percentMatch = result.match(/(\d+)%/);
      expect(percentMatch).toBeTruthy();
      const percent = parseInt(percentMatch![1]);
      expect(percent).toBeGreaterThanOrEqual(15);
    });
    
    it('should show 100% when processing is complete', () => {
      // EXERCISE
      const result = drawOcrProgressBar('processing', 10, 10);
      
      // VERIFY
      expect(result).toContain('100%');
      expect(result).toContain('OCR processing page 10/10');
    });
    
    it('should show halfway progress at ~57%', () => {
      // EXERCISE
      const result = drawOcrProgressBar('processing', 5, 10);
      
      // VERIFY
      // At 50% of processing stage (which is 85% of total), we should be at 15% + 42.5% ≈ 57-58%
      const percentMatch = result.match(/(\d+)%/);
      expect(percentMatch).toBeTruthy();
      const percent = parseInt(percentMatch![1]);
      expect(percent).toBeGreaterThanOrEqual(55);
      expect(percent).toBeLessThanOrEqual(60);
    });
  });
  
  describe('progress bar formatting', () => {
    it('should include progress bar characters', () => {
      // EXERCISE
      const result = drawOcrProgressBar('processing', 5, 10);
      
      // VERIFY
      expect(result).toContain('█');
      expect(result).toContain('░');
      expect(result).toContain('[');
      expect(result).toContain(']');
    });
    
    it('should be padded to at least 120 characters', () => {
      // EXERCISE
      const result = drawOcrProgressBar('converting', 0, 10);
      
      // VERIFY
      expect(result.length).toBeGreaterThanOrEqual(120);
    });
  });
});

describe('pdfToBase64', () => {
  it('should convert a file to base64', () => {
    // SETUP - Create a temporary test file
    const testContent = 'Test PDF content for base64 encoding';
    const tempFile = path.join(os.tmpdir(), `test-${Date.now()}.txt`);
    fs.writeFileSync(tempFile, testContent);
    
    try {
      // EXERCISE
      const result = pdfToBase64(tempFile);
      
      // VERIFY
      expect(result).toBe(Buffer.from(testContent).toString('base64'));
      
      // Verify we can decode it back
      const decoded = Buffer.from(result, 'base64').toString('utf-8');
      expect(decoded).toBe(testContent);
    } finally {
      // CLEANUP
      fs.unlinkSync(tempFile);
    }
  });
  
  it('should handle binary content', () => {
    // SETUP - Create a file with binary content
    const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0xFF, 0xFE, 0xFD]);
    const tempFile = path.join(os.tmpdir(), `test-binary-${Date.now()}.bin`);
    fs.writeFileSync(tempFile, binaryContent);
    
    try {
      // EXERCISE
      const result = pdfToBase64(tempFile);
      
      // VERIFY
      const decoded = Buffer.from(result, 'base64');
      expect(decoded).toEqual(binaryContent);
    } finally {
      // CLEANUP
      fs.unlinkSync(tempFile);
    }
  });
});

