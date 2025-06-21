#!/usr/bin/env node

/**
 * Set up the vector database for RAG pipeline
 * Creates speech_chunks and speech_embeddings tables and populates them
 */

import Database from 'better-sqlite3'
import { OpenAI } from 'openai'
import { config } from 'dotenv'
import { existsSync } from 'fs'
import { join } from 'path'
import { load } from 'sqlite-vec'

// Load environment variables
config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const DB_PATH = join(process.cwd(), 'data', 'un_speeches.db')
const CHUNK_SIZE = 2000 // characters per chunk
const OVERLAP_SIZE = 200 // overlap between chunks
const BATCH_SIZE = 500 // Increased batch size for embeddings API
const RATE_LIMIT_DELAY = 100 // Reduced delay between batches
const CONCURRENT_SPEECHES = 3 // Process multiple speeches concurrently

type Speech = {
  id: number
  country_name: string
  speaker: string
  year: number
  session: number
  text: string
}

type ChunkProcessResult = {
  success: boolean
  chunkIndex: number
  chunkId?: number
  error?: string
}

/**
 * Initialize database connection with sqlite-vec extension
 */
function initDatabase(): Database.Database {
  if (!existsSync(DB_PATH)) {
    throw new Error(
      `Database file not found at ${DB_PATH}. Run "npm run db:setup" first.`
    )
  }

  const db = new Database(DB_PATH, { readonly: false })

  // Optimize database for bulk operations
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.pragma('cache_size = 10000')
  db.pragma('temp_store = MEMORY')
  db.pragma('foreign_keys = OFF')

  try {
    load(db)
    console.log('✅ sqlite-vec extension loaded successfully')

    const version = db.prepare('SELECT vec_version()').get() as {
      'vec_version()': string
    }
    console.log(`📦 sqlite-vec version: ${version['vec_version()']}`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Failed to load sqlite-vec extension:', errorMessage)
    console.error(
      'This script requires sqlite-vec to be available. Please ensure it is properly installed.'
    )
    console.error(
      'If running in a container, make sure the correct platform-specific binaries are available.'
    )
    throw error
  }

  return db
}

/**
 * Create necessary tables for the RAG pipeline
 */
function createTables(db: Database.Database): void {
  console.log('🔧 Creating tables...')

  db.exec(`
    CREATE TABLE IF NOT EXISTS speech_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      speech_id INTEGER NOT NULL,
      chunk_text TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      embedding_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS speech_embeddings USING vec0(
      embedding FLOAT[1536]
    )
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_speech_chunks_speech_id ON speech_chunks(speech_id);
    CREATE INDEX IF NOT EXISTS idx_speech_chunks_chunk_index ON speech_chunks(chunk_index);
  `)

  console.log('✅ Tables created successfully')
}

/**
 * Split text into overlapping chunks
 */
function chunkText(
  text: string,
  chunkSize: number = CHUNK_SIZE,
  overlap: number = OVERLAP_SIZE
): string[] {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    let end = start + chunkSize

    if (start > 0 && end < text.length) {
      const searchStart = Math.max(start + chunkSize - 200, start)
      const segment = text.slice(searchStart, end)
      const sentenceEnd = segment.lastIndexOf('. ')

      if (sentenceEnd > -1) {
        end = searchStart + sentenceEnd + 1
      }
    }

    const chunk = text.slice(start, end).trim()
    if (chunk.length > 0) {
      chunks.push(chunk)
    }

    start = end - overlap
    if (start >= text.length) break
  }

  return chunks
}

/**
 * Generate embeddings for multiple texts in a single API call
 */
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      encoding_format: 'float',
    })

    return response.data.map((item) => item.embedding)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error generating embeddings:', errorMessage)
    throw error
  }
}

/**
 * Process a speech and create chunks with embeddings using batch operations
 */
async function processSpeech(
  speech: Speech,
  db: Database.Database,
  insertChunk: Database.Statement<[number, string, number]>,
  insertEmbeddings: Database.Statement<[string]>,
  updateChunkWithEmbeddingId: Database.Statement<[number, number]>
): Promise<{ chunks: number; embeddings: number }> {
  const { id: speechId, country_name: country, speaker, year, text } = speech

  // Check existing chunks
  const existingChunks = db
    .prepare(
      'SELECT id, chunk_text, chunk_index, embedding_id FROM speech_chunks WHERE speech_id = ? ORDER BY chunk_index'
    )
    .all(speechId) as Array<{
    id: number
    chunk_text: string
    chunk_index: number
    embedding_id: number | null
  }>

  let chunksProcessed = 0
  let embeddingsProcessed = 0

  if (existingChunks.length > 0) {
    // Process existing chunks that need embeddings
    const chunksNeedingEmbeddings = existingChunks.filter(
      (chunk) => chunk.embedding_id === null
    )

    if (chunksNeedingEmbeddings.length === 0) {
      return { chunks: 0, embeddings: 0 }
    }

    // Process in batches
    for (let i = 0; i < chunksNeedingEmbeddings.length; i += BATCH_SIZE) {
      const batch = chunksNeedingEmbeddings.slice(i, i + BATCH_SIZE)
      const texts = batch.map((chunk) => chunk.chunk_text)

      const embeddings = await generateEmbeddings(texts)

      // Use transaction for batch insert
      const transaction = db.transaction(() => {
        batch.forEach((chunkData, index) => {
          const embeddingResult = insertEmbeddings.run(
            JSON.stringify(embeddings[index])
          )
          const embeddingId = embeddingResult.lastInsertRowid as number
          updateChunkWithEmbeddingId.run(embeddingId, chunkData.id)
        })
      })

      transaction()
      embeddingsProcessed += batch.length

      // Small delay to respect rate limits
      if (i + BATCH_SIZE < chunksNeedingEmbeddings.length) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY))
      }
    }
  } else {
    // Create new chunks and embeddings
    const chunks = chunkText(text)

    // Process chunks in batches
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE)

      // Generate embeddings for the batch
      const embeddings = await generateEmbeddings(batch)

      // Use transaction for batch insert
      const transaction = db.transaction(() => {
        batch.forEach((chunkText, index) => {
          const chunkIndex = i + index

          // Insert chunk
          const chunkResult = insertChunk.run(speechId, chunkText, chunkIndex)
          const chunkId = chunkResult.lastInsertRowid as number

          // Insert embedding
          const embeddingResult = insertEmbeddings.run(
            JSON.stringify(embeddings[index])
          )
          const embeddingId = embeddingResult.lastInsertRowid as number

          // Update chunk with embedding ID
          updateChunkWithEmbeddingId.run(embeddingId, chunkId)
        })
      })

      transaction()
      chunksProcessed += batch.length
      embeddingsProcessed += batch.length

      // Small delay to respect rate limits
      if (i + BATCH_SIZE < chunks.length) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY))
      }
    }
  }

  return { chunks: chunksProcessed, embeddings: embeddingsProcessed }
}

/**
 * Process speeches with concurrent processing
 */
async function processSpeeches(
  db: Database.Database,
  limit: number | null = null
): Promise<void> {
  console.log('📝 Processing speeches (starting with most recent years)...')

  let query = `
    SELECT DISTINCT s.id, s.country_name, s.speaker, s.year, s.session, s.text 
    FROM speeches s
    LEFT JOIN speech_chunks c ON s.id = c.speech_id
    WHERE (
      c.speech_id IS NULL OR 
      EXISTS (
        SELECT 1 FROM speech_chunks sc 
        WHERE sc.speech_id = s.id AND sc.embedding_id IS NULL
      )
    )
    ORDER BY s.year DESC, s.session DESC, s.id ASC
  `
  if (limit) {
    query += ` LIMIT ${limit}`
  }

  const speeches = db.prepare(query).all() as Speech[]
  console.log(`Found ${speeches.length} unprocessed speeches to process`)

  if (speeches.length === 0) {
    return
  }

  const years = [...new Set(speeches.map((s) => s.year))].sort((a, b) => b - a)
  console.log(
    `📅 Years to process: ${years.slice(0, 10).join(', ')}${years.length > 10 ? ' ...' : ''}`
  )

  // Prepare statements once
  const insertChunk = db.prepare(`
    INSERT INTO speech_chunks (speech_id, chunk_text, chunk_index)
    VALUES (?, ?, ?)
  `)

  const insertEmbeddings = db.prepare(`
    INSERT INTO speech_embeddings (embedding)
    VALUES (?)
  `)

  const updateChunkWithEmbeddingId = db.prepare(`
    UPDATE speech_chunks SET embedding_id = ? WHERE id = ?
  `)

  let processedCount = 0
  let totalChunks = 0
  let totalEmbeddings = 0

  // Process speeches in concurrent batches
  for (let i = 0; i < speeches.length; i += CONCURRENT_SPEECHES) {
    const batch = speeches.slice(i, i + CONCURRENT_SPEECHES)

    const results = await Promise.all(
      batch.map((speech) =>
        processSpeech(
          speech,
          db,
          insertChunk,
          insertEmbeddings,
          updateChunkWithEmbeddingId
        ).catch((error) => {
          console.error(`❌ Error processing speech ${speech.id}:`, error)
          return { chunks: 0, embeddings: 0 }
        })
      )
    )

    results.forEach((result, index) => {
      const speech = batch[index]
      if (result.chunks > 0 || result.embeddings > 0) {
        console.log(
          `✅ Processed speech ${speech.id} (${speech.country_name}, ${speech.year}): ${result.chunks} chunks, ${result.embeddings} embeddings`
        )
      }
      totalChunks += result.chunks
      totalEmbeddings += result.embeddings
    })

    processedCount += batch.length

    if (i + CONCURRENT_SPEECHES < speeches.length) {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }

  console.log(`\n📊 Processing complete:`)
  console.log(`   - Processed: ${processedCount} speeches`)
  console.log(`   - Total chunks: ${totalChunks}`)
  console.log(`   - Total embeddings: ${totalEmbeddings}`)
}

/**
 * Verify the setup
 */
function verifySetup(db: Database.Database): void {
  console.log('\n🔍 Verifying setup...')

  try {
    const chunkCount = db
      .prepare('SELECT COUNT(*) as count FROM speech_chunks')
      .get() as { count: number }
    console.log(`   speech_chunks: ${chunkCount.count} rows`)

    const embeddingCount = db
      .prepare('SELECT COUNT(*) as count FROM speech_embeddings')
      .get() as { count: number }
    console.log(`   speech_embeddings: ${embeddingCount.count} rows`)

    const missingEmbeddings = db
      .prepare(
        `
        SELECT COUNT(*) as count 
        FROM speech_chunks c 
        WHERE c.embedding_id IS NULL
      `
      )
      .get() as { count: number }

    if (missingEmbeddings.count > 0) {
      console.log(
        `⚠️  Warning: ${missingEmbeddings.count} chunks missing embeddings`
      )
    } else {
      console.log('✅ All chunks have embeddings')
    }

    const sampleChunks = db
      .prepare(
        `
        SELECT c.id, c.chunk_text, c.chunk_index, s.country_name, s.year
        FROM speech_chunks c
        JOIN speeches s ON c.speech_id = s.id
        LIMIT 3
      `
      )
      .all() as Array<{
      id: number
      chunk_text: string
      chunk_index: number
      country_name: string
      year: number
    }>

    console.log('\n📋 Sample chunks:')
    sampleChunks.forEach((chunk, i) => {
      console.log(
        `   ${i + 1}. Chunk ${chunk.id} (${chunk.country_name}, ${chunk.year}): "${chunk.chunk_text.slice(0, 100)}..."`
      )
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Verification failed:', errorMessage)
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('🚀 Setting up UN Speeches RAG Pipeline\n')

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is required')
    console.error(
      'Please set your OpenAI API key in the environment or .env file'
    )
    process.exit(1)
  }

  let db: Database.Database | undefined
  try {
    db = initDatabase()
    createTables(db)

    const limit = process.argv[2] ? parseInt(process.argv[2]) : null
    if (limit) {
      console.log(`📊 Processing limited to ${limit} speeches`)
    }

    await processSpeeches(db, limit)
    verifySetup(db)

    console.log('\n🎉 RAG pipeline setup complete!')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Setup failed:', errorMessage)
    process.exit(1)
  } finally {
    if (db) {
      db.close()
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export {
  initDatabase,
  createTables,
  chunkText,
  generateEmbeddings,
  processSpeech,
  processSpeeches,
  verifySetup,
  type Speech,
  type ChunkProcessResult,
}
