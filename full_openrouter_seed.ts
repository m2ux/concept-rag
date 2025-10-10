import * as lancedb from "@lancedb/lancedb";
import minimist from 'minimist';
import {
  RecursiveCharacterTextSplitter
} from 'langchain/text_splitter';
import * as path from 'path';
import {
  LanceDB, LanceDBArgs
} from "@langchain/community/vectorstores/lancedb";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
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

// Create OpenRouter embeddings (using OpenAI models via OpenRouter)
function createOpenRouterEmbeddings() {
    return new OpenAIEmbeddings({
        model: "text-embedding-3-small", // Fast and cost-effective
        apiKey: openrouterApiKey,
        configuration: {
            baseURL: "https://openrouter.ai/api/v1",
        },
    });
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

// Load documents with robust error handling
async function loadDocumentsWithErrorHandling(filesDir: string, maxFiles: number = 8) {
    const documents: Document[] = [];
    const failedFiles: string[] = [];
    
    try {
        const files = await fs.promises.readdir(filesDir);
        const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf')).slice(0, maxFiles);
        
        console.log(`📚 Processing ${pdfFiles.length} PDF files (limited to ${maxFiles} for faster processing)...`);
        
        for (const pdfFile of pdfFiles) {
            const fullPath = path.join(filesDir, pdfFile);
            try {
                console.log(`Loading: ${pdfFile}`);
                const loader = new PDFLoader(fullPath);
                
                // Add timeout for PDF loading
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
            console.log(`❌ Failed files (skipped):`);
            failedFiles.forEach(file => console.log(`   - ${file}`));
            console.log('');
        }
        
        return documents;
    } catch (error) {
        console.error('Error reading directory:', error.message);
        throw error;
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
            console.log(`Document with hash ${hash} already exists in the catalog. Skipping...`);
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
    const rawDocs = await loadDocumentsWithErrorHandling(filesDir, 8);

    if (rawDocs.length === 0) {
        console.error("❌ No documents were successfully loaded. Exiting.");
        process.exit(1);
    }

    // Simplify metadata to avoid LanceDB issues
    for (const doc of rawDocs) {
        doc.metadata = { loc: doc.metadata.loc, source: doc.metadata.source };
    }

    console.log("🚀 Creating catalog with OpenRouter summarization...");
    const { skipSources, catalogRecords } = await processDocuments(rawDocs, catalogTable, overwrite || !catalogTableExists);
    
    const openrouterEmbeddings = createOpenRouterEmbeddings();
    
    if (catalogRecords.length > 0) {
        console.log("📊 Creating catalog vector store with OpenRouter embeddings...");
        const catalogStore = await LanceDB.fromDocuments(catalogRecords, 
            openrouterEmbeddings, 
            { 
                mode: overwrite ? "overwrite" : undefined, 
                uri: databaseDir, 
                tableName: defaults.CATALOG_TABLE_NAME 
            } as LanceDBArgs);
        console.log("✅ Catalog store created");
    }

    console.log("Number of new catalog records: ", catalogRecords.length);
    console.log("Number of skipped sources: ", skipSources.length);
    
    const filteredRawDocs = rawDocs.filter((doc: Document) => !skipSources.includes(doc.metadata.source));

    console.log("🔧 Creating chunks vector store with OpenRouter embeddings...");
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 10,
    });
    const docs = await splitter.splitDocuments(filteredRawDocs);
    
    if (docs.length > 0) {
        console.log(`📊 Processing ${docs.length} chunks with OpenRouter embeddings (much faster than Ollama)...`);
        
        const vectorStore = await LanceDB.fromDocuments(docs, 
            openrouterEmbeddings,
            { 
                mode: overwrite ? "overwrite" : undefined, 
                uri: databaseDir, 
                tableName: defaults.CHUNKS_TABLE_NAME 
            } as LanceDBArgs);
        console.log("✅ Chunks vector store created with OpenRouter embeddings");
    }

    console.log("Number of new chunks: ", docs.length);
    console.log("🎉 Seeding completed successfully with 100% OpenRouter (no Ollama needed)!");
}

fullOpenRouterSeed().catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
});



