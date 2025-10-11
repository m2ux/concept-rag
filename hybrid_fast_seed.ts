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
import * as defaults from './src/config.js'

// Handle unhandled promise rejections to prevent crashes
process.on('unhandledRejection', (reason: any, promise) => {
    // Only show concise error message, not full stack trace
    const message = reason?.message || String(reason);
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
        message.includes('private use area'))) {
        return; // Suppress these verbose warnings
    }
    originalConsoleLog.apply(console, args);
};

const argv: minimist.ParsedArgs = minimist(process.argv.slice(2), {boolean: "overwrite"});

const databaseDir = argv["dbpath"] || path.join(process.env.HOME || process.env.USERPROFILE || "~", ".lance_mcp");
const filesDir = argv["filesdir"];
const overwrite = argv["overwrite"];
const openrouterApiKey = process.env.OPENROUTER_API_KEY;

function validateArgs() {
    if (!filesDir) {
        console.error("Please provide a directory with files (--filesdir) to process");
        console.error("Usage: npx tsx hybrid_fast_seed.ts --filesdir <directory> [--dbpath <path>] [--overwrite]");
        console.error("  --filesdir: Directory containing PDF files to process (required)");
        console.error("  --dbpath: Database path (optional, defaults to ~/.lance_mcp)");
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
            model: 'anthropic/claude-3.5-haiku',
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

async function generateContentOverview(rawDocs: Document[]): Promise<string> {
    const combinedText = rawDocs.map(doc => doc.pageContent).join('\n\n').slice(0, 10000);
    
    try {
        const summary = await callOpenRouterChat(combinedText);
        console.log(`✅ Summary generated successfully`);
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
        return results.length > 0;
    } catch (error) {
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

async function loadDocumentsWithErrorHandling(filesDir: string) {
    const documents: Document[] = [];
    const failedFiles: string[] = [];
    
    try {
        // Check if filesDir is a file or directory
        const stats = await fs.promises.stat(filesDir);
        if (!stats.isDirectory()) {
            throw new Error(`Path is not a directory: ${filesDir}. Please provide a directory path, not a file path.`);
        }
        
        console.log(`🔍 Recursively scanning ${filesDir} for PDF files...`);
        const pdfFiles = await findPdfFilesRecursively(filesDir);
        
        console.log(`📚 Found ${pdfFiles.length} PDF files, processing all of them...`);
        
        for (const pdfFile of pdfFiles) {
            try {
                const relativePath = path.relative(filesDir, pdfFile);
                console.log(`Loading: ${relativePath}`);
                const loader = new PDFLoader(pdfFile);
                
                const docs = await Promise.race([
                    loader.load(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('PDF loading timeout')), 30000)
                    )
                ]) as Document[];
                
                documents.push(...docs);
                console.log(`✅ Successfully loaded: ${relativePath} (${docs.length} pages)`);
            } catch (error: any) {
                const relativePath = path.relative(filesDir, pdfFile);
                const errorMsg = error?.message || String(error);
                // Clean up common error messages for better readability
                let cleanErrorMsg = errorMsg;
                if (errorMsg.includes('Bad encoding in flate stream')) {
                    cleanErrorMsg = 'Bad PDF encoding';
                } else if (errorMsg.includes('PDF loading timeout')) {
                    cleanErrorMsg = 'Loading timeout';
                } else if (errorMsg.includes('Invalid PDF structure')) {
                    cleanErrorMsg = 'Invalid PDF format';
                } else if (errorMsg.length > 50) {
                    cleanErrorMsg = errorMsg.substring(0, 50) + '...';
                }
                console.warn(`⚠️  Skipping ${relativePath}: ${cleanErrorMsg}`);
                failedFiles.push(relativePath);
            }
        }
        
        if (failedFiles.length > 0) {
            console.log(`\n📝 Summary: Successfully loaded ${pdfFiles.length - failedFiles.length}/${pdfFiles.length} files`);
            console.log(`❌ Failed files (skipped): ${failedFiles.join(', ')}`);
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
    const data = documents.map((doc, i) => ({
        id: i.toString(),
        text: doc.pageContent,
        source: doc.metadata.source || '',
        hash: doc.metadata.hash || '',
        loc: JSON.stringify(doc.metadata.loc || {}),
        vector: createSimpleEmbedding(doc.pageContent)
    }));
    
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

async function processDocuments(rawDocs: Document[], catalogTable: lancedb.Table | null, skipExistsCheck: boolean) {
    const docsBySource = rawDocs.reduce((acc: Record<string, Document[]>, doc: Document) => {
        const source = doc.metadata.source;
        if (!acc[source]) {
            acc[source] = [];
        }
        acc[source].push(doc);
        return acc;
    }, {});

    let skipSources: string[] = [];
    let catalogRecords: Document[] = [];

    for (const [source, docs] of Object.entries(docsBySource)) {
        const fileContent = await fs.promises.readFile(source);
        const hash = crypto.createHash('sha256').update(fileContent).digest('hex');

        const exists = skipExistsCheck ? false : (catalogTable ? await catalogRecordExists(catalogTable, hash) : false);
        if (exists) {
            console.log(`📚 File ${path.basename(source)} already exists in database (hash: ${hash.slice(0, 8)}...). Skipping...`);
            skipSources.push(source);
        } else {
            console.log(`🤖 Generating summary with OpenRouter for: ${path.basename(source)}`);
            const contentOverview = await generateContentOverview(docs);
            catalogRecords.push(new Document({ 
                pageContent: contentOverview, 
                metadata: { source, hash } 
            }));
        }
    }

    return { skipSources, catalogRecords };
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
    const rawDocs = await loadDocumentsWithErrorHandling(filesDir);

    if (rawDocs.length === 0) {
        console.error("❌ No documents were successfully loaded. Exiting.");
        process.exit(1);
    }

    // Simplify metadata
    for (const doc of rawDocs) {
        doc.metadata = { loc: doc.metadata.loc, source: doc.metadata.source };
    }

    console.log("🚀 Creating catalog with OpenRouter summaries...");
    const { skipSources, catalogRecords } = await processDocuments(rawDocs, catalogTable, overwrite || !catalogTableExists);
    
    if (catalogRecords.length > 0) {
        console.log("📊 Creating catalog table with fast local embeddings...");
        await createLanceTableWithSimpleEmbeddings(db, catalogRecords, defaults.CATALOG_TABLE_NAME, overwrite ? "overwrite" : undefined);
    }

    console.log(`Number of new catalog records: ${catalogRecords.length}`);
    console.log(`Number of skipped sources: ${skipSources.length}`);
    
    const filteredRawDocs = rawDocs.filter((doc: Document) => !skipSources.includes(doc.metadata.source));

    console.log("🔧 Creating chunks with fast local embeddings...");
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 10,
    });
    const docs = await splitter.splitDocuments(filteredRawDocs);
    
    if (docs.length > 0) {
        console.log(`📊 Processing ${docs.length} chunks...`);
        await createLanceTableWithSimpleEmbeddings(db, docs, defaults.CHUNKS_TABLE_NAME, overwrite ? "overwrite" : undefined);
    }

    console.log(`✅ Created ${catalogRecords.length} catalog records`);
    console.log(`✅ Created ${docs.length} chunk records`);
    console.log("🎉 Seeding completed successfully!");
}

hybridFastSeed().catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
});



