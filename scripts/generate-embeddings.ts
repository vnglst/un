#!/usr/bin/env node --experimental-strip-types

import Database from 'better-sqlite3'
import { join, resolve } from 'path'
import { readFileSync } from 'fs'
import { pipeline } from '@xenova/transformers'
import { load as loadSqliteVec } from 'sqlite-vec'

// Embedding configuration
const EMBEDDING_DIMENSIONS = 384
const MODEL_NAME = 'Xenova/bge-small-en-v1.5'

// Global embedder instance (lazy loaded)
let embedder: Awaited<ReturnType<typeof pipeline>> | null = null

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

  log.debug('Generating embeddings', { textCount: texts.length })

  const startTime = Date.now()

  const embeddings = await Promise.all(
    texts.map(async (text) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const output = await model(text, {
        pooling: 'mean',
        normalize: true,
      } as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return Array.from((output as any).data) as number[]
    })
  )

  const duration = Date.now() - startTime
  log.info('Embeddings generated', {
    count: embeddings.length,
    dimensions: embeddings[0]?.length || 0,
    durationMs: duration,
    avgMs: Math.round(duration / embeddings.length),
  })

  return embeddings
}

// Simple logger for script
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

/**
 * Initialize database and create embeddings table
 */
function initDatabase(db: ReturnType<typeof Database>) {
  // Rename existing virtual table if it exists (from previous OpenAI/vec0 implementation)
  try {
    db.exec(
      'ALTER TABLE speech_embeddings RENAME TO speech_embeddings_old_vec0'
    )
    log.info(
      'Renamed existing speech_embeddings table to speech_embeddings_old_vec0'
    )
  } catch {
    // Table might not exist, continue
    log.info('No existing speech_embeddings table to rename')
  }

  const createTableSQL = readFileSync(
    join(process.cwd(), 'scripts', 'create-embeddings-table.sql'),
    'utf8'
  )

  // Remove comments and split into statements
  const sqlWithoutComments = createTableSQL
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')

  const statements = sqlWithoutComments
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  for (const statement of statements) {
    try {
      db.exec(statement)
      log.info('Executed SQL', {
        statement: statement.substring(0, 80) + '...',
      })
    } catch (error) {
      log.error('SQL execution failed', { statement, error })
      throw error
    }
  }

  log.info('Created new speech_embeddings table with indexes')
}

/**
 * Get speeches from a specific year that don't have embeddings yet
 */
function getSpeechesWithoutEmbeddings(
  db: ReturnType<typeof Database>,
  year: number
): Speech[] {
  log.info('Fetching speeches without embeddings', { year })

  const query = `
    SELECT s.id, s.text, s.speaker, s.country_name, s.year, s.session
    FROM speeches s
    LEFT JOIN speech_embeddings se ON s.id = se.speech_id
    WHERE s.year = ? AND se.id IS NULL
    ORDER BY s.id
  `

  const speeches = db.prepare(query).all(year) as Speech[]
  log.info('Speeches found', { count: speeches.length, year })

  return speeches
}

/**
 * Store embedding in database
 */
function storeEmbedding(
  db: ReturnType<typeof Database>,
  speechId: number,
  embedding: number[]
) {
  // Convert embedding to BLOB (Float32Array)
  const float32Array = new Float32Array(embedding)
  const buffer = Buffer.from(float32Array.buffer)

  const stmt = db.prepare(`
    INSERT INTO speech_embeddings (speech_id, embedding, dimensions, model)
    VALUES (?, ?, ?, ?)
  `)

  stmt.run(speechId, buffer, EMBEDDING_DIMENSIONS, MODEL_NAME)
}

/**
 * Process speeches in batches
 */
async function processSpeechesBatch(
  db: ReturnType<typeof Database>,
  speeches: Speech[],
  batchSize: number = 10
) {
  const totalBatches = Math.ceil(speeches.length / batchSize)

  for (let i = 0; i < speeches.length; i += batchSize) {
    const batch = speeches.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1

    log.info(`Processing batch ${batchNum}/${totalBatches}`, {
      speeches: batch.length,
      range: `${batch[0].id}-${batch[batch.length - 1].id}`,
    })

    // Generate embeddings for this batch
    const texts = batch.map((s) => s.text)
    const startTime = Date.now()
    const embeddings = await generateEmbeddings(texts)
    const duration = Date.now() - startTime

    log.info('Batch embeddings generated', {
      count: embeddings.length,
      durationMs: duration,
      avgMs: Math.round(duration / embeddings.length),
    })

    // Store embeddings in database
    const transaction = db.transaction(() => {
      for (let j = 0; j < batch.length; j++) {
        storeEmbedding(db, batch[j].id, embeddings[j])
      }
    })

    transaction()

    log.info(`Batch ${batchNum}/${totalBatches} completed`, {
      stored: batch.length,
      totalProcessed: Math.min(i + batchSize, speeches.length),
      totalRemaining: Math.max(speeches.length - (i + batchSize), 0),
    })
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  const year = args[0] ? parseInt(args[0]) : 2024
  const batchSize = args[1] ? parseInt(args[1]) : 10

  log.info('Starting embeddings generation', {
    year,
    batchSize,
    model: 'bge-small-en-v1.5',
    dimensions: EMBEDDING_DIMENSIONS,
  })

  const dbPath = resolve(process.cwd(), 'data', 'un_speeches.db')
  const db = new Database(dbPath)

  // Load sqlite-vec extension (needed to drop existing virtual table)
  try {
    loadSqliteVec(db)
    log.info('sqlite-vec extension loaded')
  } catch (error) {
    log.warn('Failed to load sqlite-vec extension', { error })
  }

  // Initialize database schema
  initDatabase(db)

  try {
    // Get speeches that need embeddings
    const speeches = getSpeechesWithoutEmbeddings(db, year)

    if (speeches.length === 0) {
      log.info('No speeches to process', { year })
      process.exit(0)
    }

    log.info('Starting batch processing', {
      totalSpeeches: speeches.length,
      batchSize,
      estimatedBatches: Math.ceil(speeches.length / batchSize),
    })

    // Process speeches in batches
    await processSpeechesBatch(db, speeches, batchSize)

    // Verify results
    const embeddingsCount = db
      .prepare(
        'SELECT COUNT(*) as count FROM speech_embeddings WHERE speech_id IN (SELECT id FROM speeches WHERE year = ?)'
      )
      .get(year) as { count: number }

    log.info('Embeddings generation completed successfully!', {
      year,
      totalEmbeddings: embeddingsCount.count,
      totalSpeeches: speeches.length,
    })
  } catch (error) {
    log.error('Failed to generate embeddings', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    process.exit(1)
  } finally {
    db.close()
  }
}

main()
