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
import { generateCategorySummaries, generateConceptSummaries } from './src/concepts/summary_generator.js';

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

const argv: minimist.ParsedArgs = minimist(process.argv.slice(2), {boolean: ["overwrite", "rebuild-concepts", "auto-reseed"]});

const databaseDir = argv["dbpath"] || path.join(process.env.HOME || process.env.USERPROFILE || "~", ".concept_rag");
const filesDir = argv["filesdir"];
const overwrite = argv["overwrite"];
const rebuildConcepts = argv["rebuild-concepts"];
const autoReseed = argv["auto-reseed"];
const openrouterApiKey = process.env.OPENROUTER_API_KEY;

function validateArgs() {
    if (!filesDir) {
        console.error("Please provide a directory with files (--filesdir) to process");
        console.error("Usage: npx tsx hybrid_fast_seed.ts --filesdir <directory> [--dbpath <path>] [--overwrite] [--rebuild-concepts] [--auto-reseed]");
        console.error("  --filesdir: Directory containing PDF files to process (required)");
        console.error("  --dbpath: Database path (optional, defaults to ~/.concept_rag)");
        console.error("  --overwrite: Overwrite existing database tables (optional)");
        console.error("  --rebuild-concepts: Rebuild concept index even if no new documents (optional)");
        console.error("  --auto-reseed: Automatically re-process documents with incomplete metadata (optional)");
        process.exit(1);
    }
    
    if (!openrouterApiKey) {
        console.error("Please set OPENROUTER_API_KEY environment variable");
        process.exit(1);
    }
    
    console.log(`📂 Database: ${databaseDir}`);
    console.log(`🔄 Overwrite mode: ${overwrite}`);
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
                            loc: { pageNumber: pageNumber },
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
                            loc: { pageNumber: pageNumber },
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
                        loc: { pageNumber: pageNumber },
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
                loc: { pageNumber: 1 },
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
    skipExistsCheck: boolean
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
        
        for (const docFile of documentFiles) {
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
                if (!skipExistsCheck && catalogTable && hash !== 'unknown') {
                    // NEW: Check completeness instead of just existence
                    const completeness = await checkDocumentCompleteness(
                        catalogTable,
                        chunksTable,
                        hash,
                        docFile
                    );
                    
                    if (completeness.isComplete) {
                        console.log(`  ⏭[${hash.slice(0, 4)}..${hash.slice(-4)}] ${truncateFilePath(relativePath)} (complete)`);
                        skippedFiles.push(relativePath);
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
                                                loc: chunk.loc || { pageNumber: 1 },
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
    mode?: "overwrite"
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
        
        const baseData: any = {
            id: i.toString(),
            source: doc.metadata.source || '',
            hash: doc.metadata.hash || '',
            vector: createSimpleEmbedding(doc.pageContent)
        };
        
        // Catalog uses 'summary', chunks use 'text'
        if (isCatalog) {
            baseData.summary = doc.pageContent;  // Renamed from 'text' to 'summary'
        } else {
            baseData.text = doc.pageContent;
            baseData.loc = JSON.stringify(doc.metadata.loc || {});
            // ALWAYS include concept_ids and category_ids for chunks schema (LanceDB needs consistent schema)
            // Use placeholder [0] for empty arrays to enable LanceDB type inference
            baseData.concept_ids = [0];  // Will be overwritten below if concepts exist
            baseData.category_ids = [0]; // Will be overwritten below if categories exist
        }
        
        // Add reserved bibliographic fields for catalog entries
        if (isCatalog) {
            baseData.author = '';
            baseData.year = '';
            baseData.publisher = '';
            baseData.isbn = '';
        }
        
        // Add concept metadata if present (using native arrays)
        if (doc.metadata.concepts) {
            // Extract categories and generate hash-based category IDs
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
            
            // Only add concept_ids to chunks, NOT catalog (concepts are derived from chunks)
            if (!isCatalog) {
                let conceptNames: string[] = [];
                // Check Array.isArray FIRST since arrays are also objects
                if (Array.isArray(doc.metadata.concepts)) {
                    conceptNames = doc.metadata.concepts;
                } else if (typeof doc.metadata.concepts === 'object' && doc.metadata.concepts.primary_concepts) {
                    conceptNames = doc.metadata.concepts.primary_concepts;
                }
                
                if (conceptNames.length > 0) {
                    const conceptIds = conceptNames.map((name: string) => hashToId(name));
                    baseData.concept_ids = conceptIds;
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

async function processDocuments(rawDocs: Document[]) {
    const docsBySource = rawDocs.reduce((acc: Record<string, Document[]>, doc: Document) => {
        const source = doc.metadata.source;
        if (!acc[source]) {
            acc[source] = [];
        }
        acc[source].push(doc);
        return acc;
    }, {});

    let catalogRecords: Document[] = [];
    
    // Initialize concept extractor
    const conceptExtractor = new ConceptExtractor(process.env.OPENROUTER_API_KEY || '');

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
        
        // Include concepts in the embedded content for better vector search
        const enrichedContent = `
${contentOverview}

Key Concepts: ${concepts.primary_concepts.join(', ')}
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
        
        // Debug logging for OCR persistence troubleshooting
        if (process.env.DEBUG_OCR && isOcrProcessed) {
            console.log(`📝 Creating catalog record for OCR'd document: hash=${hash.slice(0, 8)}..., source=${sourceBasename}`);
        }
    }

    return catalogRecords;
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

async function rebuildConceptIndexFromExistingData(
    db: lancedb.Connection,
    catalogTable: lancedb.Table,
    chunksTable: lancedb.Table
): Promise<void> {
    const catalogRecords = await catalogTable.query().limit(100000).toArray();
    
    // Convert to Document format
    const catalogDocs = catalogRecords
        .filter((r: any) => r.text && r.source && r.concepts)
        .map((r: any) => {
            let concepts = r.concepts;
            if (typeof concepts === 'string') {
                try {
                    concepts = JSON.parse(concepts);
                } catch (e) {
                    concepts = null;
                }
            }
            
            return new Document({
                pageContent: r.text || '',
                metadata: {
                    source: r.source,
                    hash: r.hash,
                    concepts: concepts
                }
            });
        })
        .filter((d: Document) => d.metadata.concepts);
    
    console.log(`  ✅ Loaded ${catalogRecords.length} catalog records (${catalogDocs.length} with concepts)`);
    
    const allChunkRecords = await chunksTable.query().limit(1000000).toArray();

    // Convert chunk records to Documents (handle both old and new schema)
    const allChunks = allChunkRecords.map((chunk: any) => {
        // Handle concept_ids (new) or concepts (legacy)
        let concepts: string[] = [];
        if (chunk.concept_ids) {
            // New schema: concept_ids is a native array
            // For concept index building, we don't need to resolve names here
            // The ConceptIndexBuilder uses document concepts, not chunk concepts
        }
        if (chunk.concepts) {
            try {
                concepts = typeof chunk.concepts === 'string' 
                    ? JSON.parse(chunk.concepts) 
                    : chunk.concepts;
            } catch (e) {
                concepts = [];
            }
        }
        
        return new Document({
            pageContent: chunk.text || '',
            metadata: {
                source: chunk.source,
                hash: chunk.hash,
                concepts: concepts
            }
        });
    });
    
    console.log(`  ✅ Loaded ${allChunks.length} total chunks`);
    
    const conceptBuilder = new ConceptIndexBuilder();
    const conceptRecords = await conceptBuilder.buildConceptIndex(catalogDocs, allChunks);
    
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
        const conceptId = hashToId(record.concept);
        const chunkIds = conceptToChunkIds.get(conceptId) || [];
        record.chunk_ids = chunkIds;
    }
    
    const conceptsWithChunks = conceptRecords.filter(c => c.chunk_ids && c.chunk_ids.length > 0).length;
    console.log(`  ✅ Mapped ${conceptsWithChunks} concepts to ${allChunkRecords.length} chunks`);
    
    // Generate summaries for concepts using LLM
    const conceptNames = conceptRecords.map(c => c.concept);
    const conceptSummaries = await generateConceptSummaries(conceptNames);
    
    // Add summaries to concept records
    for (const record of conceptRecords) {
        const summary = conceptSummaries.get(record.concept.toLowerCase());
        if (summary) {
            record.summary = summary;
        }
    }
    
    // Build source → catalog ID mapping for integer ID optimization
    console.log("  🔗 Building source-to-catalog-ID mapping...");
    const sourceToIdMap = new Map<string, string>();
    const incompleteRecords = [];
    const sourceCounts = new Map<string, number>();
    const duplicateSources = [];
    
    for (const row of catalogRecords) {
        if (row.source && row.id) {
            // Check for duplicate sources
            if (sourceToIdMap.has(row.source)) {
                const existingId = sourceToIdMap.get(row.source);
                duplicateSources.push({
                    source: row.source,
                    existingId: existingId,
                    duplicateId: row.id,
                    hash: row.hash
                });
            }
            sourceToIdMap.set(row.source, row.id);
            
            // Track source counts
            sourceCounts.set(row.source, (sourceCounts.get(row.source) || 0) + 1);
        } else {
            // Detailed analysis of what's wrong
            let reason = '';
            if (!row.source) {
                reason = `missing/empty source (type: ${typeof row.source}, value: ${JSON.stringify(row.source)})`;
            } else if (!row.id) {
                reason = `missing/empty id (type: ${typeof row.id}, value: ${JSON.stringify(row.id)})`;
            }
            
            incompleteRecords.push({
                source: row.source || '[no source]',
                id: row.id || '[no id]',
                hash: row.hash || 'unknown',
                reason: reason,
                hasText: !!row.text,
                hasConcepts: !!row.concepts
            });
        }
    }
    
    // Report incomplete records
    if (incompleteRecords.length > 0) {
        console.log(`  ⚠️  Found ${incompleteRecords.length} incomplete catalog records:`);
        incompleteRecords.forEach((rec, idx) => {
            const sourceDisplay = typeof rec.source === 'string' ? rec.source.substring(0, 50) : rec.source;
            console.log(`     ${idx + 1}. ${sourceDisplay}... [${rec.hash.slice(0, 8)}]`);
            console.log(`        → ${rec.reason}`);
            console.log(`        → has text: ${rec.hasText}, has concepts: ${rec.hasConcepts}`);
        });
        console.log(`\n  💡 To fix: run with --auto-reseed to delete and re-process these records`);
    }
    
    // Report duplicate sources
    if (duplicateSources.length > 0) {
        console.log(`  ⚠️  Found ${duplicateSources.length} duplicate source paths (same file path, different IDs):`);
        duplicateSources.forEach((dup, idx) => {
            const sourceDisplay = dup.source.substring(0, 60);
            console.log(`     ${idx + 1}. ${sourceDisplay}...`);
            console.log(`        → Existing ID: ${dup.existingId}, Duplicate ID: ${dup.duplicateId} [${dup.hash.slice(0, 8)}]`);
        });
        console.log(`\n  💡 Duplicate sources mean multiple catalog entries point to the same file`);
        console.log(`     This usually happens when re-seeding without --overwrite`);
    }
    
    console.log(`  ✅ Mapped ${sourceToIdMap.size}/${catalogRecords.length} sources to catalog IDs`);
    // Drop and recreate concepts table
    try {
        await db.dropTable('concepts');
        console.log("  🗑️  Dropped existing concepts table");
    } catch (e) {
        // Table didn't exist, that's fine
    }
    
    await conceptBuilder.createConceptTable(db, conceptRecords, 'concepts', sourceToIdMap);
    console.log("  ✅ Concept index created successfully (with catalog_ids optimization)");
    // Create categories table with hash-based IDs
    await createCategoriesTable(db, catalogDocs);
}

async function hybridFastSeed() {
    validateArgs();

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

    // Load files
    const { documents: rawDocs, documentsNeedingChunks } = await loadDocumentsWithErrorHandling(filesDir, catalogTable, chunksTable, overwrite || !catalogTableExists);

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
    for (const doc of rawDocs) {
        doc.metadata = { 
            loc: doc.metadata.loc, 
            source: doc.metadata.source,
            hash: doc.metadata.hash,
            ocr_processed: doc.metadata.ocr_processed,
            ocr_method: doc.metadata.ocr_method
        };
    }

    console.log("🚀 Creating catalog with LLM summaries...");
    const catalogRecords = await processDocuments(rawDocs);
    
    if (catalogRecords.length > 0) {
        console.log("📊 Creating catalog table with fast local embeddings...");
        await createLanceTableWithSimpleEmbeddings(db, catalogRecords, defaults.CATALOG_TABLE_NAME, overwrite ? "overwrite" : undefined);
    }

    console.log(`Number of new catalog records: ${catalogRecords.length}`);
    // Build source → catalog ID mapping for integer ID optimization
    console.log("🔗 Building source-to-catalog-ID mapping for optimization...");
    catalogTable = await db.openTable(defaults.CATALOG_TABLE_NAME);
    const catalogRows = await catalogTable.query().toArray();
    const sourceToIdMap = new Map<string, string>();
    for (const row of catalogRows) {
        if (row.source && row.id) {
            sourceToIdMap.set(row.source, row.id);
        }
    }
    console.log(`✅ Mapped ${sourceToIdMap.size} sources to catalog IDs`);
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
        await createLanceTableWithSimpleEmbeddings(db, newChunksToCreate, defaults.CHUNKS_TABLE_NAME, overwrite ? "overwrite" : undefined);
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
            // Build category ID map for this batch
            const batchCategories = new Set<string>();
            batch.forEach(doc => {
                if (doc.metadata.concept_categories) {
                    doc.metadata.concept_categories.forEach((cat: string) => batchCategories.add(cat));
                }
            });
            const batchCategoryIdMap = buildCategoryIdMap(batchCategories);
            
            const chunkData = batch.map((doc, idx) => {
                // Build concept IDs (native array)
                let conceptIds: number[] = [];
                if (doc.metadata.concepts && Array.isArray(doc.metadata.concepts) && doc.metadata.concepts.length > 0) {
                    conceptIds = doc.metadata.concepts.map((name: string) => hashToId(name));
                }
                
                // Build category IDs (native array)
                let categoryIds: number[] = [];
                if (doc.metadata.concept_categories && doc.metadata.concept_categories.length > 0) {
                    categoryIds = doc.metadata.concept_categories.map((cat: string) => 
                        batchCategoryIdMap.get(cat) || hashToId(cat)
                    );
                }
                
                const data: any = {
                    id: chunkIds[idx],
                    text: doc.pageContent,
                    source: doc.metadata.source,
                    hash: doc.metadata.hash,
                    loc: JSON.stringify(doc.metadata.loc || {}),
                    vector: createSimpleEmbedding(doc.pageContent),
                    concept_ids: conceptIds,
                    category_ids: categoryIds
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
                
                // Convert existing records to Document format
                const existingDocs = existingRecords
                    .filter((r: any) => r.text && r.source && r.concepts)
                    .map((r: any) => {
                        let concepts = r.concepts;
                        if (typeof concepts === 'string') {
                            try {
                                concepts = JSON.parse(concepts);
                            } catch (e) {
                                concepts = null;
                            }
                        }
                        
                        return new Document({
                            pageContent: r.text || '',
                            metadata: {
                                source: r.source,
                                hash: r.hash,
                                concepts: concepts
                            }
                        });
                    })
                    .filter((d: Document) => d.metadata.concepts);
                
                console.log(`  ✅ Loaded ${existingRecords.length} existing records (${existingDocs.length} with concepts)`);
                
                // Merge with new records, removing duplicates by hash
                const hashSet = new Set(catalogRecords.map(r => r.metadata.hash));
                const nonDuplicateExisting = existingDocs.filter((d: Document) => !hashSet.has(d.metadata.hash));
                allCatalogRecords = [...catalogRecords, ...nonDuplicateExisting];
                
                console.log(`  📊 Building concept index from ${allCatalogRecords.length} total catalog records`);
            } catch (e) {
                console.warn(`  ⚠️  Could not load existing records, building from new records only: ${e.message}`);
            }
        }
        
        const conceptBuilder = new ConceptIndexBuilder();
        
        // Build concept index from ALL catalog records (new + existing)
        const conceptRecords = await conceptBuilder.buildConceptIndex(allCatalogRecords);
        
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
                const conceptId = hashToId(record.concept);
                const chunkIds = conceptToChunkIds.get(conceptId) || [];
                record.chunk_ids = chunkIds;
            }
            
            const conceptsWithChunks = conceptRecords.filter(c => c.chunk_ids && c.chunk_ids.length > 0).length;
            console.log(`  ✅ Mapped ${conceptsWithChunks} concepts to ${allChunks.length} chunks`);
        } catch (e: any) {
            console.warn(`  ⚠️  Could not build chunk_ids mapping: ${e.message}`);
        }
        
        // Generate summaries for concepts using LLM
        const conceptNames = conceptRecords.map(c => c.concept);
        const conceptSummaries = await generateConceptSummaries(conceptNames);
        
        // Add summaries to concept records
        for (const record of conceptRecords) {
            const summary = conceptSummaries.get(record.concept.toLowerCase());
            if (summary) {
                record.summary = summary;
            }
        }
        
        // Log top concepts by weight (number of documents)
        const topConcepts = conceptRecords
            .filter(c => c.weight > 0)
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 5);
        
        if (topConcepts.length > 0) {
            console.log(`  🔝 Top concepts by document count:`);
            topConcepts.forEach(c => {
                console.log(`    • "${c.concept}" appears in ${c.catalog_ids.length} documents`);
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
                
                await conceptBuilder.createConceptTable(db, conceptRecords, 'concepts', sourceToIdMap);
                console.log("✅ Concept index created successfully (with catalog_ids optimization)");
                
                // Create categories table with hash-based IDs
                await createCategoriesTable(db, allCatalogRecords);
                // Initialize ConceptIdCache for concept_ids optimization
                console.log("🔧 Initializing ConceptIdCache for fast ID resolution...");
                const { ConceptIdCache } = await import('./src/infrastructure/cache/concept-id-cache.js');
                const { LanceDBConceptRepository } = await import('./src/infrastructure/lancedb/repositories/lancedb-concept-repository.js');
                const conceptsTable = await db.openTable('concepts');
                const conceptRepo = new LanceDBConceptRepository(conceptsTable);
                const conceptIdCache = ConceptIdCache.getInstance();
                conceptIdCache.clear();  // Clear any existing cache from previous runs
                await conceptIdCache.initialize(conceptRepo);
                const cacheStats = conceptIdCache.getStats();
                console.log(`✅ ConceptIdCache initialized: ${cacheStats.conceptCount} concepts, ~${Math.round(cacheStats.memorySizeEstimate / 1024)}KB`);
            } catch (error: any) {
                console.error("⚠️  Error creating concept table:", error.message);
                console.log("  Continuing with seeding...");
            }
        }
    }

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




