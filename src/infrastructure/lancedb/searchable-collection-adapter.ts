/**
 * Adapter that wraps a LanceDB table to provide a domain-friendly interface.
 * 
 * This class implements the Adapter pattern, converting LanceDB-specific
 * operations into domain layer abstractions. It prevents infrastructure
 * details from leaking into the domain layer.
 * 
 * **Design Pattern**: Adapter (Hexagonal Architecture / Ports & Adapters)
 * - Port: `SearchableCollection` interface (domain layer)
 * - Adapter: This class (infrastructure layer)
 * - Adaptee: `lancedb.Table` (external dependency)
 * 
 * @see {@link SearchableCollection} for the domain interface
 */

import * as lancedb from "@lancedb/lancedb";
import { SearchableCollection } from "../../domain/interfaces/services/hybrid-search-service.js";

export class SearchableCollectionAdapter implements SearchableCollection {
  constructor(
    private table: lancedb.Table,
    private name: string
  ) {}
  
  async vectorSearch(queryVector: number[], limit: number): Promise<any[]> {
    return await this.table
      .vectorSearch(queryVector)
      .limit(limit)
      .toArray();
  }
  
  getName(): string {
    return this.name;
  }
}

