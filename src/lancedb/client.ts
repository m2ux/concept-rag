import * as lancedb from "@lancedb/lancedb";
import {
  LanceDB, LanceDBArgs
} from "@langchain/community/vectorstores/lancedb";
import { Ollama, OllamaEmbeddings } from "@langchain/ollama";

export let client: lancedb.Connection;
export let table: lancedb.Table;
export let vectorStore: LanceDB; 

export async function connectToLanceDB(databaseUrl: string, tableName: string) {
  try {
    console.error(`Connecting to database: ${databaseUrl}`);
    client = await lancedb.connect(databaseUrl);
    table = await client.openTable(tableName);
    vectorStore = new LanceDB(new OllamaEmbeddings({model: "snowflake-arctic-embed2"}), { table })
  } catch (error) {
    console.error("LanceDB connection error:", error);
    throw error;
  }
}

export async function closeLanceDB() {
  await client?.close();
}
