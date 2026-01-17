#!/usr/bin/env node --experimental-strip-types

import Database from 'better-sqlite3'
import { join, resolve } from 'path'
import { readFileSync } from 'fs'
import { pipeline } from '@xenova/transformers'

// Chunking configuration
const TARGET_CHUNK_SIZE = 1500 // Target chunk size in characters
const MIN_CHUNK_SIZE = 500 // Minimum chunk size (don't create tiny chunks)
const MAX_CHUNK_SIZE = 2500 // Maximum chunk size (hard limit)

// Embedding configuration
const EMBEDDING_DIMENSIONS = 384
const MODEL_NAME = 'Xenova/bge-small-en-v1.5'

// Global embedder instance (lazy loaded)
let embedder: Awaited<ReturnType<typeof pipeline>> | null = null

// Simple logger
const log = {
  info: (msg: string, data?: unknown) =>
    console.log(`[INFO] ${msg}`, data ? JSON.stringify(data) : ''),
  warn: (msg: string, data?: unknown) =>
    console.warn(`[WARN] ${msg}`, data ? JSON.stringify(data) : ''),
  error: (msg: string, data?: unknown) =>
    console.error(`[ERROR] ${msg}`, data ? JSON.stringify(data) : ''),
  debug: (msg: string, data?: unknown) =>
    console.log(`[DEBUG] ${msg}`, data ? JSON.stringify(data) : ''),
}

interface Speech {
  id: number
  text: string
  speaker: string
  country_name: string
  year: number
  session: number
}

interface Chunk {
  speechId: number
  chunkIndex: number
  text: string
  charStart: number
  charEnd: number
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text: string): string[] {
  // Match sentence endings: . ! ? followed by whitespace and capital letter (or end of string)
  // Also handles common abbreviations like Mr. Mrs. Dr. U.N. U.S. etc.
  const sentences: string[] = []

  // Split on sentence boundaries, but preserve the delimiter
  const parts = text.split(/(?<=[.!?])\s+(?=[A-Z"']|$)/)

  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.length > 0) {
      sentences.push(trimmed)
    }
  }

  return sentences
}

/**
 * Split text into chunks using sentence boundaries
 * Groups complete sentences until target size is reached
 */
function chunkText(text: string, speechId: number): Chunk[] {
  const chunks: Chunk[] = []

  // Clean up the text - normalize whitespace
  const cleanText = text.replace(/\s+/g, ' ').trim()

  // If text is small enough, return as single chunk
  if (cleanText.length <= TARGET_CHUNK_SIZE) {
    return [
      {
        speechId,
        chunkIndex: 0,
        text: cleanText,
        charStart: 0,
        charEnd: cleanText.length,
      },
    ]
  }

  // Split into sentences
  const sentences = splitIntoSentences(cleanText)

  let currentChunk: string[] = []
  let currentLength = 0
  let chunkIndex = 0
  let charStart = 0

  for (const sentence of sentences) {
    const sentenceLength = sentence.length + 1 // +1 for space

    // If adding this sentence would exceed max size, and we have content, save current chunk
    if (currentLength + sentenceLength > MAX_CHUNK_SIZE && currentChunk.length > 0) {
      const chunkText = currentChunk.join(' ')
      chunks.push({
        speechId,
        chunkIndex,
        text: chunkText,
        charStart,
        charEnd: charStart + chunkText.length,
      })
      chunkIndex++
      charStart += chunkText.length + 1
      currentChunk = []
      currentLength = 0
    }

    // Add sentence to current chunk
    currentChunk.push(sentence)
    currentLength += sentenceLength

    // If we've reached target size, save chunk (unless next sentence would make it too small)
    if (currentLength >= TARGET_CHUNK_SIZE) {
      const chunkText = currentChunk.join(' ')
      chunks.push({
        speechId,
        chunkIndex,
        text: chunkText,
        charStart,
        charEnd: charStart + chunkText.length,
      })
      chunkIndex++
      charStart += chunkText.length + 1
      currentChunk = []
      currentLength = 0
    }
  }

  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    const chunkText = currentChunk.join(' ')
    // If last chunk is too small, merge with previous (if exists)
    if (chunkText.length < MIN_CHUNK_SIZE && chunks.length > 0) {
      const lastChunk = chunks[chunks.length - 1]
      lastChunk.text = lastChunk.text + ' ' + chunkText
      lastChunk.charEnd = lastChunk.charStart + lastChunk.text.length
    } else {
      chunks.push({
        speechId,
        chunkIndex,
        text: chunkText,
        charStart,
        charEnd: charStart + chunkText.length,
      })
    }
  }

  return chunks
}

/**
 * Initialize the embedding model
 */
async function initEmbedder() {
  if (!embedder) {
    log.info('Initializing local embedding model', {
      model: MODEL_NAME,
      dimensions: EMBEDDING_DIMENSIONS,
    })

    embedder = await pipeline('feature-extraction', MODEL_NAME)

    log.info('Embedding model initialized successfully')
  }
  return embedder
}

/**
 * Generate embeddings for an array of texts
 */
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const model = await initEmbedder()

  const embeddings = await Promise.all(
    texts.map(async (text) => {
      // Truncate text if too long (model has max token limit)
      const truncated = text.slice(0, 8000)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const output = await model(truncated, {
        pooling: 'mean',
        normalize: true,
      } as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return Array.from((output as any).data) as number[]
    })
  )

  return embeddings
}

/**
 * Initialize database and create chunks tables
 */
function initDatabase(db: ReturnType<typeof Database>) {
  const createTableSQL = readFileSync(
    join(process.cwd(), 'scripts', 'create-chunks-table.sql'),
    'utf8'
  )

  // Execute the entire SQL file - better-sqlite3 handles multiple statements
  try {
    db.exec(createTableSQL)
    log.info('Database schema initialized')
  } catch (error) {
    const errorMsg = String(error)
    // Ignore "already exists" errors - schema already set up
    if (!errorMsg.includes('already exists')) {
      log.error('SQL execution failed', { error })
      throw error
    }
    log.info('Database schema already exists')
  }
}

/**
 * Get speeches from specified years
 * If reprocessAll is true, returns all speeches (existing chunks will be replaced)
 * Otherwise, only returns speeches without any chunks
 */
function getSpeeches(
  db: ReturnType<typeof Database>,
  startYear: number,
  endYear: number,
  reprocessAll: boolean = false
): Speech[] {
  log.info('Fetching speeches', { startYear, endYear, reprocessAll })

  const query = reprocessAll
    ? `
      SELECT s.id, s.text, s.speaker, s.country_name, s.year, s.session
      FROM speeches s
      WHERE s.year >= ? AND s.year <= ?
      ORDER BY s.year DESC, s.id
    `
    : `
      SELECT s.id, s.text, s.speaker, s.country_name, s.year, s.session
      FROM speeches s
      WHERE s.year >= ? AND s.year <= ?
        AND NOT EXISTS (SELECT 1 FROM chunks c WHERE c.speech_id = s.id)
      ORDER BY s.year DESC, s.id
    `

  const speeches = db.prepare(query).all(startYear, endYear) as Speech[]
  log.info('Speeches found', { count: speeches.length })

  return speeches
}

/**
 * Store chunks and their embeddings in the database
 * Returns true if stored successfully, false if speech already has chunks (skipped)
 */
function storeChunksWithEmbeddings(
  db: ReturnType<typeof Database>,
  chunks: Chunk[],
  embeddings: number[][]
): boolean {
  if (chunks.length === 0) return true

  const speechId = chunks[0].speechId

  // Check if speech already has chunks
  const existing = db
    .prepare('SELECT COUNT(*) as count FROM chunks WHERE speech_id = ?')
    .get(speechId) as { count: number }

  if (existing.count > 0) {
    return false // Skip - already processed
  }

  const insertChunk = db.prepare(`
    INSERT INTO chunks (speech_id, chunk_index, text, char_start, char_end)
    VALUES (?, ?, ?, ?, ?)
  `)

  const insertEmbedding = db.prepare(`
    INSERT INTO chunk_embeddings (chunk_id, embedding, dimensions, model)
    VALUES (?, ?, ?, ?)
  `)

  const transaction = db.transaction(() => {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const embedding = embeddings[i]

      // Insert chunk
      const result = insertChunk.run(
        chunk.speechId,
        chunk.chunkIndex,
        chunk.text,
        chunk.charStart,
        chunk.charEnd
      )

      const chunkId = result.lastInsertRowid

      // Insert embedding
      const float32Array = new Float32Array(embedding)
      const buffer = Buffer.from(float32Array.buffer)
      insertEmbedding.run(chunkId, buffer, EMBEDDING_DIMENSIONS, MODEL_NAME)
    }
  })

  transaction()
  return true
}

/**
 * Process a single speech: chunk it and generate embeddings
 * Returns -1 if skipped (already processed), 0 if no chunks, or chunk count
 */
async function processSpeech(
  db: ReturnType<typeof Database>,
  speech: Speech
): Promise<number> {
  // Generate chunks
  const chunks = chunkText(speech.text, speech.id)

  if (chunks.length === 0) {
    log.warn('No chunks generated', { speechId: speech.id })
    return 0
  }

  // Generate embeddings for all chunks
  const texts = chunks.map((c) => c.text)
  const embeddings = await generateEmbeddings(texts)

  // Store chunks and embeddings (returns false if already exists)
  const stored = storeChunksWithEmbeddings(db, chunks, embeddings)

  return stored ? chunks.length : -1
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  const startYear = args[0] ? parseInt(args[0]) : 2023
  const endYear = args[1] ? parseInt(args[1]) : 2024

  log.info('Starting chunking pipeline', {
    startYear,
    endYear,
    targetChunkSize: TARGET_CHUNK_SIZE,
    minChunkSize: MIN_CHUNK_SIZE,
    maxChunkSize: MAX_CHUNK_SIZE,
    model: MODEL_NAME,
  })

  const dbPath = resolve(process.cwd(), 'data', 'un_speeches.db')
  const db = new Database(dbPath)

  try {
    // Initialize database schema
    initDatabase(db)

    // Get speeches to process (pass true as 4th arg to reprocess all)
    const reprocessAll = args[2] === 'all'
    const speeches = getSpeeches(db, startYear, endYear, reprocessAll)

    if (speeches.length === 0) {
      log.info('No speeches to process')
      process.exit(0)
    }

    log.info('Processing speeches', { count: speeches.length })

    let totalChunks = 0
    let processed = 0
    let skipped = 0

    for (const speech of speeches) {
      const startTime = Date.now()
      const chunkCount = await processSpeech(db, speech)
      const duration = Date.now() - startTime

      if (chunkCount === -1) {
        skipped++
        log.info(`Skipped ${processed + skipped}/${speeches.length} (already processed)`, {
          speechId: speech.id,
          year: speech.year,
          country: speech.country_name,
        })
      } else {
        totalChunks += chunkCount
        processed++
        log.info(`Processed ${processed}/${speeches.length - skipped}`, {
          speechId: speech.id,
          year: speech.year,
          country: speech.country_name,
          chunks: chunkCount,
          durationMs: duration,
        })
      }
    }

    // Final stats
    const chunkCount = db
      .prepare('SELECT COUNT(*) as count FROM chunks')
      .get() as { count: number }
    const embeddingCount = db
      .prepare('SELECT COUNT(*) as count FROM chunk_embeddings')
      .get() as { count: number }

    log.info('Chunking completed!', {
      speechesProcessed: processed,
      speechesSkipped: skipped,
      totalChunks: totalChunks,
      chunksInDb: chunkCount.count,
      embeddingsInDb: embeddingCount.count,
    })
  } catch (error) {
    log.error('Failed to generate chunks', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    process.exit(1)
  } finally {
    db.close()
  }
}

main()
