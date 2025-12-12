/**
 * Metadata Diagnostic Script
 *
 * Analyzes catalog table to identify documents with missing bibliographic metadata.
 * Reports coverage statistics for title, author, year, publisher, and ISBN fields.
 *
 * Usage:
 *   npx tsx scripts/diagnostics/diagnose-metadata.ts                    # Uses default test DB
 *   npx tsx scripts/diagnostics/diagnose-metadata.ts --dbpath ~/.concept_rag
 *   npx tsx scripts/diagnostics/diagnose-metadata.ts --json > report.json
 */

import * as lancedb from "@lancedb/lancedb";

interface MetadataStats {
  totalDocuments: number;
  fieldsAnalysis: {
    title: { empty: number; fromFilename: number; populated: number };
    author: { empty: number; populated: number };
    year: { zero: number; populated: number };
    publisher: { empty: number; populated: number };
    isbn: { empty: number; populated: number };
  };
  examples: {
    missingAll: string[];
    missingAuthor: string[];
    missingYear: string[];
    complete: string[];
  };
  completenessDistribution: {
    fieldsComplete: number;
    count: number;
  }[];
}

interface CatalogRecord {
  source?: string;
  title?: string;
  author?: string;
  year?: number;
  publisher?: string;
  isbn?: string;
  document_type?: string;
}

function parseArgs(): { dbpath: string; json: boolean } {
  const args = process.argv.slice(2);
  let dbpath = "./db/test";
  let json = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dbpath" && args[i + 1]) {
      dbpath = args[i + 1];
      i++;
    } else if (args[i] === "--json") {
      json = true;
    }
  }

  return { dbpath, json };
}

function getFilename(source: string): string {
  const parts = source.split("/");
  return parts[parts.length - 1] || source;
}

function hasDelimitedFilename(source: string): boolean {
  return source.includes(" -- ");
}

function countCompleteness(record: CatalogRecord): number {
  let count = 0;
  if (record.title && record.title.trim()) count++;
  if (record.author && record.author.trim()) count++;
  if (record.year && record.year > 0) count++;
  if (record.publisher && record.publisher.trim()) count++;
  if (record.isbn && record.isbn.trim()) count++;
  return count;
}

async function analyzeMetadata(dbpath: string): Promise<MetadataStats> {
  const db = await lancedb.connect(dbpath);
  const catalog = await db.openTable("catalog");
  const records: CatalogRecord[] = await catalog.query().limit(100000).toArray();

  const stats: MetadataStats = {
    totalDocuments: records.length,
    fieldsAnalysis: {
      title: { empty: 0, fromFilename: 0, populated: 0 },
      author: { empty: 0, populated: 0 },
      year: { zero: 0, populated: 0 },
      publisher: { empty: 0, populated: 0 },
      isbn: { empty: 0, populated: 0 },
    },
    examples: {
      missingAll: [],
      missingAuthor: [],
      missingYear: [],
      complete: [],
    },
    completenessDistribution: [],
  };

  const completenessCount: Map<number, number> = new Map();

  for (const record of records) {
    const source = record.source || "";
    const filename = getFilename(source);

    // Title analysis
    if (!record.title || !record.title.trim()) {
      stats.fieldsAnalysis.title.empty++;
    } else if (!hasDelimitedFilename(source)) {
      stats.fieldsAnalysis.title.fromFilename++;
    } else {
      stats.fieldsAnalysis.title.populated++;
    }

    // Author analysis
    if (!record.author || !record.author.trim()) {
      stats.fieldsAnalysis.author.empty++;
    } else {
      stats.fieldsAnalysis.author.populated++;
    }

    // Year analysis
    if (!record.year || record.year === 0) {
      stats.fieldsAnalysis.year.zero++;
    } else {
      stats.fieldsAnalysis.year.populated++;
    }

    // Publisher analysis
    if (!record.publisher || !record.publisher.trim()) {
      stats.fieldsAnalysis.publisher.empty++;
    } else {
      stats.fieldsAnalysis.publisher.populated++;
    }

    // ISBN analysis
    if (!record.isbn || !record.isbn.trim()) {
      stats.fieldsAnalysis.isbn.empty++;
    } else {
      stats.fieldsAnalysis.isbn.populated++;
    }

    // Completeness tracking
    const complete = countCompleteness(record);
    completenessCount.set(complete, (completenessCount.get(complete) || 0) + 1);

    // Collect examples (limit to 5 each)
    const hasTitle = record.title && record.title.trim();
    const hasAuthor = record.author && record.author.trim();
    const hasYear = record.year && record.year > 0;
    const hasPublisher = record.publisher && record.publisher.trim();
    const hasIsbn = record.isbn && record.isbn.trim();

    if (!hasTitle && !hasAuthor && !hasYear) {
      if (stats.examples.missingAll.length < 5) {
        stats.examples.missingAll.push(filename);
      }
    } else if (hasTitle && !hasAuthor) {
      if (stats.examples.missingAuthor.length < 5) {
        stats.examples.missingAuthor.push(filename);
      }
    } else if (hasTitle && !hasYear) {
      if (stats.examples.missingYear.length < 5) {
        stats.examples.missingYear.push(filename);
      }
    }

    if (hasTitle && hasAuthor && hasYear && hasPublisher && hasIsbn) {
      if (stats.examples.complete.length < 5) {
        stats.examples.complete.push(filename);
      }
    }
  }

  // Build completeness distribution
  for (let i = 0; i <= 5; i++) {
    const count = completenessCount.get(i) || 0;
    if (count > 0) {
      stats.completenessDistribution.push({ fieldsComplete: i, count });
    }
  }

  return stats;
}

function formatPercent(numerator: number, denominator: number): string {
  if (denominator === 0) return "0%";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

function printReport(stats: MetadataStats, dbpath: string): void {
  console.log("=== Metadata Analysis Report ===");
  console.log(`Database: ${dbpath}`);
  console.log(`Documents analyzed: ${stats.totalDocuments}`);
  console.log("");

  console.log("Field Coverage:");
  const total = stats.totalDocuments;

  const titlePopulated =
    stats.fieldsAnalysis.title.populated + stats.fieldsAnalysis.title.fromFilename;
  console.log(
    `  title:     ${formatPercent(titlePopulated, total).padEnd(5)} (${titlePopulated}/${total}) - ${stats.fieldsAnalysis.title.fromFilename} from simple filename`
  );
  console.log(
    `  author:    ${formatPercent(stats.fieldsAnalysis.author.populated, total).padEnd(5)} (${stats.fieldsAnalysis.author.populated}/${total}) - ${stats.fieldsAnalysis.author.empty} documents missing author`
  );
  console.log(
    `  year:      ${formatPercent(stats.fieldsAnalysis.year.populated, total).padEnd(5)} (${stats.fieldsAnalysis.year.populated}/${total}) - ${stats.fieldsAnalysis.year.zero} documents missing year`
  );
  console.log(
    `  publisher: ${formatPercent(stats.fieldsAnalysis.publisher.populated, total).padEnd(5)} (${stats.fieldsAnalysis.publisher.populated}/${total}) - ${stats.fieldsAnalysis.publisher.empty} documents missing publisher`
  );
  console.log(
    `  isbn:      ${formatPercent(stats.fieldsAnalysis.isbn.populated, total).padEnd(5)} (${stats.fieldsAnalysis.isbn.populated}/${total}) - ${stats.fieldsAnalysis.isbn.empty} documents missing ISBN`
  );
  console.log("");

  // Completeness distribution
  const completeCount = stats.examples.complete.length > 0 ? stats.completenessDistribution.find((d) => d.fieldsComplete === 5)?.count || 0 : 0;
  const minimalCount = stats.completenessDistribution.find((d) => d.fieldsComplete === 1)?.count || 0;

  console.log("Completeness Distribution:");
  for (const { fieldsComplete, count } of stats.completenessDistribution.sort(
    (a, b) => b.fieldsComplete - a.fieldsComplete
  )) {
    const label =
      fieldsComplete === 5
        ? "complete"
        : fieldsComplete === 0
          ? "empty"
          : `${fieldsComplete}/5 fields`;
    console.log(`  ${label.padEnd(12)}: ${count} documents (${formatPercent(count, total)})`);
  }
  console.log("");

  // Examples
  if (stats.examples.complete.length > 0) {
    console.log("Examples of documents with complete metadata:");
    stats.examples.complete.forEach((f) => console.log(`  - ${f}`));
    console.log("");
  }

  if (stats.examples.missingAuthor.length > 0) {
    console.log("Examples of documents missing author:");
    stats.examples.missingAuthor.forEach((f) => console.log(`  - ${f}`));
    console.log("");
  }

  if (stats.examples.missingYear.length > 0) {
    console.log("Examples of documents missing year:");
    stats.examples.missingYear.forEach((f) => console.log(`  - ${f}`));
    console.log("");
  }

  if (stats.examples.missingAll.length > 0) {
    console.log("Examples of documents with minimal metadata (title only from filename):");
    stats.examples.missingAll.forEach((f) => console.log(`  - ${f}`));
    console.log("");
  }

  // Summary
  const withAuthor = stats.fieldsAnalysis.author.populated;
  const withYear = stats.fieldsAnalysis.year.populated;
  const improvementPotential = Math.min(
    stats.fieldsAnalysis.author.empty,
    stats.fieldsAnalysis.year.zero
  );

  console.log("--- Summary ---");
  console.log(
    `Documents with complete metadata (5/5): ${completeCount}/${total} (${formatPercent(completeCount, total)})`
  );
  console.log(
    `Documents with author AND year: ${Math.min(withAuthor, withYear)}/${total} (${formatPercent(Math.min(withAuthor, withYear), total)})`
  );
  console.log(
    `Potential improvement candidates: ${improvementPotential} documents could benefit from content-based extraction`
  );
}

async function main(): Promise<void> {
  const { dbpath, json } = parseArgs();

  try {
    const stats = await analyzeMetadata(dbpath);

    if (json) {
      console.log(JSON.stringify(stats, null, 2));
    } else {
      printReport(stats, dbpath);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      if (error.message.includes("Table catalog does not exist")) {
        console.error("The database does not contain a catalog table.");
        console.error(`Make sure the database at '${dbpath}' has been seeded.`);
      }
    } else {
      console.error("Unknown error:", error);
    }
    process.exit(1);
  }
}

main();

