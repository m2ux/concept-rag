/**
 * Adapter that wraps a LanceDB table to provide a domain-friendly interface.
 * 
 * This class implements the Adapter pattern, converting LanceDB-specific
 * operations into domain layer abstractions. It prevents infrastructure
 * details from leaking into the domain layer.
 * 
 * **Design Pattern**: Adapter
 * - Port: `SearchableCollection` interface (domain layer)
 * - Adapter: This class (infrastructure layer)
 * - Adaptee: `lancedb.Table` (external dependency)
 * 
 * @see {@link SearchableCollection} for the domain interface
 */

import * as lancedb from "@lancedb/lancedb";
import { SearchableCollection, VectorSearchOptions } from "../../domain/interfaces/services/hybrid-search-service.js";

export class SearchableCollectionAdapter implements SearchableCollection {
  constructor(
    private table: lancedb.Table,
    private name: string
  ) {}
  
  async vectorSearch(queryVector: number[], limit: number, options?: VectorSearchOptions): Promise<any[]> {
    let query = this.table.vectorSearch(queryVector);
    
    // Apply filter if provided (e.g., "is_reference = false")
    if (options?.filter) {
      query = query.where(options.filter);
    }
    
    return await query.limit(limit).toArray();
  }
  
  getName(): string {
    return this.name;
  }
}

