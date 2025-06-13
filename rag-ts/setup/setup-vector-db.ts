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
const BATCH_SIZE = 100 // number of chunks to process in parallel
const RATE_LIMIT_DELAY = 10 // delay between batches in ms

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

  // Disable foreign key constraints to avoid issues
  db.pragma('foreign_keys = OFF')

  try {
    // Load sqlite-vec extension
    load(db)
    console.log('✅ sqlite-vec extension loaded successfully')

    // Check if vec_version is available
    const version = db.prepare('SELECT vec_version()').get() as {
      'vec_version()': string
    }
    console.log(`📦 sqlite-vec version: ${version['vec_version()']}`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Failed to load sqlite-vec extension:', errorMessage)
    console.error(
      'Please ensure sqlite-vec and sqlite-vec-darwin-x64 are properly installed'
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

  // Create speech_chunks table
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

  // Create speech_embeddings table using sqlite-vec
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS speech_embeddings USING vec0(
      embedding FLOAT[1536]
    )
  `)

  // Create indexes for better performance
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

    // If this isn't the first chunk, try to find a good break point
    if (start > 0 && end < text.length) {
      // Look for sentence endings within the last 200 characters
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

    // Move start position with overlap
    start = end - overlap
    if (start >= text.length) break
  }

  return chunks
}

/**
 * Generate embedding for a text chunk
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    })

    return response.data[0].embedding
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error generating embedding:', errorMessage)
    throw error
  }
}

/**
 * Process a batch of chunks in parallel
 */
async function processBatchOfChunks(
  chunks: string[],
  speechId: number,
  insertChunk: Database.Statement<[number, string, number]>,
  insertEmbedding: Database.Statement<[string]>,
  updateChunkWithEmbeddingId: Database.Statement<[number, number]>,
  startIndex: number = 0
): Promise<ChunkProcessResult[]> {
  const promises = chunks.map(
    async (chunkText, i): Promise<ChunkProcessResult> => {
      const chunkIndex = startIndex + i

      try {
        // Insert chunk into database
        const result = insertChunk.run(speechId, chunkText, chunkIndex)
        const chunkId = result.lastInsertRowid as number

        // Generate embedding
        const embedding = await generateEmbedding(chunkText)

        // Store embedding
        const embeddingResult = insertEmbedding.run(JSON.stringify(embedding))
        const embeddingId = embeddingResult.lastInsertRowid as number

        // Update chunk with embedding ID
        updateChunkWithEmbeddingId.run(embeddingId, chunkId)

        return { success: true, chunkIndex, chunkId }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        console.error(
          `   ❌ Error processing chunk ${chunkIndex}:`,
          errorMessage
        )
        return { success: false, chunkIndex, error: errorMessage }
      }
    }
  )

  return Promise.all(promises)
}

/**
 * Process speeches and create chunks with embeddings
 */
async function processSpeeches(
  db: Database.Database,
  limit: number | null = null
): Promise<void> {
  console.log('📝 Processing speeches (starting with most recent years)...')

  // Get speeches to process for USA, prioritizing recent years and excluding already processed ones
  let query = `
    SELECT s.id, s.country_name, s.speaker, s.year, s.session, s.text 
    FROM speeches s
    LEFT JOIN speech_chunks c ON s.id = c.speech_id
    WHERE c.speech_id IS NULL AND s.country_code = 'USA'
    ORDER BY s.year DESC, s.session DESC, s.id ASC
  `
  if (limit) {
    query += ` LIMIT ${limit}`
  }

  const speeches = db.prepare(query).all() as Speech[]
  console.log(`Found ${speeches.length} unprocessed speeches to process`)

  if (speeches.length > 0) {
    const years = [...new Set(speeches.map((s) => s.year))].sort(
      (a, b) => b - a
    )
    console.log(
      `📅 Years to process: ${years.slice(0, 10).join(', ')}${years.length > 10 ? ' ...' : ''}`
    )
    console.log(`🎯 Starting with ${speeches[0].year} (most recent)`)
  }

  const insertChunk = db.prepare(`
    INSERT INTO speech_chunks (speech_id, chunk_text, chunk_index)
    VALUES (?, ?, ?)
  `)

  const insertEmbedding = db.prepare(`
    INSERT INTO speech_embeddings (embedding)
    VALUES (?)
  `)

  const updateChunkWithEmbeddingId = db.prepare(`
    UPDATE speech_chunks SET embedding_id = ? WHERE id = ?
  `)

  let processedCount = 0
  let totalChunks = 0
  let currentYear: number | null = null

  for (const speech of speeches) {
    const { id: speechId, country_name: country, speaker, year, text } = speech

    // Show progress when we move to a new year
    if (currentYear !== year) {
      if (currentYear !== null) {
        console.log(`📅 Completed processing ${currentYear}, moving to ${year}`)
      }
      currentYear = year
    }

    console.log(
      `🔄 Processing speech ${speechId} (${country}, ${speaker}, ${year})...`
    )

    try {
      // Split text into chunks
      const chunks = chunkText(text)
      console.log(`   Split into ${chunks.length} chunks`)

      // Process chunks in parallel batches
      let successfulChunks = 0

      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE)
        console.log(
          `   Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)} (${batch.length} chunks)...`
        )

        const results = await processBatchOfChunks(
          batch,
          speechId,
          insertChunk,
          insertEmbedding,
          updateChunkWithEmbeddingId,
          i
        )

        // Count successful/failed chunks
        const batchSuccessful = results.filter((r) => r.success).length
        const batchFailed = results.filter((r) => !r.success).length

        successfulChunks += batchSuccessful

        if (batchFailed > 0) {
          console.log(
            `   ⚠️  Batch completed with ${batchSuccessful} successful, ${batchFailed} failed`
          )
        } else {
          console.log(
            `   ✅ Batch completed successfully (${batchSuccessful} chunks)`
          )
        }

        totalChunks += batchSuccessful

        // Add delay between batches to respect rate limits
        if (i + BATCH_SIZE < chunks.length) {
          await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY))
        }
      }

      processedCount++
      console.log(
        `✅ Completed speech ${speechId} (${successfulChunks}/${chunks.length} chunks successful)`
      )

      // Small delay between speeches
      await new Promise((resolve) => setTimeout(resolve, 50))
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      console.error(`❌ Error processing speech ${speechId}:`, errorMessage)
      continue
    }
  }

  console.log(`\n📊 Processing complete:`)
  console.log(`   - Processed: ${processedCount} speeches`)
  console.log(`   - Total chunks: ${totalChunks}`)

  if (processedCount > 0) {
    const latestYear = speeches[0].year
    const oldestYear = speeches[processedCount - 1].year
    console.log(
      `   - Years processed: ${latestYear}${latestYear !== oldestYear ? ` to ${oldestYear}` : ''}`
    )
  }
}

/**
 * Verify the setup
 */
function verifySetup(db: Database.Database): void {
  console.log('\n🔍 Verifying setup...')

  try {
    // Check speech_chunks table
    const chunkCount = db
      .prepare('SELECT COUNT(*) as count FROM speech_chunks')
      .get() as { count: number }
    console.log(`   speech_chunks: ${chunkCount.count} rows`)

    // Check speech_embeddings table
    const embeddingCount = db
      .prepare('SELECT COUNT(*) as count FROM speech_embeddings')
      .get() as { count: number }
    console.log(`   speech_embeddings: ${embeddingCount.count} rows`)

    // Check for any chunks without embeddings
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

    // Sample a few chunks to verify data integrity
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
    // Initialize database
    db = initDatabase()

    // Create tables
    createTables(db)

    // Get processing limit from command line argument
    const limit = process.argv[2] ? parseInt(process.argv[2]) : null
    if (limit) {
      console.log(`📊 Processing limited to ${limit} speeches`)
    }

    // Process speeches
    await processSpeeches(db, limit)

    // Verify setup
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

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export {
  initDatabase,
  createTables,
  chunkText,
  generateEmbedding,
  processBatchOfChunks,
  processSpeeches,
  verifySetup,
  type Speech,
  type ChunkProcessResult,
}
