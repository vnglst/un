# Setup Module

This module handles the initial setup and preparation of the RAG pipeline.

## Purpose

The setup phase is a **one-time operation** that prepares the database for RAG queries by:

1. Creating the necessary database tables (`speech_chunks`, `speech_embeddings`)
2. Chunking all speeches into ~2000 character segments with overlap
3. Generating OpenAI embeddings for each chunk
4. Storing embeddings in a sqlite-vec virtual table for fast similarity search

## Files

- `setup-vector-db.ts` - Main setup script for database preparation
- `index.ts` - Module exports

## Usage

Run the setup script once before using the RAG pipeline:

```bash
# Full setup (all speeches)
npm run rag:setup

# Test setup (first 50 speeches only)
npm run rag:setup-test
```

## Important Notes

- This process takes time and costs OpenAI API credits
- Only needs to be run once (unless you want to regenerate embeddings)
- Creates approximately 50,000+ chunks for the full UN speeches database
- Requires a valid OpenAI API key in your environment

## Database Schema Created

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
```
