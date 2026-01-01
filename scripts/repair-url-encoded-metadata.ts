/**
 * Repair URL-Encoded Metadata Script
 *
 * Fixes catalog entries where URL-encoded filenames caused metadata to be
 * incorrectly parsed or merged into wrong fields.
 *
 * Common issues this script fixes:
 * - Title contains encoded characters like "3A" instead of ":"
 * - Author field contains publisher name (e.g., "Author; Publisher")
 * - Publisher field contains ISBN instead of publisher name
 * - Year field empty when it's available in the decoded filename
 * - Title starts with metadata prefixes like "(ebook)", "[paper]", etc.
 * - Title has embedded metadata in brackets like "[IEEE][1997]"
 *
 * Usage:
 *   npx tsx scripts/repair-url-encoded-metadata.ts --dbpath ~/.concept_rag --dry-run
 *   npx tsx scripts/repair-url-encoded-metadata.ts --dbpath ~/.concept_rag
 */

import * as lancedb from "@lancedb/lancedb";
import { parseFilenameMetadata, decodeUrlEncoding } from "../src/infrastructure/utils/filename-metadata-parser.js";

interface RepairOptions {
  dbpath: string;
  dryRun: boolean;
  verbose: boolean;
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

interface RepairResult {
  documentId: number;
  source: string;
  changes: {
    field: string;
    oldValue: string | number;
    newValue: string | number;
  }[];
}

function parseArgs(): RepairOptions {
  const args = process.argv.slice(2);
  const options: RepairOptions = {
    dbpath: "./db/test",
    dryRun: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dbpath" && args[i + 1]) {
      options.dbpath = args[i + 1];
      i++;
    } else if (args[i] === "--dry-run") {
      options.dryRun = true;
    } else if (args[i] === "--verbose" || args[i] === "-v") {
      options.verbose = true;
    }
  }

  return options;
}

/**
 * Detect if a string contains URL-encoded patterns.
 * Matches patterns like _20, _3A, _2C, etc.
 */
function hasUrlEncodedPatterns(text: string): boolean {
  // Match _XX where XX is a hex pair
  return /_[0-9A-Fa-f]{2}/.test(text);
}

/**
 * Check if a value looks like an ISBN (10 or 13 digits).
 */
function looksLikeIsbn(value: string): boolean {
  if (!value) return false;
  const cleaned = value.replace(/[-\s]/g, '');
  return /^\d{10}(\d{3})?$/.test(cleaned);
}

/**
 * Metadata extracted from title prefixes like "(ebook - pdf)" or "[paper][IEEE][1997]"
 */
interface ExtractedTitleMetadata {
  cleanTitle: string;
  year?: number;
  publisher?: string;
  format?: string;  // pdf, epub, etc.
  notes: string[];  // Other extracted info
}

/**
 * Known publisher names that might appear in title brackets or as prefixes
 */
const KNOWN_PUBLISHERS = [
  'Addison Wesley', 'Addison-Wesley', 'O\'Reilly', 'Prentice Hall', 'Wiley',
  'Springer', 'Packt', 'Manning', 'Pragmatic', 'Apress', 'CMP', 'Sams',
  'Microsoft Press', 'IEEE', 'ACM', 'Cambridge', 'Oxford', 'MIT Press',
  'McGraw-Hill', 'McGraw Hill', 'Pearson', 'Newnes', 'Elsevier',
  'Cmp Books', 'Cmp'
];

/**
 * Extract metadata from title prefixes and clean up the title.
 * 
 * Handles patterns like:
 * - "(ebook - pdf) UML Tutorial" → "UML Tutorial"
 * - "(Ebook - Uml) Addison Wesley - Writing..." → "Writing..." + publisher
 * - "[paper][UML][IEEE][1997]Executable..." → "Executable..." + year + publisher
 * - "[Ebook][Management] Handbook..." → "Handbook..."
 */
function extractTitleMetadata(title: string): ExtractedTitleMetadata {
  const result: ExtractedTitleMetadata = {
    cleanTitle: title,
    notes: [],
  };

  if (!title) return result;

  let working = title;

  // Pattern 1: Leading parentheses with ebook/pdf/format info
  // e.g., "(ebook - PDF - UML) UML Tutorial"
  // e.g., "(ebook pdf) - PMP - Fundamentals"
  const parenPrefixMatch = working.match(/^\(([^)]+)\)\s*[-–—]?\s*/i);
  if (parenPrefixMatch) {
    const prefix = parenPrefixMatch[1].toLowerCase();
    
    // Check if it's a metadata prefix (contains ebook, pdf, paper, etc.)
    if (/ebook|e-book|pdf|epub|paper|doc|book/i.test(prefix)) {
      working = working.slice(parenPrefixMatch[0].length);
      result.notes.push(`Removed prefix: (${parenPrefixMatch[1]})`);
      
      // Extract format if present
      const formatMatch = prefix.match(/\b(pdf|epub|mobi|doc|docx)\b/i);
      if (formatMatch) {
        result.format = formatMatch[1].toLowerCase();
      }
    }
  }

  // Pattern 2: Leading square brackets with metadata
  // e.g., "[ebook] (Software Engineering) The UML..."
  // e.g., "[paper][UML][IEEE][1997]Executable..."
  // e.g., "[Ebook][Management] Handbook..."
  let bracketMatch;
  while ((bracketMatch = working.match(/^\[([^\]]+)\]\s*/)) !== null) {
    const content = bracketMatch[1];
    working = working.slice(bracketMatch[0].length);
    
    // Check for year (4 digits)
    const yearMatch = content.match(/^(19|20)\d{2}$/);
    if (yearMatch && !result.year) {
      result.year = parseInt(content, 10);
      result.notes.push(`Extracted year from bracket: ${content}`);
      continue;
    }

    // Check for known publisher
    const publisherMatch = KNOWN_PUBLISHERS.find(
      pub => content.toLowerCase().includes(pub.toLowerCase())
    );
    if (publisherMatch && !result.publisher) {
      result.publisher = publisherMatch;
      result.notes.push(`Extracted publisher from bracket: ${content}`);
      continue;
    }

    // Skip common noise words
    if (/^(ebook|e-book|paper|book|pdf|epub|doc|management|software|programming|uml)/i.test(content)) {
      result.notes.push(`Removed bracket: [${content}]`);
      continue;
    }

    // Keep author-like content for notes
    if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(content)) {
      result.notes.push(`Possible author in bracket: ${content}`);
    }
  }

  // Pattern 3: Additional parentheses after brackets
  // e.g., "(Software Engineering) The UML..."
  const secondParenMatch = working.match(/^\(([^)]+)\)\s*/);
  if (secondParenMatch) {
    const content = secondParenMatch[1];
    // If it looks like a category/subject, remove it
    if (/engineering|science|programming|management|design/i.test(content)) {
      working = working.slice(secondParenMatch[0].length);
      result.notes.push(`Removed category: (${content})`);
    }
  }

  // Pattern 4: "Cmp Books -" or "Cmp -" prefix (handle first, more specific)
  // e.g., "Cmp Books - Embedded Systems Design" → "Embedded Systems Design" + publisher: CMP
  // e.g., "Cmp Real-Time Concepts For Embedded Systems" → "Real-Time Concepts..." + publisher: CMP
  const cmpBooksMatch = working.match(/^Cmp\s+Books?\s*[-–—]\s*/i);
  if (cmpBooksMatch) {
    working = working.slice(cmpBooksMatch[0].length);
    if (!result.publisher) {
      result.publisher = 'CMP';
      result.notes.push('Extracted publisher from prefix: Cmp Books');
    }
  } else {
    // Pattern 5: "Cmp" alone at start (without dash)
    const cmpMatch = working.match(/^Cmp\s+/i);
    if (cmpMatch) {
      working = working.slice(cmpMatch[0].length);
      if (!result.publisher) {
        result.publisher = 'CMP';
        result.notes.push('Removed Cmp prefix');
      }
    }
  }
  
  // Pattern 6: Other publisher names at start followed by dash
  // e.g., "Addison Wesley - The UML User Guide" → "The UML User Guide" + publisher
  for (const publisher of KNOWN_PUBLISHERS) {
    // Skip CMP variants - already handled above
    if (publisher.toLowerCase().startsWith('cmp')) continue;
    
    const pubPattern = new RegExp(`^${publisher.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[-–—]\\s*`, 'i');
    const pubMatch = working.match(pubPattern);
    if (pubMatch) {
      working = working.slice(pubMatch[0].length);
      if (!result.publisher) {
        result.publisher = publisher;
        result.notes.push(`Extracted publisher from prefix: ${publisher}`);
      }
      break;
    }
  }

  // Clean up any remaining leading dashes or whitespace
  working = working.replace(/^[-–—\s]+/, '').trim();

  result.cleanTitle = working || title; // Fallback to original if nothing left

  return result;
}

/**
 * Check if a title has embedded metadata prefixes that should be cleaned.
 */
function titleHasEmbeddedMetadata(title: string): boolean {
  if (!title) return false;
  
  // Check for common patterns
  return (
    /^\s*\(ebook/i.test(title) ||
    /^\s*\(e-book/i.test(title) ||
    /^\s*\[ebook/i.test(title) ||
    /^\s*\[paper/i.test(title) ||
    /^\s*\[book/i.test(title) ||
    /^\s*\(book/i.test(title) ||
    /^\s*\[[A-Za-z]+\]\[/i.test(title) ||  // Multiple brackets
    /^\s*\(ebook[^)]*\)/i.test(title) ||
    /^\s*Cmp\s+/i.test(title) ||           // CMP publisher prefix
    /^\s*Cmp\s*Books?\s*[-–—]/i.test(title)  // "Cmp Books -" prefix
  );
}

/**
 * Check if a title contains unresolved URL encoding artifacts.
 * E.g., "Data Science 3A The Hard Parts" should be "Data Science: The Hard Parts"
 */
function titleHasEncodingArtifacts(title: string): boolean {
  // Common patterns that indicate incomplete URL decoding
  // _3A or 3A surrounded by spaces often means a colon was encoded
  // _2C or 2C at word boundaries often means a comma was encoded
  return /\s+[23][0-9A-Fa-f]\s+/.test(title) || 
         /\s+[23][0-9A-Fa-f]$/.test(title) ||
         /^[23][0-9A-Fa-f]\s+/.test(title);
}

/**
 * Detect if author field might contain a publisher name.
 * Common indicators: ends with known publisher patterns, contains semicolon followed by publisher-like name.
 */
function authorMayContainPublisher(author: string): boolean {
  if (!author) return false;
  
  // Known publisher name patterns that might appear in author field
  const publisherPatterns = [
    /;.*(?:Verlag|Press|Publishing|Publisher|Media|Books|University|Academic|Springer|Wiley|Pearson|O'Reilly|Packt|Manning|Apress|Addison|McGraw|Cambridge|Oxford|MIT|IEEE|ACM)$/i,
    /;.*(?:häuser|hauser)$/i,  // Birkhäuser, etc.
    /;.*(?:Inc\.|Ltd\.|LLC|GmbH)$/i,
  ];
  
  return publisherPatterns.some(pattern => pattern.test(author));
}

/**
 * Extract publisher from author field if it was incorrectly merged.
 */
function extractPublisherFromAuthor(author: string): { cleanAuthor: string; publisher: string } | null {
  if (!author) return null;
  
  // Split by semicolon and check if last part looks like a publisher
  const parts = author.split(';').map(p => p.trim());
  if (parts.length < 2) return null;
  
  const lastPart = parts[parts.length - 1];
  
  // Publisher indicators
  const publisherIndicators = [
    /Verlag|Press|Publishing|Publisher|Media|Books|University|Academic/i,
    /Springer|Wiley|Pearson|O'Reilly|Packt|Manning|Apress|Addison|McGraw/i,
    /Cambridge|Oxford|MIT|IEEE|ACM/i,
    /häuser|hauser/i,
    /Inc\.|Ltd\.|LLC|GmbH/i,
  ];
  
  if (publisherIndicators.some(pattern => pattern.test(lastPart))) {
    return {
      cleanAuthor: parts.slice(0, -1).join('; '),
      publisher: lastPart,
    };
  }
  
  return null;
}

async function findAndRepairDocuments(options: RepairOptions): Promise<RepairResult[]> {
  const db = await lancedb.connect(options.dbpath);
  const catalog = await db.openTable("catalog");

  const allDocs: CatalogRecord[] = await catalog.query().limit(100000).toArray();

  const results: RepairResult[] = [];

  for (const doc of allDocs) {
    const changes: RepairResult["changes"] = [];
    
    // Check for URL-encoded source path
    const hasUrlEncoding = doc.source && hasUrlEncodedPatterns(doc.source);
    
    // Check for embedded metadata in title
    const hasEmbeddedMeta = doc.title && titleHasEmbeddedMetadata(doc.title);
    
    // Skip if neither issue is present
    if (!hasUrlEncoding && !hasEmbeddedMeta) {
      continue;
    }

    // Re-parse the filename with proper URL decoding (if source exists)
    const parsed = doc.source ? parseFilenameMetadata(doc.source) : null;

    // === TITLE REPAIRS ===
    
    // Repair 1: Clean embedded metadata from title (ebook, brackets, etc.)
    if (hasEmbeddedMeta && doc.title) {
      const extracted = extractTitleMetadata(doc.title);
      
      if (extracted.cleanTitle !== doc.title && extracted.cleanTitle.length > 3) {
        changes.push({
          field: "title",
          oldValue: doc.title,
          newValue: extracted.cleanTitle,
        });
        
        // Also extract year if found and currently missing
        if (extracted.year && (!doc.year || doc.year === 0)) {
          changes.push({
            field: "year",
            oldValue: doc.year || 0,
            newValue: extracted.year,
          });
        }
        
        // Also extract publisher if found and currently missing
        if (extracted.publisher && (!doc.publisher || doc.publisher.trim() === "")) {
          changes.push({
            field: "publisher",
            oldValue: doc.publisher || "",
            newValue: extracted.publisher,
          });
        }
        
        if (options.verbose && extracted.notes.length > 0) {
          console.log(`   Notes: ${extracted.notes.join('; ')}`);
        }
      }
    }
    // Repair 2: Fix URL encoding artifacts in title
    else if (hasUrlEncoding && doc.title && parsed && parsed.title && doc.title !== parsed.title) {
      const currentHasArtifacts = titleHasEncodingArtifacts(doc.title);
      const newIsBetter = !titleHasEncodingArtifacts(parsed.title) && parsed.title.length > 5;
      
      if (currentHasArtifacts && newIsBetter) {
        changes.push({
          field: "title",
          oldValue: doc.title,
          newValue: parsed.title,
        });
      }
    }

    // === AUTHOR REPAIRS ===
    
    // Author - check if current author contains publisher that should be separated
    if (doc.author && authorMayContainPublisher(doc.author)) {
      const extracted = extractPublisherFromAuthor(doc.author);
      if (extracted) {
        changes.push({
          field: "author",
          oldValue: doc.author,
          newValue: extracted.cleanAuthor,
        });
        
        // Also update publisher if it's empty or contains an ISBN
        if (!doc.publisher || looksLikeIsbn(doc.publisher)) {
          changes.push({
            field: "publisher",
            oldValue: doc.publisher || "",
            newValue: extracted.publisher,
          });
        }
      }
    } else if (parsed && parsed.author && doc.author !== parsed.author) {
      // Author from re-parsed filename is different and looks better
      const parsedIsComplete = parsed.author.length > 3 && !looksLikeIsbn(parsed.author);
      const currentIsEmpty = !doc.author || doc.author.trim() === "";
      
      if (currentIsEmpty && parsedIsComplete) {
        changes.push({
          field: "author",
          oldValue: doc.author || "",
          newValue: parsed.author,
        });
      }
    }

    // === PUBLISHER/ISBN REPAIRS ===
    
    // Publisher - fix if current publisher is actually an ISBN
    if (doc.publisher && looksLikeIsbn(doc.publisher)) {
      // Current publisher field has an ISBN - it should be in isbn field
      if (!doc.isbn || doc.isbn.trim() === "") {
        changes.push({
          field: "isbn",
          oldValue: doc.isbn || "",
          newValue: doc.publisher,
        });
      }
      
      // Try to get real publisher from re-parsed filename
      if (parsed && parsed.publisher && !looksLikeIsbn(parsed.publisher)) {
        changes.push({
          field: "publisher",
          oldValue: doc.publisher,
          newValue: parsed.publisher,
        });
      } else {
        // Clear the invalid publisher
        changes.push({
          field: "publisher",
          oldValue: doc.publisher,
          newValue: "",
        });
      }
    }

    // Year - update if missing and available from re-parsed filename
    if (parsed && (!doc.year || doc.year === 0) && parsed.year > 0) {
      changes.push({
        field: "year",
        oldValue: doc.year || 0,
        newValue: parsed.year,
      });
    }

    // ISBN - if we have a valid ISBN from parsing and current is empty
    if (parsed && parsed.isbn && (!doc.isbn || doc.isbn.trim() === "")) {
      changes.push({
        field: "isbn",
        oldValue: doc.isbn || "",
        newValue: parsed.isbn,
      });
    }

    if (changes.length > 0) {
      results.push({
        documentId: doc.id,
        source: doc.source || "",
        changes,
      });

      if (options.verbose) {
        console.log(`\n📄 ${doc.title?.substring(0, 50) || doc.source?.split("/").pop() || "Unknown"}`);
        console.log(`   Source: ${doc.source?.split("/").pop()?.substring(0, 60) || "N/A"}...`);
        for (const change of changes) {
          const oldVal = change.oldValue === "" || change.oldValue === 0 ? "(empty)" : 
                         typeof change.oldValue === 'string' ? `"${change.oldValue.substring(0, 40)}${change.oldValue.length > 40 ? '...' : ''}"` : change.oldValue;
          const newVal = change.newValue === "" ? "(empty)" :
                         typeof change.newValue === 'string' ? `"${change.newValue.substring(0, 40)}${change.newValue.length > 40 ? '...' : ''}"` : change.newValue;
          console.log(`   ${change.field}: ${oldVal} → ${newVal}`);
        }
      }
    }
  }

  return results;
}

async function applyRepairs(dbpath: string, results: RepairResult[]): Promise<number> {
  const db = await lancedb.connect(dbpath);
  const catalog = await db.openTable("catalog");

  let repairedCount = 0;

  for (const result of results) {
    try {
      const values: Record<string, string | number> = {};
      for (const change of result.changes) {
        values[change.field] = change.newValue;
      }

      await catalog.update({
        where: `id = ${result.documentId}`,
        values,
      });

      repairedCount++;
    } catch (e: any) {
      console.error(`  ❌ Failed to repair document ${result.documentId}: ${e.message}`);
    }
  }

  return repairedCount;
}

function printSummary(results: RepairResult[], dryRun: boolean): void {
  if (results.length === 0) {
    console.log("\n✅ No documents need URL-encoding repairs");
    return;
  }

  const action = dryRun ? "Would repair" : "Repairing";
  console.log(`\n${action} ${results.length} documents:\n`);

  // Count changes by field
  const fieldCounts: Record<string, number> = {};
  for (const result of results) {
    for (const change of result.changes) {
      fieldCounts[change.field] = (fieldCounts[change.field] || 0) + 1;
    }
  }

  console.log("Changes by field:");
  for (const [field, count] of Object.entries(fieldCounts).sort()) {
    console.log(`  ${field}: ${count} repairs`);
  }

  // Show sample repairs if not verbose
  console.log("\nSample repairs:");
  for (const result of results.slice(0, 5)) {
    const title = result.source.split("/").pop()?.substring(0, 50) || "Unknown";
    console.log(`  📄 ${title}`);
    for (const change of result.changes) {
      const oldVal = change.oldValue === "" || change.oldValue === 0 ? "(empty)" : 
                     typeof change.oldValue === 'string' && change.oldValue.length > 30 ? 
                       `"${change.oldValue.substring(0, 30)}..."` : `"${change.oldValue}"`;
      const newVal = change.newValue === "" ? "(empty)" :
                     typeof change.newValue === 'string' && change.newValue.length > 30 ? 
                       `"${change.newValue.substring(0, 30)}..."` : `"${change.newValue}"`;
      console.log(`     ${change.field}: ${oldVal} → ${newVal}`);
    }
  }

  if (results.length > 5) {
    console.log(`  ... and ${results.length - 5} more documents`);
  }
}

async function main(): Promise<void> {
  const options = parseArgs();

  console.log("=== URL-Encoded Metadata Repair ===");
  console.log(`Database: ${options.dbpath}`);
  console.log(`Mode: ${options.dryRun ? "DRY RUN" : "LIVE"}`);
  console.log("");

  try {
    console.log("Scanning for documents with URL-encoded metadata issues...");
    const results = await findAndRepairDocuments(options);

    printSummary(results, options.dryRun);

    if (!options.dryRun && results.length > 0) {
      console.log("\n🔄 Applying repairs...");
      const repairedCount = await applyRepairs(options.dbpath, results);
      console.log(`✅ Repaired ${repairedCount}/${results.length} documents`);
    }

    if (options.dryRun && results.length > 0) {
      console.log("\n💡 Run without --dry-run to apply these repairs");
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

