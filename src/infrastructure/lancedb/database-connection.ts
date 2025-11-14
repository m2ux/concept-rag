import * as lancedb from "@lancedb/lancedb";

/**
 * Manages LanceDB connection and table access
 * 
 * Replaces global module-level exports (export let client, etc.)
 * with proper lifecycle management and encapsulation.
 */
export class LanceDBConnection {
  private client: lancedb.Connection;
  private tables = new Map<string, lancedb.Table>();
  
  private constructor(client: lancedb.Connection) {
    this.client = client;
  }
  
  /**
   * Create and connect to LanceDB
   * 
   * @param databaseUrl - Path to database directory
   * @returns Connected LanceDB instance
   */
  static async connect(databaseUrl: string): Promise<LanceDBConnection> {
    console.error(`Connecting to database: ${databaseUrl}`);
    const client = await lancedb.connect(databaseUrl);
    return new LanceDBConnection(client);
  }
  
  /**
   * Open and cache a table
   * 
   * @param tableName - Name of table to open
   * @returns LanceDB table handle
   */
  async openTable(tableName: string): Promise<lancedb.Table> {
    if (!this.tables.has(tableName)) {
      const table = await this.client.openTable(tableName);
      this.tables.set(tableName, table);
      console.error(`✅ Opened table: ${tableName}`);
    }
    return this.tables.get(tableName)!;
  }
  
  /**
   * Get raw client (for advanced operations)
   * Use sparingly - prefer using repository methods
   */
  getClient(): lancedb.Connection {
    return this.client;
  }
  
  /**
   * Close connection and cleanup
   */
  async close(): Promise<void> {
    await this.client.close();
    this.tables.clear();
    console.error('🛑 Database connection closed');
  }
}

