# Runtime Module

This module provides the core RAG functionality used by the web application.

## Purpose

The runtime module handles **live query processing** and is used by the web application for:

1. Semantic search across speech chunks using vector similarity
2. Full RAG pipeline with context retrieval and answer generation
3. Advanced search with filtering by country, year, speaker, etc.
4. Database connection and query management

## Files

- `vector-search.ts` - Semantic search utilities and database operations
- `rag-pipeline.ts` - Complete RAG pipeline with OpenAI integration
- `index.ts` - Module exports

## Key Functions

### Vector Search (`vector-search.ts`)

- `initDatabase()` - Initialize database connection with sqlite-vec
- `semanticSearch()` - Find similar speech chunks using embeddings
- `advancedSearch()` - Filtered semantic search with metadata
- `getChunkContext()` - Retrieve surrounding context for chunks
- `getSearchStats()` - Database statistics and health metrics

### RAG Pipeline (`rag-pipeline.ts`)

- `ragQuery()` - Complete question-answering with context retrieval
- `comparePerspectives()` - Compare viewpoints across countries/speakers
- `generateAnswer()` - OpenAI completion with retrieved context

## Usage in Web App

```typescript
import { ragQuery, semanticSearch, initDatabase } from './rag-ts/runtime'

// Initialize database
const db = initDatabase()

// Simple semantic search
const results = await semanticSearch(db, 'climate change', { limit: 5 })

// Full RAG query with answer generation
const response = await ragQuery('What do countries say about climate change?', {
  searchLimit: 10,
  filters: { country: 'United States' },
})

// Access the answer and sources
console.log(response.answer)
console.log(response.sources)
console.log(response.usage) // OpenAI API usage stats
```

## Performance Notes

- Uses sqlite-vec for fast vector similarity search
- Supports filtering to reduce search space
- Includes context retrieval for better answers
- Tracks OpenAI API usage and costs
