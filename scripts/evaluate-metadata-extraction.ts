/**
 * Metadata Extraction Evaluation Script
 *
 * Measures accuracy of content-based extraction against known-good metadata.
 * Uses documents with complete filename-derived metadata as ground truth.
 *
 * Usage:
 *   npx tsx scripts/evaluate-metadata-extraction.ts                      # Uses default test DB
 *   npx tsx scripts/evaluate-metadata-extraction.ts --dbpath ~/.concept_rag
 *   npx tsx scripts/evaluate-metadata-extraction.ts --json > evaluation.json
 *   npx tsx scripts/evaluate-metadata-extraction.ts --verbose            # Show each comparison
 */

import * as lancedb from "@lancedb/lancedb";
import {
  extractContentMetadata,
  ChunkData,
} from "../src/infrastructure/document-loaders/content-metadata-extractor.js";

interface EvaluationMetrics {
  field: "title" | "author" | "year" | "publisher";
  total: number;
  extracted: number;
  correct: number;
  precision: number;
  recall: number;
  f1: number;
  avgConfidence: number;
  examples: {
    correct: Array<{ doc: string; expected: string; got: string }>;
    incorrect: Array<{ doc: string; expected: string; got: string }>;
    missed: Array<{ doc: string; expected: string }>;
  };
}

interface EvaluationResult {
  databasePath: string;
  documentsEvaluated: number;
  documentsWithGroundTruth: number;
  metrics: EvaluationMetrics[];
  overallAccuracy: number;
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

function parseArgs(): { dbpath: string; json: boolean; verbose: boolean } {
  const args = process.argv.slice(2);
  let dbpath = "./db/test";
  let json = false;
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dbpath" && args[i + 1]) {
      dbpath = args[i + 1];
      i++;
    } else if (args[i] === "--json") {
      json = true;
    } else if (args[i] === "--verbose") {
      verbose = true;
    }
  }

  return { dbpath, json, verbose };
}

/**
 * Normalize text for comparison.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,;:'"!?()[\]{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fuzzy match for author names.
 * Handles variations like "Robert C. Martin" vs "Robert Martin" vs "R. Martin"
 */
function authorMatch(expected: string, extracted: string): boolean {
  if (!expected || !extracted) return false;

  const normExpected = normalizeText(expected);
  const normExtracted = normalizeText(extracted);

  // Exact match
  if (normExpected === normExtracted) return true;

  // Extract last name from each
  const expectedWords = normExpected.split(" ");
  const extractedWords = normExtracted.split(" ");

  const expectedLast = expectedWords[expectedWords.length - 1];
  const extractedLast = extractedWords[extractedWords.length - 1];

  // Last name must match
  if (expectedLast !== extractedLast) return false;

  // First name or initial should match
  const expectedFirst = expectedWords[0];
  const extractedFirst = extractedWords[0];

  // Full first name match
  if (expectedFirst === extractedFirst) return true;

  // Initial match (R vs Robert)
  if (
    expectedFirst.charAt(0) === extractedFirst.charAt(0) &&
    (expectedFirst.length === 1 || extractedFirst.length === 1)
  ) {
    return true;
  }

  // Check if extracted contains expected last name
  if (normExtracted.includes(expectedLast)) return true;

  return false;
}

/**
 * Fuzzy match for publisher names.
 * Ignores Inc, Ltd, Publishing suffixes.
 */
function publisherMatch(expected: string, extracted: string): boolean {
  if (!expected || !extracted) return false;

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/\b(inc|ltd|llc|publishing|press|books?)\b/gi, "")
      .replace(/[.,;:'"]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const normExpected = normalize(expected);
  const normExtracted = normalize(extracted);

  // Exact match after normalization
  if (normExpected === normExtracted) return true;

  // One contains the other
  if (normExpected.includes(normExtracted) || normExtracted.includes(normExpected)) {
    return true;
  }

  return false;
}

/**
 * Fuzzy match for titles.
 * Uses Levenshtein distance threshold.
 */
function titleMatch(expected: string, extracted: string): boolean {
  if (!expected || !extracted) return false;

  const normExpected = normalizeText(expected);
  const normExtracted = normalizeText(extracted);

  // Exact match
  if (normExpected === normExtracted) return true;

  // One starts with the other (truncated titles)
  if (normExpected.startsWith(normExtracted) || normExtracted.startsWith(normExpected)) {
    return true;
  }

  // Levenshtein distance < 10% of length
  const maxLen = Math.max(normExpected.length, normExtracted.length);
  const distance = levenshteinDistance(normExpected, normExtracted);
  return distance < maxLen * 0.1;
}

/**
 * Simple Levenshtein distance implementation.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

async function evaluateExtraction(
  dbpath: string,
  verbose: boolean
): Promise<EvaluationResult> {
  const db = await lancedb.connect(dbpath);
  const catalog = await db.openTable("catalog");
  const chunks = await db.openTable("chunks");

  const allDocs: CatalogRecord[] = await catalog.query().limit(100000).toArray();
  const allChunks: ChunkRecord[] = await chunks.query().limit(1000000).toArray();

  // Find documents with ground truth (complete filename-derived metadata)
  const groundTruthDocs = allDocs.filter(
    (d) =>
      d.author &&
      d.author.trim() &&
      d.year &&
      d.year > 0 &&
      d.source?.includes(" -- ")
  );

  if (verbose) {
    console.log(
      `Found ${groundTruthDocs.length} documents with ground truth metadata`
    );
  }

  // Initialize metrics
  const metricsMap: Map<string, EvaluationMetrics> = new Map();
  for (const field of ["author", "year", "publisher"] as const) {
    metricsMap.set(field, {
      field,
      total: 0,
      extracted: 0,
      correct: 0,
      precision: 0,
      recall: 0,
      f1: 0,
      avgConfidence: 0,
      examples: { correct: [], incorrect: [], missed: [] },
    });
  }

  let totalConfidenceSum: Record<string, number> = { author: 0, year: 0, publisher: 0 };
  let totalConfidenceCount: Record<string, number> = { author: 0, year: 0, publisher: 0 };

  // Evaluate each document
  for (const doc of groundTruthDocs) {
    // Get front matter chunks
    const docChunks = allChunks
      .filter((c) => c.catalog_id === doc.id)
      .filter((c) => !c.is_reference)
      .filter((c) => !c.page_number || c.page_number <= 10)
      .sort((a, b) => (a.page_number || 0) - (b.page_number || 0))
      .slice(0, 8);

    if (docChunks.length === 0) continue;

    // Convert to ChunkData
    const chunkData: ChunkData[] = docChunks.map((c) => ({
      text: c.text,
      page_number: c.page_number,
      is_reference: c.is_reference,
    }));

    // Extract metadata
    const extracted = await extractContentMetadata(chunkData);

    const docName = doc.title?.substring(0, 40) || doc.source?.split("/").pop() || "Unknown";

    // Evaluate author
    const authorMetrics = metricsMap.get("author")!;
    if (doc.author) {
      authorMetrics.total++;
      if (extracted.author) {
        authorMetrics.extracted++;
        totalConfidenceSum.author += extracted.confidence.author;
        totalConfidenceCount.author++;

        if (authorMatch(doc.author, extracted.author)) {
          authorMetrics.correct++;
          if (authorMetrics.examples.correct.length < 3) {
            authorMetrics.examples.correct.push({
              doc: docName,
              expected: doc.author,
              got: extracted.author,
            });
          }
        } else {
          if (authorMetrics.examples.incorrect.length < 3) {
            authorMetrics.examples.incorrect.push({
              doc: docName,
              expected: doc.author,
              got: extracted.author,
            });
          }
        }
      } else {
        if (authorMetrics.examples.missed.length < 3) {
          authorMetrics.examples.missed.push({
            doc: docName,
            expected: doc.author,
          });
        }
      }
    }

    // Evaluate year
    const yearMetrics = metricsMap.get("year")!;
    if (doc.year && doc.year > 0) {
      yearMetrics.total++;
      if (extracted.year) {
        yearMetrics.extracted++;
        totalConfidenceSum.year += extracted.confidence.year;
        totalConfidenceCount.year++;

        if (extracted.year === doc.year) {
          yearMetrics.correct++;
          if (yearMetrics.examples.correct.length < 3) {
            yearMetrics.examples.correct.push({
              doc: docName,
              expected: String(doc.year),
              got: String(extracted.year),
            });
          }
        } else {
          if (yearMetrics.examples.incorrect.length < 3) {
            yearMetrics.examples.incorrect.push({
              doc: docName,
              expected: String(doc.year),
              got: String(extracted.year),
            });
          }
        }
      } else {
        if (yearMetrics.examples.missed.length < 3) {
          yearMetrics.examples.missed.push({
            doc: docName,
            expected: String(doc.year),
          });
        }
      }
    }

    // Evaluate publisher
    const publisherMetrics = metricsMap.get("publisher")!;
    if (doc.publisher && doc.publisher.trim()) {
      publisherMetrics.total++;
      if (extracted.publisher) {
        publisherMetrics.extracted++;
        totalConfidenceSum.publisher += extracted.confidence.publisher;
        totalConfidenceCount.publisher++;

        if (publisherMatch(doc.publisher, extracted.publisher)) {
          publisherMetrics.correct++;
          if (publisherMetrics.examples.correct.length < 3) {
            publisherMetrics.examples.correct.push({
              doc: docName,
              expected: doc.publisher,
              got: extracted.publisher,
            });
          }
        } else {
          if (publisherMetrics.examples.incorrect.length < 3) {
            publisherMetrics.examples.incorrect.push({
              doc: docName,
              expected: doc.publisher,
              got: extracted.publisher,
            });
          }
        }
      } else {
        if (publisherMetrics.examples.missed.length < 3) {
          publisherMetrics.examples.missed.push({
            doc: docName,
            expected: doc.publisher,
          });
        }
      }
    }

    if (verbose) {
      console.log(`\n${docName}:`);
      console.log(`  Expected: author="${doc.author}", year=${doc.year}, publisher="${doc.publisher}"`);
      console.log(
        `  Extracted: author="${extracted.author || ""}", year=${extracted.year || 0}, publisher="${extracted.publisher || ""}"`
      );
    }
  }

  // Calculate final metrics
  const metrics: EvaluationMetrics[] = [];
  let totalCorrect = 0;
  let totalFields = 0;

  for (const [, m] of metricsMap) {
    m.precision = m.extracted > 0 ? m.correct / m.extracted : 0;
    m.recall = m.total > 0 ? m.correct / m.total : 0;
    m.f1 = m.precision + m.recall > 0 
      ? (2 * m.precision * m.recall) / (m.precision + m.recall) 
      : 0;
    
    const field = m.field as keyof typeof totalConfidenceSum;
    m.avgConfidence = totalConfidenceCount[field] > 0 
      ? totalConfidenceSum[field] / totalConfidenceCount[field] 
      : 0;

    metrics.push(m);
    totalCorrect += m.correct;
    totalFields += m.total;
  }

  return {
    databasePath: dbpath,
    documentsEvaluated: allDocs.length,
    documentsWithGroundTruth: groundTruthDocs.length,
    metrics,
    overallAccuracy: totalFields > 0 ? totalCorrect / totalFields : 0,
  };
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function printReport(result: EvaluationResult): void {
  console.log("=== Metadata Extraction Evaluation Report ===");
  console.log(`Database: ${result.databasePath}`);
  console.log(`Documents evaluated: ${result.documentsEvaluated}`);
  console.log(`Documents with ground truth: ${result.documentsWithGroundTruth}`);
  console.log("");

  console.log("Per-Field Metrics:");
  console.log("─".repeat(80));
  console.log(
    "Field".padEnd(12) +
      "Total".padStart(8) +
      "Extracted".padStart(12) +
      "Correct".padStart(10) +
      "Precision".padStart(12) +
      "Recall".padStart(10) +
      "F1".padStart(8) +
      "Avg Conf".padStart(10)
  );
  console.log("─".repeat(80));

  for (const m of result.metrics) {
    console.log(
      m.field.padEnd(12) +
        String(m.total).padStart(8) +
        String(m.extracted).padStart(12) +
        String(m.correct).padStart(10) +
        formatPercent(m.precision).padStart(12) +
        formatPercent(m.recall).padStart(10) +
        formatPercent(m.f1).padStart(8) +
        m.avgConfidence.toFixed(2).padStart(10)
    );
  }
  console.log("─".repeat(80));
  console.log(`Overall Accuracy: ${formatPercent(result.overallAccuracy)}`);
  console.log("");

  // Show examples
  for (const m of result.metrics) {
    if (m.examples.correct.length > 0) {
      console.log(`\n✓ Correct ${m.field} extractions:`);
      for (const ex of m.examples.correct) {
        console.log(`  ${ex.doc}: "${ex.expected}" → "${ex.got}"`);
      }
    }
    if (m.examples.incorrect.length > 0) {
      console.log(`\n✗ Incorrect ${m.field} extractions:`);
      for (const ex of m.examples.incorrect) {
        console.log(`  ${ex.doc}: expected "${ex.expected}", got "${ex.got}"`);
      }
    }
    if (m.examples.missed.length > 0) {
      console.log(`\n○ Missed ${m.field} extractions:`);
      for (const ex of m.examples.missed) {
        console.log(`  ${ex.doc}: expected "${ex.expected}", got nothing`);
      }
    }
  }
}

async function main(): Promise<void> {
  const { dbpath, json, verbose } = parseArgs();

  try {
    const result = await evaluateExtraction(dbpath, verbose);

    if (json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printReport(result);
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




