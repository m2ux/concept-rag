#!/usr/bin/env npx tsx
/**
 * Production Database Health Check
 * 
 * Scans ebooks directory and compares with database to identify:
 * - Missing ebooks (in filesystem but not in database)
 * - Orphaned catalog entries (in database but file missing)
 * - Documents with missing chunks
 * - Documents with missing concepts
 * - Other data integrity issues
 */

import * as lancedb from "@lancedb/lancedb";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// Configuration
const EBOOKS_DIR = process.env.EBOOKS_DIR || path.join(process.env.HOME || "", "Ebooks");
const DATABASE_PATH = process.env.DATABASE_PATH || path.join(process.env.HOME || "", ".concept_rag");
const REPORT_OUTPUT = process.env.REPORT_OUTPUT || "./health-check-report.md";

interface EbookFile {
    path: string;
    relativePath: string;
    size: number;
    hash: string;
}

interface CatalogRecord {
    id: number;
    hash: string;
    source: string;
    title: string;
    concept_ids: number[];
    concept_names: string[];
    category_ids: number[];
    summary: string;
}

interface ChunkRecord {
    id: number;
    hash: string;
    catalog_id: number;
    concept_ids: number[];
    concept_names: string[];
    text: string;
}

interface HealthIssue {
    severity: 'critical' | 'warning' | 'info';
    category: string;
    description: string;
    details?: string;
}

interface HealthReport {
    timestamp: string;
    ebooksDir: string;
    databasePath: string;
    
    // Counts
    totalEbooks: number;
    totalCatalogRecords: number;
    totalChunks: number;
    totalConcepts: number;
    totalCategories: number;
    
    // Issues
    issues: HealthIssue[];
    
    // Detailed lists
    missingFromDatabase: string[];
    orphanedInDatabase: string[];
    missingChunks: { source: string; catalogId: number; title: string }[];
    missingConcepts: { source: string; catalogId: number; title: string; chunkCount: number }[];
    emptySummaries: { source: string; title: string }[];
    emptyTitles: { source: string; hash: string }[];
}

/**
 * Calculate file hash (first 8KB + size for speed)
 */
async function calculateFileHash(filePath: string): Promise<string> {
    const stats = await fs.promises.stat(filePath);
    const buffer = Buffer.alloc(Math.min(8192, stats.size));
    const fd = await fs.promises.open(filePath, 'r');
    await fd.read(buffer, 0, buffer.length, 0);
    await fd.close();
    
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    hash.update(stats.size.toString());
    return hash.digest('hex');
}

/**
 * Scan ebooks directory for all PDF and EPUB files
 */
async function scanEbooksDirectory(dir: string): Promise<EbookFile[]> {
    const ebooks: EbookFile[] = [];
    
    async function scanDir(currentDir: string): Promise<void> {
        const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            
            if (entry.isDirectory()) {
                await scanDir(fullPath);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (ext === '.pdf' || ext === '.epub') {
                    try {
                        const stats = await fs.promises.stat(fullPath);
                        const hash = await calculateFileHash(fullPath);
                        ebooks.push({
                            path: fullPath,
                            relativePath: path.relative(dir, fullPath),
                            size: stats.size,
                            hash
                        });
                    } catch (err) {
                        console.error(`Error reading ${fullPath}:`, err);
                    }
                }
            }
        }
    }
    
    await scanDir(dir);
    return ebooks;
}

/**
 * Run the health check
 */
async function runHealthCheck(): Promise<HealthReport> {
    console.log("🔍 Starting Production Database Health Check...\n");
    
    const report: HealthReport = {
        timestamp: new Date().toISOString(),
        ebooksDir: EBOOKS_DIR,
        databasePath: DATABASE_PATH,
        totalEbooks: 0,
        totalCatalogRecords: 0,
        totalChunks: 0,
        totalConcepts: 0,
        totalCategories: 0,
        issues: [],
        missingFromDatabase: [],
        orphanedInDatabase: [],
        missingChunks: [],
        missingConcepts: [],
        emptySummaries: [],
        emptyTitles: [],
    };
    
    // Step 1: Scan ebooks directory
    console.log(`📂 Scanning ebooks directory: ${EBOOKS_DIR}`);
    const ebooks = await scanEbooksDirectory(EBOOKS_DIR);
    report.totalEbooks = ebooks.length;
    console.log(`   Found ${ebooks.length} ebook files\n`);
    
    // Create lookup maps
    const ebooksByPath = new Map<string, EbookFile>();
    const ebooksByHash = new Map<string, EbookFile>();
    for (const ebook of ebooks) {
        ebooksByPath.set(ebook.path, ebook);
        ebooksByHash.set(ebook.hash, ebook);
    }
    
    // Step 2: Connect to database
    console.log(`📊 Connecting to database: ${DATABASE_PATH}`);
    const db = await lancedb.connect(DATABASE_PATH);
    const tableNames = await db.tableNames();
    console.log(`   Tables: ${tableNames.join(', ')}\n`);
    
    // Check required tables exist
    const requiredTables = ['catalog', 'chunks', 'concepts', 'categories'];
    for (const tableName of requiredTables) {
        if (!tableNames.includes(tableName)) {
            report.issues.push({
                severity: 'critical',
                category: 'Schema',
                description: `Missing required table: ${tableName}`
            });
        }
    }
    
    // Step 3: Load catalog records
    console.log("📖 Loading catalog records...");
    const catalogTable = await db.openTable('catalog');
    const catalogRecords = await catalogTable.query().limit(100000).toArray() as unknown as CatalogRecord[];
    report.totalCatalogRecords = catalogRecords.length;
    console.log(`   Found ${catalogRecords.length} catalog records\n`);
    
    // Create catalog lookup
    const catalogBySource = new Map<string, CatalogRecord>();
    const catalogByHash = new Map<string, CatalogRecord>();
    const catalogById = new Map<number, CatalogRecord>();
    for (const record of catalogRecords) {
        catalogBySource.set(record.source, record);
        catalogByHash.set(record.hash, record);
        catalogById.set(record.id, record);
    }
    
    // Step 4: Load chunks and group by catalog_id
    console.log("📄 Loading chunks...");
    const chunksTable = await db.openTable('chunks');
    report.totalChunks = await chunksTable.countRows();
    console.log(`   Found ${report.totalChunks.toLocaleString()} chunks\n`);
    
    // Get chunk counts per catalog_id
    console.log("   Analyzing chunk distribution...");
    const chunksByCatalogId = new Map<number, { count: number; withConcepts: number }>();
    
    // Query in batches to avoid memory issues
    const BATCH_SIZE = 50000;
    let offset = 0;
    let totalChunksProcessed = 0;
    
    while (true) {
        const chunkBatch = await chunksTable.query()
            .limit(BATCH_SIZE)
            .toArray() as unknown as ChunkRecord[];
        
        if (chunkBatch.length === 0) break;
        
        for (const chunk of chunkBatch) {
            const catalogId = chunk.catalog_id;
            const existing = chunksByCatalogId.get(catalogId) || { count: 0, withConcepts: 0 };
            existing.count++;
            if (chunk.concept_ids && chunk.concept_ids.length > 0) {
                existing.withConcepts++;
            }
            chunksByCatalogId.set(catalogId, existing);
        }
        
        totalChunksProcessed += chunkBatch.length;
        process.stdout.write(`\r   Processed ${totalChunksProcessed.toLocaleString()} chunks...`);
        
        if (chunkBatch.length < BATCH_SIZE) break;
        offset += BATCH_SIZE;
    }
    console.log(`\r   Processed ${totalChunksProcessed.toLocaleString()} chunks ✓\n`);
    
    // Step 5: Load concepts count
    console.log("💡 Loading concepts...");
    const conceptsTable = await db.openTable('concepts');
    report.totalConcepts = await conceptsTable.countRows();
    console.log(`   Found ${report.totalConcepts.toLocaleString()} concepts\n`);
    
    // Step 6: Load categories count
    console.log("📁 Loading categories...");
    const categoriesTable = await db.openTable('categories');
    report.totalCategories = await categoriesTable.countRows();
    console.log(`   Found ${report.totalCategories} categories\n`);
    
    // Step 7: Cross-reference ebooks with catalog
    console.log("🔗 Cross-referencing ebooks with catalog...\n");
    
    // Find ebooks missing from database (by source path)
    for (const ebook of ebooks) {
        const inCatalog = catalogBySource.has(ebook.path) || catalogByHash.has(ebook.hash);
        if (!inCatalog) {
            report.missingFromDatabase.push(ebook.relativePath);
        }
    }
    
    // Find orphaned catalog entries (file doesn't exist)
    for (const record of catalogRecords) {
        const fileExists = await fs.promises.access(record.source).then(() => true).catch(() => false);
        if (!fileExists) {
            report.orphanedInDatabase.push(record.source);
        }
    }
    
    // Step 8: Check for documents with missing chunks or concepts
    console.log("🔍 Checking data completeness...\n");
    
    for (const record of catalogRecords) {
        const chunkInfo = chunksByCatalogId.get(record.id);
        
        // Check for missing chunks
        if (!chunkInfo || chunkInfo.count === 0) {
            report.missingChunks.push({
                source: record.source,
                catalogId: record.id,
                title: record.title || path.basename(record.source)
            });
        }
        
        // Check for missing concepts (has chunks but no concepts)
        if (chunkInfo && chunkInfo.count > 0 && chunkInfo.withConcepts === 0) {
            // Also check catalog-level concepts
            const hasCatalogConcepts = record.concept_ids && record.concept_ids.length > 0;
            if (!hasCatalogConcepts) {
                report.missingConcepts.push({
                    source: record.source,
                    catalogId: record.id,
                    title: record.title || path.basename(record.source),
                    chunkCount: chunkInfo.count
                });
            }
        }
        
        // Check for empty summaries
        if (!record.summary || record.summary.trim().length === 0 || 
            record.summary.startsWith('Document overview (')) {
            report.emptySummaries.push({
                source: record.source,
                title: record.title || path.basename(record.source)
            });
        }
        
        // Check for empty titles
        if (!record.title || record.title.trim().length === 0) {
            report.emptyTitles.push({
                source: record.source,
                hash: record.hash
            });
        }
    }
    
    // Step 9: Generate issues summary
    if (report.missingFromDatabase.length > 0) {
        report.issues.push({
            severity: 'warning',
            category: 'Coverage',
            description: `${report.missingFromDatabase.length} ebook(s) not in database`,
            details: 'Files exist in filesystem but are not indexed'
        });
    }
    
    if (report.orphanedInDatabase.length > 0) {
        report.issues.push({
            severity: 'warning',
            category: 'Integrity',
            description: `${report.orphanedInDatabase.length} orphaned catalog entries`,
            details: 'Database references files that no longer exist'
        });
    }
    
    if (report.missingChunks.length > 0) {
        report.issues.push({
            severity: 'critical',
            category: 'Data',
            description: `${report.missingChunks.length} document(s) with no chunks`,
            details: 'Documents in catalog but have no searchable content'
        });
    }
    
    if (report.missingConcepts.length > 0) {
        report.issues.push({
            severity: 'warning',
            category: 'Data',
            description: `${report.missingConcepts.length} document(s) with no concepts`,
            details: 'Documents have chunks but no concept extraction'
        });
    }
    
    if (report.emptySummaries.length > 0) {
        report.issues.push({
            severity: 'info',
            category: 'Quality',
            description: `${report.emptySummaries.length} document(s) with missing/placeholder summaries`,
            details: 'Content overview not generated'
        });
    }
    
    if (report.emptyTitles.length > 0) {
        report.issues.push({
            severity: 'info',
            category: 'Quality',
            description: `${report.emptyTitles.length} document(s) with empty titles`,
            details: 'Title metadata not extracted'
        });
    }
    
    return report;
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(report: HealthReport): string {
    const lines: string[] = [];
    
    lines.push("# Production Database Health Check Report");
    lines.push("");
    lines.push(`**Generated:** ${report.timestamp}`);
    lines.push(`**Ebooks Directory:** ${report.ebooksDir}`);
    lines.push(`**Database Path:** ${report.databasePath}`);
    lines.push("");
    
    // Summary
    lines.push("## Summary");
    lines.push("");
    lines.push("| Metric | Count |");
    lines.push("|--------|-------|");
    lines.push(`| Ebook files in filesystem | ${report.totalEbooks} |`);
    lines.push(`| Catalog records in database | ${report.totalCatalogRecords} |`);
    lines.push(`| Total chunks | ${report.totalChunks.toLocaleString()} |`);
    lines.push(`| Total concepts | ${report.totalConcepts.toLocaleString()} |`);
    lines.push(`| Total categories | ${report.totalCategories} |`);
    lines.push("");
    
    // Coverage calculation
    const coverage = report.totalEbooks > 0 
        ? Math.round((report.totalCatalogRecords / report.totalEbooks) * 100) 
        : 0;
    const avgChunks = report.totalCatalogRecords > 0
        ? Math.round(report.totalChunks / report.totalCatalogRecords)
        : 0;
    const avgConcepts = report.totalCatalogRecords > 0
        ? Math.round(report.totalConcepts / report.totalCatalogRecords)
        : 0;
    
    lines.push("### Statistics");
    lines.push("");
    lines.push(`- **Database Coverage:** ${coverage}%`);
    lines.push(`- **Average chunks per document:** ${avgChunks.toLocaleString()}`);
    lines.push(`- **Average concepts per document:** ${avgConcepts}`);
    lines.push("");
    
    // Issues
    lines.push("## Issues Found");
    lines.push("");
    
    if (report.issues.length === 0) {
        lines.push("✅ **No issues detected!** Database is healthy.");
    } else {
        const critical = report.issues.filter(i => i.severity === 'critical');
        const warnings = report.issues.filter(i => i.severity === 'warning');
        const info = report.issues.filter(i => i.severity === 'info');
        
        lines.push(`| Severity | Count |`);
        lines.push(`|----------|-------|`);
        lines.push(`| 🔴 Critical | ${critical.length} |`);
        lines.push(`| 🟡 Warning | ${warnings.length} |`);
        lines.push(`| 🔵 Info | ${info.length} |`);
        lines.push("");
        
        for (const issue of report.issues) {
            const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
            lines.push(`### ${icon} ${issue.description}`);
            lines.push("");
            lines.push(`**Category:** ${issue.category}`);
            if (issue.details) {
                lines.push(`**Details:** ${issue.details}`);
            }
            lines.push("");
        }
    }
    
    // Detailed lists
    if (report.missingFromDatabase.length > 0) {
        lines.push("## Ebooks Missing from Database");
        lines.push("");
        lines.push("These files exist in the filesystem but are not indexed:");
        lines.push("");
        for (const file of report.missingFromDatabase.slice(0, 50)) {
            lines.push(`- \`${file}\``);
        }
        if (report.missingFromDatabase.length > 50) {
            lines.push(`- ... and ${report.missingFromDatabase.length - 50} more`);
        }
        lines.push("");
    }
    
    if (report.orphanedInDatabase.length > 0) {
        lines.push("## Orphaned Catalog Entries");
        lines.push("");
        lines.push("These database entries reference files that no longer exist:");
        lines.push("");
        for (const file of report.orphanedInDatabase.slice(0, 50)) {
            lines.push(`- \`${file}\``);
        }
        if (report.orphanedInDatabase.length > 50) {
            lines.push(`- ... and ${report.orphanedInDatabase.length - 50} more`);
        }
        lines.push("");
    }
    
    if (report.missingChunks.length > 0) {
        lines.push("## Documents with Missing Chunks");
        lines.push("");
        lines.push("These catalog entries have no associated chunks (no searchable content):");
        lines.push("");
        lines.push("| Catalog ID | Title |");
        lines.push("|------------|-------|");
        for (const doc of report.missingChunks.slice(0, 50)) {
            const title = doc.title.length > 60 ? doc.title.slice(0, 57) + '...' : doc.title;
            lines.push(`| ${doc.catalogId} | ${title} |`);
        }
        if (report.missingChunks.length > 50) {
            lines.push(`| ... | ${report.missingChunks.length - 50} more entries |`);
        }
        lines.push("");
    }
    
    if (report.missingConcepts.length > 0) {
        lines.push("## Documents with Missing Concepts");
        lines.push("");
        lines.push("These documents have chunks but no concept extraction:");
        lines.push("");
        lines.push("| Catalog ID | Chunks | Title |");
        lines.push("|------------|--------|-------|");
        for (const doc of report.missingConcepts.slice(0, 50)) {
            const title = doc.title.length > 50 ? doc.title.slice(0, 47) + '...' : doc.title;
            lines.push(`| ${doc.catalogId} | ${doc.chunkCount} | ${title} |`);
        }
        if (report.missingConcepts.length > 50) {
            lines.push(`| ... | ... | ${report.missingConcepts.length - 50} more entries |`);
        }
        lines.push("");
    }
    
    if (report.emptySummaries.length > 0 && report.emptySummaries.length <= 20) {
        lines.push("## Documents with Missing Summaries");
        lines.push("");
        for (const doc of report.emptySummaries) {
            const title = doc.title.length > 70 ? doc.title.slice(0, 67) + '...' : doc.title;
            lines.push(`- ${title}`);
        }
        lines.push("");
    } else if (report.emptySummaries.length > 20) {
        lines.push("## Documents with Missing Summaries");
        lines.push("");
        lines.push(`${report.emptySummaries.length} documents have missing or placeholder summaries.`);
        lines.push("");
    }
    
    if (report.emptyTitles.length > 0) {
        lines.push("## Documents with Empty Titles");
        lines.push("");
        for (const doc of report.emptyTitles.slice(0, 20)) {
            lines.push(`- \`${path.basename(doc.source)}\` (hash: ${doc.hash.slice(0, 8)})`);
        }
        if (report.emptyTitles.length > 20) {
            lines.push(`- ... and ${report.emptyTitles.length - 20} more`);
        }
        lines.push("");
    }
    
    // Recommendations
    lines.push("## Recommendations");
    lines.push("");
    
    if (report.issues.length === 0) {
        lines.push("✅ No action required - database is healthy!");
    } else {
        if (report.missingFromDatabase.length > 0) {
            lines.push("1. **Index missing ebooks:** Run the seeder with `--source ~/Ebooks` to add missing files");
        }
        if (report.orphanedInDatabase.length > 0) {
            lines.push("2. **Clean orphaned entries:** Consider removing catalog entries for deleted files");
        }
        if (report.missingChunks.length > 0) {
            lines.push("3. **Reprocess documents with missing chunks:** Use `--auto-reseed` flag");
        }
        if (report.missingConcepts.length > 0) {
            lines.push("4. **Extract concepts:** Run seeder with `--rebuild-concepts` or reprocess specific documents");
        }
        if (report.emptySummaries.length > 0) {
            lines.push("5. **Generate summaries:** Content overviews can be regenerated with `--auto-reseed`");
        }
    }
    lines.push("");
    
    return lines.join("\n");
}

async function main() {
    try {
        const report = await runHealthCheck();
        const markdown = generateMarkdownReport(report);
        
        // Write report
        const reportPath = path.resolve(REPORT_OUTPUT);
        await fs.promises.writeFile(reportPath, markdown);
        
        console.log("\n" + "=".repeat(60));
        console.log("📋 HEALTH CHECK COMPLETE");
        console.log("=".repeat(60));
        console.log(`\n📄 Report saved to: ${reportPath}\n`);
        
        // Print summary
        console.log("Summary:");
        console.log(`  • Ebooks in filesystem: ${report.totalEbooks}`);
        console.log(`  • Catalog records: ${report.totalCatalogRecords}`);
        console.log(`  • Total chunks: ${report.totalChunks.toLocaleString()}`);
        console.log(`  • Total concepts: ${report.totalConcepts.toLocaleString()}`);
        console.log("");
        
        if (report.issues.length === 0) {
            console.log("✅ No issues found - database is healthy!\n");
        } else {
            console.log(`⚠️  Found ${report.issues.length} issue(s):\n`);
            for (const issue of report.issues) {
                const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
                console.log(`  ${icon} ${issue.description}`);
            }
            console.log("");
        }
        
    } catch (error) {
        console.error("❌ Health check failed:", error);
        process.exit(1);
    }
}

main();






