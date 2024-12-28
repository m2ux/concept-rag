# 🗄️ LanceDB MCP Server for LLMS

[![Node.js 18+](https://img.shields.io/badge/node-18%2B-blue.svg)](https://nodejs.org/en/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that enables LLMs to interact directly the documents that they have on-disk through agentic RAG and hybrid search. Ask LLMs questions about the dataset as a whole or about specific documents.

## ✨ Features

- 🔍 LanceDB-powered serverless vector index and document summary catalog.
- 📊 Efficient use of LLM tokens. The LLM itself looks up what it needs when it needs.
- 📈 Security. The index is stored locally so no data is transferred to the Cloud when using a local LLM.

## 🚀 Quick Start

To get started, create a local directory to store the index and add this configuration to your Claude Desktop config file:

**MacOS**: `~/Library/Application\ Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mongodb": {
      "command": "npx",
      "args": [
        "lance-mcp",
        "PATH_TO_LOCAL_INDEX_DIR"
      ]
    }
  }
}
```

### Prerequisites

- Node.js 18+
- npx
- MCP Client (Claude Desktop App for example)
- Summarization and embedding models installed (see config.ts - by default we use Ollama models)
  - `ollama pull snowflake-arctic-embed2`
  - `ollama pull llama3.1:8b`

#### Local Development Mode:

```json
{
  "mcpServers": {
    "mongodb": {
      "command": "node",
      "args": [
        "PATH_TO_LANCE_MCP/dist/index.js",
        "PATH_TO_LOCAL_INDEX_DIR"
      ]
    }
  }
}
```

### Seed Data

The seed script creates two tables in LanceDB - one for the catalog of document summaries, and another one - for vectorized documents' chunks.
To run the seed script use the following command:
```console
npm run seed -- --dbpath <PATH_TO_LOCAL_INDEX_DIR> --filesdir <PATH_TO_DOCS>
```

You can use sample data from the docs/ directory. Feel free to adjust the default summarization and embedding models in the config.ts file. If you need to recreate the index, simply rerun the seed script with the `--overwrite` option.

#### Catalog

- Document summary
- Metadata

#### Chunks

- Vectorized document chunk
- Metadata

## 🎯 Example Prompts

Try these prompts with Claude to explore the functionality:

### Basic Operations

```plaintext
"What collections are available in the database?"
"Show me the schema for the users collection"
"Find all users in San Francisco"
```

### Advanced Queries

```plaintext
"Find all electronics products that are in stock and cost less than $1000"
"Show me all orders from the user john@example.com"
"List the products with ratings above 4.5"
```

### Index Management

```plaintext
"What indexes exist on the users collection?"
"Create an index on the products collection for the 'category' field"
"List all indexes across all collections"
```

### Document Operations

```plaintext
"Insert a new product with name 'Gaming Laptop' in the products collection"
"Update the status of order with ID X to 'shipped'"
"Find and delete all products that are out of stock"
```

## 📝 Available Tools

The server provides these tools for interaction with the index:

### Catalog Tools

- `catalog_search`: Search for relevant documents in the catalog

### Chunks Tools

- `chunks_search`: Find relevant chunks based on a specific document from the catalog
- `all_chunks_search`: Find relevant chunks from all known documents

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
