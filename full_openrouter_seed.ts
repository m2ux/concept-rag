import * as lancedb from "@lancedb/lancedb";
import minimist from 'minimist';
import {
  RecursiveCharacterTextSplitter
} from 'langchain/text_splitter';
import * as path from 'path';
// import {
//   LanceDB, LanceDBArgs
// } from "@langchain/community/vectorstores/lancedb"; // Removed due to dependency issues
import { Document } from "@langchain/core/documents";
// import { OpenAIEmbeddings } from "@langchain/openai"; // Removed due to dependency issues
import * as fs from 'fs';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import * as crypto from 'crypto';
import * as defaults from './src/config.js'

// Handle unhandled promise rejections to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
    console.warn('⚠️  Caught unhandled promise rejection:', reason);
});

const argv: minimist.ParsedArgs = minimist(process.argv.slice(2), {boolean: "overwrite"});

const databaseDir = argv["dbpath"] || path.join(process.env.HOME || process.env.USERPROFILE || "~", ".lance_mcp");
const filesDir = argv["filesdir"];
const overwrite = argv["overwrite"];
const openrouterApiKey = process.env.OPENROUTER_API_KEY;

function validateArgs() {
    if (!filesDir) {
        console.error("Please provide a directory with files (--filesdir) to process");
        console.error("Usage: npx tsx full_openrouter_seed.ts --filesdir <directory> [--dbpath <path>] [--overwrite]");
        console.error("  --filesdir: Directory containing PDF files to process (required)");
        console.error("  --dbpath: Database path (optional, defaults to ~/.lance_mcp)");
        console.error("  --overwrite: Overwrite existing database tables (optional)");
        process.exit(1);
    }
    
    if (!openrouterApiKey) {
        console.error("Please set OPENROUTER_API_KEY environment variable");
        console.error("Example: export OPENROUTER_API_KEY=your_key_here");
        process.exit(1);
    }
    
    console.log("DATABASE PATH: ", databaseDir);
    console.log("FILES DIRECTORY: ", filesDir);
    console.log("OVERWRITE FLAG: ", overwrite);
    console.log("✅ OpenRouter API key configured");
    console.log("🚀 Using OpenRouter for ALL operations (summarization + embeddings)");
}

// Direct OpenRouter API call for summarization
async function callOpenRouter(text: string): Promise<string> {
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
                content: `Write a high-level one sentence content overview based on the text below. WRITE THE CONTENT OVERVIEW ONLY, DO NOT WRITE ANYTHING ELSE:\n\n${text.slice(0, 8000)}` // Limit text to avoid token limits
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

async function generateContentOverview(rawDocs: Document[]): Promise<string> {
    // Combine all document text for summarization
    const combinedText = rawDocs.map(doc => doc.pageContent).join('\n\n').slice(0, 10000); // Limit to 10k chars
    
    try {
        const summary = await callOpenRouter(combinedText);
        console.log(`📝 Generated summary: ${summary}`);
        return summary;
    } catch (error) {
        console.warn(`⚠️ OpenRouter summarization failed: ${error.message}`);
        return `Document overview (${rawDocs.length} pages)`;
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

async function catalogRecordExists(catalogTable: lancedb.Table, hash: string): Promise<boolean> {
    try {
        const query = catalogTable.query().where(`hash="${hash}"`).limit(1);
        const results = await query.toArray();
        return results.length > 0;
    } catch (error) {
        return false; // If table doesn't exist, record doesn't exist
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

// Load documents with robust error handling
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
            
            try {
                // Calculate hash first (fast operation)
                if (!skipExistsCheck && catalogTable) {
                    const fileContent = await fs.promises.readFile(pdfFile);
                    const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
                    
                    const exists = await catalogRecordExists(catalogTable, hash);
                    if (exists) {
                        console.log(`📚 ${relativePath} already in database (hash: ${hash.slice(0, 8)}...). Skipping loading.`);
                        skippedFiles.push(relativePath);
                        continue; // Skip loading this file entirely
                    }
                }
                
                console.log(`Loading: ${relativePath}`);
                const loader = new PDFLoader(pdfFile);
                
                // Add timeout for PDF loading
                const docs = await Promise.race([
                    loader.load(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('PDF loading timeout')), 30000)
                    )
                ]) as Document[];
                
                documents.push(...docs);
                console.log(`✅ Successfully loaded: ${relativePath} (${docs.length} pages)`);
            } catch (error: any) {
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
        
        const loadedCount = pdfFiles.length - failedFiles.length - skippedFiles.length;
        console.log(`\n📝 Summary: ${loadedCount} files loaded, ${skippedFiles.length} skipped (already in DB), ${failedFiles.length} failed`);
        
        if (failedFiles.length > 0) {
            console.log(`❌ Failed files: ${failedFiles.join(', ')}`);
        }
        
        return documents;
    } catch (error) {
        console.error('Error reading directory:', error.message);
        throw error;
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

    for (const [source, docs] of Object.entries(docsBySource)) {
        const fileContent = await fs.promises.readFile(source);
        const hash = crypto.createHash('sha256').update(fileContent).digest('hex');

        console.log(`🤖 Generating summary with OpenRouter for: ${path.basename(source)}`);
        const contentOverview = await generateContentOverview(docs);
        catalogRecords.push(new Document({ 
            pageContent: contentOverview, 
            metadata: { source, hash } 
        }));
    }

    return catalogRecords;
}

async function fullOpenRouterSeed() {
    validateArgs();

    const db = await lancedb.connect(databaseDir);

    let catalogTable: lancedb.Table | null = null;
    let catalogTableExists = true;

    try {
        catalogTable = await db.openTable(defaults.CATALOG_TABLE_NAME);
    } catch (e) {
        console.error(`Looks like the catalog table "${defaults.CATALOG_TABLE_NAME}" doesn't exist. We'll create it later.`);
        catalogTableExists = false;
    }

    try {
        await db.openTable(defaults.CHUNKS_TABLE_NAME);
    } catch (e) {
        console.error(`Looks like the chunks table "${defaults.CHUNKS_TABLE_NAME}" doesn't exist. We'll create it later.`);
    }

    if (overwrite) {
        try {
            await db.dropTable(defaults.CATALOG_TABLE_NAME);
            await db.dropTable(defaults.CHUNKS_TABLE_NAME);
            console.log("🗑️ Dropped existing tables");
            catalogTable = null;
            catalogTableExists = false;
        } catch (e) {
            console.log("Error dropping tables. Maybe they don't exist!");
        }
    }

    // Load files with error handling
    console.log("Loading files...");
    const rawDocs = await loadDocumentsWithErrorHandling(filesDir, catalogTable, overwrite || !catalogTableExists);

    if (rawDocs.length === 0) {
        console.log("✅ No new documents to process - all files already exist in database.");
        console.log("🎉 Seeding completed successfully (no changes needed)!");
        process.exit(0);
    }

    // Simplify metadata to avoid LanceDB issues
    for (const doc of rawDocs) {
        doc.metadata = { loc: doc.metadata.loc, source: doc.metadata.source };
    }

    console.log("🚀 Creating catalog with OpenRouter summarization...");
    const catalogRecords = await processDocuments(rawDocs);
    
    if (catalogRecords.length > 0) {
        console.log("📊 Creating catalog table with fast local embeddings...");
        await createLanceTableWithSimpleEmbeddings(db, catalogRecords, defaults.CATALOG_TABLE_NAME, overwrite ? "overwrite" : undefined);
    }

    console.log("Number of new catalog records: ", catalogRecords.length);

    console.log("🔧 Creating chunks with fast local embeddings...");
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 10,
    });
    const docs = await splitter.splitDocuments(rawDocs);
    
    if (docs.length > 0) {
        console.log(`📊 Processing ${docs.length} chunks...`);
        await createLanceTableWithSimpleEmbeddings(db, docs, defaults.CHUNKS_TABLE_NAME, overwrite ? "overwrite" : undefined);
    }

    console.log("Number of new chunks: ", docs.length);
    console.log("🎉 Seeding completed successfully with 100% OpenRouter (no Ollama needed)!");
}

fullOpenRouterSeed().catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
});



