#!/usr/bin/env node --experimental-strip-types

import Database from 'better-sqlite3'
import { resolve } from 'path'
import { pipeline } from '@xenova/transformers'

const MODEL_NAME = 'Xenova/bge-small-en-v1.5'

let embedder: Awaited<ReturnType<typeof pipeline>> | null = null

async function initEmbedder() {
  if (!embedder) {
    console.log('Loading embedding model...')
    embedder = await pipeline('feature-extraction', MODEL_NAME)
  }
  return embedder
}

async function generateEmbedding(text: string): Promise<number[]> {
  const model = await initEmbedder()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output = await model(text, { pooling: 'mean', normalize: true } as any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Array.from((output as any).data) as number[]
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
  }
  return dotProduct // Already normalized, so dot product = cosine similarity
}

interface SearchResult {
  chunkId: number
  speechId: number
  year: number
  country: string
  speaker: string
  chunkIndex: number
  text: string
  similarity: number
}

async function searchChunks(
  db: ReturnType<typeof Database>,
  query: string,
  limit: number = 10,
  yearFilter?: { start?: number; end?: number }
): Promise<SearchResult[]> {
  // Generate query embedding
  console.log(`\nSearching for: "${query}"`)
  const queryEmbedding = await generateEmbedding(query)

  // Get all chunk embeddings with metadata
  let sql = `
    SELECT
      c.id as chunk_id,
      c.speech_id,
      c.chunk_index,
      c.text,
      s.year,
      s.country_name as country,
      s.speaker,
      ce.embedding
    FROM chunks c
    JOIN speeches s ON c.speech_id = s.id
    JOIN chunk_embeddings ce ON c.id = ce.chunk_id
  `

  const conditions: string[] = []
  const params: (number | undefined)[] = []

  if (yearFilter?.start) {
    conditions.push('s.year >= ?')
    params.push(yearFilter.start)
  }
  if (yearFilter?.end) {
    conditions.push('s.year <= ?')
    params.push(yearFilter.end)
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ')
  }

  const rows = db.prepare(sql).all(...params) as Array<{
    chunk_id: number
    speech_id: number
    chunk_index: number
    text: string
    year: number
    country: string
    speaker: string
    embedding: Buffer
  }>

  console.log(`Comparing against ${rows.length} chunks...`)

  // Calculate similarities
  const results: SearchResult[] = rows.map((row) => {
    const embeddingArray = new Float32Array(row.embedding.buffer)
    const similarity = cosineSimilarity(
      queryEmbedding,
      Array.from(embeddingArray)
    )

    return {
      chunkId: row.chunk_id,
      speechId: row.speech_id,
      year: row.year,
      country: row.country,
      speaker: row.speaker,
      chunkIndex: row.chunk_index,
      text: row.text,
      similarity,
    }
  })

  // Sort by similarity and return top results
  results.sort((a, b) => b.similarity - a.similarity)
  return results.slice(0, limit)
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('Usage: npx ts-node scripts/search-chunks.ts "<query>"')
    console.log('Examples:')
    console.log('  npx ts-node scripts/search-chunks.ts "Greenland sovereignty"')
    console.log('  npx ts-node scripts/search-chunks.ts "nuclear disarmament"')
    console.log('  npx ts-node scripts/search-chunks.ts "climate change islands"')
    process.exit(0)
  }

  const query = args[0]

  const dbPath = resolve(process.cwd(), 'data', 'un_speeches.db')
  const db = new Database(dbPath)

  try {
    const results = await searchChunks(db, query, 15)

    console.log('\n' + '='.repeat(80))
    console.log(`TOP RESULTS FOR: "${query}"`)
    console.log('='.repeat(80))

    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      console.log(`\n[${i + 1}] Score: ${r.similarity.toFixed(4)} | ${r.year} | ${r.country} | ${r.speaker || 'Unknown'}`)
      console.log('-'.repeat(80))
      console.log(r.text)
    }

    console.log('\n' + '='.repeat(80))
  } finally {
    db.close()
  }
}

main()
