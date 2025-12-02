import * as lancedb from '@lancedb/lancedb';

async function main() {
  const dbPath = process.argv[2] || (process.env.HOME + '/.concept_rag');
  console.log(`Checking database: ${dbPath}\n`);
  
  const db = await lancedb.connect(dbPath);
  const tables = await db.tableNames();
  console.log('Tables:', tables);
  
  for (const tableName of tables) {
    const table = await db.openTable(tableName);
    const count = await table.countRows();
    const sample = await table.query().limit(1).toArray();
    console.log(`\n${tableName}: ${count} rows`);
    console.log(`  Fields: ${Object.keys(sample[0] || {}).join(', ')}`);
  }
}
main().catch(console.error);
