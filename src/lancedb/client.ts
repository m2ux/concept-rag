import * as lancedb from "@lancedb/lancedb";
import {
  LanceDB, LanceDBArgs
} from "@langchain/community/vectorstores/lancedb";
import { Ollama, OllamaEmbeddings } from "@langchain/ollama";
import * as defaults from '../config'

export let client: lancedb.Connection;
export let chunksTable: lancedb.Table;
export let chunksVectorStore: LanceDB; 
export let catalogTable: lancedb.Table;
export let catalogVectorStore: LanceDB; 

export async function connectToLanceDB(databaseUrl: string, chunksTableName: string, catalogTableName: string) {
  try {
    console.error(`Connecting to database: ${databaseUrl}`);
    client = await lancedb.connect(databaseUrl);

    chunksTable = await client.openTable(chunksTableName);
    chunksVectorStore = new LanceDB(new OllamaEmbeddings({model: defaults.EMBEDDING_MODEL}), { table: chunksTable })

    catalogTable = await client.openTable(catalogTableName);
    catalogVectorStore = new LanceDB(new OllamaEmbeddings({model: defaults.EMBEDDING_MODEL}), { table: catalogTable })

  } catch (error) {
    console.error("LanceDB connection error:", error);
    throw error;
  }
}

export async function closeLanceDB() {
  await client?.close();
}
