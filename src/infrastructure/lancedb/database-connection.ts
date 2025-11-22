import * as lancedb from "@lancedb/lancedb";
import { ConnectionError, DatabaseError } from "../../domain/exceptions/index.js";

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
   * @throws {ConnectionError} If connection fails
   */
  static async connect(databaseUrl: string): Promise<LanceDBConnection> {
    try {
      console.error(`Connecting to database: ${databaseUrl}`);
      const client = await lancedb.connect(databaseUrl);
      return new LanceDBConnection(client);
    } catch (error) {
      throw new ConnectionError(error as Error);
    }
  }
  
  /**
   * Open and cache a table
   * 
   * @param tableName - Name of table to open
   * @returns LanceDB table handle
   * @throws {DatabaseError} If table opening fails
   */
  async openTable(tableName: string): Promise<lancedb.Table> {
    try {
      if (!this.tables.has(tableName)) {
        const table = await this.client.openTable(tableName);
        this.tables.set(tableName, table);
        console.error(`✅ Opened table: ${tableName}`);
      }
      return this.tables.get(tableName)!;
    } catch (error) {
      throw new DatabaseError(
        `Failed to open table "${tableName}"`,
        'open_table',
        error as Error
      );
    }
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
   * @throws {DatabaseError} If closing fails
   */
  async close(): Promise<void> {
    try {
      await this.client.close();
      this.tables.clear();
      console.error('🛑 Database connection closed');
    } catch (error) {
      throw new DatabaseError(
        'Failed to close database connection',
        'close',
        error as Error
      );
    }
  }
}

