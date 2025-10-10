# 🗄️ LanceDB MCP Server for LLMS

[![Node.js 18+](https://img.shields.io/badge/node-18%2B-blue.svg)](https://nodejs.org/en/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that enables LLMs to interact directly with documents through agentic RAG and hybrid search in LanceDB. Features both **Ollama-based** and **cloud-based** architectures for maximum flexibility and performance.

## ✨ Features

- 🔍 **LanceDB-powered** serverless vector index and intelligent document catalog
- 🤖 **Dual Architecture**: Choose between Ollama (local) or OpenRouter (cloud) for AI operations
- ⚡ **Lightning Fast**: Hybrid approach with cloud summarization + local embeddings
- 🛡️ **Robust PDF Handling**: Gracefully handles corrupted files and continues processing
- 📊 **Efficient Token Usage**: LLM looks up exactly what it needs, when it needs it
- 🔒 **Security First**: Local storage with secure API key management
- 🚀 **No Timeouts**: Eliminates Ollama timeout issues with fast cloud processing

## 🚀 Quick Start

Choose between two architectures based on your needs:

### 🌟 Recommended: Hybrid (OpenRouter + Local)

**Fast, reliable, and no local AI dependencies required!**

1. **Get OpenRouter API Key**: Sign up at [OpenRouter.ai](https://openrouter.ai/keys)

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenRouter API key
   ```

3. **Add to Claude Desktop config:**

   **MacOS**: `~/Library/Application\ Support/Claude/claude_desktop_config.json`  
   **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

   ```json
   {
     "mcpServers": {
       "lancedb": {
         "command": "node",
         "args": [
           "PATH_TO_LANCE_MCP/dist/simple_index.js",
           "PATH_TO_LOCAL_INDEX_DIR"
         ]
       }
     }
   }
   ```

### 🏠 Alternative: Full Local (Ollama)

**For completely offline operation:**

```json
{
  "mcpServers": {
    "lancedb": {
      "command": "node", 
      "args": [
        "PATH_TO_LANCE_MCP/dist/index.js",
        "PATH_TO_LOCAL_INDEX_DIR"
      ]
    }
  }
}
```

### Prerequisites

**Hybrid Approach (Recommended):**
- Node.js 18+
- OpenRouter API key
- MCP Client (Claude Desktop App)

**Full Local Approach:**
- Node.js 18+ 
- MCP Client (Claude Desktop App)
- Ollama with models:
  - `ollama pull snowflake-arctic-embed2`
  - `ollama pull llama3.1:8b`

### Demo

<img src="https://github.com/user-attachments/assets/90bfdea9-9edd-4cf6-bb04-94c9c84e4825" width="50%">

### 🔧 Development Setup

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Test with MCP Inspector:**
   ```bash
   # Hybrid approach
   npx @modelcontextprotocol/inspector dist/simple_index.js PATH_TO_LOCAL_INDEX_DIR
   
   # Local approach  
   npx @modelcontextprotocol/inspector dist/index.js PATH_TO_LOCAL_INDEX_DIR
   ```

## 📚 Data Seeding

### 🌟 Hybrid Seeding (Recommended)

**Fast, reliable seeding with OpenRouter AI summarization:**

```bash
# Set up environment
export OPENROUTER_API_KEY=your_key_here

# Run hybrid seeding (fast cloud AI + local embeddings)
npx tsx hybrid_fast_seed.ts --dbpath ~/.lance_mcp --filesdir ~/Documents/ebooks --overwrite
```

**Features:**
- ⚡ **Lightning fast** - Cloud AI summarization via Claude 3.5 Haiku
- 🛡️ **Robust** - Automatically skips corrupted PDFs and continues
- 🚀 **No timeouts** - Eliminates Ollama hanging issues
- 💰 **Cost effective** - Only pays for summarization, embeddings are free

### 🏠 Traditional Seeding (Ollama)

```bash
npm run seed -- --dbpath <PATH_TO_LOCAL_INDEX_DIR> --filesdir <PATH_TO_DOCS>
```

**Note:** Requires Ollama running locally and may experience timeouts with large documents.

### 📋 Seeding Options

- `--dbpath`: Directory to store the LanceDB database
- `--filesdir`: Directory containing PDF files to process  
- `--overwrite`: Recreate the database from scratch

The seeding process creates two tables:
- **Catalog**: AI-generated document summaries and metadata
- **Chunks**: Vectorized document segments for detailed search

## 🎯 Example Prompts

Try these prompts with Claude to explore the functionality:

```plaintext
"What documents do we have in the catalog?"
"Find information about Rust programming patterns"
"What are the main topics covered in the embedded systems book?"
"Search for design patterns in object-oriented programming"
```

## 📝 Available Tools

The server provides these tools for intelligent document interaction:

### 🗂️ Catalog Tools
- **`catalog_search`**: Search document summaries to find relevant sources

### 📄 Chunks Tools  
- **`chunks_search`**: Find specific information within a chosen document
- **`all_chunks_search`**: Search across all documents for detailed information

## 🔒 Security

This project follows security best practices:

- ✅ **No hardcoded API keys** - Uses environment variables only
- ✅ **Local data storage** - Your documents stay on your machine  
- ✅ **Secure configuration** - `.env` files are gitignored
- ✅ **Security documentation** - See [SECURITY.md](SECURITY.md) for details

**Never commit API keys to version control!**

## 🏗️ Architecture

### Hybrid Approach (Recommended)
```
Documents → PDF Processing → OpenRouter (Summarization) → Local Embeddings → LanceDB
```

### Local Approach  
```
Documents → PDF Processing → Ollama (Summarization + Embeddings) → LanceDB
```

## 🛠️ Development

### File Structure
- `hybrid_fast_seed.ts` - OpenRouter-based seeding (recommended)
- `src/simple_index.ts` - Ollama-free MCP server  
- `src/index.ts` - Traditional Ollama-based server
- `src/seed.ts` - Traditional Ollama-based seeding

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes (ensure no API keys in code!)
4. Test with both architectures if applicable
5. Submit a pull request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
