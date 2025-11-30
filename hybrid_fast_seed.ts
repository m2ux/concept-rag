import * as lancedb from "@lancedb/lancedb";
import minimist from 'minimist';
import {
  RecursiveCharacterTextSplitter
} from 'langchain/text_splitter';
import * as path from 'path';
import { Document } from "@langchain/core/documents";
import * as fs from 'fs';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import * as crypto from 'crypto';
import { execSync, spawn } from 'child_process';
import * as os from 'os';
import * as defaults from './src/config.js';
import { ConceptExtractor } from './src/concepts/concept_extractor.js';
import { ConceptIndexBuilder } from './src/concepts/concept_index.js';
import { ConceptChunkMatcher } from './src/concepts/concept_chunk_matcher.js';
import { DocumentLoaderFactory } from './src/infrastructure/document-loaders/document-loader-factory.js';
import { PDFDocumentLoader } from './src/infrastructure/document-loaders/pdf-loader.js';
import { EPUBDocumentLoader } from './src/infrastructure/document-loaders/epub-loader.js';
import { hashToId, generateStableId } from './src/infrastructure/utils/hash.js';
import { generateCategorySummaries } from './src/concepts/summary_generator.js';
import { parseFilenameMetadata, normalizeText } from './src/infrastructure/utils/filename-metadata-parser.js';
import { SeedingCheckpoint } from './src/infrastructure/checkpoint/seeding-checkpoint.js';
import { ConceptEnricher } from './src/concepts/concept_enricher.js';
import { ParallelConceptExtractor, DocumentSet } from './src/concepts/parallel-concept-extractor.js';
import { ProgressBarDisplay, createProgressBarDisplay } from './src/infrastructure/cli/progress-bar-display.js';

// Setup timestamped logging
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const logsDir = path.join(process.cwd(), 'logs');
const logFile = path.join(logsDir, `seed-${timestamp}.log`);

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Create write stream for log file
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Helper to write to both console and file
function writeToLog(level: string, ...args: any[]) {
    const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    const logLine = `[${new Date().toISOString()}] [${level}] ${message}\n`;
    logStream.write(logLine);
}

/**
 * Note: To suppress Lance Rust library warnings, set RUST_LOG=lance=error before running:
 * 
 * Direct execution:
 *   RUST_LOG=lance=error npx tsx hybrid_fast_seed.ts --filesdir ~/docs
 * 
 * Or use npm script (already configured):
 *   npm run seed -- --filesdir ~/docs
 * 
 * The environment variable must be set before the script runs because
 * the native Rust module reads it during initialization (before any code executes).
 */

// ASCII progress bar utility with gradual progress for both stages
function drawProgressBar(stage: 'converting' | 'processing', current: number, total: number, width: number = 40): string {
    let percentage: number;
    let statusText: string;
    
    if (stage === 'converting') {
        // PDF conversion progress: 0% to 15%
        // Since pdftoppm is synchronous, we show either start (~1%) or complete (15%)
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
    
    // Pad with spaces to ensure complete line overwrite (120 chars should cover most terminals)
    const paddedProgress = progress.padEnd(120, ' ');
    return paddedProgress;
}

// Handle unhandled promise rejections to prevent crashes
process.on('unhandledRejection', (reason: any, promise) => {
    // Only show concise error message, not full stack trace
    const message = reason?.message || String(reason);
    // Skip PDF processing errors since they're handled in the main loop
    if (message.includes('Bad encoding in flate stream') || 
        message.includes('PDF loading timeout') || 
        message.includes('Invalid PDF structure') ||
        message.includes('PDF contains no pages')) {
        return; // Already handled by main error handling
    }
    console.warn(`⚠️  PDF processing error: ${message}`);
});


// Suppress PDF.js warnings that clutter output and add logging to file
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

// Suppress console.warn and log to file
console.warn = (...args: any[]) => {
    const message = args.join(' ');
    const shouldSuppress = message.includes('Ran out of space in font private use area') ||
        message.includes('font private use area') ||
        message.includes('private use area') ||
        message.includes('FormatError') ||
        message.includes('FlateDecode') ||
        message.includes('Empty') && message.includes('stream') ||
        message.includes('charstring command') ||
        message.includes('Unknown type') && message.includes('charstring') ||
        message.includes('TT: undefined function') ||
        message.includes('Indexing all PDF objects') ||
        message.includes('webpack://');
    
    if (!shouldSuppress) {
        writeToLog('WARN', ...args);
        originalConsoleWarn.apply(console, args);
    }
};

// Suppress console.error for the same messages and log to file
console.error = (...args: any[]) => {
    const message = args.join(' ');
    const shouldSuppress = message.includes('Ran out of space in font private use area') ||
        message.includes('font private use area') ||
        message.includes('private use area') ||
        message.includes('FlateDecode') ||
        message.includes('Empty') && message.includes('stream') ||
        message.includes('charstring command') ||
        message.includes('Unknown type') && message.includes('charstring') ||
        message.includes('TT: undefined function') ||
        message.includes('Indexing all PDF objects') ||
        message.includes('Warning:') && message.includes('font');
    
    if (!shouldSuppress) {
        writeToLog('ERROR', ...args);
        originalConsoleError.apply(console, args);
    }
};

// Also suppress console.log for these warnings (some libraries use it) and log to file
console.log = (...args: any[]) => {
    const message = args.join(' ');
    const shouldSuppress = message.includes('Warning:') && (
        message.includes('TT: undefined function') ||
        message.includes('Indexing all PDF objects') ||
        message.includes('Ran out of space in font private use area') ||
        message.includes('font private use area') ||
        message.includes('private use area') ||
        message.includes('FlateDecode') ||
        message.includes('charstring command') ||
        message.includes('Unknown type') && message.includes('charstring') ||
        message.includes('Empty') && message.includes('stream'));
    
    if (!shouldSuppress) {
        writeToLog('INFO', ...args);
        originalConsoleLog.apply(console, args);
    }
};

const argv: minimist.ParsedArgs = minimist(process.argv.slice(2), {
    boolean: ["overwrite", "rebuild-concepts", "auto-reseed", "clean-checkpoint", "resume", "with-wordnet"],
    string: ["dbpath", "filesdir", "max-docs", "parallel"]
});

const databaseDir = argv["dbpath"] || path.join(process.env.HOME || process.env.USERPROFILE || "~", ".concept_rag");
const filesDir = argv["filesdir"];
const overwrite = argv["overwrite"];
const rebuildConcepts = argv["rebuild-concepts"];
const autoReseed = argv["auto-reseed"];
const cleanCheckpoint = argv["clean-checkpoint"];
const resumeMode = argv["resume"];
const maxDocs = argv["max-docs"] ? parseInt(argv["max-docs"], 10) : undefined;
const parallelWorkers = argv["parallel"] ? parseInt(argv["parallel"], 10) : 1;
const openrouterApiKey = process.env.OPENROUTER_API_KEY;

function validateArgs() {
    if (!filesDir) {
        console.error("Please provide a directory with files (--filesdir) to process");
        console.error("Usage: npx tsx hybrid_fast_seed.ts --filesdir <directory> [--dbpath <path>] [options]");
        console.error("");
        console.error("Required:");
        console.error("  --filesdir: Directory containing PDF/EPUB files to process");
        console.error("");
        console.error("Options:");
        console.error("  --dbpath: Database path (default: ~/.concept_rag)");
        console.error("  --overwrite: Drop and recreate all database tables");
        console.error("  --rebuild-concepts: Rebuild concept index even if no new documents");
        console.error("  --auto-reseed: Re-process documents with incomplete metadata");
        console.error("  --resume: Resume from checkpoint (skip already processed documents)");
        console.error("  --clean-checkpoint: Clear checkpoint and start fresh");
        console.error("  --with-wordnet: Enable WordNet enrichment (disabled by default)");
        console.error("  --max-docs N: Process at most N NEW documents (skips already processed, enables batching)");
        console.error("  --parallel N: Process N documents concurrently for concept extraction (default: 1, max: 20)");
        process.exit(1);
    }
    
    if (!openrouterApiKey) {
        console.error("Please set OPENROUTER_API_KEY environment variable");
        process.exit(1);
    }
    
    // Validate parallel workers
    if (parallelWorkers < 1 || parallelWorkers > 20 || isNaN(parallelWorkers)) {
        console.error("--parallel must be a number between 1 and 20");
        process.exit(1);
    }
    
    console.log(`📂 Database: ${databaseDir}`);
    console.log(`🔄 Overwrite mode: ${overwrite}`);
    if (resumeMode) {
        console.log(`🔄 Resume mode: enabled`);
    }
    if (maxDocs) {
        console.log(`📊 Max documents: ${maxDocs}`);
    }
    if (parallelWorkers > 1) {
        console.log(`🚀 Parallel mode: ${parallelWorkers} workers`);
    }
}

// LLM API call for summarization
async function callOpenRouterChat(text: string): Promise<string> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${openrouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/adiom-data/lance-mcp',
            'X-Title': 'Lance MCP Server'
        },
        body: JSON.stringify({
            model: 'x-ai/grok-4-fast',  // Grok-4-fast: blazing fast for simple summaries
            messages: [{
                role: 'user',
                content: `Write a high-level one sentence content overview based on the text below. WRITE THE CONTENT OVERVIEW ONLY:\n\n${text.slice(0, 8000)}`
            }],
            max_tokens: 100,
            temperature: 0.3
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`LLM API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
}

// Convert PDF file to base64 for LLM OCR processing
function pdfToBase64(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    return fileBuffer.toString('base64');
}

// OCR processing (using local Tesseract)
async function callOpenRouterOCR(pdfPath: string): Promise<{ documents: Document[], ocrStats: { totalPages: number, totalChars: number, success: boolean } }> {
    
    const tempDir = os.tmpdir();
    const fileName = path.basename(pdfPath, '.pdf');
    const tempImagePrefix = path.join(tempDir, `ocr_${fileName}`);
    
    try {
        // Step 1: Check if required tools are available
        try {
            execSync('pdftoppm --help', { stdio: 'ignore' });
            execSync('tesseract --help', { stdio: 'ignore' });
            execSync('pdfinfo -h', { stdio: 'ignore' });
        } catch (toolError) {
            throw new Error('Required tools missing. Install: sudo apt install poppler-utils tesseract-ocr (Ubuntu) or brew install poppler tesseract (macOS)');
        }
        
        // Step 2: Get page count first
        let pageCount = 1;
        try {
            // Get actual page count using pdfinfo
            const pdfInfo = execSync(`pdfinfo "${pdfPath}"`, { encoding: 'utf-8', stdio: 'pipe' });
            const pageMatch = pdfInfo.match(/Pages:\s*(\d+)/);
            if (pageMatch) {
                pageCount = parseInt(pageMatch[1]);
            }
        } catch (infoError) {
            // If pdfinfo fails, we'll detect from generated images
        }
        
        // Show conversion start (1% progress to indicate activity)
        process.stdout.write('\r' + drawProgressBar('converting', 0, pageCount));
        
        // Convert PDF to PNG images with real-time progress monitoring
        // Using spawn instead of execSync so we can track progress
        await new Promise<void>((resolve, reject) => {
            const pdftoppm = spawn('pdftoppm', ['-png', '-r', '150', pdfPath, tempImagePrefix]);
            
            let conversionError = '';
            
            if (process.env.DEBUG_OCR) {
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
                    
                    if (currentFiles.length > 0) {
                        process.stdout.write('\r' + drawProgressBar('converting', currentFiles.length, pageCount));
                    }
                } catch (checkError) {
                    // Ignore errors during progress check
                }
            }, 500); // Check every 500ms
            
            pdftoppm.on('close', (code) => {
                clearInterval(progressCheckInterval);
                
                if (code === 0) {
                    // Show conversion complete (15%)
                    process.stdout.write('\r' + drawProgressBar('converting', pageCount, pageCount));
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
            }, 600000);
        });
        
        // Step 3: Find all generated image files
        const imageFiles = fs.readdirSync(tempDir)
            .filter((file: string) => file.startsWith(path.basename(tempImagePrefix)) && file.endsWith('.png'))
            .sort() // Ensure proper page order
            .map((file: string) => path.join(tempDir, file));
        
        if (imageFiles.length === 0) {
            throw new Error('No image files generated from PDF conversion');
        }
        
        // Step 4: OCR each image with Tesseract
        const documents: Document[] = [];
        let totalChars = 0;
        let errorCount = 0;
        
        for (let i = 0; i < imageFiles.length; i++) {
            const imageFile = imageFiles[i];
            const pageNumber = i + 1;
            
            // Update progress bar
            process.stdout.write('\r' + drawProgressBar('processing', pageNumber, imageFiles.length));
            
            try {
                // Run tesseract on the image (suppress stderr to avoid progress bar interference)
                const ocrText = execSync(`tesseract "${imageFile}" stdout`, { 
                    encoding: 'utf-8',
                    timeout: 60000, // 1 minute timeout per page
                    stdio: ['pipe', 'pipe', 'ignore'] // stdin, stdout, stderr - ignore stderr
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
            } catch (cleanupError) {
                // Ignore cleanup errors
            }
        }
        
        // Clear progress line and show completion
        process.stdout.write('\r' + ' '.repeat(120) + '\r');
        console.log(`✅ OCR completed: ${imageFiles.length} pages, ${totalChars} chars${errorCount > 0 ? `, ${errorCount} errors` : ''}`);
        
        const ocrStats = {
            totalPages: documents.length,
            totalChars: totalChars,
            success: documents.length > 0 && totalChars > 50
        };
        
        return { documents, ocrStats };
        
    } catch (error: any) {
        console.log(`❌ Tesseract OCR failed: ${error.message}`);
        
        // Clean up any remaining temporary files
        try {
            const tempFiles = fs.readdirSync(tempDir)
                .filter((file: string) => file.startsWith(path.basename(tempImagePrefix)))
                .map((file: string) => path.join(tempDir, file));
            
            tempFiles.forEach((file: string) => {
                try { fs.unlinkSync(file); } catch {}
            });
        } catch {}
        
        // Return fallback placeholder
        const placeholderText = `Tesseract OCR failed for this PDF.
File: ${path.basename(pdfPath)}
Error: ${error.message}

To fix this, ensure you have installed:
- Ubuntu/Debian: sudo apt install poppler-utils tesseract-ocr
- macOS: brew install poppler tesseract
- Windows: Install from official sources

Alternative: Process manually with other OCR tools.`;

        const documents = [new Document({
            pageContent: placeholderText,
            metadata: {
                source: pdfPath,
                page_number: 1,
                ocr_processed: false,
                ocr_method: 'tesseract_failed',
                ocr_error: error.message
            }
        })];
        
        const ocrStats = {
            totalPages: 1,
            totalChars: placeholderText.length,
            success: false
        };
        
        return { documents, ocrStats };
    }
}

// Simple local embedding function using TF-IDF-like approach
function createSimpleEmbedding(text: string): number[] {
    // Create a simple 384-dimensional embedding using character/word features
    const embedding = new Array(384).fill(0);
    
    // Use text characteristics to create a unique vector
    const words = text.toLowerCase().split(/\s+/);
    const chars = text.toLowerCase();
    
    // Fill embedding with features based on text content
    for (let i = 0; i < Math.min(words.length, 100); i++) {
        const word = words[i];
        const hash = simpleHash(word);
        embedding[hash % 384] += 1;
    }
    
    // Add character-level features
    for (let i = 0; i < Math.min(chars.length, 1000); i++) {
        const charCode = chars.charCodeAt(i);
        embedding[charCode % 384] += 0.1;
    }
    
    // Add length and structure features
    embedding[0] = text.length / 1000; // Normalized length
    embedding[1] = words.length / 100; // Normalized word count
    embedding[2] = (text.match(/\./g) || []).length / 10; // Sentence count
    
    // Normalize the vector
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => norm > 0 ? val / norm : 0);
}

function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

function truncateFilePath(filePath: string, maxLength: number = 180): string {
    if (filePath.length <= maxLength) {
        return filePath;
    }
    return filePath.slice(0, maxLength - 3) + '...';
}

async function generateContentOverview(rawDocs: Document[]): Promise<string> {
    const combinedText = rawDocs.map(doc => doc.pageContent).join('\n\n').slice(0, 10000);
    
    try {
        const summary = await callOpenRouterChat(combinedText);
        console.log(`✅ Content overview generated`);
        return summary;
    } catch (error) {
        console.warn(`⚠️ LLM summarization failed: ${error.message}`);
        return `Document overview (${rawDocs.length} pages)`;
    }
}

// Check data completeness for a document
interface DataCompletenessCheck {
    hasRecord: boolean;
    hasSummary: boolean;
    hasConcepts: boolean;
    hasChunks: boolean;
    isComplete: boolean;
    missingComponents: string[];
}

async function checkDocumentCompleteness(
    catalogTable: lancedb.Table | null,
    chunksTable: lancedb.Table | null,
    hash: string,
    source: string
): Promise<DataCompletenessCheck> {
    const result: DataCompletenessCheck = {
        hasRecord: false,
        hasSummary: false,
        hasConcepts: false,
        hasChunks: false,
        isComplete: false,
        missingComponents: []
    };
    
    try {
        // Check catalog record exists and has valid data
        if (catalogTable) {
            const query = catalogTable.query().where(`hash="${hash}"`).limit(1);
            const results = await query.toArray();
            
            if (results.length > 0) {
                result.hasRecord = true;
                const record = results[0];
                
                // Check if summary is present and not just a fallback
                const pageContent = record.text || '';
                const isFallbackSummary = 
                    pageContent.startsWith('Document overview (') ||
                    pageContent.trim().length < 10 ||
                    pageContent.includes('LLM summarization failed');
                
                result.hasSummary = !isFallbackSummary;
                
                // Check if concepts were successfully extracted
                if (record.concepts) {
                    try {
                        const concepts = typeof record.concepts === 'string' 
                            ? JSON.parse(record.concepts)
                            : record.concepts;
                        result.hasConcepts = 
                            concepts && 
                            concepts.primary_concepts && 
                            concepts.primary_concepts.length > 0;
                    } catch (e) {
                        result.hasConcepts = false;
                    }
                } else {
                    result.hasConcepts = false;
                }
                
                // Debug logging
                if (process.env.DEBUG_OCR) {
                    console.log(`🔍 Hash ${hash.slice(0, 8)}...: record=${result.hasRecord}, summary=${result.hasSummary}, concepts=${result.hasConcepts}`);
                }
            }
        }
        
        // Check if chunks exist for this document AND have concept metadata
        if (chunksTable && result.hasRecord) {
            try {
                const chunksQuery = chunksTable.query().where(`hash="${hash}"`).limit(10);
                const chunksResults = await chunksQuery.toArray();
                result.hasChunks = chunksResults.length > 0;
                
                // NEW: Also check if chunks have concept metadata
                if (result.hasChunks) {
                    // Sample a few chunks to see if they have concept metadata
                    let chunksWithConcepts = 0;
                    for (const chunk of chunksResults) {
                        try {
                            const concepts = chunk.concepts ? JSON.parse(chunk.concepts) : [];
                            if (Array.isArray(concepts) && concepts.length > 0) {
                                chunksWithConcepts++;
                            }
                        } catch (e) {
                            // Invalid concept data
                        }
                    }
                    
                    // If less than half of sampled chunks have concepts, mark as incomplete
                    if (chunksWithConcepts < chunksResults.length / 2) {
                        result.missingComponents.push('chunk_concepts');
                        if (process.env.DEBUG_OCR) {
                            console.log(`🔍 Hash ${hash.slice(0, 8)}... chunks lack concept metadata (${chunksWithConcepts}/${chunksResults.length} enriched)`);
                        }
                    }
                }
                
                if (process.env.DEBUG_OCR) {
                    console.log(`🔍 Hash ${hash.slice(0, 8)}... chunks: ${result.hasChunks}`);
                }
            } catch (e) {
                // Chunks table might not exist yet
                result.hasChunks = false;
            }
        }
        
        // Determine what's missing
        if (!result.hasRecord) {
            result.missingComponents.push('catalog');
        }
        if (!result.hasSummary) {
            result.missingComponents.push('summary');
        }
        if (!result.hasConcepts) {
            result.missingComponents.push('concepts');
        }
        if (!result.hasChunks) {
            result.missingComponents.push('chunks');
        }
        
        result.isComplete = result.hasRecord && result.hasSummary && result.hasConcepts && result.hasChunks;
        
        return result;
    } catch (error: any) {
        console.warn(`⚠️ Error checking document completeness for hash ${hash.slice(0, 8)}...: ${error.message}`);
        return result;
    }
}

async function catalogRecordExists(catalogTable: lancedb.Table, hash: string): Promise<boolean> {
    try {
        const query = catalogTable.query().where(`hash="${hash}"`).limit(1);
        const results = await query.toArray();
        const exists = results.length > 0;
        
        // Debug logging for hash checking and OCR persistence troubleshooting
        if (process.env.DEBUG_OCR && exists) {
            const record = results[0];
            console.log(`🔍 Hash ${hash.slice(0, 8)}... found in DB: OCR=${record.ocr_processed || false}, source=${path.basename(record.source || '')}`);
        }
        
        return exists;
    } catch (error: any) {
        console.warn(`⚠️ Error checking catalog record for hash ${hash.slice(0, 8)}...: ${error.message}`);
        return false; // If table doesn't exist or query fails, record doesn't exist
    }
}

async function deleteIncompleteDocumentData(
    catalogTable: lancedb.Table | null,
    chunksTable: lancedb.Table | null,
    hash: string,
    source: string,
    missingComponents: string[]
): Promise<void> {
    try {
        // Only delete catalog if summary or concepts are missing
        // (We'll regenerate the catalog entry with corrected data)
        if (catalogTable && (missingComponents.includes('summary') || missingComponents.includes('concepts'))) {
            try {
                await catalogTable.delete(`hash="${hash}"`);
                console.log(`  🗑️  Deleted incomplete catalog entry for ${path.basename(source)}`);
            } catch (e) {
                // Might fail if no matching records, that's okay
            }
        }
        
        // Only delete chunks if chunks are actually missing or corrupted
        // NEVER delete chunks if only concept metadata is missing - we'll re-enrich them in-place
        if (chunksTable && missingComponents.includes('chunks') && !missingComponents.includes('chunk_concepts')) {
            try {
                await chunksTable.delete(`hash="${hash}"`);
                console.log(`  🗑️  Deleted incomplete chunks for ${path.basename(source)}`);
            } catch (e) {
                // Might fail if no matching records, that's okay
            }
        } else if (missingComponents.includes('chunk_concepts')) {
            console.log(`  🔄 Preserving chunks for ${path.basename(source)} (will re-enrich with concept metadata)`);
        } else if (!missingComponents.includes('chunks')) {
            console.log(`  ✅ Preserving existing chunks for ${path.basename(source)} (${missingComponents.join(', ')} will be regenerated)`);
        }
    } catch (error: any) {
        console.warn(`⚠️ Error deleting incomplete data for ${path.basename(source)}: ${error.message}`);
    }
}

async function findDocumentFilesRecursively(
    dir: string,
    extensions: string[] = ['.pdf', '.epub', '.mobi']
): Promise<string[]> {
    const documentFiles: string[] = [];
    
    try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
                // Recursively search subdirectories
                const subDirDocs = await findDocumentFilesRecursively(fullPath, extensions);
                documentFiles.push(...subDirDocs);
            } else if (entry.isFile()) {
                const fileExt = path.extname(entry.name).toLowerCase();
                if (extensions.includes(fileExt)) {
                    documentFiles.push(fullPath);
                }
            }
        }
    } catch (error: any) {
        console.warn(`⚠️ Error scanning directory ${dir}: ${error.message}`);
    }
    
    return documentFiles;
}

async function loadDocumentsWithErrorHandling(
    filesDir: string, 
    catalogTable: lancedb.Table | null, 
    chunksTable: lancedb.Table | null,
    skipExistsCheck: boolean,
    checkpoint?: SeedingCheckpoint
) {
    const documents: Document[] = [];
    const failedFiles: string[] = [];
    const skippedFiles: string[] = [];
    const incompleteFiles: Array<{path: string, missing: string[]}> = [];
    const documentsNeedingChunks = new Set<string>(); // Track which docs need chunking
    
    // Initialize document loader factory
    const loaderFactory = new DocumentLoaderFactory();
    loaderFactory.registerLoader(new PDFDocumentLoader());
    loaderFactory.registerLoader(new EPUBDocumentLoader());
    
    try {
        // Check if filesDir is a file or directory
        const stats = await fs.promises.stat(filesDir);
        if (!stats.isDirectory()) {
            throw new Error(`Path is not a directory: ${filesDir}. Please provide a directory path, not a file path.`);
        }
        
        const supportedExtensions = loaderFactory.getSupportedExtensions();
        console.log(`🔍 Recursively scanning ${filesDir} for document files (${supportedExtensions.join(', ')})...`);
        const documentFiles = await findDocumentFilesRecursively(filesDir, supportedExtensions);
        
        if (!skipExistsCheck && catalogTable) {
            console.log(`📊 Processing ${documentFiles.length} documents...`);
        } else {
            console.log(`📚 Found ${documentFiles.length} document files`);
        }
        
        // Track newly processed count for --max-docs (skipped docs don't count)
        let newlyProcessedCount = 0;
        if (maxDocs && maxDocs > 0) {
            console.log(`📊 Will process up to ${maxDocs} NEW documents (--max-docs), skipping already processed`);
        }
        
        // Use labeled loop so we can break from nested try/catch
        documentLoop: for (const docFile of documentFiles) {
            const relativePath = path.relative(filesDir, docFile);
            
            // Calculate hash first (available for all cases)
            let hash = 'unknown';
            try {
                const fileContent = await fs.promises.readFile(docFile);
                hash = crypto.createHash('sha256').update(fileContent).digest('hex');
            } catch (hashError) {
                // If we can't read the file for hashing, we'll use 'unknown'
            }
            
            try {
                // Check checkpoint first for fast skip (O(1) hash lookup)
                if (checkpoint && checkpoint.isProcessed(hash)) {
                    console.log(`  ⏭[${hash.slice(0, 4)}..${hash.slice(-4)}] ${truncateFilePath(relativePath)} (checkpoint)`);
                    skippedFiles.push(relativePath);
                    continue;
                }
                
                if (!skipExistsCheck && catalogTable && hash !== 'unknown') {
                    // Check completeness instead of just existence
                    const completeness = await checkDocumentCompleteness(
                        catalogTable,
                        chunksTable,
                        hash,
                        docFile
                    );
                    
                    if (completeness.isComplete) {
                        console.log(`  ⏭[${hash.slice(0, 4)}..${hash.slice(-4)}] ${truncateFilePath(relativePath)} (complete)`);
                        skippedFiles.push(relativePath);
                        // Update checkpoint with this complete document (for future runs)
                        if (checkpoint) {
                            await checkpoint.markProcessed(hash, docFile, false);
                        }
                        continue; // Skip loading this file entirely
                    } else if (completeness.hasRecord) {
                        // Document exists but is incomplete - needs reprocessing
                        const missingStr = completeness.missingComponents.join(', ');
                        console.log(`🔄 [${hash.slice(0, 4)}..${hash.slice(-4)}] ${truncateFilePath(relativePath)} (missing: ${missingStr})`);
                        incompleteFiles.push({
                            path: relativePath,
                            missing: completeness.missingComponents
                        });
                        
                        // Track if this document needs chunking or just chunk enrichment
                        const needsChunks = completeness.missingComponents.includes('chunks');
                        const needsChunkConcepts = completeness.missingComponents.includes('chunk_concepts');
                        
                        if (needsChunks) {
                            documentsNeedingChunks.add(docFile);
                        }
                        
                        // Delete incomplete data before reprocessing
                        // Only deletes what's actually missing (preserves intact chunks)
                        await deleteIncompleteDocumentData(
                            catalogTable, 
                            chunksTable, 
                            hash, 
                            docFile, 
                            completeness.missingComponents
                        );
                        
                        // If chunks exist and we only need concepts/summary, skip loading the document
                        // We'll regenerate concepts from existing chunks later
                        if (!needsChunks || needsChunkConcepts) {
                            console.log(`  ⏭️  Skipping document load (chunks exist, only regenerating ${missingStr})`);
                            
                            // Load content from existing chunks for concept regeneration
                            try {
                                const chunkRecords = await chunksTable!
                                    .query()
                                    .where(`hash = "${hash}"`)
                                    .limit(10000) // Get all chunks
                                    .toArray();
                                
                                if (chunkRecords.length > 0) {
                                    console.log(`  📦 Loaded ${chunkRecords.length} existing chunks${needsChunkConcepts ? ' for concept enrichment' : ' for concept extraction'}`);
                                    
                                    // Reconstruct documents from chunks
                                    const reconstructedDocs = chunkRecords.map((chunk: any) => 
                                        new Document({
                                            pageContent: chunk.text || '',
                                            metadata: {
                                                source: docFile,
                                                hash: hash,
                                                page_number: chunk.page_number || 1,
                                                // Preserve chunk ID for in-place updates
                                                chunkId: chunk.id,
                                                // Mark if needs concept enrichment
                                                needsConceptEnrichment: needsChunkConcepts
                                            }
                                        })
                                    );
                                    
                                    documents.push(...reconstructedDocs);
                                    
                                    // Mark for chunk updates if concept enrichment is needed
                                    if (needsChunkConcepts) {
                                        documentsNeedingChunks.add(docFile); // Will trigger re-enrichment
                                    }
                                } else {
                                    console.warn(`  ⚠️  No chunks found despite chunks not being in missing list!`);
                                    // Fall through to load document as fallback
                                }
                                
                                continue; // Skip document loading
                            } catch (error: any) {
                                console.error(`  ❌ Failed to load chunks: ${error.message}`);
                                console.log(`  ⬇️  Falling back to document loading...`);
                                // Fall through to load document as fallback
                            }
                        }
                        
                        // If we reach here, chunks are needed - continue to load the document
                    }
                }
                
                // Get appropriate loader for this file type
                const loader = loaderFactory.getLoader(docFile);
                if (!loader) {
                    throw new Error(`No loader found for file type: ${path.extname(docFile)}`);
                }
                
                // Load document with timeout
                // Note: Timeout only applies to PDF loading; EPUB/MOBI typically faster
                const isPdf = docFile.toLowerCase().endsWith('.pdf');
                const docs = await Promise.race([
                    loader.load(docFile),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Document loading timeout')), 30000)
                    )
                ]) as Document[];
                
                if (docs.length === 0) {
                    throw new Error('Document contains no content');
                }
                
                // Add hash to all document pages for tracking
                docs.forEach(doc => {
                    doc.metadata.hash = hash;
                });
                
                documents.push(...docs);
                
                // New documents need chunking
                documentsNeedingChunks.add(docFile);
                
                // Format output based on document type
                const fileExt = path.extname(docFile).toLowerCase();
                let contentInfo = '';
                if (fileExt === '.pdf') {
                    contentInfo = `${docs.length} pages`;
                } else if (fileExt === '.epub') {
                    contentInfo = `${Math.round(docs[0].pageContent.length / 1000)}k chars`;
                } else {
                    contentInfo = `${docs.length} docs`;
                }
                console.log(`  📥[${hash.slice(0, 4)}..${hash.slice(-4)}] ${truncateFilePath(relativePath)} (${contentInfo})`);
                
                // Check --max-docs limit (only counts newly processed, not skipped)
                newlyProcessedCount++;
                if (maxDocs && maxDocs > 0 && newlyProcessedCount >= maxDocs) {
                    break documentLoop;
                }
            } catch (error: any) {
                const errorMsg = error?.message || String(error);
                const fileExt = path.extname(docFile).toLowerCase();
                
                // Try OCR fallback ONLY for PDFs that failed normal processing
                let ocrAttempted = false;
                let ocrSuccessful = false;
                if (fileExt === '.pdf') {
                    try {
                        console.log(`🔍 OCR processing: ${truncateFilePath(relativePath)}`);
                        const ocrResult = await callOpenRouterOCR(docFile);
                        
                        if (ocrResult && ocrResult.documents && ocrResult.documents.length > 0) {
                            // Add hash to OCR'd document metadata for proper tracking
                            ocrResult.documents.forEach(doc => {
                                doc.metadata.hash = hash;
                            });
                            
                            documents.push(...ocrResult.documents);
                            
                            // OCR documents need chunking
                            documentsNeedingChunks.add(docFile);
                            
                            const hashDisplay = hash !== 'unknown' ? `[${hash.slice(0, 4)}..${hash.slice(-4)}]` : '[????..????]';
                            const { totalPages, totalChars, success } = ocrResult.ocrStats;
                            
                            if (success) {
                                console.log(`✅ ${hashDisplay} ${truncateFilePath(relativePath)} (${totalPages} pages, ${totalChars} chars, OCR)`);
                                ocrSuccessful = true;
                                
                                // Check --max-docs limit for OCR success
                                newlyProcessedCount++;
                                if (maxDocs && maxDocs > 0 && newlyProcessedCount >= maxDocs) {
                                    break documentLoop;
                                }
                            } else {
                                console.log(`⚠️ ${hashDisplay} ${truncateFilePath(relativePath)} (OCR: low quality text extracted)`);
                            }
                            ocrAttempted = true;
                        }
                    } catch (ocrError: any) {
                        const hashDisplay = hash !== 'unknown' ? `[${hash.slice(0, 4)}..${hash.slice(-4)}]` : '[????..????]';
                        console.log(`  ❌${hashDisplay} ${truncateFilePath(relativePath)} (OCR failed: ${ocrError.message})`);
                        ocrAttempted = true;
                    }
                }
                
                // If OCR wasn't successful, handle as error
                if (!ocrSuccessful) {
                    // Only add to failed files if OCR wasn't attempted or failed completely
                    if (!ocrAttempted) {
                        // Clean up common error messages for better readability
                        let cleanErrorMsg = errorMsg;
                        if (errorMsg.includes('Bad encoding in flate stream')) {
                            cleanErrorMsg = 'Bad PDF encoding (OCR not attempted)';
                        } else if (errorMsg.includes('PDF loading timeout')) {
                            cleanErrorMsg = 'Loading timeout (OCR not attempted)';
                        } else if (errorMsg.includes('Invalid PDF structure')) {
                            cleanErrorMsg = 'Invalid PDF format (OCR not attempted)';
                        } else if (errorMsg.includes('PDF contains no pages')) {
                            cleanErrorMsg = 'Empty PDF (OCR not attempted)';
                        } else if (errorMsg.length > 50) {
                            cleanErrorMsg = errorMsg.substring(0, 50) + '... (OCR not attempted)';
                        }
                        
                        const hashDisplay = hash !== 'unknown' ? `[${hash.slice(0, 4)}..${hash.slice(-4)}]` : '[????..????]';
                        console.log(`⚠️ ${hashDisplay} ${truncateFilePath(relativePath)}: ${cleanErrorMsg}`);
                        failedFiles.push(relativePath);
                    } else {
                        // OCR was attempted but failed - already logged above
                        failedFiles.push(relativePath);
                    }
                }
            }
        }
        
        const loadedCount = documentFiles.length - failedFiles.length - skippedFiles.length;
        const ocrProcessedCount = documents.filter(doc => doc.metadata.ocr_processed).length;
        const standardProcessedCount = loadedCount - (ocrProcessedCount > 0 ? 1 : 0); // Approximate count of files processed via standard PDF loading
        
        console.log(`📊 Summary: • 📥 Loaded: ${loadedCount} • ⏭️ Skipped: ${skippedFiles.length} • ⚠️ Error: ${failedFiles.length}`);
        
        if (incompleteFiles.length > 0) {
            console.log(`🔄 Incomplete documents (will reprocess): ${incompleteFiles.length}`);
            incompleteFiles.forEach(incomplete => {
                console.log(`   • ${incomplete.path} (missing: ${incomplete.missing.join(', ')})`);
            });
        }
        
        if (ocrProcessedCount > 0) {
            console.log(`🤖 OCR Summary: • 📄 ${ocrProcessedCount} pages processed via OCR • 📚 Standard PDFs also processed`);
        }
        
        return { documents, documentsNeedingChunks };
    } catch (error) {
        console.error('Error reading directory:', error.message);
        throw error;
    }
}

async function createLanceTableWithSimpleEmbeddings(
    db: lancedb.Connection,
    documents: Document[],
    tableName: string,
    mode?: "overwrite",
    sourceToCatalogIdMap?: Map<string, number>
): Promise<lancedb.Table> {
    
    console.log(`🔄 Creating simple embeddings for ${documents.length} ${tableName}...`);
    
    // Build category ID map for hash-based IDs
    const allCategories = new Set<string>();
    for (const doc of documents) {
        if (doc.metadata.concept_categories) {
            for (const cat of doc.metadata.concept_categories) {
                allCategories.add(cat);
            }
        }
    }
    const categoryIdMap = buildCategoryIdMap(allCategories);
    
    // Generate fast local embeddings with normalized schema
    const data = documents.map((doc, i) => {
        const isCatalog = tableName === 'catalog';
        
        // Generate hash-based numeric ID from source + hash for uniqueness
        const idSource = `${doc.metadata.source || ''}-${doc.metadata.hash || ''}-${i}`;
        const baseData: any = {
            id: isCatalog ? hashToId(doc.metadata.source || `doc-${i}`) : hashToId(idSource),
            hash: doc.metadata.hash || '',
            vector: createSimpleEmbedding(doc.pageContent)
        };
        
        // Catalog uses 'summary', chunks use 'text'
        if (isCatalog) {
            baseData.source = doc.metadata.source || '';  // Catalog keeps source path
            baseData.summary = doc.pageContent;  // Renamed from 'text' to 'summary'
        } else {
            // Chunks get catalog_title instead of source
            baseData.text = doc.pageContent;
            // Extract page_number from loc.pageNumber (LangChain format) or direct field
            baseData.page_number = doc.metadata.page_number ?? doc.metadata.loc?.pageNumber ?? 1;
            // ALWAYS include concept_ids, concept_names, concept_density for chunks schema
            // Use placeholder values for empty arrays to enable LanceDB type inference
            baseData.concept_ids = [0];  // Will be overwritten below if concepts exist
            baseData.concept_names = [''];  // DERIVED: Will be overwritten below if concepts exist
            baseData.concept_density = 0;  // Will be computed below if concepts exist
            // Add catalog_id (foreign key to catalog table) if map is provided
            if (sourceToCatalogIdMap && doc.metadata.source) {
                baseData.catalog_id = sourceToCatalogIdMap.get(doc.metadata.source) || 0;
            } else {
                baseData.catalog_id = 0;  // Placeholder if no map provided
            }
            // Add catalog_title (derived from filename) for display
            const fileMeta = parseFilenameMetadata(doc.metadata.source || '');
            baseData.catalog_title = fileMeta.title || '';
        }
        
        // Add bibliographic fields for catalog entries (parsed from filename)
        if (isCatalog) {
            // Parse metadata from filename using '--' delimiter format
            const fileMeta = parseFilenameMetadata(doc.metadata.source || '');
            
            baseData.origin_hash = '';  // Reserved: hash of original file before processing
            baseData.title = fileMeta.title || '';      // Document title from filename
            baseData.author = fileMeta.author || '';    // Document author(s) from filename
            baseData.year = fileMeta.year || 0;         // Publication year from filename
            baseData.publisher = fileMeta.publisher || '';  // Publisher name from filename
            baseData.isbn = fileMeta.isbn || '';        // ISBN from filename
            // DERIVED fields with placeholders for LanceDB schema inference
            baseData.concept_ids = [0];     // Will be overwritten if concepts exist
            baseData.concept_names = [''];  // DERIVED: Will be overwritten if concepts exist
            baseData.category_ids = [0];    // Will be overwritten if categories exist
            baseData.category_names = [''];  // DERIVED: Will be overwritten if categories exist
        }
        
        // Add concept metadata if present (using native arrays)
        if (doc.metadata.concepts) {
            // Extract categories and generate hash-based category IDs (CATALOG ONLY)
            // Chunks don't store category_ids - use catalog_id to lookup categories
            if (isCatalog) {
                let categories: string[] = [];
                if (typeof doc.metadata.concepts === 'object' && doc.metadata.concepts.categories) {
                    categories = doc.metadata.concepts.categories;
                } else if (doc.metadata.concept_categories) {
                    categories = doc.metadata.concept_categories;
                }
                
                if (categories.length > 0) {
                    // Generate hash-based category IDs (native array)
                    const categoryIds = categories.map((cat: string) => 
                        categoryIdMap.get(cat) || hashToId(cat)
                    );
                    baseData.category_ids = categoryIds;
                }
            }
            
            // Populate concept_ids in chunks using consistent normalization
            // Since concepts table uses hashToId(name.toLowerCase().trim()) for ID generation,
            // we use the same formula here to ensure foreign key consistency
            if (!isCatalog) {
                let chunkConceptNames: string[] = [];
                // Check Array.isArray FIRST since arrays are also objects
                // Handle both old (string[]) and new (ExtractedConcept[]) formats
                if (Array.isArray(doc.metadata.concepts)) {
                    chunkConceptNames = doc.metadata.concepts.map((c: any) => 
                        typeof c === 'string' ? c : (c.name || '')
                    ).filter((n: string) => n);
                } else if (typeof doc.metadata.concepts === 'object' && doc.metadata.concepts.primary_concepts) {
                    chunkConceptNames = doc.metadata.concepts.primary_concepts.map((c: any) => 
                        typeof c === 'string' ? c : (c.name || '')
                    ).filter((n: string) => n);
                }
                
                if (chunkConceptNames.length > 0) {
                    // Use same normalization as concepts table: hashToId(name.toLowerCase().trim())
                    const conceptIds = chunkConceptNames.map((name: string) => 
                        hashToId(name.toLowerCase().trim())
                    );
                    baseData.concept_ids = conceptIds;
                    // DERIVED FIELD: Store concept names for display and text search
                    baseData.concept_names = chunkConceptNames.map((name: string) => name.toLowerCase().trim());
                    
                    // Calculate concept density: concepts per 10 words
                    // Higher values indicate more concept-rich content
                    const wordCount = doc.pageContent.split(/\s+/).length;
                    baseData.concept_density = wordCount > 0 ? conceptIds.length / (wordCount / 10) : 0;
                } else {
                    baseData.concept_density = 0;
                }
            }
            
            // Populate concept_names and category_names for catalog (DERIVED fields)
            if (isCatalog && doc.metadata.concepts) {
                // Extract primary concepts for concept_names
                // Handle both old (string[]) and new (ExtractedConcept[]) formats
                let catalogConceptNames: string[] = [];
                if (typeof doc.metadata.concepts === 'object' && doc.metadata.concepts.primary_concepts) {
                    catalogConceptNames = doc.metadata.concepts.primary_concepts.map((c: any) => 
                        typeof c === 'string' ? c : (c.name || '')
                    ).filter((n: string) => n);
                }
                if (catalogConceptNames.length > 0) {
                    // Store concept_ids and concept_names together
                    const conceptIds = catalogConceptNames.map((name: string) => 
                        hashToId(name.toLowerCase().trim())
                    );
                    baseData.concept_ids = conceptIds;
                    // DERIVED FIELD: Store concept names for display and text search
                    baseData.concept_names = catalogConceptNames.map((name: string) => name.toLowerCase().trim());
                }
                
                // Extract categories for category_names (DERIVED)
                let categoryNames: string[] = [];
                if (typeof doc.metadata.concepts === 'object' && doc.metadata.concepts.categories) {
                    categoryNames = doc.metadata.concepts.categories;
                } else if (doc.metadata.concept_categories) {
                    categoryNames = doc.metadata.concept_categories;
                }
                if (categoryNames.length > 0) {
                    // DERIVED FIELD: Store category names for display and text search
                    baseData.category_names = categoryNames;
                }
            }
        }
        
        return baseData;
    });
    
    console.log(`✅ Generated ${data.length} embeddings locally`);
    
    // Calculate appropriate number of partitions based on dataset size
    // Rule of thumb: ~100-200 vectors per partition for good cluster quality
    const calculatePartitions = (dataSize: number): number => {
        if (dataSize < 100) return 2;
        if (dataSize < 500) return Math.max(2, Math.floor(dataSize / 100));
        if (dataSize < 1000) return Math.max(4, Math.floor(dataSize / 150));
        if (dataSize < 5000) return Math.max(8, Math.floor(dataSize / 300));
        if (dataSize < 10000) return Math.max(32, Math.floor(dataSize / 300));
        if (dataSize < 50000) return Math.max(64, Math.floor(dataSize / 400));
        return 256; // Default for very large datasets (50k+ vectors)
    };
    
    const numPartitions = calculatePartitions(data.length);
    
    // Handle existing tables
    if (mode === "overwrite") {
        try {
            await db.dropTable(tableName);
            console.log(`🗑️ Dropped existing table: ${tableName}`);
        } catch (e) {
            // Table might not exist
        }
        const table = await db.createTable(tableName, data);
        console.log(`✅ Created LanceDB table: ${tableName}`);
        
        // Create index with appropriate configuration for dataset size
        // IVF_PQ requires at least 256 rows for PQ training
        if (data.length >= 256) {
            await createOptimizedIndex(table, data.length, numPartitions, tableName);
        } else {
            console.log(`⏭️  Skipping index creation (${data.length} vectors < 256 minimum for IVF_PQ)`);
        }
        
        return table;
    } else {
        // Check if table already exists
        try {
            const existingTables = await db.tableNames();
            if (existingTables.includes(tableName)) {
                // Table exists, add to it
                const table = await db.openTable(tableName);
                if (data.length > 0) {
                    await table.add(data);
                    console.log(`✅ Added ${data.length} new records to existing table: ${tableName}`);
                    
                    // Get total record count to determine if we should rebuild index
                    const totalCount = await table.countRows();
                    const newPartitions = calculatePartitions(totalCount);
                    
                    // IVF_PQ requires at least 256 rows for PQ training
                    if (totalCount >= 256) {
                        await createOptimizedIndex(table, totalCount, newPartitions, tableName);
                    }
                }
                return table;
            }
        } catch (e) {
            // Continue to create new table
        }
        
        // Create new table
        const table = await db.createTable(tableName, data);
        console.log(`✅ Created LanceDB table: ${tableName}`);
        
        // Create index with appropriate configuration for dataset size
        // IVF_PQ requires at least 256 rows for PQ training
        if (data.length >= 256) {
            await createOptimizedIndex(table, data.length, numPartitions, tableName);
        } else {
            console.log(`⏭️  Skipping index creation (${data.length} vectors < 256 minimum for IVF_PQ)`);
        }
        
        return table;
    }
}

async function createOptimizedIndex(
    table: lancedb.Table,
    dataSize: number,
    numPartitions: number,
    tableName: string
): Promise<void> {
    try {
        // IVF_PQ requires at least 256 rows for PQ training
        // This should never be called with < 256, but double-check
        if (dataSize < 256) {
            console.log(`⏭️  Skipping index - dataset too small (${dataSize} < 256)`);
            return;
        }
        
        console.log(`🔧 Creating optimized index for ${tableName} (${dataSize} vectors, ${numPartitions} partitions)...`);
        
        await table.createIndex("vector", {
            config: lancedb.Index.ivfPq({
                numPartitions: numPartitions,
                numSubVectors: 16, // For 384-dim vectors
            })
        });
        
        console.log(`✅ Index created (IVF_PQ) successfully`);
    } catch (error: any) {
        // If index creation fails, log warning but continue (table is still usable without index)
        console.warn(`⚠️  Index creation failed: ${error.message}`);
        console.warn(`   Table is still functional, searches will use brute-force (slower but accurate)`);
    }
}

async function processDocuments(rawDocs: Document[], checkpoint?: SeedingCheckpoint, workers: number = 1) {
    const docsBySource = rawDocs.reduce((acc: Record<string, Document[]>, doc: Document) => {
        const source = doc.metadata.source;
        if (!acc[source]) {
            acc[source] = [];
        }
        acc[source].push(doc);
        return acc;
    }, {});

    // Use parallel processing if workers > 1
    if (workers > 1) {
        return processDocumentsParallel(docsBySource, checkpoint, workers);
    }

    // Sequential processing (original behavior)
    let catalogRecords: Document[] = [];
    
    // Initialize concept extractor
    const conceptExtractor = new ConceptExtractor(process.env.OPENROUTER_API_KEY || '');
    
    // Track documents for checkpoint updates
    const processedInThisRun: Array<{hash: string, source: string}> = [];

    for (const [source, docs] of Object.entries(docsBySource)) {
        // Use existing hash from document metadata if available (for consistency)
        let hash = docs[0]?.metadata?.hash;
        if (!hash || hash === 'unknown') {
            // Fallback: calculate hash from file content
            const fileContent = await fs.promises.readFile(source);
            hash = crypto.createHash('sha256').update(fileContent).digest('hex');
        }

        const isOcrProcessed = docs.some(doc => doc.metadata.ocr_processed);
        const sourceBasename = path.basename(source);
        
        if (isOcrProcessed) {
            console.log(`🤖 Extracting concepts for: ${sourceBasename} (OCR processed)`);
        } else {
            console.log(`🤖 Extracting concepts for: ${sourceBasename}`);
        }
        
        const contentOverview = await generateContentOverview(docs);
        
        // ENHANCED: Extract concepts using LLM
        let concepts;
        try {
            concepts = await conceptExtractor.extractConcepts(docs);
            console.log(`✅ Found: ${concepts.primary_concepts.length} concepts`);
        } catch (error) {
            console.error(`❌ Concept extraction failed for ${sourceBasename}:`, error.message);
            // Use empty concepts if extraction fails
            concepts = {
                primary_concepts: [],
                categories: ['General'],
                related_concepts: []
            };
            console.log(`⚠️  Continuing with empty concepts for this document`);
        }
        
        // Extract concept names for display (handle both string[] and ExtractedConcept[] formats)
        const conceptNames = concepts.primary_concepts.map((c: any) => 
            typeof c === 'string' ? c : (c.name || '')
        ).filter((n: string) => n);
        
        // Include concepts in the embedded content for better vector search
        const enrichedContent = `
${contentOverview}

Key Concepts: ${conceptNames.join(', ')}
Categories: ${concepts.categories.join(', ')}
`.trim();
        
        const catalogRecord = new Document({ 
            pageContent: enrichedContent, 
            metadata: { 
                source, 
                hash,
                ocr_processed: isOcrProcessed,
                concepts: concepts  // STORE STRUCTURED CONCEPTS
            } 
        });
        
        catalogRecords.push(catalogRecord);
        
        // Track for checkpoint update
        processedInThisRun.push({ hash, source });
        
        // Debug logging for OCR persistence troubleshooting
        if (process.env.DEBUG_OCR && isOcrProcessed) {
            console.log(`📝 Creating catalog record for OCR'd document: hash=${hash.slice(0, 8)}..., source=${sourceBasename}`);
        }
    }

    return { catalogRecords, processedInThisRun };
}

/**
 * Process documents in parallel for concept extraction.
 * Uses ParallelConceptExtractor to coordinate workers with shared rate limiting.
 */
async function processDocumentsParallel(
    docsBySource: Record<string, Document[]>,
    checkpoint: SeedingCheckpoint | undefined,
    workers: number
): Promise<{ catalogRecords: Document[], processedInThisRun: Array<{hash: string, source: string}> }> {
    
    // Prepare document sets with hashes
    const documentSets = new Map<string, DocumentSet>();
    
    for (const [source, docs] of Object.entries(docsBySource)) {
        let hash = docs[0]?.metadata?.hash;
        if (!hash || hash === 'unknown') {
            const fileContent = await fs.promises.readFile(source);
            hash = crypto.createHash('sha256').update(fileContent).digest('hex');
        }
        documentSets.set(source, { docs, hash });
    }
    
    const totalDocs = documentSets.size;
    const actualWorkers = Math.min(totalDocs, workers);
    console.log(`📊 Processing ${totalDocs} document(s) with ${actualWorkers} parallel workers\n`);
    
    // Create parallel extractor
    const parallelExtractor = new ParallelConceptExtractor(
        process.env.OPENROUTER_API_KEY || '',
        3000  // 3 second rate limit interval
    );
    
    // Create progress bar display (null if in CI or non-TTY)
    // Only show as many lines as needed (min of workers and docs)
    const displayLines = Math.min(workers, totalDocs);
    const progressDisplay = createProgressBarDisplay(displayLines);
    progressDisplay?.initialize();
    progressDisplay?.updateProgress(0, totalDocs);
    
    // Handle Ctrl+C for cleanup
    const cleanupHandler = () => {
        progressDisplay?.cleanup();
        process.exit(130);
    };
    process.on('SIGINT', cleanupHandler);
    
    // Extract concepts in parallel
    const results = await parallelExtractor.extractAll(documentSets, {
        concurrency: workers,
        onWorkerStart: (workerIndex, source, totalChunks) => {
            const basename = path.basename(source);
            progressDisplay?.updateWorker(workerIndex, {
                documentName: basename,
                chunkNum: 0,
                totalChunks,
                status: 'processing'
            });
        },
        onProgress: (completed, total, current, workerIndex) => {
            progressDisplay?.updateProgress(completed, total);
            progressDisplay?.updateWorker(workerIndex, { status: 'done', message: null });
            
            // Fallback for non-TTY
            if (!progressDisplay) {
                const pct = Math.round((completed / total) * 100);
                const basename = path.basename(current);
                console.log(`[${workerIndex}] ✅ Complete: ${completed}/${total} (${pct}%) - ${basename}`);
            }
        },
        onChunkProgress: (completed, total, current, chunkNum, totalChunks, workerIndex) => {
            progressDisplay?.updateWorker(workerIndex, {
                chunkNum,
                totalChunks,
                status: 'processing',
                message: null  // Clear any previous message when starting new chunk
            });
            
            // Fallback for non-TTY
            if (!progressDisplay) {
                const pct = Math.round((completed / total) * 100);
                const basename = path.basename(current);
                console.log(`[${workerIndex}] 📊 Progress: ${completed}/${total} (${pct}%) - ${basename.slice(0, 80)}  🔄 ${chunkNum}/${totalChunks}`);
            }
        },
        onError: (source, error, workerIndex) => {
            progressDisplay?.updateWorker(workerIndex, { status: 'idle', message: null });
            console.error(`\n❌ Failed: ${path.basename(source)}: ${error.message}`);
        },
        onMessage: (workerIndex, message) => {
            progressDisplay?.updateWorker(workerIndex, { message });
            
            // Fallback for non-TTY
            if (!progressDisplay) {
                console.log(`[${workerIndex}] ${message}`);
            }
        }
    });
    
    // Cleanup progress display
    progressDisplay?.cleanup();
    process.removeListener('SIGINT', cleanupHandler);
    console.log('');
    
    // Get and display stats
    const stats = parallelExtractor.getStats(results);
    const { successful, failed } = parallelExtractor.partitionResults(results);
    
    console.log(`✅ Completed: ${stats.successCount}/${stats.totalDocuments} documents`);
    if (stats.failureCount > 0) {
        console.log(`⚠️  Failed: ${stats.failureCount} documents`);
        for (const f of failed) {
            console.log(`   - ${path.basename(f.source)}: ${f.error}`);
        }
    }
    console.log(`⏱️  Total time: ${(stats.totalTimeMs / 1000).toFixed(1)}s`);
    console.log(`📊 Rate limiter: ${stats.rateLimiterMetrics.totalRequests} requests, avg wait ${stats.rateLimiterMetrics.avgWaitTimeMs}ms`);
    
    // Convert results to catalog records
    const catalogRecords: Document[] = [];
    const processedInThisRun: Array<{hash: string, source: string}> = [];
    
    // Process successful documents
    for (const result of successful) {
        const docs = docsBySource[result.source];
        const contentOverview = await generateContentOverview(docs);
        const isOcrProcessed = docs.some(doc => doc.metadata.ocr_processed);
        
        // Extract concept names
        const conceptNames = result.concepts!.primary_concepts.map((c: any) => 
            typeof c === 'string' ? c : (c.name || '')
        ).filter((n: string) => n);
        
        // Include concepts in embedded content
        const enrichedContent = `
${contentOverview}

Key Concepts: ${conceptNames.join(', ')}
Categories: ${result.concepts!.categories.join(', ')}
`.trim();
        
        const catalogRecord = new Document({
            pageContent: enrichedContent,
            metadata: {
                source: result.source,
                hash: result.hash,
                ocr_processed: isOcrProcessed,
                concepts: result.concepts
            }
        });
        
        catalogRecords.push(catalogRecord);
        processedInThisRun.push({ hash: result.hash, source: result.source });
    }
    
    // Process failed documents with empty concepts (consistent with sequential mode)
    // This ensures they're still added to the catalog and checkpoint
    for (const result of failed) {
        const docs = docsBySource[result.source];
        const contentOverview = await generateContentOverview(docs);
        const isOcrProcessed = docs.some(doc => doc.metadata.ocr_processed);
        
        // Use empty concepts for failed documents
        const emptyConcepts = {
            primary_concepts: [],
            categories: ['General']
        };
        
        const enrichedContent = `
${contentOverview}

Key Concepts: 
Categories: General
`.trim();
        
        const catalogRecord = new Document({
            pageContent: enrichedContent,
            metadata: {
                source: result.source,
                hash: result.hash,
                ocr_processed: isOcrProcessed,
                concepts: emptyConcepts
            }
        });
        
        catalogRecords.push(catalogRecord);
        processedInThisRun.push({ hash: result.hash, source: result.source });
        
        // Also mark as failed in checkpoint if available (for reporting purposes)
        if (checkpoint) {
            await checkpoint.markFailed(result.source, false);
        }
    }
    
    // Save checkpoint once after batch processing
    if (checkpoint && failed.length > 0) {
        await checkpoint.save();
    }
    
    return { catalogRecords, processedInThisRun };
}

async function getDatabaseSize(dbPath: string): Promise<string> {
    try {
        const stats = await fs.promises.stat(dbPath);
        
        if (!stats.isDirectory()) {
            return 'N/A';
        }
        
        // Recursively calculate directory size
        async function getDirectorySize(dirPath: string): Promise<number> {
            let totalSize = 0;
            const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item.name);
                
                if (item.isDirectory()) {
                    totalSize += await getDirectorySize(itemPath);
                } else if (item.isFile()) {
                    const stats = await fs.promises.stat(itemPath);
                    totalSize += stats.size;
                }
            }
            
            return totalSize;
        }
        
        const sizeInBytes = await getDirectorySize(dbPath);
        
        // Format size in human-readable format
        if (sizeInBytes < 1024) {
            return `${sizeInBytes} B`;
        } else if (sizeInBytes < 1024 * 1024) {
            return `${(sizeInBytes / 1024).toFixed(2)} KB`;
        } else if (sizeInBytes < 1024 * 1024 * 1024) {
            return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
        } else {
            return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        }
    } catch (error) {
        return 'N/A';
    }
}

/**
 * Extract unique categories and create categories table with hash-based IDs
 */
async function createCategoriesTable(
    db: lancedb.Connection,
    catalogDocs: Document[]
): Promise<void> {
    console.log("📊 Creating categories table...");
    
    // Extract unique categories from all documents
    const categorySet = new Set<string>();
    const categoryStats = new Map<string, {
        documentCount: number;
        sources: Set<string>;
    }>();
    
    for (const doc of catalogDocs) {
        // Categories can be in two places:
        // 1. doc.metadata.concepts.categories (structured format from LLM extraction)
        // 2. doc.metadata.concept_categories (flat array format)
        let categories: string[] = [];
        
        if (doc.metadata.concepts && typeof doc.metadata.concepts === 'object') {
            categories = doc.metadata.concepts.categories || [];
        } else if (doc.metadata.concept_categories) {
            categories = doc.metadata.concept_categories;
        }
        
        for (const cat of categories) {
            categorySet.add(cat);
            if (!categoryStats.has(cat)) {
                categoryStats.set(cat, {
                    documentCount: 0,
                    sources: new Set()
                });
            }
            const stats = categoryStats.get(cat)!;
            stats.documentCount++;
            stats.sources.add(doc.metadata.source);
        }
    }
    
    if (categorySet.size === 0) {
        console.log("  ⚠️  No categories found, skipping categories table creation");
        return;
    }
    
    console.log(`  ✅ Found ${categorySet.size} unique categories`);
    
    // Generate stable hash-based IDs
    const sortedCategories = Array.from(categorySet).sort();
    const existingIds = new Set<number>();
    const categoryRecords: any[] = [];
    
    console.log("  🔄 Generating category records with embeddings...");
    
    // Generate summaries for categories using LLM
    const categorySummaries = await generateCategorySummaries(sortedCategories);
    
    for (const category of sortedCategories) {
        // Generate stable hash-based ID
        const categoryId = generateStableId(category, existingIds);
        existingIds.add(categoryId);
        
        // Generate simple description
        const description = `Concepts and practices related to ${category}`;
        
        // Get LLM-generated summary or fallback to description
        const summary = categorySummaries.get(category.toLowerCase()) || description;
        
        // Generate embedding using simple embedding function (same as used for catalog/chunks)
        const embeddingText = `${category}: ${description}`;
        const vector = createSimpleEmbedding(embeddingText);
        
        const stats = categoryStats.get(category)!;
        
        categoryRecords.push({
            id: categoryId,
            category: category,
            description: description,
            summary: summary,
            parent_category_id: 0, // Use 0 as null placeholder (LanceDB can't infer type from all nulls)
            aliases: JSON.stringify([]),
            related_categories: JSON.stringify([]),
            document_count: stats.documentCount,
            chunk_count: 0, // Will be updated when chunks are processed
            concept_count: 0, // Will be updated when concepts are processed
            vector: vector
        });
    }
    
    console.log(`  ✅ Generated ${categoryRecords.length} category records`);
    
    // Drop existing categories table if it exists
    try {
        await db.dropTable('categories');
        console.log("  🗑️  Dropped existing categories table");
    } catch (e) {
        // Table didn't exist, that's fine
    }
    
    // Create categories table
    const table = await db.createTable('categories', categoryRecords, { mode: 'overwrite' });
    console.log("  ✅ Categories table created successfully");
    // Create vector index only for large datasets to avoid KMeans warnings
    // For datasets < 5000, linear scan is fast and avoids empty cluster warnings
    if (categoryRecords.length >= 5000) {
        console.log("  🔧 Creating vector index for categories...");
        await table.createIndex("vector", {
            config: lancedb.Index.ivfPq({
                numPartitions: Math.max(2, Math.ceil(categoryRecords.length / 100)),
                numSubVectors: 8
            })
        });
        console.log("  ✅ Vector index created");
    }
}

/**
 * Build category ID map for converting category names to hash-based IDs
 */
function buildCategoryIdMap(categories: Set<string>): Map<string, number> {
    const categoryIdMap = new Map<string, number>();
    const existingIds = new Set<number>();
    
    const sortedCategories = Array.from(categories).sort();
    for (const category of sortedCategories) {
        const categoryId = generateStableId(category, existingIds);
        existingIds.add(categoryId);
        categoryIdMap.set(category, categoryId);
    }
    
    return categoryIdMap;
}

/**
 * Parse array field from LanceDB (handles native arrays, Arrow Vectors, JSON strings)
 */
function parseArrayField(value: any): any[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'object' && 'toArray' in value) {
        return Array.from(value.toArray());
    }
    if (typeof value === 'string') {
        try { return JSON.parse(value); } catch { return []; }
    }
    return [];
}

async function rebuildConceptIndexFromExistingData(
    db: lancedb.Connection,
    catalogTable: lancedb.Table,
    chunksTable: lancedb.Table
): Promise<void> {
    const catalogRecords = await catalogTable.query().limit(100000).toArray();
    
    // Build source → catalog ID map from ACTUAL catalog table IDs (foreign key constraint)
    const sourceToCatalogId = new Map<string, number>();
    for (const r of catalogRecords) {
        if (r.source && r.id !== undefined) {
            sourceToCatalogId.set(r.source, typeof r.id === 'number' ? r.id : parseInt(r.id, 10));
        }
    }
    console.log(`  ✅ Built source→catalogId map with ${sourceToCatalogId.size} entries`);
    
    // Convert catalog records to Document format compatible with ConceptIndexBuilder
    // Schema v7: catalog uses `summary` (not `text`) and `concept_names` (not `concepts`)
    const catalogDocs = catalogRecords
        .filter((r: any) => {
            const conceptNames = parseArrayField(r.concept_names);
            // Filter out placeholder values [0] or ['']
            const validConcepts = conceptNames.filter((n: any) => n && n !== '' && n !== 0);
            return r.source && validConcepts.length > 0;
        })
        .map((r: any) => {
            // Reconstruct the concepts metadata structure from stored concept_names
            const conceptNames = parseArrayField(r.concept_names)
                .filter((n: any) => n && n !== '' && n !== 0);
            const categoryNames = parseArrayField(r.category_names)
                .filter((n: any) => n && n !== '' && n !== 0);
            
            // Build ConceptMetadata structure expected by ConceptIndexBuilder
            const concepts = {
                primary_concepts: conceptNames,  // Array of concept name strings
                categories: categoryNames,
                related_concepts: []  // Not stored, will be rebuilt
            };
            
            return new Document({
                pageContent: r.summary || '',  // Schema v7: catalog uses 'summary' not 'text'
                metadata: {
                    source: r.source,
                    hash: r.hash,
                    concepts: concepts
                }
            });
        });
    
    console.log(`  ✅ Loaded ${catalogRecords.length} catalog records (${catalogDocs.length} with concepts)`);
    
    const allChunkRecords = await chunksTable.query().limit(1000000).toArray();
    
    // Count chunks with concepts for logging
    const chunksWithConcepts = allChunkRecords.filter((chunk: any) => {
        const conceptIds = parseArrayField(chunk.concept_ids);
        return conceptIds.filter((id: any) => id && id !== 0).length > 0;
    });
    
    console.log(`  ✅ Loaded ${allChunkRecords.length} total chunks (${chunksWithConcepts.length} with concepts)`);
    
    const conceptBuilder = new ConceptIndexBuilder();
    // Pass actual catalog IDs from the database (foreign key constraint)
    const conceptRecords = await conceptBuilder.buildConceptIndex(catalogDocs, sourceToCatalogId);
    
    console.log(`  ✅ Built ${conceptRecords.length} unique concept records`);
    
    // Build chunk_ids for each concept (reverse mapping from chunks → concepts)
    console.log("  🔗 Building concept → chunk_ids mapping...");
    const conceptToChunkIds = new Map<number, number[]>();
    
    for (const chunk of allChunkRecords) {
        const chunkId = chunk.id;
        let conceptIds: number[] = [];
        
        // Parse concept_ids (native array or JSON string or Arrow Vector)
        if (chunk.concept_ids) {
            if (Array.isArray(chunk.concept_ids)) {
                conceptIds = chunk.concept_ids;
            } else if (typeof chunk.concept_ids === 'object' && 'toArray' in chunk.concept_ids) {
                conceptIds = Array.from(chunk.concept_ids.toArray());
            } else if (typeof chunk.concept_ids === 'string') {
                try { conceptIds = JSON.parse(chunk.concept_ids); } catch (e) {}
            }
        }
        
        // Add this chunk to each concept's chunk_ids
        for (const conceptId of conceptIds) {
            if (!conceptToChunkIds.has(conceptId)) {
                conceptToChunkIds.set(conceptId, []);
            }
            conceptToChunkIds.get(conceptId)!.push(chunkId);
        }
    }
    
    // Add chunk_ids to concept records
    for (const record of conceptRecords) {
        const conceptId = hashToId(record.name);
        const chunkIds = conceptToChunkIds.get(conceptId) || [];
        record.chunk_ids = chunkIds;
    }
    
    const conceptsWithChunks = conceptRecords.filter(c => c.chunk_ids && c.chunk_ids.length > 0).length;
    console.log(`  ✅ Mapped ${conceptsWithChunks} concepts to ${allChunkRecords.length} chunks`);
    
    // Note: Summaries are now included in the concept extraction response,
    // so no separate summary generation is needed.
    
    // Enrich concepts with WordNet data (synonyms, broader_terms, narrower_terms)
    // Disabled by default - use --with-wordnet to enable
    if (argv['with-wordnet']) {
        console.log("  📚 Enriching concepts with WordNet data...");
        const conceptEnricher = new ConceptEnricher();
        await conceptEnricher.enrichConcepts(conceptRecords);
    } else {
        console.log("  ⏭️  Skipping WordNet enrichment (use --with-wordnet to enable)");
    }
    
    // Note: Lexical linking (related_ids) can be added post-seeding via:
    //   npx tsx scripts/link_related_concepts.ts --db <path>
    
    // Drop and recreate concepts table
    try {
        await db.dropTable('concepts');
        console.log("  🗑️  Dropped existing concepts table");
    } catch (e) {
        // Table didn't exist, that's fine
    }
    
    // Create concepts table - catalog_ids are already populated with actual IDs from sourceToCatalogId
    await conceptBuilder.createConceptTable(db, conceptRecords, 'concepts');
    console.log("  ✅ Concept index created successfully (with actual catalog IDs)");
    // Create categories table with hash-based IDs
    await createCategoriesTable(db, catalogDocs);
}

async function hybridFastSeed() {
    validateArgs();

    // Initialize checkpoint for resumable seeding
    const checkpointPath = SeedingCheckpoint.getDefaultPath(databaseDir);
    const seedingCheckpoint = new SeedingCheckpoint({
        checkpointPath,
        databasePath: databaseDir,
        filesDir: filesDir
    });
    
    // Handle --clean-checkpoint flag
    if (cleanCheckpoint) {
        console.log(`🗑️ Clearing checkpoint file...`);
        await seedingCheckpoint.delete();
        console.log(`✅ Checkpoint cleared`);
    }
    
    // Load checkpoint (or create new one)
    const { loaded: checkpointLoaded, warnings: checkpointWarnings } = await seedingCheckpoint.load();
    
    if (checkpointLoaded) {
        const stats = seedingCheckpoint.getStats();
        console.log(`📋 Checkpoint found: ${stats.processedHashCount} documents already processed`);
        console.log(`   Stage: ${stats.stage}, Last updated: ${stats.lastUpdatedAt}`);
        
        if (checkpointWarnings.length > 0) {
            console.log(`⚠️  Checkpoint warnings:`);
            checkpointWarnings.forEach(w => console.log(`   - ${w}`));
        }
        
        if (stats.totalFailed > 0) {
            console.log(`⚠️  ${stats.totalFailed} previously failed documents`);
        }
    } else if (resumeMode) {
        console.log(`📋 No checkpoint found - starting fresh`);
    }
    
    // If overwrite mode, clear checkpoint as well
    if (overwrite && checkpointLoaded) {
        console.log(`🗑️ Overwrite mode - clearing checkpoint...`);
        await seedingCheckpoint.clear();
    }

    const db = await lancedb.connect(databaseDir);

    let catalogTable: lancedb.Table | null = null;
    let catalogTableExists = true;
    let chunksTable: lancedb.Table | null = null;

    try {
        catalogTable = await db.openTable(defaults.CATALOG_TABLE_NAME);
    } catch (e) {
        console.log(`Catalog table "${defaults.CATALOG_TABLE_NAME}" doesn't exist. Will create it.`);
        catalogTableExists = false;
    }

    // Try to open chunks table for completeness checking
    try {
        chunksTable = await db.openTable(defaults.CHUNKS_TABLE_NAME);
    } catch (e) {
        // Chunks table doesn't exist yet, that's okay
    }

    if (overwrite) {
        try {
            await db.dropTable(defaults.CATALOG_TABLE_NAME);
            await db.dropTable(defaults.CHUNKS_TABLE_NAME);
            console.log("🗑️ Dropped existing tables");
            catalogTable = null;
            chunksTable = null;
            catalogTableExists = false;
        } catch (e) {
            console.log("Tables didn't exist");
        }
    }

    // Check for incomplete catalog records and handle auto-reseed
    if (autoReseed && catalogTable) {
        console.log("\n🔍 Checking for incomplete catalog records...");
        const allCatalogRecords = await catalogTable.query().limit(100000).toArray();
        
        // Find records with missing fields or invalid IDs
        // Note: '0' (string) is valid - it's the first record ID. Only 0 (number) is invalid.
        const incompleteRecords = allCatalogRecords.filter((row: any) => 
            !row.source || !row.id || row.id === 0 || row.id === ''
        );
        
        // Find duplicate source paths (keep first occurrence, mark rest for deletion)
        const sourceMap = new Map<string, any>();
        const duplicateRecords = [];
        for (const row of allCatalogRecords) {
            if (row.source) {
                if (sourceMap.has(row.source)) {
                    // This is a duplicate
                    duplicateRecords.push({
                        ...row,
                        reason: 'duplicate source path',
                        originalHash: sourceMap.get(row.source).hash
                    });
                } else {
                    // First occurrence - keep it
                    sourceMap.set(row.source, row);
                }
            }
        }
        
        const recordsToRemove = [...incompleteRecords, ...duplicateRecords];
        
        if (recordsToRemove.length > 0) {
            console.log(`  ⚠️  Found ${recordsToRemove.length} problematic records:`);
            if (incompleteRecords.length > 0) {
                console.log(`     - ${incompleteRecords.length} incomplete records (missing/invalid fields)`);
            }
            if (duplicateRecords.length > 0) {
                console.log(`     - ${duplicateRecords.length} duplicate source paths`);
            }
            console.log(`  🔄 Auto-reseed enabled - removing problematic records...`);
            
            // Delete records by hash
            for (const rec of recordsToRemove) {
                if (rec.hash) {
                    try {
                        await catalogTable.delete(`hash = '${rec.hash}'`);
                        const reason = !rec.source ? 'no source' : 
                                     (!rec.id || rec.id === 0 || rec.id === '') ? 'invalid ID' : 
                                     rec.reason || 'unknown';
                        console.log(`     ✓ Removed: ${(rec.source || 'unknown').substring(0, 50)}... [${rec.hash.slice(0, 8)}] (${reason})`);
                    } catch (e: any) {
                        console.log(`     ✗ Failed to remove ${rec.hash.slice(0, 8)}: ${e.message}`);
                    }
                }
            }
            console.log(`  ✅ Removed ${recordsToRemove.length} problematic records - they will be re-processed`);
        } else {
            console.log(`  ✅ No incomplete or duplicate records found`);
        }
    }

    // Load files (pass checkpoint for resumable skip detection)
    const { documents: rawDocs, documentsNeedingChunks } = await loadDocumentsWithErrorHandling(
        filesDir, 
        catalogTable, 
        chunksTable, 
        overwrite || !catalogTableExists,
        seedingCheckpoint
    );
    
    // Save checkpoint after loading phase to persist any newly discovered complete documents
    if (seedingCheckpoint.hasUnsavedChanges()) {
        await seedingCheckpoint.save();
    }

    if (rawDocs.length === 0) {
        // Check if we should rebuild the concept index (opt-in via flag)
        if (rebuildConcepts && catalogTable && chunksTable) {
            try {
                // Check if concepts table exists
                const tableNames = await db.tableNames();
                const hasConceptsTable = tableNames.includes('concepts');
                
                if (!hasConceptsTable) {
                    console.log("📊 Concept index missing - will rebuild from existing data");
                } else {
                    console.log("📊 Rebuilding concept index...");
                }
                
                // Rebuild concept index from ALL existing catalog records and chunks
                await rebuildConceptIndexFromExistingData(db, catalogTable, chunksTable);
                
                const dbSize = await getDatabaseSize(databaseDir);
                console.log(`💾 Database size: ${dbSize}`);
                console.log("🎉 Concept index rebuild completed successfully!");
                process.exit(0);
            } catch (error: any) {
                console.error("⚠️  Error rebuilding concept index:", error.message);
                console.log("🎉 Seeding completed (concept index rebuild failed)");
                process.exit(0);
            }
        }
        
        if (rebuildConcepts) {
            console.log("\n💡 Note: --rebuild-concepts flag was set but catalog or chunks table missing");
        }
        
        const dbSize = await getDatabaseSize(databaseDir);
        console.log(`💾 Database size: ${dbSize}`);
        console.log("🎉 Seeding completed successfully (no changes needed)!");
        console.log("💡 Tip: Use --rebuild-concepts to rebuild the concept index if chunk counts are incorrect");
        process.exit(0);
    }

    // Simplify metadata but preserve hash and OCR information
    // Extract page_number from loc.pageNumber (LangChain format) or direct field
    for (const doc of rawDocs) {
        const pageNumber = doc.metadata.page_number ?? doc.metadata.loc?.pageNumber ?? 1;
        doc.metadata = { 
            page_number: pageNumber,
            source: doc.metadata.source,
            hash: doc.metadata.hash,
            ocr_processed: doc.metadata.ocr_processed,
            ocr_method: doc.metadata.ocr_method
        };
    }

    console.log("🚀 Creating catalog with LLM summaries...");
    const { catalogRecords, processedInThisRun } = await processDocuments(rawDocs, seedingCheckpoint, parallelWorkers);
    
    if (catalogRecords.length > 0) {
        console.log("📊 Creating catalog table with fast local embeddings...");
        await createLanceTableWithSimpleEmbeddings(db, catalogRecords, defaults.CATALOG_TABLE_NAME, overwrite ? "overwrite" : undefined);
    }

    console.log(`Number of new catalog records: ${catalogRecords.length}`);
    // Build source → catalog ID mapping from ACTUAL catalog table IDs (foreign key constraint)
    console.log("🔗 Building source-to-catalog-ID mapping for optimization...");
    catalogTable = await db.openTable(defaults.CATALOG_TABLE_NAME);
    // LanceDB query() defaults to limit of 10, so we need explicit high limit
    const catalogRows = await catalogTable.query().limit(100000).toArray();
    const sourceToCatalogIdMap = new Map<string, number>();
    for (const row of catalogRows) {
        if (row.source && row.id !== undefined) {
            sourceToCatalogIdMap.set(row.source, typeof row.id === 'number' ? row.id : parseInt(row.id, 10));
        }
    }
    console.log(`✅ Mapped ${sourceToCatalogIdMap.size} sources to catalog IDs`);
    // Build and store concept index (moved to after chunk creation for chunk_count)
    // We'll create chunks first, then build concept index with chunk stats
    console.log("🔧 Creating chunks with fast local embeddings...");
    
    // Separate docs that need new chunks vs. existing chunks needing enrichment
    const docsNeedingNewChunks = rawDocs.filter(doc => 
        documentsNeedingChunks.has(doc.metadata.source) && !doc.metadata.needsConceptEnrichment
    );
    const existingChunksNeedingEnrichment = rawDocs.filter(doc => 
        doc.metadata.needsConceptEnrichment && doc.metadata.chunkId
    );
    
    if (existingChunksNeedingEnrichment.length > 0) {
        console.log(`🔄 Found ${existingChunksNeedingEnrichment.length} existing chunks needing concept enrichment`);
    }
    if (docsNeedingNewChunks.length > 0) {
        console.log(`🔧 Chunking ${docsNeedingNewChunks.length} page(s) into new chunks...`);
    }
    
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 10,
    });
    
    // Create new chunks from documents needing chunking
    const newChunks = docsNeedingNewChunks.length > 0 
        ? await splitter.splitDocuments(docsNeedingNewChunks)
        : [];
    
    // Combine new chunks with existing chunks needing enrichment
    const docs = [...newChunks, ...existingChunksNeedingEnrichment];
    
    // ENHANCED: Enrich chunks with concept metadata
    if (catalogRecords.length > 0 && docs.length > 0) {
        console.log("🧠 Enriching chunks with concept metadata...");
        
        // Create a map of source -> concepts
        const sourceConceptsMap = new Map<string, any>();
        for (const catalogRecord of catalogRecords) {
            if (catalogRecord.metadata.concepts) {
                sourceConceptsMap.set(
                    catalogRecord.metadata.source,
                    catalogRecord.metadata.concepts
                );
            }
        }
        
        // Enrich each chunk with concepts from its source document
        const matcher = new ConceptChunkMatcher();
        let enrichedCount = 0;
        const totalChunks = docs.length;
        const progressInterval = Math.max(Math.floor(totalChunks / 20), 100); // Update every 5% or 100 chunks
        
        for (let i = 0; i < docs.length; i++) {
            const chunk = docs[i];
            const source = chunk.metadata.source;
            const documentConcepts = sourceConceptsMap.get(source);
            
            if (documentConcepts) {
                const matched = matcher.matchConceptsToChunk(
                    chunk.pageContent,
                    documentConcepts
                );
                
                // Add concept metadata to chunk
                chunk.metadata.concepts = matched.concepts;
                chunk.metadata.concept_categories = matched.categories;
                
                if (matched.concepts.length > 0) {
                    enrichedCount++;
                }
            }
            
            // Progress indicator
            if ((i + 1) % progressInterval === 0 || i === docs.length - 1) {
                const progress = ((i + 1) / totalChunks * 100).toFixed(1);
                const enrichedPercent = enrichedCount > 0 ? ((enrichedCount / (i + 1)) * 100).toFixed(1) : '0.0';
                process.stdout.write(`\r  📊 Progress: ${i + 1}/${totalChunks} chunks (${progress}%) - ${enrichedCount} enriched (${enrichedPercent}%)     `);
            }
        }
        
        // Clear progress line and print final result
        process.stdout.write('\r' + ' '.repeat(100) + '\r');
        
        const stats = matcher.getMatchingStats(
            docs.filter(d => d.metadata.concepts).map(d => ({
                text: d.pageContent,
                source: d.metadata.source || '',
                concepts: d.metadata.concepts || []
            }))
        );
        
        console.log(`✅ Enriched ${enrichedCount} chunks with concepts`);
        console.log(`  📊 Stats: ${stats.chunksWithConcepts} chunks with concepts, avg ${stats.avgConceptsPerChunk.toFixed(1)} concepts/chunk`);
        if (stats.topConcepts.length > 0) {
            console.log(`  🔝 Top concepts: ${stats.topConcepts.slice(0, 5).map(c => c.concept).join(', ')}`);
        }
    }
    
    // Separate new chunks from existing chunks that need updates
    const newChunksToCreate = docs.filter(doc => !doc.metadata.chunkId);
    const existingChunksToUpdate = docs.filter(doc => doc.metadata.chunkId);
    
    if (newChunksToCreate.length > 0) {
        console.log(`📊 Creating ${newChunksToCreate.length} new chunks...`);
        // Pass sourceToCatalogIdMap so chunks get proper catalog_id foreign key
        await createLanceTableWithSimpleEmbeddings(db, newChunksToCreate, defaults.CHUNKS_TABLE_NAME, overwrite ? "overwrite" : undefined, sourceToCatalogIdMap);
        
        // Update checkpoint after chunks are written successfully
        // This marks each document as fully processed (catalog + chunks)
        console.log(`📋 Updating checkpoint for ${processedInThisRun.length} newly processed documents...`);
        for (const { hash, source } of processedInThisRun) {
            await seedingCheckpoint.markProcessed(hash, source, false);
        }
        await seedingCheckpoint.save();
        console.log(`✅ Checkpoint updated`);
    }
    
    // Update existing chunks with new concept metadata
    if (existingChunksToUpdate.length > 0 && chunksTable) {
        console.log(`🔄 Updating ${existingChunksToUpdate.length} existing chunks with concept metadata...`);
        
        // Group updates by batch for efficiency
        const batchSize = 1000;
        let updatedCount = 0;
        
        for (let i = 0; i < existingChunksToUpdate.length; i += batchSize) {
            const batch = existingChunksToUpdate.slice(i, i + batchSize);
            
            // LanceDB doesn't support batch updates, so we need to delete and recreate
            // This is more efficient than individual updates for large batches
            const chunkIds = batch.map(c => c.metadata.chunkId);
            
            const chunkData = batch.map((doc, idx) => {
                // Build concept IDs (native array)
                // IMPORTANT: Lowercase concept names to match concepts table ID generation
                let conceptIds: number[] = [];
                if (doc.metadata.concepts && Array.isArray(doc.metadata.concepts) && doc.metadata.concepts.length > 0) {
                    conceptIds = doc.metadata.concepts.map((name: string) => hashToId(name.toLowerCase().trim()));
                }
                
                const data: any = {
                    id: chunkIds[idx],
                    text: doc.pageContent,
                    hash: doc.metadata.hash,
                    catalog_id: sourceToCatalogId.get(doc.metadata.source) || 0,
                    page_number: doc.metadata.page_number || 1,
                    vector: createSimpleEmbedding(doc.pageContent),
                    concept_ids: conceptIds
                };
                
                return data;
            });
            
            try {
                // Delete old records
                for (const chunkId of chunkIds) {
                    await chunksTable.delete(`id = "${chunkId}"`);
                }
                
                // Add updated records
                await chunksTable.add(chunkData);
                updatedCount += batch.length;
                
                if ((i + batchSize) % 5000 === 0 || i + batchSize >= existingChunksToUpdate.length) {
                    console.log(`  📊 Updated ${Math.min(i + batchSize, existingChunksToUpdate.length)}/${existingChunksToUpdate.length} chunks`);
                }
            } catch (error: any) {
                console.warn(`  ⚠️  Error updating batch ${i / batchSize + 1}: ${error.message}`);
            }
        }
        
        console.log(`✅ Updated ${updatedCount} existing chunks with concept metadata`);
    }

    // Update checkpoint stage to concepts
    await seedingCheckpoint.setStage('concepts');
    
    // ENHANCED: Build concept index with chunk statistics
    // When reprocessing documents, we need to rebuild from ALL catalog records, not just new ones
    if (catalogRecords.length > 0) {
        console.log("🧠 Building concept index with chunk statistics...");
        
        // Load ALL catalog records to build complete concept index
        let allCatalogRecords = catalogRecords;
        if (!overwrite && catalogTable) {
            try {
                console.log("  📚 Loading existing catalog records for concept index...");
                const existingRecords = await catalogTable.query().limit(100000).toArray();
                
                // Helper to convert Arrow arrays to JS arrays
                const toArray = (val: any): any[] => {
                    if (!val) return [];
                    if (Array.isArray(val)) return val;
                    if (typeof val === 'object' && 'toArray' in val) return Array.from(val.toArray());
                    return [];
                };
                
                // Convert existing records to Document format
                // FIX: Use normalized schema fields (summary, concept_ids, concept_names) 
                // instead of legacy fields (text, concepts)
                const existingDocs = existingRecords
                    .filter((r: any) => {
                        // Check for normalized schema fields
                        const conceptIds = toArray(r.concept_ids);
                        const conceptNames = toArray(r.concept_names);
                        return r.source && (conceptIds.length > 0 || conceptNames.length > 0);
                    })
                    .map((r: any) => {
                        // Reconstruct ConceptMetadata from normalized fields
                        const conceptNames = toArray(r.concept_names);
                        const categoryNames = toArray(r.category_names);
                        
                        // Create ConceptMetadata structure that ConceptIndexBuilder expects
                        const concepts = {
                            primary_concepts: conceptNames.map((name: string) => ({ 
                                name: name, 
                                summary: '' // Summary not stored in normalized schema
                            })),
                            categories: categoryNames.length > 0 ? categoryNames : ['General']
                        };
                        
                        return new Document({
                            pageContent: r.summary || '',  // FIX: catalog uses 'summary' not 'text'
                            metadata: {
                                source: r.source,
                                hash: r.hash,
                                concepts: concepts
                            }
                        });
                    })
                    .filter((d: Document) => d.metadata.concepts?.primary_concepts?.length > 0);
                
                console.log(`  ✅ Loaded ${existingRecords.length} existing records (${existingDocs.length} with concepts)`);
                
                // Merge with new records, removing duplicates by hash
                const hashSet = new Set(catalogRecords.map(r => r.metadata.hash));
                const nonDuplicateExisting = existingDocs.filter((d: Document) => !hashSet.has(d.metadata.hash));
                allCatalogRecords = [...catalogRecords, ...nonDuplicateExisting];
                
                console.log(`  📊 Building concept index from ${allCatalogRecords.length} total catalog records`);
            } catch (e: any) {
                console.warn(`  ⚠️  Could not load existing records, building from new records only: ${e.message}`);
            }
        }
        
        const conceptBuilder = new ConceptIndexBuilder();
        
        // Build concept index from ALL catalog records using ACTUAL catalog IDs (foreign key constraint)
        const conceptRecords = await conceptBuilder.buildConceptIndex(allCatalogRecords, sourceToCatalogIdMap);
        
        console.log(`✅ Built ${conceptRecords.length} unique concept records`);
        
        // Build chunk_ids for each concept (reverse mapping from chunks → concepts)
        console.log("🔗 Building concept → chunk_ids mapping...");
        try {
            const chunksTable = await db.openTable(defaults.CHUNKS_TABLE_NAME);
            const allChunks = await chunksTable.query().limit(1000000).toArray();
            
            // Build concept_id → chunk_ids mapping
            const conceptToChunkIds = new Map<number, number[]>();
            
            for (const chunk of allChunks) {
                const chunkId = chunk.id;
                let conceptIds: number[] = [];
                
                // Parse concept_ids (native array or JSON string or Arrow Vector)
                if (chunk.concept_ids) {
                    if (Array.isArray(chunk.concept_ids)) {
                        conceptIds = chunk.concept_ids;
                    } else if (typeof chunk.concept_ids === 'object' && 'toArray' in chunk.concept_ids) {
                        conceptIds = Array.from(chunk.concept_ids.toArray());
                    } else if (typeof chunk.concept_ids === 'string') {
                        try { conceptIds = JSON.parse(chunk.concept_ids); } catch (e) {}
                    }
                }
                
                // Add this chunk to each concept's chunk_ids
                for (const conceptId of conceptIds) {
                    if (!conceptToChunkIds.has(conceptId)) {
                        conceptToChunkIds.set(conceptId, []);
                    }
                    conceptToChunkIds.get(conceptId)!.push(chunkId);
                }
            }
            
            // Add chunk_ids to concept records
            for (const record of conceptRecords) {
                const conceptId = hashToId(record.name);
                const chunkIds = conceptToChunkIds.get(conceptId) || [];
                record.chunk_ids = chunkIds;
            }
            
            const conceptsWithChunks = conceptRecords.filter(c => c.chunk_ids && c.chunk_ids.length > 0).length;
            console.log(`  ✅ Mapped ${conceptsWithChunks} concepts to ${allChunks.length} chunks`);
        } catch (e: any) {
            console.warn(`  ⚠️  Could not build chunk_ids mapping: ${e.message}`);
        }
        
        // Note: Summaries are now included in the concept extraction response.
        
        // Enrich concepts with WordNet data (synonyms, broader_terms, narrower_terms)
        // Disabled by default - use --with-wordnet to enable
        if (argv['with-wordnet']) {
            console.log("📚 Enriching concepts with WordNet data...");
            const conceptEnricher = new ConceptEnricher();
            await conceptEnricher.enrichConcepts(conceptRecords);
        } else {
            console.log("⏭️  Skipping WordNet enrichment (use --with-wordnet to enable)");
        }
        
        // Note: Lexical linking (related_ids) can be added post-seeding via:
        //   npx tsx scripts/link_related_concepts.ts --db <path>
        
        // Log top concepts by weight (number of documents)
        const topConcepts = conceptRecords
            .filter(c => c.weight > 0)
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 5);
        
        if (topConcepts.length > 0) {
            console.log(`  🔝 Top concepts by document count:`);
            topConcepts.forEach(c => {
                console.log(`    • "${c.name}" appears in ${c.catalog_ids.length} documents`);
            });
        }
        
        if (conceptRecords.length > 0) {
            try {
                // Always drop and recreate concepts table to ensure consistency
                try {
                    await db.dropTable('concepts');
                    console.log("🗑️  Dropped existing concepts table");
                } catch (e) {
                    // Table didn't exist, that's fine
                }
                
                await conceptBuilder.createConceptTable(db, conceptRecords, 'concepts', sourceToCatalogIdMap);
                console.log("✅ Concept index created successfully (with catalog_ids from actual catalog table)");
                
                // Create categories table with hash-based IDs
                await createCategoriesTable(db, allCatalogRecords);
            } catch (error: any) {
                console.error("⚠️  Error creating concept table:", error.message);
                console.log("  Continuing with seeding...");
            }
        }
    }

    // Mark checkpoint as complete
    await seedingCheckpoint.setStage('complete');

    // Calculate database size
    const dbSize = await getDatabaseSize(databaseDir);
    console.log(`✅ Created ${catalogRecords.length} catalog records`);
    if (newChunksToCreate.length > 0) {
        console.log(`✅ Created ${newChunksToCreate.length} new chunk records`);
    }
    if (existingChunksToUpdate.length > 0) {
        console.log(`✅ Updated ${existingChunksToUpdate.length} existing chunk records with concept metadata`);
    }
    console.log(`💾 Database size: ${dbSize}`);
    
    // Display checkpoint stats
    const finalStats = seedingCheckpoint.getStats();
    console.log(`📋 Checkpoint: ${finalStats.totalProcessed} processed, ${finalStats.totalFailed} failed`);
    
    console.log("🎉 Seeding completed successfully!");
}

// Log script start
console.log(`📝 Log file: ${logFile}`);

// Ensure log stream is closed on exit
process.on('exit', () => {
    logStream.end();
});

process.on('SIGINT', () => {
    console.log('\n\n⚠️  Interrupted by user');
    logStream.end();
    process.exit(130);
});

process.on('SIGTERM', () => {
    console.log('\n\n⚠️  Terminated');
    logStream.end();
    process.exit(143);
});

hybridFastSeed().catch((error) => {
    console.error("❌ Seeding failed:", error);
    logStream.end();
    process.exit(1);
});




