// Registry using hybrid search for better title matching
import { HybridCatalogSearchTool } from "./operations/hybrid_catalog_search.js";
import { SimpleChunksSearchTool } from "./operations/simple_chunks_search.js";
import { SimpleBroadSearchTool } from "./operations/simple_broad_search.js";

export const tools = [
  new HybridCatalogSearchTool(),        // Enhanced catalog search
  new SimpleChunksSearchTool(),          // Regular chunks search
  new SimpleBroadSearchTool(),           // Broad chunks search
];

