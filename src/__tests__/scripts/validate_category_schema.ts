/**
 * Validate Category Schema Script
 * 
 * Validates that the database has been properly migrated to the new category schema.
 * Checks:
 * - Categories table exists and has correct structure
 * - Catalog entries have category_ids field
 * - Chunks have category_ids field
 * - Concepts have NO category_id field (category-agnostic)
 * - IDs are hash-based integers
 * 
 * Usage:
 *   npx tsx scripts/validate_category_schema.ts [--db-path <path>]
 */

import { connect } from '@lancedb/lancedb';
import * as path from 'path';

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: any;
}

class SchemaValidator {
  constructor(private dbPath: string) {}
  
  async validate(): Promise<boolean> {
    console.log(`\n🔍 VALIDATING CATEGORY SCHEMA`);
    console.log(`   Database: ${this.dbPath}`);
    console.log('='.repeat(80));
    
    const results: ValidationResult[] = [];
    
    // Check 1: Categories table exists
    results.push(await this.checkCategoriesTableExists());
    
    // Check 2: Categories table structure
    results.push(await this.checkCategoriesTableStructure());
    
    // Check 3: Category IDs are hash-based integers
    results.push(await this.checkCategoryIdsAreIntegers());
    
    // Check 4: Catalog has category_ids field
    results.push(await this.checkCatalogHasCategoryIds());
    
    // Check 5: Chunks have category_ids field
    results.push(await this.checkChunksHaveCategoryIds());
    
    // Check 6: Concepts have NO category_id field (category-agnostic)
    results.push(await this.checkConceptsNoCategoryId());
    
    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(80));
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    
    results.forEach((result, idx) => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} Check ${idx + 1}: ${result.message}`);
      if (result.details) {
        console.log(`   ${JSON.stringify(result.details)}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    if (passed === total) {
      console.log(`✅ ALL CHECKS PASSED (${passed}/${total})`);
      return true;
    } else {
      console.log(`❌ SOME CHECKS FAILED (${passed}/${total} passed)`);
      return false;
    }
  }
  
  private async checkCategoriesTableExists(): Promise<ValidationResult> {
    try {
      const db = await connect(this.dbPath);
      const tables = await db.tableNames();
      
      if (tables.includes('categories')) {
        const categoriesTable = await db.openTable('categories');
        const count = await categoriesTable.countRows();
        
        return {
          passed: true,
          message: `Categories table exists with ${count} categories`,
          details: { count }
        };
      } else {
        return {
          passed: false,
          message: 'Categories table does not exist',
          details: { tables }
        };
      }
    } catch (error) {
      return {
        passed: false,
        message: `Error checking categories table: ${error}`,
        details: { error: String(error) }
      };
    }
  }
  
  private async checkCategoriesTableStructure(): Promise<ValidationResult> {
    try {
      const db = await connect(this.dbPath);
      const categoriesTable = await db.openTable('categories');
      const sample = await categoriesTable.query().limit(1).toArray();
      
      if (sample.length === 0) {
        return {
          passed: false,
          message: 'Categories table is empty',
          details: {}
        };
      }
      
      const row = sample[0];
      const requiredFields = [
        'id', 'category', 'description', 'parent_category_id',
        'aliases', 'related_categories', 'document_count',
        'chunk_count', 'concept_count', 'vector'
      ];
      
      const missingFields = requiredFields.filter(f => !(f in row));
      
      if (missingFields.length > 0) {
        return {
          passed: false,
          message: 'Categories table missing required fields',
          details: { missingFields }
        };
      }
      
      return {
        passed: true,
        message: 'Categories table has correct structure',
        details: { fields: Object.keys(row) }
      };
    } catch (error) {
      return {
        passed: false,
        message: `Error checking categories table structure: ${error}`,
        details: { error: String(error) }
      };
    }
  }
  
  private async checkCategoryIdsAreIntegers(): Promise<ValidationResult> {
    try {
      const db = await connect(this.dbPath);
      const categoriesTable = await db.openTable('categories');
      const sample = await categoriesTable.query().limit(5).toArray();
      
      if (sample.length === 0) {
        return {
          passed: false,
          message: 'Categories table is empty',
          details: {}
        };
      }
      
      const nonIntegerIds = sample.filter(row => typeof row.id !== 'number');
      
      if (nonIntegerIds.length > 0) {
        return {
          passed: false,
          message: 'Category IDs are not integers',
          details: { nonIntegerIds: nonIntegerIds.map(r => ({ id: r.id, type: typeof r.id })) }
        };
      }
      
      return {
        passed: true,
        message: 'Category IDs are hash-based integers',
        details: { sampleIds: sample.map(r => r.id) }
      };
    } catch (error) {
      return {
        passed: false,
        message: `Error checking category IDs: ${error}`,
        details: { error: String(error) }
      };
    }
  }
  
  private async checkCatalogHasCategoryIds(): Promise<ValidationResult> {
    try {
      const db = await connect(this.dbPath);
      
      // Check if catalog table exists
      const tables = await db.tableNames();
      if (!tables.includes('catalog')) {
        return {
          passed: true, // Not an error if table doesn't exist yet (new DB)
          message: 'Catalog table does not exist (new database)',
          details: {}
        };
      }
      
      const catalogTable = await db.openTable('catalog');
      const sample = await catalogTable.query().limit(1).toArray();
      
      if (sample.length === 0) {
        return {
          passed: true, // Empty table is ok
          message: 'Catalog table is empty',
          details: {}
        };
      }
      
      const row = sample[0];
      
      // Check if category_ids field exists (new format)
      if (!('category_ids' in row)) {
        return {
          passed: false,
          message: 'Catalog entries missing category_ids field',
          details: { fields: Object.keys(row) }
        };
      }
      
      // Validate category_ids is a JSON array of integers
      try {
        const categoryIds = JSON.parse(row.category_ids);
        if (!Array.isArray(categoryIds)) {
          return {
            passed: false,
            message: 'category_ids is not an array',
            details: { categoryIds, type: typeof categoryIds }
          };
        }
        
        // Check if IDs are integers
        if (categoryIds.length > 0 && typeof categoryIds[0] !== 'number') {
          return {
            passed: false,
            message: 'category_ids contains non-integer IDs',
            details: { categoryIds }
          };
        }
        
        return {
          passed: true,
          message: 'Catalog entries have category_ids with hash-based integers',
          details: { sampleCategoryIds: categoryIds }
        };
      } catch (parseError) {
        return {
          passed: false,
          message: 'Error parsing category_ids JSON',
          details: { error: String(parseError), value: row.category_ids }
        };
      }
    } catch (error) {
      return {
        passed: false,
        message: `Error checking catalog category_ids: ${error}`,
        details: { error: String(error) }
      };
    }
  }
  
  private async checkChunksHaveCategoryIds(): Promise<ValidationResult> {
    try {
      const db = await connect(this.dbPath);
      
      // Check if chunks table exists
      const tables = await db.tableNames();
      if (!tables.includes('chunks')) {
        return {
          passed: true, // Not an error if table doesn't exist yet (new DB)
          message: 'Chunks table does not exist (new database)',
          details: {}
        };
      }
      
      const chunksTable = await db.openTable('chunks');
      const sample = await chunksTable.query().limit(1).toArray();
      
      if (sample.length === 0) {
        return {
          passed: true, // Empty table is ok
          message: 'Chunks table is empty',
          details: {}
        };
      }
      
      const row = sample[0];
      
      // Check if category_ids field exists (new format)
      if (!('category_ids' in row)) {
        return {
          passed: false,
          message: 'Chunk entries missing category_ids field',
          details: { fields: Object.keys(row) }
        };
      }
      
      return {
        passed: true,
        message: 'Chunk entries have category_ids field',
        details: {}
      };
    } catch (error) {
      return {
        passed: false,
        message: `Error checking chunks category_ids: ${error}`,
        details: { error: String(error) }
      };
    }
  }
  
  private async checkConceptsNoCategoryId(): Promise<ValidationResult> {
    try {
      const db = await connect(this.dbPath);
      
      // Check if concepts table exists
      const tables = await db.tableNames();
      if (!tables.includes('concepts')) {
        return {
          passed: true, // Not an error if table doesn't exist yet (new DB)
          message: 'Concepts table does not exist (new database)',
          details: {}
        };
      }
      
      const conceptsTable = await db.openTable('concepts');
      const sample = await conceptsTable.query().limit(5).toArray();
      
      if (sample.length === 0) {
        return {
          passed: true, // Empty table is ok
          message: 'Concepts table is empty',
          details: {}
        };
      }
      
      // Check if any concept has category_id field (should NOT have it in new schema)
      // Note: Old databases may have 'category' string field, which is OK for backward compat
      const withCategoryId = sample.filter(row => 'category_id' in row && row.category_id !== null && row.category_id !== undefined);
      
      if (withCategoryId.length > 0) {
        return {
          passed: false,
          message: 'Concepts have category_id field (should be category-agnostic)',
          details: { 
            count: withCategoryId.length, 
            sample: withCategoryId[0],
            note: 'Concepts should NOT have categories - they are cross-domain entities'
          }
        };
      }
      
      // Check if concepts still have old 'category' string field (backward compat)
      const withOldCategory = sample.filter(row => 'category' in row && row.category);
      
      return {
        passed: true,
        message: `Concepts are category-agnostic (no category_id field)${withOldCategory.length > 0 ? ' - old category field present for backward compat' : ''}`,
        details: { 
          hasOldCategoryField: withOldCategory.length > 0,
          note: 'Old category string field is OK for backward compatibility, but not used in new schema'
        }
      };
    } catch (error) {
      return {
        passed: false,
        message: `Error checking concepts category_id: ${error}`,
        details: { error: String(error) }
      };
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let dbPath = `${process.env.HOME}/.concept_rag`;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--db-path' && i + 1 < args.length) {
    dbPath = args[i + 1];
    i++;
  }
}

// Run validation
const validator = new SchemaValidator(dbPath);
const success = await validator.validate();

process.exit(success ? 0 : 1);

