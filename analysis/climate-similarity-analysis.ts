#!/usr/bin/env node

/**
 * Climate Change Similarity Analysis for USA Speeches
 *
 * This script analyzes the similarity of USA UN General Assembly speech chunks
 * to the phrase "Climate change is one of the major challenges the world is currently facing"
 * over the last 25 years (2000-2024).
 *
 * The script uses OpenAI embeddings and cosine similarity to measure semantic similarity.
 */

import Database from 'better-sqlite3'
import { OpenAI } from 'openai'
import { config } from 'dotenv'
import { existsSync, writeFileSync } from 'fs'
import { join } from 'path'
import { load } from 'sqlite-vec'

// Load environment variables
config()

// Configuration
const DB_PATH = join(process.cwd(), 'data', 'un_speeches.db')
const TARGET_PHRASE =
  'Climate change is one of the major challenges the world is currently facing'
const COUNTRY_CODE = 'USA' // USA country code
const START_YEAR = 2000
const END_YEAR = 2024

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Types
interface ChunkSimilarity {
  chunkId: number
  speechId: number
  year: number
  session: number
  speaker: string | null
  chunkText: string
  chunkIndex: number
  similarity: number
  distance: number
}

interface YearlyAnalysis {
  year: number
  totalChunks: number
  averageSimilarity: number
  maxSimilarity: number
  minSimilarity: number
  topChunks: ChunkSimilarity[]
  speechCount: number
}

interface AnalysisResult {
  targetPhrase: string
  countryCode: string
  yearRange: { start: number; end: number }
  totalChunks: number
  overallStats: {
    averageSimilarity: number
    maxSimilarity: number
    minSimilarity: number
  }
  yearlyAnalysis: YearlyAnalysis[]
  topSimilarChunks: ChunkSimilarity[]
  trendData: Array<{
    year: number
    avgSimilarity: number
    maxSimilarity: number
  }>
}

/**
 * Initialize database connection and load sqlite-vec extension
 */
function initializeDatabase(): Database.Database {
  if (!existsSync(DB_PATH)) {
    console.error(`Database file not found at ${DB_PATH}`)
    console.error(
      'Please run "npm run db:setup" to download and set up the database'
    )
    process.exit(1)
  }

  const db = new Database(DB_PATH)

  // Load sqlite-vec extension
  try {
    load(db)
    console.log('✓ SQLite-vec extension loaded successfully')
  } catch (error) {
    console.error('Failed to load sqlite-vec extension:', error)
    process.exit(1)
  }

  return db
}

/**
 * Generate embedding for the target phrase using OpenAI
 */
async function generateTargetEmbedding(phrase: string): Promise<number[]> {
  console.log(`Generating embedding for target phrase: "${phrase}"`)

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: phrase,
      encoding_format: 'float',
    })

    const embedding = response.data[0].embedding
    console.log(`✓ Generated embedding with ${embedding.length} dimensions`)
    return embedding
  } catch (error) {
    console.error('Error generating target embedding:', error)
    throw error
  }
}

/**
 * Get all USA speech chunks from the specified year range
 */
function getUSAChunks(db: Database.Database): ChunkSimilarity[] {
  console.log(`Fetching USA speech chunks from ${START_YEAR} to ${END_YEAR}...`)

  const query = `
    SELECT 
      c.id as chunkId,
      c.speech_id as speechId,
      s.year,
      s.session,
      s.speaker,
      c.chunk_text as chunkText,
      c.chunk_index as chunkIndex,
      c.embedding_id
    FROM speech_chunks c
    JOIN speeches s ON c.speech_id = s.id
    WHERE s.country_code = ? 
      AND s.year >= ? 
      AND s.year <= ?
      AND c.embedding_id IS NOT NULL
    ORDER BY s.year, s.session, c.chunk_index
  `

  const chunks = db
    .prepare(query)
    .all(COUNTRY_CODE, START_YEAR, END_YEAR) as Array<{
    chunkId: number
    speechId: number
    year: number
    session: number
    speaker: string | null
    chunkText: string
    chunkIndex: number
    embedding_id: number
  }>

  console.log(`✓ Found ${chunks.length} USA chunks with embeddings`)

  return chunks.map((chunk) => ({
    ...chunk,
    similarity: 0, // Will be calculated later
    distance: 0, // Will be calculated later
  }))
}

/**
 * Calculate similarity between target phrase and all chunks
 */
async function calculateSimilarities(
  db: Database.Database,
  chunks: ChunkSimilarity[],
  targetEmbedding: number[]
): Promise<ChunkSimilarity[]> {
  console.log('Calculating similarities using cosine distance...')

  const targetEmbeddingJSON = JSON.stringify(targetEmbedding)

  // Get embeddings and calculate similarities in batches
  const batchSize = 100
  const results: ChunkSimilarity[] = []

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)
    const embeddingIds = batch.map((chunk) => chunk.chunkId)

    // Get embeddings for this batch
    const embeddings = db
      .prepare(
        `
      SELECT 
        sc.id as chunkId,
        vec_distance_cosine(se.embedding, ?) as distance
      FROM speech_chunks sc
      JOIN speech_embeddings se ON sc.embedding_id = se.rowid
      WHERE sc.id IN (${embeddingIds.map(() => '?').join(',')})
    `
      )
      .all(targetEmbeddingJSON, ...embeddingIds) as Array<{
      chunkId: number
      distance: number
    }>

    // Merge distance data with chunk data
    const batchResults = batch.map((chunk) => {
      const embeddingData = embeddings.find((e) => e.chunkId === chunk.chunkId)
      const distance = embeddingData?.distance ?? 1.0
      const similarity = 1 - distance // Convert distance to similarity

      return {
        ...chunk,
        distance,
        similarity,
      }
    })

    results.push(...batchResults)

    if ((i + batchSize) % 500 === 0 || i + batchSize >= chunks.length) {
      console.log(
        `  Processed ${Math.min(i + batchSize, chunks.length)}/${chunks.length} chunks`
      )
    }
  }

  console.log('✓ Similarity calculations completed')
  return results
}

/**
 * Analyze chunks by year
 */
function analyzeByYear(chunks: ChunkSimilarity[]): YearlyAnalysis[] {
  console.log('Analyzing similarities by year...')

  const yearGroups = new Map<number, ChunkSimilarity[]>()

  // Group chunks by year
  chunks.forEach((chunk) => {
    if (!yearGroups.has(chunk.year)) {
      yearGroups.set(chunk.year, [])
    }
    yearGroups.get(chunk.year)!.push(chunk)
  })

  // Analyze each year
  const yearlyAnalysis: YearlyAnalysis[] = []

  for (const [year, yearChunks] of yearGroups.entries()) {
    const similarities = yearChunks.map((c) => c.similarity)
    const uniqueSpeeches = new Set(yearChunks.map((c) => c.speechId)).size

    const analysis: YearlyAnalysis = {
      year,
      totalChunks: yearChunks.length,
      averageSimilarity:
        similarities.reduce((a, b) => a + b, 0) / similarities.length,
      maxSimilarity: Math.max(...similarities),
      minSimilarity: Math.min(...similarities),
      topChunks: yearChunks
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5), // Top 5 most similar chunks per year
      speechCount: uniqueSpeeches,
    }

    yearlyAnalysis.push(analysis)
  }

  yearlyAnalysis.sort((a, b) => a.year - b.year)
  console.log(`✓ Analyzed ${yearlyAnalysis.length} years`)

  return yearlyAnalysis
}

/**
 * Generate comprehensive analysis result
 */
function generateAnalysisResult(
  chunks: ChunkSimilarity[],
  yearlyAnalysis: YearlyAnalysis[]
): AnalysisResult {
  const similarities = chunks.map((c) => c.similarity)

  const result: AnalysisResult = {
    targetPhrase: TARGET_PHRASE,
    countryCode: COUNTRY_CODE,
    yearRange: { start: START_YEAR, end: END_YEAR },
    totalChunks: chunks.length,
    overallStats: {
      averageSimilarity:
        similarities.reduce((a, b) => a + b, 0) / similarities.length,
      maxSimilarity: Math.max(...similarities),
      minSimilarity: Math.min(...similarities),
    },
    yearlyAnalysis,
    topSimilarChunks: chunks
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 20), // Top 20 most similar chunks overall
    trendData: yearlyAnalysis.map((ya) => ({
      year: ya.year,
      avgSimilarity: ya.averageSimilarity,
      maxSimilarity: ya.maxSimilarity,
    })),
  }

  return result
}

/**
 * Save results to JSON file
 */
function saveResults(result: AnalysisResult): void {
  const outputPath = join(
    process.cwd(),
    'analysis',
    'climate-similarity-results.json'
  )
  writeFileSync(outputPath, JSON.stringify(result, null, 2))
  console.log(`✓ Results saved to ${outputPath}`)
}

/**
 * Print summary to console
 */
function printSummary(result: AnalysisResult): void {
  console.log('\n' + '='.repeat(80))
  console.log('CLIMATE CHANGE SIMILARITY ANALYSIS - SUMMARY')
  console.log('='.repeat(80))
  console.log(`Target Phrase: "${result.targetPhrase}"`)
  console.log(`Country: ${result.countryCode}`)
  console.log(`Year Range: ${result.yearRange.start}-${result.yearRange.end}`)
  console.log(`Total Chunks Analyzed: ${result.totalChunks}`)
  console.log()

  console.log('OVERALL STATISTICS:')
  console.log(
    `  Average Similarity: ${(result.overallStats.averageSimilarity * 100).toFixed(2)}%`
  )
  console.log(
    `  Maximum Similarity: ${(result.overallStats.maxSimilarity * 100).toFixed(2)}%`
  )
  console.log(
    `  Minimum Similarity: ${(result.overallStats.minSimilarity * 100).toFixed(2)}%`
  )
  console.log()

  console.log('YEARLY TRENDS:')
  result.yearlyAnalysis.forEach((ya) => {
    console.log(
      `  ${ya.year}: Avg ${(ya.averageSimilarity * 100).toFixed(2)}%, Max ${(ya.maxSimilarity * 100).toFixed(2)}% (${ya.totalChunks} chunks, ${ya.speechCount} speeches)`
    )
  })
  console.log()

  console.log('TOP 5 MOST SIMILAR CHUNKS:')
  result.topSimilarChunks.slice(0, 5).forEach((chunk, index) => {
    console.log(
      `  ${index + 1}. Year ${chunk.year}, Similarity: ${(chunk.similarity * 100).toFixed(2)}%`
    )
    console.log(`     Speaker: ${chunk.speaker || 'Unknown'}`)
    console.log(`     Text: ${chunk.chunkText.substring(0, 100)}...`)
    console.log()
  })

  // Identify trend
  const firstHalf = result.yearlyAnalysis.slice(
    0,
    Math.floor(result.yearlyAnalysis.length / 2)
  )
  const secondHalf = result.yearlyAnalysis.slice(
    Math.floor(result.yearlyAnalysis.length / 2)
  )
  const firstHalfAvg =
    firstHalf.reduce((sum, ya) => sum + ya.averageSimilarity, 0) /
    firstHalf.length
  const secondHalfAvg =
    secondHalf.reduce((sum, ya) => sum + ya.averageSimilarity, 0) /
    secondHalf.length

  console.log('TREND ANALYSIS:')
  if (secondHalfAvg > firstHalfAvg) {
    console.log(
      `  📈 INCREASING: Climate change similarity has increased over time`
    )
    console.log(
      `     First half (${firstHalf[0].year}-${firstHalf[firstHalf.length - 1].year}): ${(firstHalfAvg * 100).toFixed(2)}%`
    )
    console.log(
      `     Second half (${secondHalf[0].year}-${secondHalf[secondHalf.length - 1].year}): ${(secondHalfAvg * 100).toFixed(2)}%`
    )
  } else if (secondHalfAvg < firstHalfAvg) {
    console.log(
      `  📉 DECREASING: Climate change similarity has decreased over time`
    )
    console.log(
      `     First half (${firstHalf[0].year}-${firstHalf[firstHalf.length - 1].year}): ${(firstHalfAvg * 100).toFixed(2)}%`
    )
    console.log(
      `     Second half (${secondHalf[0].year}-${secondHalf[secondHalf.length - 1].year}): ${(secondHalfAvg * 100).toFixed(2)}%`
    )
  } else {
    console.log(
      `  ➡️  STABLE: Climate change similarity has remained relatively stable`
    )
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log('🌍 Starting Climate Change Similarity Analysis for USA Speeches')
  console.log('='.repeat(80))

  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error(
      '❌ OpenAI API key not found. Please set OPENAI_API_KEY environment variable.'
    )
    process.exit(1)
  }

  try {
    // Initialize database
    const db = initializeDatabase()

    // Generate target embedding
    const targetEmbedding = await generateTargetEmbedding(TARGET_PHRASE)

    // Get USA chunks
    const chunks = getUSAChunks(db)

    if (chunks.length === 0) {
      console.log(
        '❌ No USA chunks found in the specified year range with embeddings.'
      )
      console.log(
        '   Make sure the RAG system has been set up with: npm run rag:setup'
      )
      process.exit(1)
    }

    // Calculate similarities
    const chunksWithSimilarity = await calculateSimilarities(
      db,
      chunks,
      targetEmbedding
    )

    // Analyze by year
    const yearlyAnalysis = analyzeByYear(chunksWithSimilarity)

    // Generate final result
    const result = generateAnalysisResult(chunksWithSimilarity, yearlyAnalysis)

    // Save and display results
    saveResults(result)
    printSummary(result)

    // Close database
    db.close()

    console.log('\n✅ Analysis completed successfully!')
  } catch (error) {
    console.error('❌ Analysis failed:', error)
    process.exit(1)
  }
}

// Run the analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { main, type AnalysisResult, type YearlyAnalysis, type ChunkSimilarity }
