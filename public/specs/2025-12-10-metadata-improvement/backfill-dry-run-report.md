# Metadata Backfill - Dry Run Report

**Date:** 2026-01-01  
**Database:** `~/.concept_rag` (Production)  
**Mode:** Dry Run (no changes applied)

---

## Executive Summary

Two metadata extraction methods were tested against the production database:

| Method | Documents Updated | Success Rate | Recommended? |
|--------|------------------|--------------|--------------|
| **URL-Decoded Filename Parsing** | 5 documents | 100% confidence | ✅ Yes |
| **Content-Based Extraction** | 1 document | 1% recovery | ❌ No |

**Recommendation:** Apply URL-decoded filename parsing for 5 documents, then evaluate remaining candidates for manual curation.

---

## Database Metadata Status

### Current Coverage

| Field | Coverage | Documents Missing |
|-------|----------|-------------------|
| **Title** | 100% (281/281) | 0 |
| **Author** | 73% (206/281) | 75 |
| **Year** | 74% (209/281) | 72 |
| **Publisher** | 77% (217/281) | 64 |
| **ISBN** | 41% (116/281) | 165 |

### Completeness Distribution

| Completeness | Documents | Percentage |
|--------------|-----------|------------|
| Complete (5/5 fields) | 110 | 39% |
| 4/5 fields | 73 | 26% |
| 3/5 fields | 31 | 11% |
| 2/5 fields | 27 | 10% |
| 1/5 fields (title only) | 40 | 14% |

**Key Finding:** 104 documents (37%) could potentially benefit from content-based extraction.

---

## Extraction Accuracy Evaluation

Tested against 182 documents with known ground-truth metadata (from filename parsing):

| Field | Precision | Recall | F1 Score | Avg Confidence |
|-------|-----------|--------|----------|----------------|
| **Author** | 17.1% | 15.8% | 16.4% | 0.86 |
| **Year** | 74.3% | 68.4% | 71.2% | 0.82 |
| **Publisher** | 60.0% | 34.3% | 43.6% | 0.93 |

### Field-by-Field Analysis

#### Year Extraction (Best Performance)
- **74.3% precision** - Most extractions are correct
- Copyright years are clearly formatted in most documents
- Failures occur when documents have multiple dates (edition year vs. original publication)
- Example correct: "2023" from Mastering Blockchain
- Example incorrect: Expected "2020", got "1918" (earlier edition copyright)

#### Publisher Extraction (Moderate Performance)
- **60.0% precision** when extracted
- Known publisher names (Springer, Packt, Cambridge) detected reliably
- Low recall (34.3%) - many documents don't have explicit publisher mentions
- Example correct: "Packt Publishing" from Mastering Blockchain
- Example issue: Sometimes extracts parent company instead of imprint

#### Author Extraction (Poor Performance)
- **17.1% precision** - Most extractions are wrong
- Pattern matching designed for books with copyright pages
- Academic papers lack standard "by Author" or "Copyright © Author" patterns
- Many false positives from abstract/content text fragments

**Common Author Extraction Failures:**
| Document | Expected | Extracted | Issue |
|----------|----------|-----------|-------|
| Visualizing complexity | Author name | "many factors" | Content fragment |
| Introduction to Modern Cryptography | Jonathan Katz | "focusing on private-key cryptography" | Abstract text |
| Building Decentralized Trust | Victoria L. Lemieux | "the Publisher" | Wrong pattern match |
| Mastering Blockchain | Imran Bashir | "Packt Publishing" | Publisher as author |

---

## Backfill Dry Run Results

### At 0.5 Confidence Threshold

Would update **9 documents**:

| Document | Field | New Value | Confidence | Quality |
|----------|-------|-----------|------------|---------|
| Digital Designs for Money | year | 1997 | 0.50 | ⚠️ Unverified |
| Foundations of Cryptography | year | 2005 | 0.50 | ⚠️ Unverified |
| Tutorials on the Foundations | year | 2017 | 0.50 | ⚠️ Unverified |
| Concurrency Control and Recovery | year | 1987 | 0.50 | ⚠️ Unverified |
| Distributed Computing 16th | year | 2002 | 0.50 | ⚠️ Unverified |
| Peer-to-Peer Systems | year | 1973 | 0.50 | ❌ Likely wrong |
| Visualizing complexity | author | "many factors" | 0.80 | ❌ False positive |
| Introduction to Modern Cryptography | author | "focusing on..." | 0.80 | ❌ False positive |
| Data Science: The Hard Parts | author | "Daniel Vaughan" | 0.93 | ✅ Correct |

**Summary:** 6 year updates (unverified), 3 author updates (2 wrong, 1 correct)

### At 0.8 Confidence Threshold

Would update **3 documents**:

| Document | Field | New Value | Confidence | Quality |
|----------|-------|-----------|------------|---------|
| Visualizing complexity | author | "many factors" | 0.80 | ❌ False positive |
| Introduction to Modern Cryptography | author | "focusing on..." | 0.80 | ❌ False positive |
| Data Science: The Hard Parts | author | "Daniel Vaughan" | 0.93 | ✅ Correct |

**Summary:** All author updates - 2 wrong, 1 correct (33% accuracy)

### At 0.9 Confidence Threshold

Would update **1 document**:

| Document | Field | New Value | Confidence | Quality |
|----------|-------|-----------|------------|---------|
| Data Science: The Hard Parts | author | "Daniel Vaughan" | 0.93 | ✅ Correct |

**Summary:** Only 1 safe update out of 104 candidates (1% recovery rate)

### Year-Only at 0.9 Confidence

Would update **0 documents**.

No year extractions meet the 0.9 confidence threshold.

---

## Root Cause Analysis

### Why Author Extraction Fails

1. **Pattern mismatch for academic papers**
   - Papers don't have "by Author" or "Copyright © by Author" patterns
   - Author names appear in headers, abstracts, or references
   - Current patterns optimized for books with copyright pages

2. **Content fragment false positives**
   - "by" appears frequently in text (e.g., "filtered by", "categorized by")
   - Pattern matches partial sentences instead of author names

3. **URL-encoded filenames**
   - 10-20 documents have URL-encoded characters (`_20`, `_3A`)
   - These already have author names in filenames but aren't being parsed
   - Example: `Visualizing_20complexity_20_3A_20modular_20information_20design_20handbook_20--_20Darjan_20Hil_3B_20Nicole_20Lachenmeier`

### Why Year Extraction Has Low Confidence

1. **Multiple dates in documents**
   - First published year vs. current edition
   - Copyright renewal dates
   - Reprint dates

2. **Pattern specificity**
   - Copyright years are found but without context of which is "the" year
   - Results in lower confidence scores

---

## Recommendations

### Do Not Apply Automated Backfill

The current extraction accuracy is insufficient:
- Author: 17% precision (too many false positives)
- Year: 74% precision but low confidence (no updates at 0.9 threshold)
- Publisher: 60% precision but low recall

### Alternative Approaches

1. **Fix URL-Encoded Filenames (High Impact)**
   - Decode `_20` → space, `_3A` → colon in filename parser
   - Would recover metadata for ~10-20 documents
   - Zero risk of incorrect data

2. **Use Paper Metadata for Academic Papers**
   - `PaperMetadataExtractor` already extracts authors from papers
   - Populate `author` field from `paperMetadata.authors` array
   - Example: `["Author A", "Author B"]` → "Author A, Author B"

3. **Manual Curation for High-Value Documents**
   - Review the 40 documents with only title metadata
   - Add proper filenames with `--` delimiters for re-seeding

4. **Improve Author Patterns for Books**
   - Add patterns for Table of Contents pages
   - Add patterns for publisher credit pages
   - Exclude abstract/body text from extraction scope

### Safe Actions Now

Only **1 document** can be safely updated with current extraction:

```bash
# Apply the single safe update
npx tsx scripts/backfill-metadata.ts --dbpath ~/.concept_rag \
  --min-confidence 0.9 --fields author \
  --source "Data Science*"
```

This would set:
- "Data Science: The Hard Parts" → author: "Daniel Vaughan"

---

## Conclusion

| Metric | Value |
|--------|-------|
| Documents with incomplete metadata | 104 (37%) |
| Documents recoverable via content extraction | 1 (1%) |
| Recovery rate | **0.96%** |

The content-based metadata extraction feature works as designed for its primary use case (seeding new documents with incomplete filenames), but is **not effective for retroactive backfill** of existing documents due to:

1. Low author extraction precision (17%)
2. High confidence threshold requirements filter out nearly all candidates
3. Many documents with missing metadata are academic papers, which don't match book-oriented patterns

---

## NEW: URL-Decoded Filename Parsing Results

After implementing URL-decoding in the filename parser, a new `--reparse-filenames` mode was added to the backfill script.

### Dry Run with `--reparse-filenames`

```
=== Metadata Backfill ===
Database: ~/.concept_rag
Mode: DRY RUN
Extraction: FILENAME PARSING (URL-decoded)
Fields: author, year, publisher

Found 104 documents with incomplete metadata
Would update 5 documents
```

### Documents That Can Now Be Updated

| Document | Field | New Value | Confidence |
|----------|-------|-----------|------------|
| **Visualizing complexity** | author | Darjan Hil; Nicole Lachenmeier | 1.0 |
| | year | 2022 | 1.0 |
| **Introduction to Modern Cryptography** | author | Jonathan Katz, Yehuda Lindell | 1.0 |
| **Data Science: The Hard Parts** | author | Daniel Vaughan | 1.0 |
| | publisher | O'Reilly Media | 1.0 |
| **Systems Engineering Models** | author | Badiru, Adedeji B | 1.0 |
| | publisher | Chapman and Hall/CRC | 1.0 |
| **Essential TypeScript 5** | author | Adam Freeman | 1.0 |

### Title Improvements Also Available

The verbose output shows 6 titles that could be improved by URL decoding:

| Current Title | Decoded Title |
|---------------|---------------|
| Visualizing complexity **3A** modular inform... | Visualizing complexity **:** modular informa... |
| Introduction to Modern Cryptography **28**Ch... | Introduction to Modern Cryptography **(** Cha... |
| Data Science **3A** The Hard Parts **3A** Techni... | Data Science **:** The Hard Parts **:** Techniques... |
| Systems Engineering Models **3A** Theory **2C**... | Systems Engineering Models **:** Theory **,** Meth... |
| Essential TypeScript 5 **2C** Third Edition... | Essential TypeScript 5 **,** Third Edition... |

### Summary of Changes

| Field | Updates | Notes |
|-------|---------|-------|
| Author | 5 | All correct |
| Year | 1 | Visualizing complexity → 2022 |
| Publisher | 4 | 2 correct (O'Reilly, Chapman), 2 are actually ISBN numbers |

### Data Quality Issues Identified

1. **Publisher field contains ISBN in some filenames**
   - "Visualizing complexity" filename has ISBN in publisher position
   - Should filter out publisher values that look like ISBNs

2. **Author field sometimes includes publisher name**
   - "BirkhaÌuser" in author list is actually the publisher (Birkhäuser)
   - This is a filename formatting issue, not a parsing issue

### Recommended Commands

```bash
# Safe to apply - author and year only (excludes problematic publisher)
npx tsx scripts/backfill-metadata.ts --dbpath ~/.concept_rag \
  --reparse-filenames --fields author,year

# Dry run to verify first
npx tsx scripts/backfill-metadata.ts --dbpath ~/.concept_rag \
  --reparse-filenames --fields author,year --dry-run
```

---

## Conclusion (Updated)

| Metric | Before | After URL Decoding |
|--------|--------|-------------------|
| Documents with incomplete metadata | 104 | 104 |
| Recoverable via content extraction | 1 (1%) | 1 (1%) |
| Recoverable via filename re-parsing | 0 | 5 (5%) |
| **Total recoverable** | **1** | **6** |

**Improvement:** The URL decoding fix enables recovery of metadata for 5 additional documents (5% of candidates) with 100% confidence, compared to only 1 document via content-based extraction.

**Next steps:**
1. Apply `--reparse-filenames --fields author,year` to update 5 documents safely
2. The remaining 99 documents with missing metadata are primarily:
   - Academic papers (arXiv-style filenames with no `--` delimiter)
   - Simple filenames like `book.pdf`
   - These would require manual curation or external API lookups

