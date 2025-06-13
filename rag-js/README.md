# UN Speeches RAG Pipeline (JavaScript)

A robust Retrieval-Augmented Generation (RAG) system for UN General Assembly speeches using SQLite, sqlite-vec extension, and OpenAI embeddings.

## Overview

This RAG pipeline provides semantic search and question-answering capabilities for UN speeches by:

1. **Chunking**: Splitting speeches into ~2000 character segments with overlap
2. **Embedding**: Generating OpenAI embeddings for each chunk
3. **Vector Search**: Using sqlite-vec for fast semantic similarity search
4. **Generation**: Combining retrieved context with OpenAI completions for answers

## Prerequisites

1. **Node.js 22+** with ES modules support
2. **sqlite-vec extension** properly installed and loadable
3. **OpenAI API key** for embeddings and completions
4. **UN speeches database** (`data/un_speeches.db`)

## Installation

```bash
# Install all dependencies (from project root)
npm install

# Set up environment variables
echo "OPENAI_API_KEY=your_api_key_here" > .env

# Ensure database exists
npm run db:setup
```

## Quick Start

### 1. Set up the vector database

```bash
# Create embeddings for all speeches (this will take time and cost API credits)
npm run rag:setup

# Or limit to first 50 speeches for testing
npm run rag:setup-test
```

### 2. Verify the setup

```bash
# Run comprehensive verification
npm run rag:verify

# Check statistics
npm run rag:stats
```

### 3. Start using the RAG pipeline

```bash
# Interactive chat interface
npm run rag:chat

# Single query (note: arguments after -- are passed to the script)
npm run rag:chat -- query "What do countries say about climate change?"

# Compare perspectives
npm run rag:chat -- compare "nuclear weapons" "United States" "Russia" "China"
```

## Architecture

### Core Components

1. **setup-vector-db.js** - Sets up vector database with chunking and embeddings
2. **vector-search.js** - Provides semantic search functionality
3. **rag-pipeline.js** - Complete RAG pipeline with answer generation
4. **verify-rag.js** - Verification and testing utilities

### Database Schema

```sql
-- Speech chunks table
CREATE TABLE speech_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  speech_id INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vector embeddings table (sqlite-vec virtual table)
CREATE VIRTUAL TABLE speech_embeddings USING vec0(
  embedding FLOAT[1536]
);

-- Note: Foreign key constraints are disabled during setup for performance
-- The speech_chunks.embedding_id links to speech_embeddings.rowid
-- The speech_chunks.speech_id links to speeches.id
```

## API Reference

### Vector Search

```javascript
import { semanticSearch, advancedSearch } from './vector-search.js'

// Basic semantic search
const results = await semanticSearch(db, 'climate change', 5)

// Advanced search with filters
const results = await advancedSearch(
  db,
  'nuclear weapons',
  {
    country: 'United States',
    year: 2020,
    minYear: 2015,
    maxYear: 2023,
  },
  10
)
```

### RAG Pipeline

```javascript
import { ragQuery, compareperspectives } from './rag-pipeline.js'

// Ask a question
const result = await ragQuery(db, 'What is the position on climate change?')
console.log(result.answer)
console.log(result.sources)

// Compare perspectives
const comparison = await compareperspectives(
  db,
  'nuclear disarmament',
  ['United States', 'Russia'],
  ['António Guterres']
)
```

## Text Chunking Strategy

- **Chunk Size**: ~2000 characters
- **Overlap**: 200 characters between chunks
- **Smart Splitting**: Attempts to break at sentence boundaries when possible
- **Context Preservation**: Maintains coherent semantic units

## Vector Search Features

- **Cosine Similarity**: Using sqlite-vec's efficient vector operations
- **Metadata Filtering**: Filter by country, year, speaker, etc.
- **Context Retrieval**: Get surrounding chunks for better context
- **Similarity Threshold**: Optional distance threshold filtering

## Performance Considerations

### Embedding Generation

- Uses OpenAI's `text-embedding-3-small` (1536 dimensions)
- Processes with rate limiting to avoid API limits
- Caches embeddings to avoid regeneration

### Search Optimization

- Indexed foreign keys for fast joins
- Vector index managed by sqlite-vec
- Efficient similarity computation in SQLite

### Resource Usage

- ~1MB per 1000 embeddings in storage
- API cost: ~$0.02 per 1M tokens for embeddings
- Query time: <100ms for typical searches

## Usage Examples

### Interactive Chat

```bash
$ npm run rag:chat

🚀 Starting UN Speeches RAG Chat Interface
Ask questions about UN speeches. Type "exit" to quit.

❓ Your question: What do world leaders say about artificial intelligence?

📝 Answer:
World leaders have expressed both excitement and caution about artificial intelligence...

📚 Sources:
   1. United States, 2023 (John Smith)
   2. European Union, 2022 (Jane Doe)
   3. China, 2023 (Li Wei)
```

### Programmatic Usage

```javascript
import { initDatabase } from './rag-js/vector-search.js'
import { ragQuery } from './rag-js/rag-pipeline.js'

const db = initDatabase()

const result = await ragQuery(
  db,
  'What are the main concerns about climate change?',
  {
    searchLimit: 8,
    filters: { minYear: 2020 },
  }
)

console.log('Answer:', result.answer)
result.sources.forEach((source) => {
  console.log(`- ${source.country} (${source.year}): ${source.preview}`)
})

db.close()
```

## Verification Commands

```bash
# Full verification suite
npm run rag:verify

# Statistics and detailed analysis
npm run rag:stats

# Note: For detailed component verification, you can run the script directly:
# node rag-js/verify-rag.js structure    # Database structure
# node rag-js/verify-rag.js embeddings  # Embedding integrity
# node rag-js/verify-rag.js search      # Vector search functionality
# node rag-js/verify-rag.js rag         # End-to-end RAG pipeline
```

## Troubleshooting

### sqlite-vec Extension Issues

```bash
# Check if extension is loadable
node -e "const db = require('better-sqlite3')(':memory:'); db.loadExtension('vec0')"

# Install sqlite-vec if needed
npm install sqlite-vec
```

### OpenAI API Issues

```bash
# Verify API key
node -e "console.log(process.env.OPENAI_API_KEY ? 'API key set' : 'API key missing')"

# Test API connectivity
node -e "
import('openai').then(({OpenAI}) => {
  const client = new OpenAI();
  client.models.list().then(() => console.log('API works')).catch(console.error);
});"
```

### Memory Issues

- Process speeches in batches if running out of memory
- Use `LIMIT` parameter in setup script for large datasets
- Consider using a server with more RAM for large-scale processing

## Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...                    # OpenAI API key

# Optional
RAG_CHUNK_SIZE=2000                      # Chunk size in characters
RAG_OVERLAP_SIZE=200                     # Overlap size in characters
RAG_EMBEDDING_MODEL=text-embedding-3-small  # OpenAI embedding model
RAG_COMPLETION_MODEL=gpt-4o              # OpenAI completion model
```

## Performance Benchmarks

### Setup Phase (1000 speeches):

- Chunking: ~10 seconds
- Embedding generation: ~2-5 minutes (depending on API rate limits)
- Database insertion: ~5 seconds

### Query Phase:

- Vector search: 10-50ms
- Answer generation: 1-3 seconds
- Total query time: 1-4 seconds

## Cost Estimation

### One-time Setup (10,000 speeches):

- Embedding generation: ~$5-15 (varies by speech length)
- Storage: ~10MB database size increase

### Ongoing Usage:

- Query embedding: ~$0.0001 per query
- Answer generation: ~$0.01-0.05 per query (varies by context length)

## Contributing

1. Follow the existing code style and structure
2. Add tests for new functionality
3. Update documentation for API changes
4. Verify all tests pass with `npm run rag:verify`

## License

Same as parent project.
