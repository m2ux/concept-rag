/**
 * Summary Backfill
 *
 * Fills in missing summaries in an already-seeded database without re-running
 * document loading, chunking or concept extraction. Backs the
 * `--populate-summaries` flag of the seeding script.
 *
 * Three tables carry summaries, and each is repaired from data already in the
 * database:
 * - `catalog.summary`  - document overview, regenerated from existing chunks,
 *                        re-enriched with the row's concept/category names, and
 *                        re-embedded (the catalog vector embeds this text).
 * - `concepts.summary` - one-sentence definition generated from the concept name.
 * - `categories.summary` - one-sentence description generated from the category name.
 *
 * Rows are written back with a merge-insert keyed on `id`, so every column the
 * table already has (including `catalog_titles`, `adjacent_ids`, `related_ids`)
 * survives untouched and the Arrow schema is never rewritten.
 */

import * as lancedb from '@lancedb/lancedb';
import {
  generateSummaries,
  generateDocumentOverview
} from '../../concepts/summary_generator.js';
import { SimpleEmbeddingService } from '../embeddings/simple-embedding-service.js';

/** Tables that carry a summary field. */
export const SUMMARY_TARGETS = ['catalog', 'concepts', 'categories'] as const;

export type SummaryTarget = (typeof SUMMARY_TARGETS)[number];

/** Separator between the document overview and its enrichment lines in catalog.summary */
const CONCEPTS_MARKER = '\n\nKey Concepts:';

/** Fallback text written by the seeder when overview generation fails */
const OVERVIEW_FALLBACK_PREFIX = 'Document overview (';

/** An overview shorter than this is treated as junk rather than a summary */
const MIN_OVERVIEW_LENGTH = 10;

/** Characters of document text assembled from chunks before summarising */
const DOCUMENT_TEXT_LIMIT = 10000;

const DEFAULT_BATCH_SIZE = 30;
const DEFAULT_FLUSH_SIZE = 250;

/**
 * Generates summaries for a batch of concept/category names.
 * Returns a map of lowercased name to summary. Injectable for testing.
 */
export type BatchSummaryGenerator = (
  names: string[],
  type: 'concept' | 'category'
) => Promise<Map<string, string>>;

/**
 * Generates a one-sentence overview for a single document's text.
 * Injectable for testing.
 */
export type OverviewGenerator = (text: string) => Promise<string>;

export interface SummaryBackfillOptions {
  /** Tables to process (default: all three) */
  targets?: SummaryTarget[];
  /** OpenRouter API key (defaults to OPENROUTER_API_KEY) */
  apiKey?: string;
  /** Model override for summary generation */
  model?: string;
  /** Items per LLM request for concepts/categories */
  batchSize?: number;
  /** Summaries buffered before writing back to the table */
  flushSize?: number;
  /** Regenerate every summary instead of only the missing ones */
  force?: boolean;
  /** Report what would change without calling the LLM or writing */
  dryRun?: boolean;
  /** Process at most N items per table (useful for trial runs) */
  maxItems?: number;
  /** Milestone logger (default: console.log) */
  log?: (message: string) => void;
  /** Progress callback, called after each batch */
  onProgress?: (progress: SummaryProgress) => void;
  /** Override batch summary generation (tests) */
  batchGenerator?: BatchSummaryGenerator;
  /** Override document overview generation (tests) */
  overviewGenerator?: OverviewGenerator;
}

export interface SummaryProgress {
  table: SummaryTarget;
  completed: number;
  total: number;
}

export interface TableBackfillResult {
  table: SummaryTarget;
  /** Rows in the table */
  total: number;
  /** Rows found to be missing a summary */
  missing: number;
  /** Summaries the LLM returned */
  generated: number;
  /** Rows written back to the table */
  written: number;
  /** Rows that were missing a summary but got no usable result */
  failed: number;
  /** Set when the table was not processed at all */
  skippedReason?: string;
}

export interface SummaryBackfillReport {
  dryRun: boolean;
  results: TableBackfillResult[];
}

const embeddingService = new SimpleEmbeddingService();

/**
 * Parse the `--populate-summaries` value into a list of tables.
 *
 * Accepts an empty string or "all" for every table, or a comma-separated
 * subset such as "concepts,catalog".
 *
 * @throws If a token is not a known table
 */
export function parseSummaryTargets(value?: string | boolean): SummaryTarget[] {
  if (value === undefined || value === null || value === true || value === '') {
    return [...SUMMARY_TARGETS];
  }

  const tokens = String(value)
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(t => t.length > 0);

  if (tokens.length === 0 || tokens.includes('all')) {
    return [...SUMMARY_TARGETS];
  }

  const unknown = tokens.filter(t => !SUMMARY_TARGETS.includes(t as SummaryTarget));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown summary target(s): ${unknown.join(', ')}. Valid targets: ${SUMMARY_TARGETS.join(', ')}, all`
    );
  }

  // Preserve canonical order and drop duplicates
  return SUMMARY_TARGETS.filter(t => tokens.includes(t));
}

/**
 * Split a catalog summary into its LLM overview and the enrichment lines
 * ("Key Concepts: ..." / "Categories: ...") appended during seeding.
 */
export function splitCatalogSummary(summary: string): { overview: string; enrichment: string } {
  const text = summary || '';
  const markerIndex = text.indexOf(CONCEPTS_MARKER);

  if (markerIndex === -1) {
    return { overview: text.trim(), enrichment: '' };
  }

  return {
    overview: text.slice(0, markerIndex).trim(),
    enrichment: text.slice(markerIndex).trim()
  };
}

/**
 * Rebuild a catalog summary in the exact shape the seeder writes:
 * overview, blank line, concept names, category names.
 */
export function buildCatalogSummary(
  overview: string,
  conceptNames: string[],
  categoryNames: string[]
): string {
  const concepts = conceptNames.filter(n => n && n.trim().length > 0);
  const categories = categoryNames.filter(n => n && n.trim().length > 0);

  return `${overview}\n\nKey Concepts: ${concepts.join(', ')}\nCategories: ${categories.join(', ')}`.trim();
}

/**
 * Is this catalog row missing a usable document overview?
 *
 * True for an empty summary, the seeder's "Document overview (N pages)"
 * fallback, a failed-summarisation marker, or an overview too short to be one.
 */
export function isMissingCatalogSummary(row: { summary?: string }, force = false): boolean {
  if (force) return true;

  const { overview } = splitCatalogSummary(row.summary ?? '');

  return (
    overview.length < MIN_OVERVIEW_LENGTH ||
    overview.startsWith(OVERVIEW_FALLBACK_PREFIX) ||
    overview.includes('LLM summarization failed')
  );
}

/** Is this concept row missing a summary? */
export function isMissingConceptSummary(row: { summary?: string }, force = false): boolean {
  if (force) return true;
  return (row.summary ?? '').trim().length === 0;
}

/**
 * Is this category row missing a summary?
 *
 * Also true when the summary is just the generated description, which is what
 * seeding falls back to when the LLM call is skipped or fails.
 */
export function isMissingCategorySummary(
  row: { summary?: string; description?: string },
  force = false
): boolean {
  if (force) return true;

  const summary = (row.summary ?? '').trim();
  if (summary.length === 0) return true;

  const description = (row.description ?? '').trim();
  return description.length > 0 && summary === description;
}

/**
 * Assemble document text from its chunks, in reading order, for summarisation.
 *
 * Chunks are ordered by page number with a *stable* sort, so chunks sharing a
 * page keep the order they came back from the table in - which is insertion
 * order, i.e. the order they were split from the document. Chunk ids are
 * hash-based and carry no sequence, so they must not be used as a tiebreak:
 * EPUBs store every chunk as page 1, and sorting those by id shuffles the book.
 */
export function assembleDocumentText(
  chunks: Array<{ text?: string; page_number?: number }>,
  maxChars: number = DOCUMENT_TEXT_LIMIT
): string {
  const ordered = [...chunks].sort((a, b) => (a.page_number ?? 0) - (b.page_number ?? 0));

  return ordered
    .map(c => c.text ?? '')
    .filter(t => t.length > 0)
    .join('\n\n')
    .slice(0, maxChars);
}

/** Convert an Arrow-backed value to a plain JS value. */
function toPlain(value: any): any {
  if (value && typeof value === 'object' && typeof value.toArray === 'function') {
    return Array.from(value.toArray());
  }
  return value;
}

/** Read a row's array field as a plain string array. */
function toStringArray(value: any): string[] {
  const plain = toPlain(value);
  if (!Array.isArray(plain)) return [];
  return plain.map(v => String(v ?? '')).filter(v => v.length > 0);
}

/**
 * Write updated rows back via merge-insert on `id`.
 *
 * Rows are reconstructed field-by-field from the live schema, so unknown or
 * newly added columns pass through unchanged.
 */
async function writeUpdatedRows(
  table: lancedb.Table,
  fieldNames: string[],
  updates: Array<{ row: any; values: Record<string, unknown> }>
): Promise<number> {
  if (updates.length === 0) return 0;

  const data = updates.map(({ row, values }) => {
    const record: Record<string, unknown> = {};
    for (const field of fieldNames) {
      record[field] = field in values ? values[field] : toPlain(row[field]);
    }
    return record;
  });

  await table.mergeInsert('id').whenMatchedUpdateAll().execute(data);
  return data.length;
}

/**
 * Populate missing summaries across the catalog, concepts and categories tables.
 *
 * Every LLM result is written back in batches, so an interrupted run keeps the
 * summaries it already produced and a re-run picks up where it stopped.
 */
export async function backfillSummaries(
  db: lancedb.Connection,
  options: SummaryBackfillOptions = {}
): Promise<SummaryBackfillReport> {
  const targets = options.targets ?? [...SUMMARY_TARGETS];
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  const flushSize = options.flushSize ?? DEFAULT_FLUSH_SIZE;
  const force = options.force ?? false;
  const dryRun = options.dryRun ?? false;
  const log = options.log ?? ((message: string) => console.log(message));

  const generateBatch: BatchSummaryGenerator =
    options.batchGenerator ??
    ((names, type) =>
      generateSummaries(names, type, {
        apiKey: options.apiKey,
        model: options.model,
        batchSize,
        onProgress: () => {} // progress is reported per batch by this module
      }));

  const generateOverview: OverviewGenerator =
    options.overviewGenerator ??
    (text =>
      generateDocumentOverview(text, {
        apiKey: options.apiKey,
        model: options.model,
        rateLimit: true
      }));

  const tableNames = await db.tableNames();
  const results: TableBackfillResult[] = [];

  for (const target of targets) {
    if (!tableNames.includes(target)) {
      results.push({
        table: target,
        total: 0,
        missing: 0,
        generated: 0,
        written: 0,
        failed: 0,
        skippedReason: 'table not found'
      });
      continue;
    }

    if (target === 'catalog') {
      results.push(
        await backfillCatalog(db, {
          force,
          dryRun,
          flushSize,
          maxItems: options.maxItems,
          log,
          onProgress: options.onProgress,
          generateOverview
        })
      );
    } else {
      results.push(
        await backfillNamedTable(db, target, {
          force,
          dryRun,
          batchSize,
          flushSize,
          maxItems: options.maxItems,
          log,
          onProgress: options.onProgress,
          generateBatch
        })
      );
    }
  }

  return { dryRun, results };
}

/**
 * Regenerate document overviews for catalog rows, from their existing chunks.
 */
async function backfillCatalog(
  db: lancedb.Connection,
  opts: {
    force: boolean;
    dryRun: boolean;
    flushSize: number;
    maxItems?: number;
    log: (message: string) => void;
    onProgress?: (progress: SummaryProgress) => void;
    generateOverview: OverviewGenerator;
  }
): Promise<TableBackfillResult> {
  const table = await db.openTable('catalog');
  const schema = await table.schema();
  const fieldNames = schema.fields.map((f: any) => f.name);

  const rows = await table.query().limit(1000000).toArray();
  const missingRows = rows.filter((r: any) => isMissingCatalogSummary(r, opts.force));
  const targetRows = opts.maxItems ? missingRows.slice(0, opts.maxItems) : missingRows;

  const result: TableBackfillResult = {
    table: 'catalog',
    total: rows.length,
    missing: missingRows.length,
    generated: 0,
    written: 0,
    failed: 0
  };

  opts.log(`📚 catalog: ${missingRows.length}/${rows.length} document(s) need a summary`);

  if (targetRows.length === 0 || opts.dryRun) {
    return result;
  }

  const chunksAvailable = (await db.tableNames()).includes('chunks');
  if (!chunksAvailable) {
    result.skippedReason = 'chunks table not found (document text unavailable)';
    opts.log(`  ⚠️  ${result.skippedReason} - skipping catalog summaries`);
    return result;
  }
  const chunksTable = await db.openTable('chunks');

  let pending: Array<{ row: any; values: Record<string, unknown> }> = [];

  const flush = async () => {
    result.written += await writeUpdatedRows(table, fieldNames, pending);
    pending = [];
  };

  for (let i = 0; i < targetRows.length; i++) {
    const row: any = targetRows[i];
    const hash = String(row.hash ?? '').replace(/"/g, '');

    try {
      const chunks = hash
        ? await chunksTable.query().where(`hash = "${hash}"`).limit(100000).toArray()
        : [];

      if (chunks.length === 0) {
        result.failed++;
        opts.log(`  ⚠️  No chunks found for ${row.source ?? row.id} - cannot regenerate summary`);
        continue;
      }

      const text = assembleDocumentText(
        chunks.map((c: any) => ({
          text: c.text,
          page_number: typeof c.page_number === 'number' ? c.page_number : Number(c.page_number ?? 0)
        }))
      );

      if (text.trim().length === 0) {
        result.failed++;
        opts.log(`  ⚠️  Chunks for ${row.source ?? row.id} contain no text`);
        continue;
      }

      const overview = (await opts.generateOverview(text)).trim();
      if (overview.length === 0) {
        result.failed++;
        continue;
      }

      const summary = buildCatalogSummary(
        overview,
        toStringArray(row.concept_names),
        toStringArray(row.category_names)
      );

      result.generated++;
      pending.push({
        row,
        values: {
          summary,
          // The catalog vector embeds the summary text, so it must be refreshed too
          vector: embeddingService.generateEmbedding(summary)
        }
      });

      if (pending.length >= opts.flushSize) {
        await flush();
      }
    } catch (error: any) {
      result.failed++;
      opts.log(`  ❌ Summary failed for ${row.source ?? row.id}: ${error.message}`);
    }

    opts.onProgress?.({ table: 'catalog', completed: i + 1, total: targetRows.length });
  }

  await flush();
  opts.log(`  ✅ catalog: wrote ${result.written} summary/summaries`);

  return result;
}

/**
 * Generate summaries for the concepts or categories table from their names.
 */
async function backfillNamedTable(
  db: lancedb.Connection,
  target: 'concepts' | 'categories',
  opts: {
    force: boolean;
    dryRun: boolean;
    batchSize: number;
    flushSize: number;
    maxItems?: number;
    log: (message: string) => void;
    onProgress?: (progress: SummaryProgress) => void;
    generateBatch: BatchSummaryGenerator;
  }
): Promise<TableBackfillResult> {
  const isConcepts = target === 'concepts';
  const nameField = isConcepts ? 'name' : 'category';
  const type = isConcepts ? 'concept' : 'category';
  const icon = isConcepts ? '🧠' : '📂';

  const table = await db.openTable(target);
  const schema = await table.schema();
  const fieldNames = schema.fields.map((f: any) => f.name);

  const rows = await table.query().limit(1000000).toArray();
  const missingRows = rows.filter((r: any) =>
    isConcepts ? isMissingConceptSummary(r, opts.force) : isMissingCategorySummary(r, opts.force)
  );
  const targetRows = (opts.maxItems ? missingRows.slice(0, opts.maxItems) : missingRows).filter(
    (r: any) => String(r[nameField] ?? '').trim().length > 0
  );

  const result: TableBackfillResult = {
    table: target,
    total: rows.length,
    missing: missingRows.length,
    generated: 0,
    written: 0,
    failed: 0
  };

  opts.log(`${icon} ${target}: ${missingRows.length}/${rows.length} row(s) need a summary`);

  if (targetRows.length === 0 || opts.dryRun) {
    return result;
  }

  let pending: Array<{ row: any; values: Record<string, unknown> }> = [];

  const flush = async () => {
    result.written += await writeUpdatedRows(table, fieldNames, pending);
    pending = [];
  };

  for (let i = 0; i < targetRows.length; i += opts.batchSize) {
    const batch = targetRows.slice(i, i + opts.batchSize);
    const names = batch.map((r: any) => String(r[nameField]));

    let summaries = new Map<string, string>();
    try {
      summaries = await opts.generateBatch(names, type);
    } catch (error: any) {
      opts.log(`  ❌ Batch failed (${names.length} ${type}s): ${error.message}`);
    }

    for (const row of batch) {
      const summary = summaries.get(String(row[nameField]).toLowerCase().trim());
      if (summary && summary.trim().length > 0) {
        result.generated++;
        pending.push({ row, values: { summary: summary.trim() } });
      } else {
        result.failed++;
      }
    }

    if (pending.length >= opts.flushSize) {
      await flush();
    }

    opts.onProgress?.({
      table: target,
      completed: Math.min(i + opts.batchSize, targetRows.length),
      total: targetRows.length
    });
  }

  await flush();
  opts.log(`  ✅ ${target}: wrote ${result.written} summary/summaries`);

  return result;
}
