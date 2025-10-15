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

// Suppress PDF.js warnings that clutter output
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

// Suppress console.warn
console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (message.includes('Ran out of space in font private use area') ||
        message.includes('font private use area') ||
        message.includes('private use area') ||
        message.includes('FormatError') ||
        message.includes('FlateDecode') ||
        message.includes('Empty') && message.includes('stream') ||
        message.includes('webpack://') ) {
        return; // Suppress these verbose warnings
    }
    originalConsoleWarn.apply(console, args);
};

// Suppress console.error for the same messages
console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (message.includes('Ran out of space in font private use area') ||
        message.includes('font private use area') ||
        message.includes('private use area') ||
        message.includes('FlateDecode') ||
        message.includes('Empty') && message.includes('stream') ||
        message.includes('Warning:') && message.includes('font')) {
        return; // Suppress these verbose warnings
    }
    originalConsoleError.apply(console, args);
};

// Also suppress console.log for these warnings (some libraries use it)
console.log = (...args: any[]) => {
    const message = args.join(' ');
    if (message.includes('Warning:') && (
        message.includes('Ran out of space in font private use area') ||
        message.includes('font private use area') ||
        message.includes('private use area') ||
        message.includes('FlateDecode') ||
        message.includes('Empty') && message.includes('stream'))) {
        return; // Suppress these verbose warnings
    }
    originalConsoleLog.apply(console, args);
};

const argv: minimist.ParsedArgs = minimist(process.argv.slice(2), {boolean: "overwrite"});

const databaseDir = argv["dbpath"] || path.join(process.env.HOME || process.env.USERPROFILE || "~", ".concept_rag");
const filesDir = argv["filesdir"];
const overwrite = argv["overwrite"];
const openrouterApiKey = process.env.OPENROUTER_API_KEY;

function validateArgs() {
    if (!filesDir) {
        console.error("Please provide a directory with files (--filesdir) to process");
        console.error("Usage: npx tsx hybrid_fast_seed.ts --filesdir <directory> [--dbpath <path>] [--overwrite]");
        console.error("  --filesdir: Directory containing PDF files to process (required)");
        console.error("  --dbpath: Database path (optional, defaults to ~/.concept_rag)");
        console.error("  --overwrite: Overwrite existing database tables (optional)");
        process.exit(1);
    }
    
    if (!openrouterApiKey) {
        console.error("Please set OPENROUTER_API_KEY environment variable");
        process.exit(1);
    }
    
    console.log("DATABASE PATH: ", databaseDir);
    console.log("FILES DIRECTORY: ", filesDir);
    console.log("OVERWRITE FLAG: ", overwrite);
    console.log("✅ OpenRouter API key configured");
    console.log("🚀 Hybrid approach: OpenRouter summaries + Fast local embeddings");
}

// Direct OpenRouter API call for summarization
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
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
}

// Convert PDF file to base64 for OpenRouter OCR processing
function pdfToBase64(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    return fileBuffer.toString('base64');
}

// Local Tesseract OCR processing
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
        console.warn(`⚠️ OpenRouter summarization failed: ${error.message}`);
        return `Document overview (${rawDocs.length} pages)`;
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

async function findPdfFilesRecursively(dir: string): Promise<string[]> {
    const pdfFiles: string[] = [];
    
    try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
                // Recursively search subdirectories
                const subDirPdfs = await findPdfFilesRecursively(fullPath);
                pdfFiles.push(...subDirPdfs);
            } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
                pdfFiles.push(fullPath);
            }
        }
    } catch (error) {
        console.warn(`⚠️ Error scanning directory ${dir}: ${error.message}`);
    }
    
    return pdfFiles;
}

async function loadDocumentsWithErrorHandling(filesDir: string, catalogTable: lancedb.Table | null, skipExistsCheck: boolean) {
    const documents: Document[] = [];
    const failedFiles: string[] = [];
    const skippedFiles: string[] = [];
    
    try {
        // Check if filesDir is a file or directory
        const stats = await fs.promises.stat(filesDir);
        if (!stats.isDirectory()) {
            throw new Error(`Path is not a directory: ${filesDir}. Please provide a directory path, not a file path.`);
        }
        
        console.log(`🔍 Recursively scanning ${filesDir} for PDF files...`);
        const pdfFiles = await findPdfFilesRecursively(filesDir);
        
        console.log(`📚 Found ${pdfFiles.length} PDF files`);
        
        if (!skipExistsCheck && catalogTable) {
            console.log(`🔍 Checking which files are already in database...`);
        }
        
        for (const pdfFile of pdfFiles) {
            const relativePath = path.relative(filesDir, pdfFile);
            
            // Calculate hash first (available for all cases)
            let hash = 'unknown';
            try {
                const fileContent = await fs.promises.readFile(pdfFile);
                hash = crypto.createHash('sha256').update(fileContent).digest('hex');
            } catch (hashError) {
                // If we can't read the file for hashing, we'll use 'unknown'
            }
            
            try {
                if (!skipExistsCheck && catalogTable && hash !== 'unknown') {
                    const exists = await catalogRecordExists(catalogTable, hash);
                    if (exists) {
                        console.log(`⏭️ [${hash.slice(0, 4)}..${hash.slice(-4)}] ${truncateFilePath(relativePath)}`);
                        skippedFiles.push(relativePath);
                        continue; // Skip loading this file entirely
                    }
                }
                
                const loader = new PDFLoader(pdfFile);
                
                const docs = await Promise.race([
                    loader.load(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('PDF loading timeout')), 30000)
                    )
                ]) as Document[];
                
                if (docs.length === 0) {
                    throw new Error('PDF contains no pages');
                }
                
                // Add hash to all document pages for tracking
                docs.forEach(doc => {
                    doc.metadata.hash = hash;
                });
                
                documents.push(...docs);
                console.log(`📥 [${hash.slice(0, 4)}..${hash.slice(-4)}] ${truncateFilePath(relativePath)} (${docs.length} pages)`);
            } catch (error: any) {
                const errorMsg = error?.message || String(error);
                
                // Try OCR fallback for scanned PDFs that failed normal processing
                let ocrAttempted = false;
                let ocrSuccessful = false;
                try {
                    console.log(`🔍 OCR processing: ${truncateFilePath(relativePath)}`);
                    const ocrResult = await callOpenRouterOCR(pdfFile);
                    
                    if (ocrResult && ocrResult.documents && ocrResult.documents.length > 0) {
                        // Add hash to OCR'd document metadata for proper tracking
                        ocrResult.documents.forEach(doc => {
                            doc.metadata.hash = hash;
                        });
                        
                        documents.push(...ocrResult.documents);
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
                    console.log(`❌ ${hashDisplay} ${truncateFilePath(relativePath)} (OCR failed: ${ocrError.message})`);
                    ocrAttempted = true;
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
        
        const loadedCount = pdfFiles.length - failedFiles.length - skippedFiles.length;
        const ocrProcessedCount = documents.filter(doc => doc.metadata.ocr_processed).length;
        const standardProcessedCount = loadedCount - (ocrProcessedCount > 0 ? 1 : 0); // Approximate count of files processed via standard PDF loading
        
        console.log(`\n📊 Summary: • 📥 Loaded: ${loadedCount} • ⏭️ Skipped: ${skippedFiles.length} • ⚠️ Error: ${failedFiles.length}`);
        
        if (ocrProcessedCount > 0) {
            console.log(`🤖 OCR Summary: • 📄 ${ocrProcessedCount} pages processed via OCR • 📚 Standard PDFs also processed`);
        }
        
        return documents;
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
    
    console.log(`🔄 Creating simple embeddings for ${documents.length} documents...`);
    
    // Generate fast local embeddings
    // Enhanced: Include concept metadata if present
    const data = documents.map((doc, i) => {
        const baseData: any = {
            id: i.toString(),
            text: doc.pageContent,
            source: doc.metadata.source || '',
            hash: doc.metadata.hash || '',
            loc: JSON.stringify(doc.metadata.loc || {}),
            vector: createSimpleEmbedding(doc.pageContent)
        };
        
        // Add concept metadata if present (for chunks)
        if (doc.metadata.concepts) {
            baseData.concepts = JSON.stringify(doc.metadata.concepts);
        }
        if (doc.metadata.concept_categories) {
            baseData.concept_categories = JSON.stringify(doc.metadata.concept_categories);
        }
        if (doc.metadata.concept_density !== undefined) {
            baseData.concept_density = doc.metadata.concept_density;
        }
        
        return baseData;
    });
    
    console.log(`✅ Generated ${data.length} embeddings locally (instant)`);
    
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
                }
                return table;
            }
        } catch (e) {
            // Continue to create new table
        }
        
        // Create new table
        const table = await db.createTable(tableName, data);
        console.log(`✅ Created LanceDB table: ${tableName}`);
        return table;
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

async function hybridFastSeed() {
    validateArgs();

    const db = await lancedb.connect(databaseDir);

    let catalogTable: lancedb.Table | null = null;
    let catalogTableExists = true;

    try {
        catalogTable = await db.openTable(defaults.CATALOG_TABLE_NAME);
    } catch (e) {
        console.log(`Catalog table "${defaults.CATALOG_TABLE_NAME}" doesn't exist. Will create it.`);
        catalogTableExists = false;
    }

    if (overwrite) {
        try {
            await db.dropTable(defaults.CATALOG_TABLE_NAME);
            await db.dropTable(defaults.CHUNKS_TABLE_NAME);
            console.log("🗑️ Dropped existing tables");
            catalogTable = null;
            catalogTableExists = false;
        } catch (e) {
            console.log("Tables didn't exist");
        }
    }

    // Load files
    console.log("Loading files...");
    const rawDocs = await loadDocumentsWithErrorHandling(filesDir, catalogTable, overwrite || !catalogTableExists);

    if (rawDocs.length === 0) {
        console.log("✅ No new documents to process - all files already exist in database.");
        console.log("🎉 Seeding completed successfully (no changes needed)!");
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

    console.log("🚀 Creating catalog with OpenRouter summaries...");
    
    // Check API rate limits before starting
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (openRouterKey) {
        const { ConceptExtractor } = await import('./src/concepts/concept_extractor.js');
        const extractor = new ConceptExtractor(openRouterKey);
        await extractor.checkRateLimits();
        console.log(); // Blank line after rate limit info
    }
    
    const catalogRecords = await processDocuments(rawDocs);
    
    if (catalogRecords.length > 0) {
        console.log("📊 Creating catalog table with fast local embeddings...");
        await createLanceTableWithSimpleEmbeddings(db, catalogRecords, defaults.CATALOG_TABLE_NAME, overwrite ? "overwrite" : undefined);
    }

    console.log(`Number of new catalog records: ${catalogRecords.length}`);
    
    // Build and store concept index (moved to after chunk creation for chunk_count)
    // We'll create chunks first, then build concept index with chunk stats

    console.log("\n🔧 Creating chunks with fast local embeddings...");
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 10,
    });
    const docs = await splitter.splitDocuments(rawDocs);
    
    // ENHANCED: Enrich chunks with concept metadata
    if (catalogRecords.length > 0 && docs.length > 0) {
        console.log("\n🧠 Enriching chunks with concept metadata...");
        
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
        
        for (const chunk of docs) {
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
                chunk.metadata.concept_density = matched.density;
                
                if (matched.concepts.length > 0) {
                    enrichedCount++;
                }
            }
        }
        
        const stats = matcher.getMatchingStats(
            docs.filter(d => d.metadata.concepts).map(d => ({
                text: d.pageContent,
                source: d.metadata.source || '',
                concepts: d.metadata.concepts || [],
                concept_categories: d.metadata.concept_categories || [],
                concept_density: d.metadata.concept_density || 0
            }))
        );
        
        console.log(`✅ Enriched ${enrichedCount} chunks with concepts`);
        console.log(`  📊 Stats: ${stats.chunksWithConcepts} chunks with concepts, avg ${stats.avgConceptsPerChunk.toFixed(1)} concepts/chunk`);
        if (stats.topConcepts.length > 0) {
            console.log(`  🔝 Top concepts: ${stats.topConcepts.slice(0, 5).map(c => c.concept).join(', ')}`);
        }
    }
    
    if (docs.length > 0) {
        console.log(`📊 Processing ${docs.length} chunks...`);
        await createLanceTableWithSimpleEmbeddings(db, docs, defaults.CHUNKS_TABLE_NAME, overwrite ? "overwrite" : undefined);
    }

    // ENHANCED: Build concept index with chunk statistics
    if (catalogRecords.length > 0) {
        console.log("\n🧠 Building concept index with chunk statistics...");
        const conceptBuilder = new ConceptIndexBuilder();
        const conceptRecords = await conceptBuilder.buildConceptIndex(catalogRecords, docs);
        
        console.log(`✅ Built ${conceptRecords.length} unique concept records`);
        
        // Log concepts with highest chunk counts
        const topConceptsByChunks = conceptRecords
            .filter(c => c.chunk_count > 0)
            .sort((a, b) => b.chunk_count - a.chunk_count)
            .slice(0, 5);
        
        if (topConceptsByChunks.length > 0) {
            console.log(`  🔝 Top concepts by chunk count:`);
            topConceptsByChunks.forEach(c => {
                console.log(`    • "${c.concept}" appears in ${c.chunk_count} chunks`);
            });
        }
        
        if (conceptRecords.length > 0) {
            try {
                // Drop existing concepts table if overwrite
                if (overwrite) {
                    try {
                        await db.dropTable('concepts');
                        console.log("  🗑️  Dropped existing concepts table");
                    } catch (e) {
                        // Table didn't exist, that's fine
                    }
                }
                
                await conceptBuilder.createConceptTable(db, conceptRecords, 'concepts');
                console.log("✅ Concept index created successfully");
            } catch (error: any) {
                console.error("⚠️  Error creating concept table:", error.message);
                console.log("  Continuing with seeding...");
            }
        }
    }

    console.log(`\n✅ Created ${catalogRecords.length} catalog records`);
    console.log(`✅ Created ${docs.length} chunk records`);
    console.log("🎉 Seeding completed successfully!");
}

hybridFastSeed().catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
});



