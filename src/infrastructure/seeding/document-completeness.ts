/**
 * Document Completeness Checking Utilities
 * 
 * Utilities for checking if documents in the database have complete
 * metadata, concepts, and chunks, and for cleaning up incomplete data.
 */

import * as lancedb from '@lancedb/lancedb';
import * as path from 'path';

/**
 * Result of checking document completeness in the database.
 */
export interface DataCompletenessCheck {
  hasRecord: boolean;
  hasSummary: boolean;
  hasConcepts: boolean;
  hasChunks: boolean;
  isComplete: boolean;
  missingComponents: string[];
}

/**
 * Check if a document has complete data in the database.
 * 
 * Checks for:
 * - Catalog record exists
 * - Summary is present (not just fallback text)
 * - Concepts were extracted
 * - Chunks exist and have concept metadata
 * 
 * @param catalogTable - LanceDB catalog table (or null if not open)
 * @param chunksTable - LanceDB chunks table (or null if not open)
 * @param hash - Document content hash
 * @param source - Source file path (for logging)
 * @param options - Optional configuration
 * @returns Completeness check result
 */
export async function checkDocumentCompleteness(
  catalogTable: lancedb.Table | null,
  chunksTable: lancedb.Table | null,
  hash: string,
  source: string,
  options: { debug?: boolean } = {}
): Promise<DataCompletenessCheck> {
  const debug = options.debug ?? process.env.DEBUG_OCR === 'true';
  
  const result: DataCompletenessCheck = {
    hasRecord: false,
    hasSummary: false,
    hasConcepts: false,
    hasChunks: false,
    isComplete: false,
    missingComponents: []
  };

  try {
    // Check catalog record exists and has valid data
    if (catalogTable) {
      const query = catalogTable.query().where(`hash="${hash}"`).limit(1);
      const results = await query.toArray();

      if (results.length > 0) {
        result.hasRecord = true;
        const record = results[0];

        // Check if summary is present and not just a fallback
        const pageContent = record.text || '';
        const isFallbackSummary =
          pageContent.startsWith('Document overview (') ||
          pageContent.trim().length < 10 ||
          pageContent.includes('LLM summarization failed');

        result.hasSummary = !isFallbackSummary;

        // Check if concepts were successfully extracted
        if (record.concepts) {
          try {
            const concepts = typeof record.concepts === 'string'
              ? JSON.parse(record.concepts)
              : record.concepts;
            result.hasConcepts =
              concepts &&
              concepts.primary_concepts &&
              concepts.primary_concepts.length > 0;
          } catch {
            result.hasConcepts = false;
          }
        } else {
          result.hasConcepts = false;
        }

        if (debug) {
          console.log(`🔍 Hash ${hash.slice(0, 8)}...: record=${result.hasRecord}, summary=${result.hasSummary}, concepts=${result.hasConcepts}`);
        }
      }
    }

    // Check if chunks exist for this document AND have concept metadata
    if (chunksTable && result.hasRecord) {
      try {
        const chunksQuery = chunksTable.query().where(`hash="${hash}"`).limit(10);
        const chunksResults = await chunksQuery.toArray();
        result.hasChunks = chunksResults.length > 0;

        // Also check if chunks have concept metadata
        if (result.hasChunks) {
          let chunksWithConcepts = 0;
          for (const chunk of chunksResults) {
            try {
              const concepts = chunk.concepts ? JSON.parse(chunk.concepts) : [];
              if (Array.isArray(concepts) && concepts.length > 0) {
                chunksWithConcepts++;
              }
            } catch {
              // Invalid concept data
            }
          }

          // If less than half of sampled chunks have concepts, mark as incomplete
          if (chunksWithConcepts < chunksResults.length / 2) {
            result.missingComponents.push('chunk_concepts');
            if (debug) {
              console.log(`🔍 Hash ${hash.slice(0, 8)}... chunks lack concept metadata (${chunksWithConcepts}/${chunksResults.length} enriched)`);
            }
          }
        }

        if (debug) {
          console.log(`🔍 Hash ${hash.slice(0, 8)}... chunks: ${result.hasChunks}`);
        }
      } catch {
        // Chunks table might not exist yet
        result.hasChunks = false;
      }
    }

    // Determine what's missing
    if (!result.hasRecord) {
      result.missingComponents.push('catalog');
    }
    if (!result.hasSummary) {
      result.missingComponents.push('summary');
    }
    if (!result.hasConcepts) {
      result.missingComponents.push('concepts');
    }
    if (!result.hasChunks) {
      result.missingComponents.push('chunks');
    }

    result.isComplete = result.hasRecord && result.hasSummary && result.hasConcepts && result.hasChunks;

    return result;
  } catch (error: any) {
    console.warn(`⚠️ Error checking document completeness for hash ${hash.slice(0, 8)}...: ${error.message}`);
    return result;
  }
}

/**
 * Check if a catalog record exists for a given hash.
 * 
 * @param catalogTable - LanceDB catalog table
 * @param hash - Document content hash
 * @param options - Optional configuration
 * @returns True if record exists
 */
export async function catalogRecordExists(
  catalogTable: lancedb.Table,
  hash: string,
  options: { debug?: boolean } = {}
): Promise<boolean> {
  const debug = options.debug ?? process.env.DEBUG_OCR === 'true';
  
  try {
    const query = catalogTable.query().where(`hash="${hash}"`).limit(1);
    const results = await query.toArray();
    const exists = results.length > 0;

    if (debug && exists) {
      const record = results[0];
      console.log(`🔍 Hash ${hash.slice(0, 8)}... found in DB: OCR=${record.ocr_processed || false}, source=${path.basename(record.source || '')}`);
    }

    return exists;
  } catch (error: any) {
    console.warn(`⚠️ Error checking catalog record for hash ${hash.slice(0, 8)}...: ${error.message}`);
    return false;
  }
}

/**
 * Delete incomplete document data from the database.
 * 
 * Selective deletion based on what's missing:
 * - Deletes catalog entry if summary or concepts are missing
 * - Deletes chunks if chunks are missing (but not if only chunk_concepts missing)
 * 
 * @param catalogTable - LanceDB catalog table (or null)
 * @param chunksTable - LanceDB chunks table (or null)
 * @param hash - Document content hash
 * @param source - Source file path (for logging)
 * @param missingComponents - List of missing components
 */
export async function deleteIncompleteDocumentData(
  catalogTable: lancedb.Table | null,
  chunksTable: lancedb.Table | null,
  hash: string,
  source: string,
  missingComponents: string[]
): Promise<void> {
  try {
    // Only delete catalog if summary or concepts are missing
    if (catalogTable && (missingComponents.includes('summary') || missingComponents.includes('concepts'))) {
      try {
        await catalogTable.delete(`hash="${hash}"`);
        console.log(`  🗑️  Deleted incomplete catalog entry for ${path.basename(source)}`);
      } catch {
        // Might fail if no matching records, that's okay
      }
    }

    // Only delete chunks if chunks are actually missing or corrupted
    // NEVER delete chunks if only concept metadata is missing - we'll re-enrich them in-place
    if (chunksTable && missingComponents.includes('chunks') && !missingComponents.includes('chunk_concepts')) {
      try {
        await chunksTable.delete(`hash="${hash}"`);
        console.log(`  🗑️  Deleted incomplete chunks for ${path.basename(source)}`);
      } catch {
        // Might fail if no matching records, that's okay
      }
    } else if (missingComponents.includes('chunk_concepts')) {
      console.log(`  🔄 Preserving chunks for ${path.basename(source)} (will re-enrich with concept metadata)`);
    } else if (!missingComponents.includes('chunks')) {
      console.log(`  ✅ Preserving existing chunks for ${path.basename(source)} (${missingComponents.join(', ')} will be regenerated)`);
    }
  } catch (error: any) {
    console.warn(`⚠️ Error deleting incomplete data for ${path.basename(source)}: ${error.message}`);
  }
}


