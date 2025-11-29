#!/usr/bin/env npx tsx
/**
 * Analyzes all backup databases and generates markdown reports
 * Each report includes record counts and schema information for all tables
 */

import * as lancedb from "@lancedb/lancedb";
import * as fs from "fs";
import * as path from "path";

const BACKUPS_DIR = "./backups";

interface TableInfo {
  name: string;
  exists: boolean;
  recordCount: number;
  schema: { field: string; type: string }[];
  sampleRecord?: Record<string, unknown>;
}

interface BackupReport {
  backupName: string;
  backupDate: string;
  tables: TableInfo[];
  schemaVersion: string;
  notes: string[];
}

function inferLanceDBType(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return "Utf8 (string)";
  if (typeof value === "number") return Number.isInteger(value) ? "Float64 (integer)" : "Float64 (float)";
  if (typeof value === "boolean") return "Bool";
  if (value instanceof Float32Array) return `FixedSizeList[${value.length}]<Float32> (vector)`;
  if (value instanceof Float64Array) return `FixedSizeList[${value.length}]<Float64>`;
  if (ArrayBuffer.isView(value)) return `TypedArray[${(value as ArrayBufferView).byteLength}]`;
  if (Array.isArray(value)) {
    if (value.length === 0) return "List (empty)";
    const elemType = inferLanceDBType(value[0]);
    return `List<${elemType}>`;
  }
  // Handle LanceDB Vector/Array types
  if (value && typeof value === "object" && "toArray" in value) {
    try {
      const arr = (value as { toArray: () => unknown[] }).toArray();
      if (arr.length === 0) return "List (empty)";
      const elemType = typeof arr[0];
      return `List<${elemType}>`;
    } catch {
      return "LanceDB Array";
    }
  }
  if (typeof value === "object") return "Struct";
  return typeof value;
}

function detectSchemaVersion(tables: TableInfo[]): { version: string; notes: string[] } {
  const notes: string[] = [];
  
  const chunks = tables.find(t => t.name === "chunks");
  const concepts = tables.find(t => t.name === "concepts");
  const catalog = tables.find(t => t.name === "catalog");
  const categories = tables.find(t => t.name === "categories");
  
  // Check for key schema indicators
  const hasCategories = categories?.exists && categories.recordCount > 0;
  const hasChunks = chunks?.exists && chunks.recordCount > 0;
  const hasConcepts = concepts?.exists && concepts.recordCount > 0;
  const hasCatalog = catalog?.exists && catalog.recordCount > 0;
  
  // Check chunks schema
  const chunksFields = chunks?.schema.map(s => s.field) || [];
  const hasSource = chunksFields.includes("source");
  const hasCatalogId = chunksFields.includes("catalog_id");
  const hasCatalogTitle = chunksFields.includes("catalog_title");
  const hasConceptNames = chunksFields.includes("concept_names");
  const hasPageNumber = chunksFields.includes("page_number");
  const hasLoc = chunksFields.includes("loc");
  
  // Check concepts schema  
  const conceptFields = concepts?.schema.map(s => s.field) || [];
  const hasConceptField = conceptFields.includes("concept");
  const hasNameField = conceptFields.includes("name");
  const hasSummaryField = conceptFields.includes("summary");
  const hasChunkIds = conceptFields.includes("chunk_ids");
  const hasAdjacentIds = conceptFields.includes("adjacent_ids");
  const hasRelatedIds = conceptFields.includes("related_ids");
  const hasCatalogTitles = conceptFields.includes("catalog_titles");
  
  // Determine schema version
  if (!hasChunks) {
    return { version: "Incomplete (no chunks)", notes: ["Missing chunks table - critical data loss"] };
  }
  
  if (hasSource && !hasCatalogId && !hasCatalogTitle) {
    notes.push("Uses denormalized `source` field in chunks (legacy)");
    notes.push("Chunks reference documents by path instead of ID");
    
    if (hasConceptField && !hasNameField) {
      notes.push("Concepts use `concept` field name instead of `name`");
      return { version: "Pre-migration (legacy denormalized)", notes };
    }
    return { version: "Pre-normalization (v1-v5)", notes };
  }
  
  if (hasCatalogId && hasCatalogTitle && hasConceptNames) {
    notes.push("Uses normalized schema with `catalog_id` foreign key");
    notes.push("Has derived `catalog_title` and `concept_names` fields");
    
    if (hasPageNumber && !hasLoc) {
      notes.push("Uses `page_number` instead of JSON `loc` field");
    }
    
    if (hasNameField && hasSummaryField && hasChunkIds) {
      notes.push("Concepts have `summary`, `chunk_ids`, and rich linking");
      if (hasAdjacentIds && hasRelatedIds && hasCatalogTitles) {
        return { version: "Normalized v7+ (current production)", notes };
      }
      return { version: "Normalized v6 (transitional)", notes };
    }
    return { version: "Normalized v5-v6 (partial)", notes };
  }
  
  // Hybrid/transitional state
  if (hasCatalogId && hasSource) {
    notes.push("Has both `source` and `catalog_id` - transitional state");
    return { version: "Transitional (mixed schema)", notes };
  }
  
  return { version: "Unknown schema version", notes };
}

async function analyzeBackup(backupPath: string): Promise<BackupReport> {
  const backupName = path.basename(backupPath);
  
  // Extract date from backup name
  const dateMatch = backupName.match(/(\d{8}_\d{6})/);
  const backupDate = dateMatch 
    ? dateMatch[1].replace(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/, "$1-$2-$3 $4:$5:$6")
    : "Unknown";
  
  const tables: TableInfo[] = [];
  const tableNames = ["catalog", "chunks", "concepts", "categories"];
  
  let db: Awaited<ReturnType<typeof lancedb.connect>> | null = null;
  
  try {
    db = await lancedb.connect(backupPath);
    const existingTables = await db.tableNames();
    
    for (const tableName of tableNames) {
      if (!existingTables.includes(tableName)) {
        tables.push({
          name: tableName,
          exists: false,
          recordCount: 0,
          schema: [],
        });
        continue;
      }
      
      try {
        const table = await db.openTable(tableName);
        const recordCount = await table.countRows();
        
        // Get schema by examining first record
        let schema: { field: string; type: string }[] = [];
        let sampleRecord: Record<string, unknown> | undefined;
        
        if (recordCount > 0) {
          const sample = await table.query().limit(1).toArray();
          if (sample.length > 0) {
            sampleRecord = sample[0] as Record<string, unknown>;
            schema = Object.entries(sampleRecord).map(([field, value]) => ({
              field,
              type: inferLanceDBType(value),
            }));
          }
        }
        
        tables.push({
          name: tableName,
          exists: true,
          recordCount,
          schema,
          sampleRecord,
        });
      } catch (err) {
        tables.push({
          name: tableName,
          exists: true,
          recordCount: -1,
          schema: [],
        });
        console.error(`  Error reading table ${tableName}:`, err);
      }
    }
  } catch (err) {
    console.error(`Error connecting to backup ${backupPath}:`, err);
    return {
      backupName,
      backupDate,
      tables,
      schemaVersion: "Error - could not connect",
      notes: [`Connection error: ${err}`],
    };
  }
  
  const { version, notes } = detectSchemaVersion(tables);
  
  return {
    backupName,
    backupDate,
    tables,
    schemaVersion: version,
    notes,
  };
}

function generateMarkdownReport(report: BackupReport): string {
  const lines: string[] = [];
  
  lines.push(`# Backup Database Report: ${report.backupName}`);
  lines.push("");
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push(`**Backup Date:** ${report.backupDate}`);
  lines.push(`**Schema Version:** ${report.schemaVersion}`);
  lines.push("");
  
  // Summary table
  lines.push("## Summary");
  lines.push("");
  lines.push("| Table | Records | Status |");
  lines.push("|-------|---------|--------|");
  
  let totalRecords = 0;
  for (const table of report.tables) {
    const status = !table.exists 
      ? "❌ Missing" 
      : table.recordCount === -1 
        ? "⚠️ Error reading" 
        : table.recordCount === 0 
          ? "⚠️ Empty" 
          : "✅ OK";
    const count = table.recordCount >= 0 ? table.recordCount.toLocaleString() : "N/A";
    lines.push(`| ${table.name} | ${count} | ${status} |`);
    if (table.recordCount > 0) totalRecords += table.recordCount;
  }
  
  lines.push("");
  lines.push(`**Total Records:** ${totalRecords.toLocaleString()}`);
  lines.push("");
  
  // Schema notes
  if (report.notes.length > 0) {
    lines.push("## Schema Notes");
    lines.push("");
    for (const note of report.notes) {
      lines.push(`- ${note}`);
    }
    lines.push("");
  }
  
  // Detailed table schemas
  lines.push("## Table Schemas");
  lines.push("");
  
  for (const table of report.tables) {
    lines.push(`### ${table.name}`);
    lines.push("");
    
    if (!table.exists) {
      lines.push("*Table does not exist in this backup.*");
      lines.push("");
      continue;
    }
    
    if (table.recordCount === -1) {
      lines.push("*Error reading table - may be corrupted.*");
      lines.push("");
      continue;
    }
    
    if (table.schema.length === 0) {
      lines.push("*Table is empty - no schema information available.*");
      lines.push("");
      continue;
    }
    
    lines.push(`**Records:** ${table.recordCount.toLocaleString()}`);
    lines.push("");
    lines.push("| Field | Type |");
    lines.push("|-------|------|");
    
    for (const col of table.schema) {
      lines.push(`| \`${col.field}\` | ${col.type} |`);
    }
    lines.push("");
  }
  
  // Data completeness assessment
  lines.push("## Completeness Assessment");
  lines.push("");
  
  const catalog = report.tables.find(t => t.name === "catalog");
  const chunks = report.tables.find(t => t.name === "chunks");
  const concepts = report.tables.find(t => t.name === "concepts");
  const categories = report.tables.find(t => t.name === "categories");
  
  const issues: string[] = [];
  const strengths: string[] = [];
  
  if (!catalog?.exists || catalog.recordCount === 0) {
    issues.push("Missing catalog data - document metadata unavailable");
  } else {
    strengths.push(`Catalog has ${catalog.recordCount.toLocaleString()} documents indexed`);
  }
  
  if (!chunks?.exists || chunks.recordCount === 0) {
    issues.push("Missing chunks data - search functionality unavailable");
  } else {
    strengths.push(`Chunks table has ${chunks.recordCount.toLocaleString()} text segments`);
    if (catalog?.recordCount && catalog.recordCount > 0) {
      const avgChunks = Math.round(chunks.recordCount / catalog.recordCount);
      strengths.push(`Average ${avgChunks} chunks per document`);
    }
  }
  
  if (!concepts?.exists || concepts.recordCount === 0) {
    issues.push("Missing concepts data - concept search unavailable");
  } else {
    strengths.push(`Concepts table has ${concepts.recordCount.toLocaleString()} indexed concepts`);
  }
  
  if (!categories?.exists || categories.recordCount === 0) {
    issues.push("Missing categories data - category browsing unavailable");
  } else {
    strengths.push(`Categories table has ${categories.recordCount.toLocaleString()} categories`);
  }
  
  if (strengths.length > 0) {
    lines.push("### ✅ Strengths");
    lines.push("");
    for (const s of strengths) {
      lines.push(`- ${s}`);
    }
    lines.push("");
  }
  
  if (issues.length > 0) {
    lines.push("### ⚠️ Issues");
    lines.push("");
    for (const i of issues) {
      lines.push(`- ${i}`);
    }
    lines.push("");
  }
  
  return lines.join("\n");
}

async function main() {
  console.log("Analyzing backup databases...\n");
  
  const backupDirs = fs.readdirSync(BACKUPS_DIR)
    .filter(name => {
      const fullPath = path.join(BACKUPS_DIR, name);
      return fs.statSync(fullPath).isDirectory();
    })
    .sort();
  
  console.log(`Found ${backupDirs.length} backup directories:\n`);
  
  for (const backupDir of backupDirs) {
    const backupPath = path.join(BACKUPS_DIR, backupDir);
    console.log(`Analyzing: ${backupDir}...`);
    
    try {
      const report = await analyzeBackup(backupPath);
      const markdown = generateMarkdownReport(report);
      
      // Write report to backups folder
      const reportFilename = `${backupDir}.report.md`;
      const reportPath = path.join(BACKUPS_DIR, reportFilename);
      fs.writeFileSync(reportPath, markdown);
      
      console.log(`  ✓ Written: ${reportFilename}`);
      console.log(`    Tables: ${report.tables.filter(t => t.exists).length}/4`);
      console.log(`    Schema: ${report.schemaVersion}`);
      console.log("");
    } catch (err) {
      console.error(`  ✗ Error analyzing ${backupDir}:`, err);
    }
  }
  
  console.log("\nDone! Reports saved to ./backups/");
}

main().catch(console.error);

