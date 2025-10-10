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

3. **Add to MCP Client config:**

   **Claude Desktop**  
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

   **Cursor**  
   **MacOS**: `~/.cursor/mcp.json`  
   **Windows**: `%APPDATA%/Cursor/User/mcp.json`  
   **Linux**: `~/.cursor/mcp.json`

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

**For completely offline operation, use the same config format but with the traditional server:**

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

*Use this same JSON structure for both Claude Desktop and Cursor configuration files.*

### Prerequisites

**Hybrid Approach (Recommended):**
- Node.js 18+
- OpenRouter API key
- MCP Client (Claude Desktop or Cursor)

**Full Local Approach:**
- Node.js 18+ 
- MCP Client (Claude Desktop or Cursor)
- Ollama with models:
  - `ollama pull snowflake-arctic-embed2`
  - `ollama pull llama3.1:8b`

## 🎬 End-to-End Walkthrough (Hybrid Approach)

**Complete setup from PDFs to working Cursor integration in 10 minutes!**

### Step 1: Prerequisites & Setup

1. **Ensure you have Node.js 18+:**
   ```bash
   node --version  # Should show v18+ 
   ```

2. **Clone and build the project:**
   ```bash
   git clone https://github.com/m2ux/lance-mcp.git
   cd lance-mcp
   npm install
   npm run build
   ```

### Step 2: Get OpenRouter API Key

1. **Sign up at [OpenRouter.ai](https://openrouter.ai/keys)**
2. **Create an API key** (starts with `sk-or-v1-...`)
3. **Set up environment:**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and replace with your actual key
   nano .env  # or use your preferred editor
   ```

### Step 3: Prepare Your PDFs

```bash
# Example: Organize your PDFs in a folder
mkdir -p ~/Documents/my-pdfs
# Copy your PDF files to ~/Documents/my-pdfs/
# e.g., programming books, research papers, documentation, etc.
```

### Step 4: Run Hybrid Seeding

```bash
# Set environment and run seeding
source .env
npx tsx hybrid_fast_seed.ts \
  --dbpath ~/.lance_mcp \
  --filesdir ~/Documents/my-pdfs \
  --overwrite

# Expected output:
# ✅ Successfully loaded X/Y files
# 🤖 Generating summary with OpenRouter for: [filename]
# 📝 Generated summary: [AI summary]
# ✅ Created N catalog records
# ✅ Created M chunk records
# 🎉 Seeding completed successfully!
```

**What happens during seeding:**
- 📄 Loads PDF files (skips corrupted ones automatically)
- 🤖 Generates intelligent summaries using Claude 3.5 Haiku 
- ⚡ Creates fast local embeddings (384-dimensional)
- 💾 Stores everything in LanceDB at `~/.lance_mcp`

### Step 5: Configure Cursor

1. **Open Cursor settings** and navigate to MCP configuration
2. **Edit your MCP config file:**
   
   **Linux/macOS**: `~/.cursor/mcp.json`
   **Windows**: `%APPDATA%/Cursor/User/mcp.json`

3. **Add the configuration:**
   ```json
   {
     "mcpServers": {
       "lancedb": {
         "command": "node",
         "args": [
           "/path/to/your/lance-mcp/dist/simple_index.js",
           "/home/your-username/.lance_mcp"
         ]
       }
     }
   }
   ```

   **Replace the paths with your actual paths:**
   ```bash
   # Find your full paths
   pwd  # Note this path for the first argument
   echo ~/.lance_mcp  # Note this path for the second argument
   ```

### Step 6: Restart Cursor

```bash
# Close Cursor completely and restart it
# The MCP server should now be available
```

### Step 7: Test the Integration

**Open Cursor and try these commands:**

1. **Check what documents are available:**
   ```
   What documents do we have in the catalog?
   ```

2. **Search for specific topics:**
   ```
   Find information about [your topic]
   ```

3. **Get detailed information:**
   ```
   Search for specific details about [topic] in the [document name] document
   ```

### Step 8: Example Usage Session

**Here's a real example conversation:**

```
You: "What documents do we have in the catalog?"

Cursor: [Lists your documents with AI-generated summaries]

You: "Find information about error handling patterns"

Cursor: [Searches across documents and returns relevant chunks about error handling]

You: "Give me more details about error handling from the Rust programming book"

Cursor: [Searches specifically within the Rust book for error handling information]
```

### 🎯 Pro Tips

- **Large document collections?** Start with `--filesdir` pointing to a small subset first
- **Corrupted PDFs?** The system automatically skips them and continues
- **Need to reprocess?** Use `--overwrite` to recreate the database
- **API costs?** Typically $0.10-0.50 for 100+ documents (only summarization is paid)

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
