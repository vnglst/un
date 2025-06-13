#!/usr/bin/env node

/**
 * Vector search utilities for the RAG pipeline
 * Provides semantic search functionality using sqlite-vec
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

/**
 * Initialize database connection with sqlite-vec extension
 */
function initDatabase() {
  if (!existsSync(DB_PATH)) {
    throw new Error(`Database file not found at ${DB_PATH}`)
  }

  const db = new Database(DB_PATH, { readonly: true })

  try {
    // Load sqlite-vec extension
    load(db)
  } catch (error) {
    console.error('Failed to load sqlite-vec extension:', error.message)
    throw error
  }

  return db
}

/**
 * Generate embedding for search query
 */
async function generateQueryEmbedding(query) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
      encoding_format: 'float',
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error.message)
    throw error
  }
}

/**
 * Perform semantic search using vector similarity
 */
async function semanticSearch(db, query, limit = 5, threshold = null) {
  // Generate embedding for the query
  const queryEmbedding = await generateQueryEmbedding(query)

  // Prepare the search query
  let searchQuery = `
    SELECT 
      c.id as chunk_id,
      c.chunk_text,
      c.chunk_index,
      s.id as speech_id,
      s.country_name as country,
      s.speaker,
      s.year,
      s.session,
      vec_distance_cosine(e.embedding, ?) as distance
    FROM speech_chunks c
    JOIN speech_embeddings e ON c.embedding_id = e.rowid
    JOIN speeches s ON c.speech_id = s.id
    ORDER BY distance ASC
    LIMIT ?
  `

  const params = [JSON.stringify(queryEmbedding), limit]

  // Add threshold filter if provided
  if (threshold !== null) {
    searchQuery = searchQuery.replace(
      'ORDER BY distance ASC',
      'WHERE vec_distance_cosine(e.embedding, ?) <= ? ORDER BY distance ASC'
    )
    params.splice(1, 0, JSON.stringify(queryEmbedding), threshold)
  }

  try {
    const results = db.prepare(searchQuery).all(...params)
    return results
  } catch (error) {
    console.error('Error performing semantic search:', error.message)
    throw error
  }
}

/**
 * Search for similar chunks to a given chunk
 */
async function findSimilarChunks(db, chunkId, limit = 5) {
  // Get the embedding for the given chunk
  const chunk = db
    .prepare(
      `
    SELECT embedding_id FROM speech_chunks WHERE id = ?
  `
    )
    .get(chunkId)

  if (!chunk || !chunk.embedding_id) {
    throw new Error(`Chunk ${chunkId} not found or has no embedding`)
  }

  const chunkEmbedding = db
    .prepare(
      `
    SELECT embedding FROM speech_embeddings WHERE rowid = ?
  `
    )
    .get(chunk.embedding_id)

  if (!chunkEmbedding) {
    throw new Error(`Chunk ${chunkId} not found`)
  }

  // Find similar chunks
  const results = db
    .prepare(
      `
    SELECT 
      c.id as chunk_id,
      c.chunk_text,
      c.chunk_index,
      s.id as speech_id,
      s.country_name as country,
      s.speaker,
      s.year,
      s.session,
      vec_distance_cosine(e.embedding, ?) as distance
    FROM speech_chunks c
    JOIN speech_embeddings e ON c.embedding_id = e.rowid
    JOIN speeches s ON c.speech_id = s.id
    WHERE c.id != ?
    ORDER BY distance ASC
    LIMIT ?
  `
    )
    .all(chunkEmbedding.embedding, chunkId, limit)

  return results
}

/**
 * Get context for a search result (surrounding chunks from the same speech)
 */
function getChunkContext(db, chunkId, contextSize = 1) {
  const chunk = db
    .prepare(
      `
    SELECT c.*, s.country_name, s.speaker, s.year, s.session
    FROM speech_chunks c
    JOIN speeches s ON c.speech_id = s.id
    WHERE c.id = ?
  `
    )
    .get(chunkId)

  if (!chunk) {
    return null
  }

  // Get surrounding chunks from the same speech
  const contextChunks = db
    .prepare(
      `
    SELECT id, chunk_text, chunk_index
    FROM speech_chunks
    WHERE speech_id = ? 
      AND chunk_index BETWEEN ? AND ?
    ORDER BY chunk_index ASC
  `
    )
    .all(
      chunk.speech_id,
      chunk.chunk_index - contextSize,
      chunk.chunk_index + contextSize
    )

  return {
    mainChunk: chunk,
    contextChunks,
    fullContext: contextChunks.map((c) => c.chunk_text).join(' '),
  }
}

/**
 * Perform advanced search with filters
 */
async function advancedSearch(db, query, filters = {}, limit = 5) {
  const { country, year, speaker, minYear, maxYear } = filters

  // Generate embedding for the query
  const queryEmbedding = await generateQueryEmbedding(query)

  // Build WHERE clause for filters
  const conditions = []
  const params = [JSON.stringify(queryEmbedding)]

  if (country) {
    conditions.push('s.country_name = ?')
    params.push(country)
  }

  if (year) {
    conditions.push('s.year = ?')
    params.push(year)
  }

  if (speaker) {
    conditions.push('s.speaker LIKE ?')
    params.push(`%${speaker}%`)
  }

  if (minYear) {
    conditions.push('s.year >= ?')
    params.push(minYear)
  }

  if (maxYear) {
    conditions.push('s.year <= ?')
    params.push(maxYear)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  params.push(limit)

  const searchQuery = `
    SELECT 
      c.id as chunk_id,
      c.chunk_text,
      c.chunk_index,
      s.id as speech_id,
      s.country_name as country,
      s.speaker,
      s.year,
      s.session,
      vec_distance_cosine(e.embedding, ?) as distance
    FROM speech_chunks c
    JOIN speech_embeddings e ON c.embedding_id = e.rowid
    JOIN speeches s ON c.speech_id = s.id
    ${whereClause}
    ORDER BY distance ASC
    LIMIT ?
  `

  try {
    const results = db.prepare(searchQuery).all(...params)
    return results
  } catch (error) {
    console.error('Error performing advanced search:', error.message)
    throw error
  }
}

/**
 * Get search statistics
 */
function getSearchStats(db) {
  const stats = {}

  try {
    // Total chunks and embeddings
    stats.totalChunks = db
      .prepare('SELECT COUNT(*) as count FROM speech_chunks')
      .get().count
    stats.totalEmbeddings = db
      .prepare('SELECT COUNT(*) as count FROM speech_embeddings')
      .get().count

    // Chunks per speech statistics
    const chunkStats = db
      .prepare(
        `
      SELECT 
        AVG(chunk_count) as avg_chunks,
        MIN(chunk_count) as min_chunks,
        MAX(chunk_count) as max_chunks
      FROM (
        SELECT COUNT(*) as chunk_count
        FROM speech_chunks
        GROUP BY speech_id
      )
    `
      )
      .get()

    stats.avgChunksPerSpeech = Math.round(chunkStats.avg_chunks * 100) / 100
    stats.minChunksPerSpeech = chunkStats.min_chunks
    stats.maxChunksPerSpeech = chunkStats.max_chunks

    // Coverage by country
    stats.countryCoverage = db
      .prepare(
        `
      SELECT 
        s.country_name as country,
        COUNT(DISTINCT s.id) as speeches,
        COUNT(c.id) as chunks
      FROM speeches s
      LEFT JOIN speech_chunks c ON s.id = c.speech_id
      GROUP BY s.country_name
      ORDER BY chunks DESC
      LIMIT 10
    `
      )
      .all()

    // Coverage by year
    stats.yearCoverage = db
      .prepare(
        `
      SELECT 
        s.year,
        COUNT(DISTINCT s.id) as speeches,
        COUNT(c.id) as chunks
      FROM speeches s
      LEFT JOIN speech_chunks c ON s.id = c.speech_id
      GROUP BY s.year
      ORDER BY s.year DESC
      LIMIT 10
    `
      )
      .all()
  } catch (error) {
    console.error('Error getting search stats:', error.message)
  }

  return stats
}

export {
  initDatabase,
  generateQueryEmbedding,
  semanticSearch,
  findSimilarChunks,
  getChunkContext,
  advancedSearch,
  getSearchStats,
}
