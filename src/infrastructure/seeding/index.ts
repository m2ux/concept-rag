/**
 * Document Seeding Infrastructure Module
 * 
 * Utilities for document seeding, completeness checking, and file discovery.
 */

export {
  checkDocumentCompleteness,
  catalogRecordExists,
  deleteIncompleteDocumentData,
  type DataCompletenessCheck
} from './document-completeness.js';

export {
  findDocumentFilesRecursively,
  isDirectory,
  getPathSize,
  formatFileSize,
  getDatabaseSize,
  DEFAULT_DOCUMENT_EXTENSIONS
} from './file-discovery.js';

export {
  truncateFilePath,
  formatHashDisplay
} from './string-utils.js';

export {
  backfillSummaries,
  parseSummaryTargets,
  splitCatalogSummary,
  buildCatalogSummary,
  assembleDocumentText,
  isMissingCatalogSummary,
  isMissingConceptSummary,
  isMissingCategorySummary,
  SUMMARY_TARGETS,
  type SummaryTarget,
  type SummaryBackfillOptions,
  type SummaryBackfillReport,
  type TableBackfillResult,
  type SummaryProgress
} from './summary-backfill.js';
