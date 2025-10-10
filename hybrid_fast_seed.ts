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
process.on('unhandledRejection', (reason, promise) => {
    console.warn('⚠️  Caught unhandled promise rejection:', reason);
});

const argv: minimist.ParsedArgs = minimist(process.argv.slice(2), {boolean: "overwrite"});

const databaseDir = argv["dbpath"];
const filesDir = argv["filesdir"];
const overwrite = argv["overwrite"];
const openrouterApiKey = process.env.OPENROUTER_API_KEY;

function validateArgs() {
    if (!databaseDir || !filesDir) {
        console.error("Please provide a database path (--dbpath) and a directory with files (--filesdir) to process");
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
        console.log(`📝 Generated summary: ${summary}`);
        return summary;
    } catch (error) {
        console.warn(`⚠️ OpenRouter summarization failed: ${error.message}`);
        return `Document overview (${rawDocs.length} pages)`;
    }
}

async function loadDocumentsWithErrorHandling(filesDir: string, maxFiles: number = 8) {
    const documents: Document[] = [];
    const failedFiles: string[] = [];
    
    try {
        const files = await fs.promises.readdir(filesDir);
        const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf')).slice(0, maxFiles);
        
        console.log(`📚 Processing ${pdfFiles.length} PDF files...`);
        
        for (const pdfFile of pdfFiles) {
            const fullPath = path.join(filesDir, pdfFile);
            try {
                console.log(`Loading: ${pdfFile}`);
                const loader = new PDFLoader(fullPath);
                
                const docs = await Promise.race([
                    loader.load(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('PDF loading timeout')), 30000)
                    )
                ]) as Document[];
                
                documents.push(...docs);
                console.log(`✅ Successfully loaded: ${pdfFile} (${docs.length} pages)`);
            } catch (error) {
                console.warn(`⚠️  Skipping ${pdfFile} due to error: ${error.message}`);
                failedFiles.push(pdfFile);
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
        loc: JSON.stringify(doc.metadata.loc || {}),
        vector: createSimpleEmbedding(doc.pageContent)
    }));
    
    console.log(`✅ Generated ${data.length} embeddings locally (instant)`);
    
    // Create table
    if (mode === "overwrite") {
        try {
            await db.dropTable(tableName);
        } catch (e) {
            // Table might not exist
        }
    }
    
    const table = await db.createTable(tableName, data);
    console.log(`✅ Created LanceDB table: ${tableName}`);
    
    return table;
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

async function hybridFastSeed() {
    validateArgs();

    const db = await lancedb.connect(databaseDir);

    if (overwrite) {
        try {
            await db.dropTable(defaults.CATALOG_TABLE_NAME);
            await db.dropTable(defaults.CHUNKS_TABLE_NAME);
            console.log("🗑️ Dropped existing tables");
        } catch (e) {
            console.log("Tables didn't exist");
        }
    }

    // Load files
    console.log("Loading files...");
    const rawDocs = await loadDocumentsWithErrorHandling(filesDir, 8);

    if (rawDocs.length === 0) {
        console.error("❌ No documents were successfully loaded. Exiting.");
        process.exit(1);
    }

    // Simplify metadata
    for (const doc of rawDocs) {
        doc.metadata = { loc: doc.metadata.loc, source: doc.metadata.source };
    }

    console.log("🚀 Creating catalog with OpenRouter summaries...");
    const catalogRecords = await processDocuments(rawDocs);
    
    if (catalogRecords.length > 0) {
        console.log("📊 Creating catalog table with fast local embeddings...");
        await createLanceTableWithSimpleEmbeddings(db, catalogRecords, defaults.CATALOG_TABLE_NAME, overwrite ? "overwrite" : undefined);
    }

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

    console.log(`✅ Created ${catalogRecords.length} catalog records`);
    console.log(`✅ Created ${docs.length} chunk records`);
    console.log("🎉 Seeding completed successfully!");
}

hybridFastSeed().catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
});



