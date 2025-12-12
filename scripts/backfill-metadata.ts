/**
 * Metadata Backfill Script
 *
 * Updates existing catalog entries with content-extracted metadata.
 * Processes documents with missing author/year and fills from document content.
 *
 * Usage:
 *   npx tsx scripts/backfill-metadata.ts --dbpath ~/.concept_rag --dry-run
 *   npx tsx scripts/backfill-metadata.ts --dbpath ~/.concept_rag --min-confidence 0.7
 *   npx tsx scripts/backfill-metadata.ts --dbpath ~/.concept_rag --fields author,year
 *   npx tsx scripts/backfill-metadata.ts --dbpath ~/.concept_rag --source "/path/to/doc.pdf"
 */

import * as lancedb from "@lancedb/lancedb";
import {
  extractContentMetadata,
  ChunkData,
} from "../src/infrastructure/document-loaders/content-metadata-extractor.js";

interface BackfillOptions {
  dbpath: string;
  dryRun: boolean;
  minConfidence: number;
  fields: Set<string>;
  source?: string;
  verbose: boolean;
}

interface BackfillResult {
  documentId: number;
  source: string;
  title: string;
  updates: {
    field: string;
    oldValue: string | number;
    newValue: string | number;
    confidence: number;
  }[];
}

interface CatalogRecord {
  id: number;
  source?: string;
  title?: string;
  author?: string;
  year?: number;
  publisher?: string;
  isbn?: string;
}

interface ChunkRecord {
  catalog_id: number;
  text: string;
  page_number?: number;
  is_reference?: boolean;
}

function parseArgs(): BackfillOptions {
  const args = process.argv.slice(2);
  const options: BackfillOptions = {
    dbpath: "./db/test",
    dryRun: false,
    minConfidence: 0.5,
    fields: new Set(["author", "year", "publisher"]),
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dbpath" && args[i + 1]) {
      options.dbpath = args[i + 1];
      i++;
    } else if (args[i] === "--dry-run") {
      options.dryRun = true;
    } else if (args[i] === "--min-confidence" && args[i + 1]) {
      options.minConfidence = parseFloat(args[i + 1]);
      i++;
    } else if (args[i] === "--fields" && args[i + 1]) {
      options.fields = new Set(args[i + 1].split(",").map((f) => f.trim()));
      i++;
    } else if (args[i] === "--source" && args[i + 1]) {
      options.source = args[i + 1];
      i++;
    } else if (args[i] === "--verbose" || args[i] === "-v") {
      options.verbose = true;
    }
  }

  return options;
}

async function backfillMetadata(options: BackfillOptions): Promise<BackfillResult[]> {
  const db = await lancedb.connect(options.dbpath);
  const catalog = await db.openTable("catalog");
  const chunks = await db.openTable("chunks");

  const allDocs: CatalogRecord[] = await catalog.query().limit(100000).toArray();
  const allChunks: ChunkRecord[] = await chunks.query().limit(1000000).toArray();

  // Filter documents needing backfill
  let docsToProcess = allDocs.filter((d) => {
    // Skip if specific source requested and doesn't match
    if (options.source && d.source !== options.source) {
      return false;
    }

    // Check if any tracked field is missing
    const missingAuthor = options.fields.has("author") && (!d.author || !d.author.trim());
    const missingYear = options.fields.has("year") && (!d.year || d.year === 0);
    const missingPublisher = options.fields.has("publisher") && (!d.publisher || !d.publisher.trim());

    return missingAuthor || missingYear || missingPublisher;
  });

  console.log(`Found ${docsToProcess.length} documents with incomplete metadata`);

  const results: BackfillResult[] = [];

  for (const doc of docsToProcess) {
    // Get front matter chunks for this document
    const docChunks = allChunks
      .filter((c) => c.catalog_id === doc.id)
      .filter((c) => !c.is_reference)
      .filter((c) => !c.page_number || c.page_number <= 10)
      .sort((a, b) => (a.page_number || 0) - (b.page_number || 0))
      .slice(0, 8);

    if (docChunks.length === 0) {
      if (options.verbose) {
        console.log(`  ⚠️  No chunks found for: ${doc.title?.substring(0, 50)}`);
      }
      continue;
    }

    // Convert to ChunkData
    const chunkData: ChunkData[] = docChunks.map((c) => ({
      text: c.text,
      page_number: c.page_number,
      is_reference: c.is_reference,
    }));

    // Extract metadata from content
    const extracted = await extractContentMetadata(chunkData);

    // Determine which fields to update
    const updates: BackfillResult["updates"] = [];

    // Author
    if (
      options.fields.has("author") &&
      (!doc.author || !doc.author.trim()) &&
      extracted.author &&
      extracted.confidence.author >= options.minConfidence
    ) {
      updates.push({
        field: "author",
        oldValue: doc.author || "",
        newValue: extracted.author,
        confidence: extracted.confidence.author,
      });
    }

    // Year
    if (
      options.fields.has("year") &&
      (!doc.year || doc.year === 0) &&
      extracted.year &&
      extracted.confidence.year >= options.minConfidence
    ) {
      updates.push({
        field: "year",
        oldValue: doc.year || 0,
        newValue: extracted.year,
        confidence: extracted.confidence.year,
      });
    }

    // Publisher
    if (
      options.fields.has("publisher") &&
      (!doc.publisher || !doc.publisher.trim()) &&
      extracted.publisher &&
      extracted.confidence.publisher >= options.minConfidence
    ) {
      updates.push({
        field: "publisher",
        oldValue: doc.publisher || "",
        newValue: extracted.publisher,
        confidence: extracted.confidence.publisher,
      });
    }

    if (updates.length > 0) {
      results.push({
        documentId: doc.id,
        source: doc.source || "",
        title: doc.title || "",
        updates,
      });
    }
  }

  return results;
}

async function applyUpdates(
  dbpath: string,
  results: BackfillResult[]
): Promise<number> {
  const db = await lancedb.connect(dbpath);
  const catalog = await db.openTable("catalog");

  let updatedCount = 0;

  for (const result of results) {
    // Build update object
    const updateData: Record<string, string | number> = {};
    for (const update of result.updates) {
      updateData[update.field] = update.newValue;
    }

    try {
      // LanceDB update: fetch record, modify, and update
      // Note: LanceDB doesn't have direct update by ID, so we use merge
      const records = await catalog
        .query()
        .where(`id = ${result.documentId}`)
        .limit(1)
        .toArray();

      if (records.length === 0) {
        console.warn(`  ⚠️  Record not found: ${result.documentId}`);
        continue;
      }

      const record = records[0];
      const updatedRecord = { ...record, ...updateData };

      // Use LanceDB's merge upsert to update the record
      await catalog.mergeInsert("id").whenMatchedUpdateAll().execute([updatedRecord]);
      updatedCount++;
    } catch (e: any) {
      console.error(`  ❌ Failed to update ${result.documentId}: ${e.message}`);
    }
  }

  return updatedCount;
}

function printResults(results: BackfillResult[], dryRun: boolean): void {
  if (results.length === 0) {
    console.log("\n✅ No documents need metadata backfill");
    return;
  }

  const action = dryRun ? "Would update" : "Updating";
  console.log(`\n${action} ${results.length} documents:\n`);

  for (const result of results) {
    const title = result.title?.substring(0, 50) || result.source.split("/").pop() || "Unknown";
    console.log(`📄 ${title}`);

    for (const update of result.updates) {
      const oldVal = update.oldValue === "" || update.oldValue === 0 ? "(empty)" : update.oldValue;
      console.log(
        `   ${update.field}: ${oldVal} → "${update.newValue}" (conf: ${update.confidence.toFixed(2)})`
      );
    }
    console.log("");
  }

  // Summary
  const fieldCounts: Record<string, number> = {};
  for (const result of results) {
    for (const update of result.updates) {
      fieldCounts[update.field] = (fieldCounts[update.field] || 0) + 1;
    }
  }

  console.log("Summary:");
  for (const [field, count] of Object.entries(fieldCounts)) {
    console.log(`  ${field}: ${count} updates`);
  }
}

async function main(): Promise<void> {
  const options = parseArgs();

  console.log("=== Metadata Backfill ===");
  console.log(`Database: ${options.dbpath}`);
  console.log(`Mode: ${options.dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Min confidence: ${options.minConfidence}`);
  console.log(`Fields: ${Array.from(options.fields).join(", ")}`);
  if (options.source) {
    console.log(`Source filter: ${options.source}`);
  }
  console.log("");

  try {
    const results = await backfillMetadata(options);
    printResults(results, options.dryRun);

    if (!options.dryRun && results.length > 0) {
      console.log("\n🔄 Applying updates...");
      const updatedCount = await applyUpdates(options.dbpath, results);
      console.log(`✅ Updated ${updatedCount}/${results.length} documents`);
    }

    if (options.dryRun && results.length > 0) {
      console.log("\n💡 Run without --dry-run to apply these updates");
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("Unknown error:", error);
    }
    process.exit(1);
  }
}

main();

