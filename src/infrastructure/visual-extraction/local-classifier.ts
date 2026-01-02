/**
 * Local Classifier
 * 
 * TypeScript wrapper for the Python LayoutParser-based classifier.
 * Provides local image classification without requiring Vision LLM API calls.
 * 
 * Two modes:
 * - classify: Determine if an image is a figure/table/skip (for native PDFs)
 * - detect: Find figure/table regions within a page image (for scanned PDFs)
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Result of classifying a single image.
 */
export interface ClassificationResult {
  /** Visual type: figure, table, or skip */
  type: 'figure' | 'table' | 'skip';
  /** Confidence score (0-1) */
  score: number;
  /** Whether to skip this image */
  skip: boolean;
  /** Error message if classification failed */
  error?: string;
}

/**
 * A detected region within a page image.
 */
export interface DetectedRegion {
  /** Visual type: figure or table */
  type: 'figure' | 'table';
  /** Confidence score (0-1) */
  score: number;
  /** Bounding box in pixels */
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Options for classification/detection.
 */
export interface ClassifierOptions {
  /** Minimum confidence score (0-1, default: 0.5) */
  minScore?: number;
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
}

// Paths to Python script and virtual environment
const SCRIPT_PATH = path.resolve(__dirname, '../../../scripts/python/classify_visual.py');
const VENV_PYTHON_LINUX = path.resolve(__dirname, '../../../scripts/python/venv/bin/python3');
const VENV_PYTHON_WIN = path.resolve(__dirname, '../../../scripts/python/venv/Scripts/python.exe');

/**
 * Get the path to the Python interpreter.
 * Prefers the virtual environment if it exists.
 */
function getPythonPath(): string {
  // Check for Linux/Mac venv
  if (fs.existsSync(VENV_PYTHON_LINUX)) {
    return VENV_PYTHON_LINUX;
  }
  // Check for Windows venv
  if (fs.existsSync(VENV_PYTHON_WIN)) {
    return VENV_PYTHON_WIN;
  }
  // Fall back to system Python
  return 'python3';
}

/**
 * Check if the local classifier is available.
 * Returns true if Python script and dependencies are set up.
 */
export function isLocalClassifierAvailable(): boolean {
  // Check if script exists
  if (!fs.existsSync(SCRIPT_PATH)) {
    return false;
  }
  // Check if venv exists (indicates dependencies are installed)
  return fs.existsSync(VENV_PYTHON_LINUX) || fs.existsSync(VENV_PYTHON_WIN);
}

/**
 * Run the Python classification script.
 */
async function runPythonScript(args: string[], timeout: number = 30000): Promise<string> {
  return new Promise((resolve, reject) => {
    const pythonPath = getPythonPath();
    
    const childProcess = spawn(pythonPath, [SCRIPT_PATH, ...args], {
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });
    
    let stdout = '';
    let stderr = '';
    
    const timeoutId = setTimeout(() => {
      childProcess.kill();
      reject(new Error(`Classification timed out after ${timeout}ms`));
    }, timeout);
    
    childProcess.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
    childProcess.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });
    
    childProcess.on('close', (code: number | null) => {
      clearTimeout(timeoutId);
      
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        // Try to parse error from stdout (script outputs JSON errors)
        try {
          const result = JSON.parse(stdout.trim());
          if (result.error) {
            reject(new Error(result.error));
            return;
          }
        } catch {
          // Not JSON, use stderr
        }
        reject(new Error(`Classification failed (code ${code}): ${stderr || stdout}`));
      }
    });
    
    childProcess.on('error', (err: Error) => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to start Python: ${err.message}`));
    });
  });
}

/**
 * Classify a single image using the local model.
 * 
 * Determines if the image is primarily a figure, table, or should be skipped.
 * Used for native PDF images extracted via pdfimages.
 * 
 * @param imagePath - Path to the image file
 * @param options - Classification options
 * @returns Classification result
 */
export async function classifyImage(
  imagePath: string,
  options: ClassifierOptions = {}
): Promise<ClassificationResult> {
  const { minScore = 0.5, timeout = 30000 } = options;
  
  // Verify image exists
  if (!fs.existsSync(imagePath)) {
    return {
      type: 'skip',
      score: 0,
      skip: true,
      error: `Image not found: ${imagePath}`
    };
  }
  
  try {
    const output = await runPythonScript(
      ['classify', imagePath, '--min-score', minScore.toString()],
      timeout
    );
    
    const result = JSON.parse(output);
    
    if (result.error) {
      return {
        type: 'skip',
        score: 0,
        skip: true,
        error: result.error
      };
    }
    
    return result as ClassificationResult;
  } catch (err: any) {
    return {
      type: 'skip',
      score: 0,
      skip: true,
      error: err.message
    };
  }
}

/**
 * Detect diagram regions within a page image.
 * 
 * Returns bounding boxes for all detected figures and tables.
 * Used for scanned PDFs where each page is a single image.
 * 
 * @param imagePath - Path to the page image
 * @param options - Detection options
 * @returns Array of detected regions with bounding boxes
 */
export async function detectRegions(
  imagePath: string,
  options: ClassifierOptions = {}
): Promise<DetectedRegion[]> {
  const { minScore = 0.5, timeout = 60000 } = options;
  
  // Verify image exists
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image not found: ${imagePath}`);
  }
  
  const output = await runPythonScript(
    ['detect', imagePath, '--min-score', minScore.toString()],
    timeout
  );
  
  const result = JSON.parse(output);
  
  if (result.error) {
    throw new Error(result.error);
  }
  
  return result as DetectedRegion[];
}

/**
 * Batch classify multiple images.
 * 
 * Processes images sequentially (model is cached between calls).
 * More efficient than calling classifyImage() in a loop.
 * 
 * @param imagePaths - Array of image paths
 * @param options - Classification options
 * @returns Array of classification results (same order as input)
 */
export async function classifyImages(
  imagePaths: string[],
  options: ClassifierOptions = {}
): Promise<ClassificationResult[]> {
  const results: ClassificationResult[] = [];
  
  for (const imagePath of imagePaths) {
    const result = await classifyImage(imagePath, options);
    results.push(result);
  }
  
  return results;
}

