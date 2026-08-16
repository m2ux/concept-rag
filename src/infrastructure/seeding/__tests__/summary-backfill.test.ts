/**
 * Unit Tests for Summary Backfill (--populate-summaries)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as lancedb from '@lancedb/lancedb';
import {
  parseSummaryTargets,
  splitCatalogSummary,
  buildCatalogSummary,
  assembleDocumentText,
  isMissingCatalogSummary,
  isMissingConceptSummary,
  isMissingCategorySummary,
  backfillSummaries,
  SUMMARY_TARGETS
} from '../index.js';

describe('parseSummaryTargets', () => {
  it('defaults to every table for a bare flag', () => {
    expect(parseSummaryTargets(undefined)).toEqual([...SUMMARY_TARGETS]);
    expect(parseSummaryTargets('')).toEqual([...SUMMARY_TARGETS]);
    expect(parseSummaryTargets(true)).toEqual([...SUMMARY_TARGETS]);
    expect(parseSummaryTargets('all')).toEqual([...SUMMARY_TARGETS]);
  });

  it('parses a comma-separated subset in canonical order', () => {
    expect(parseSummaryTargets('concepts,catalog')).toEqual(['catalog', 'concepts']);
    expect(parseSummaryTargets(' CATEGORIES ')).toEqual(['categories']);
  });

  it('drops duplicates', () => {
    expect(parseSummaryTargets('concepts,concepts')).toEqual(['concepts']);
  });

  it('throws on an unknown target', () => {
    expect(() => parseSummaryTargets('chunks')).toThrow(/Unknown summary target/);
  });
});

describe('splitCatalogSummary', () => {
  it('separates the overview from the enrichment lines', () => {
    const summary = 'A book about testing.\n\nKey Concepts: a, b\nCategories: x';
    expect(splitCatalogSummary(summary)).toEqual({
      overview: 'A book about testing.',
      enrichment: 'Key Concepts: a, b\nCategories: x'
    });
  });

  it('treats a bare summary as all overview', () => {
    expect(splitCatalogSummary('Just an overview.').overview).toBe('Just an overview.');
    expect(splitCatalogSummary('').overview).toBe('');
  });
});

describe('buildCatalogSummary', () => {
  it('matches the shape written during seeding', () => {
    expect(buildCatalogSummary('An overview.', ['a', 'b'], ['x'])).toBe(
      'An overview.\n\nKey Concepts: a, b\nCategories: x'
    );
  });

  it('drops placeholder entries', () => {
    expect(buildCatalogSummary('An overview.', ['', 'a'], [''])).toBe(
      'An overview.\n\nKey Concepts: a\nCategories:'
    );
  });

  it('round-trips through splitCatalogSummary', () => {
    const summary = buildCatalogSummary('An overview.', ['a'], ['x']);
    expect(splitCatalogSummary(summary).overview).toBe('An overview.');
  });
});

describe('isMissingCatalogSummary', () => {
  it('accepts a real overview', () => {
    expect(isMissingCatalogSummary({ summary: 'A thorough guide to distributed systems.' })).toBe(false);
  });

  it('flags empty and too-short summaries', () => {
    expect(isMissingCatalogSummary({ summary: '' })).toBe(true);
    expect(isMissingCatalogSummary({})).toBe(true);
    expect(isMissingCatalogSummary({ summary: 'short' })).toBe(true);
  });

  it('flags the seeder fallback and failure markers', () => {
    expect(isMissingCatalogSummary({ summary: 'Document overview (42 pages)' })).toBe(true);
    expect(isMissingCatalogSummary({ summary: 'LLM summarization failed for this document' })).toBe(true);
  });

  it('flags a row whose overview is missing but enrichment survives', () => {
    expect(isMissingCatalogSummary({ summary: '\n\nKey Concepts: a\nCategories: x' })).toBe(true);
  });

  it('flags everything under force', () => {
    expect(isMissingCatalogSummary({ summary: 'A thorough guide to distributed systems.' }, true)).toBe(true);
  });
});

describe('isMissingConceptSummary', () => {
  it('flags empty summaries only', () => {
    expect(isMissingConceptSummary({ summary: '' })).toBe(true);
    expect(isMissingConceptSummary({ summary: '   ' })).toBe(true);
    expect(isMissingConceptSummary({})).toBe(true);
    expect(isMissingConceptSummary({ summary: 'A definition.' })).toBe(false);
  });

  it('flags everything under force', () => {
    expect(isMissingConceptSummary({ summary: 'A definition.' }, true)).toBe(true);
  });
});

describe('isMissingCategorySummary', () => {
  it('flags empty summaries', () => {
    expect(isMissingCategorySummary({ summary: '', description: 'd' })).toBe(true);
  });

  it('flags a summary that is just the generated description', () => {
    const description = 'Concepts and practices related to cryptography';
    expect(isMissingCategorySummary({ summary: description, description })).toBe(true);
  });

  it('accepts a distinct summary', () => {
    expect(
      isMissingCategorySummary({
        summary: 'Cryptography covers the design of ciphers and protocols.',
        description: 'Concepts and practices related to cryptography'
      })
    ).toBe(false);
  });
});

describe('assembleDocumentText', () => {
  it('orders chunks by page number', () => {
    const text = assembleDocumentText([
      { text: 'third', page_number: 3 },
      { text: 'first', page_number: 1 },
      { text: 'second', page_number: 2 }
    ]);

    expect(text).toBe('first\n\nsecond\n\nthird');
  });

  it('keeps storage order for chunks sharing a page number', () => {
    // EPUBs store every chunk as page 1; the scan order is the reading order
    const text = assembleDocumentText([
      { text: 'front matter', page_number: 1 },
      { text: 'chapter one', page_number: 1 },
      { text: 'chapter two', page_number: 1 }
    ]);

    expect(text).toBe('front matter\n\nchapter one\n\nchapter two');
  });

  it('skips empty chunks and truncates to the limit', () => {
    const text = assembleDocumentText(
      [{ text: '', page_number: 1 }, { text: 'abcdefghij', page_number: 2 }],
      4
    );

    expect(text).toBe('abcd');
  });
});

describe('backfillSummaries', () => {
  let tempDir: string;
  let db: lancedb.Connection;

  // Must match SimpleEmbeddingService's dimension: the backfill re-embeds catalog summaries
  const vector = () => Array.from({ length: 384 }, (_, i) => (i % 10) / 10);

  beforeEach(async () => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'summary-backfill-test-'));
    db = await lancedb.connect(path.join(tempDir, 'db'));

    await db.createTable('catalog', [
      {
        id: 1,
        hash: 'aaa',
        source: '/docs/complete.pdf',
        summary: 'An existing overview of a complete document.\n\nKey Concepts: kept\nCategories: kept',
        concept_names: ['kept'],
        category_names: ['kept'],
        vector: vector()
      },
      {
        id: 2,
        hash: 'bbb',
        source: '/docs/fallback.pdf',
        summary: 'Document overview (12 pages)',
        concept_names: ['alpha', 'beta'],
        category_names: ['engineering'],
        vector: vector()
      }
    ]);

    await db.createTable('chunks', [
      { id: 10, hash: 'bbb', page_number: 2, text: 'second page text', vector: vector() },
      { id: 11, hash: 'bbb', page_number: 1, text: 'first page text', vector: vector() }
    ]);

    await db.createTable('concepts', [
      {
        id: 100,
        name: 'alpha',
        summary: '',
        catalog_ids: [1],
        catalog_titles: ['/docs/fallback.pdf'],
        chunk_ids: [10],
        adjacent_ids: [101],
        related_ids: [101],
        synonyms: ['a'],
        broader_terms: [''],
        narrower_terms: [''],
        weight: 1,
        vector: vector()
      },
      {
        id: 101,
        name: 'beta',
        summary: 'Beta already has a summary.',
        catalog_ids: [1],
        catalog_titles: ['/docs/fallback.pdf'],
        chunk_ids: [11],
        adjacent_ids: [100],
        related_ids: [100],
        synonyms: ['b'],
        broader_terms: [''],
        narrower_terms: [''],
        weight: 1,
        vector: vector()
      }
    ]);

    await db.createTable('categories', [
      {
        id: 200,
        category: 'engineering',
        description: 'Concepts and practices related to engineering',
        summary: 'Concepts and practices related to engineering',
        parent_category_id: 0,
        aliases: [''],
        related_categories: [0],
        document_count: 1,
        chunk_count: 2,
        concept_count: 2,
        vector: vector()
      }
    ]);
  });

  afterEach(async () => {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  });

  const stubs = () => ({
    log: () => {},
    overviewGenerator: async (text: string) => `Overview of: ${text.slice(0, 16)}`,
    batchGenerator: async (names: string[]) =>
      new Map(names.map(n => [n.toLowerCase(), `Summary of ${n}.`]))
  });

  it('reports missing summaries without writing under dry run', async () => {
    const report = await backfillSummaries(db, { ...stubs(), dryRun: true });

    expect(report.dryRun).toBe(true);
    expect(report.results.map(r => [r.table, r.missing, r.written])).toEqual([
      ['catalog', 1, 0],
      ['concepts', 1, 0],
      ['categories', 1, 0]
    ]);

    const concepts = await (await db.openTable('concepts')).query().limit(10).toArray();
    expect(concepts.find((c: any) => c.name === 'alpha')?.summary).toBe('');
  });

  it('fills missing summaries across all three tables', async () => {
    const report = await backfillSummaries(db, stubs());

    expect(report.results.map(r => [r.table, r.written, r.failed])).toEqual([
      ['catalog', 1, 0],
      ['concepts', 1, 0],
      ['categories', 1, 0]
    ]);

    const catalog = await (await db.openTable('catalog')).query().limit(10).toArray();
    const repaired: any = catalog.find((r: any) => r.id === 2);
    // Overview regenerated from chunks, in page order, with enrichment rebuilt
    expect(repaired.summary).toBe(
      'Overview of: first page text\n\nKey Concepts: alpha, beta\nCategories: engineering'
    );

    const untouched: any = catalog.find((r: any) => r.id === 1);
    expect(untouched.summary).toContain('An existing overview');

    const concepts = await (await db.openTable('concepts')).query().limit(10).toArray();
    expect(concepts.find((c: any) => c.name === 'alpha')?.summary).toBe('Summary of alpha.');
    expect(concepts.find((c: any) => c.name === 'beta')?.summary).toBe('Beta already has a summary.');

    const categories = await (await db.openTable('categories')).query().limit(10).toArray();
    expect(categories[0].summary).toBe('Summary of engineering.');
  });

  it('preserves every other column and the table schema', async () => {
    const before = await (await db.openTable('concepts')).schema();

    await backfillSummaries(db, { ...stubs(), targets: ['concepts'] });

    // Re-open: LanceDB table handles are pinned to the version they were opened at
    const conceptsTable = await db.openTable('concepts');
    const after = await conceptsTable.schema();
    expect(after.fields.map((f: any) => `${f.name}:${f.type}`)).toEqual(
      before.fields.map((f: any) => `${f.name}:${f.type}`)
    );

    const rows = await conceptsTable.query().limit(10).toArray();
    expect(rows).toHaveLength(2);

    const alpha: any = rows.find((r: any) => r.name === 'alpha');
    expect(alpha.summary).toBe('Summary of alpha.');
    expect(Array.from(alpha.catalog_titles.toArray())).toEqual(['/docs/fallback.pdf']);
    expect(Array.from(alpha.adjacent_ids.toArray())).toEqual([101]);
    expect(Array.from(alpha.related_ids.toArray())).toEqual([101]);
    expect(Array.from(alpha.chunk_ids.toArray())).toEqual([10]);
    expect(Array.from(alpha.synonyms.toArray())).toEqual(['a']);
    expect(Array.from(alpha.vector.toArray())).toHaveLength(384);
    expect(alpha.weight).toBe(1);
  });

  it('refreshes the catalog vector, which embeds the summary text', async () => {
    const before: any = (await (await db.openTable('catalog')).query().limit(10).toArray()).find(
      (r: any) => r.id === 2
    );
    const beforeVector = Array.from(before.vector.toArray());

    await backfillSummaries(db, { ...stubs(), targets: ['catalog'] });

    const after: any = (await (await db.openTable('catalog')).query().limit(10).toArray()).find(
      (r: any) => r.id === 2
    );
    expect(Array.from(after.vector.toArray())).not.toEqual(beforeVector);
    // Untouched rows keep their original vector
    const untouched: any = (await (await db.openTable('catalog')).query().limit(10).toArray()).find(
      (r: any) => r.id === 1
    );
    expect(Array.from(untouched.vector.toArray())).toEqual(beforeVector);
  });

  it('regenerates everything under force', async () => {
    const report = await backfillSummaries(db, { ...stubs(), force: true, targets: ['concepts'] });

    expect(report.results[0].missing).toBe(2);
    expect(report.results[0].written).toBe(2);

    const rows = await (await db.openTable('concepts')).query().limit(10).toArray();
    expect(rows.find((c: any) => c.name === 'beta')?.summary).toBe('Summary of beta.');
  });

  it('caps work with maxItems', async () => {
    const report = await backfillSummaries(db, {
      ...stubs(),
      force: true,
      targets: ['concepts'],
      maxItems: 1
    });

    expect(report.results[0].written).toBe(1);
  });

  it('counts a document with no chunks as failed instead of throwing', async () => {
    await (await db.openTable('chunks')).delete('hash = "bbb"');

    const report = await backfillSummaries(db, { ...stubs(), targets: ['catalog'] });

    expect(report.results[0]).toMatchObject({ missing: 1, written: 0, failed: 1 });
  });

  it('skips tables that do not exist', async () => {
    const emptyDb = await lancedb.connect(path.join(tempDir, 'empty'));
    const report = await backfillSummaries(emptyDb, stubs());

    expect(report.results.every(r => r.skippedReason === 'table not found')).toBe(true);
  });

  it('records a failure when the generator returns nothing for a name', async () => {
    const report = await backfillSummaries(db, {
      ...stubs(),
      targets: ['concepts'],
      batchGenerator: async () => new Map()
    });

    expect(report.results[0]).toMatchObject({ missing: 1, generated: 0, written: 0, failed: 1 });
  });
});
