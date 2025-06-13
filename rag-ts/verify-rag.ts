#!/usr/bin/env node

/**
 * Verification and testing utilities for the RAG pipeline
 * Validates database structure, embeddings, and end-to-end functionality
 */

import Database from 'better-sqlite3'
import { config } from 'dotenv'
import { existsSync } from 'fs'
import { join } from 'path'
import { load } from 'sqlite-vec'
import { semanticSearch, getSearchStats } from './vector-search.js'
import { ragQuery } from './rag-pipeline.js'

// Load environment variables
config()

const DB_PATH = join(process.cwd(), 'data', 'un_speeches.db')

type VerificationResult = {
  tablesExist: boolean
  correctStructure: boolean
  errors: string[]
}

type EmbeddingVerificationResult = {
  embeddingsExist: boolean
  correctFormat: boolean
  consistentData: boolean
  stats: {
    totalEmbeddings?: number
    totalChunks?: number
  }
  errors: string[]
}

type VectorSearchResult = {
  searchWorks: boolean
  resultsReturned: boolean
  relevantResults: boolean
  errors: string[]
}

type RAGTestResult = {
  ragWorks: boolean
  answerGenerated: boolean
  sourcesProvided: boolean
  errors: string[]
}

type AllResults = {
  structure: VerificationResult
  embeddings: EmbeddingVerificationResult
  vectorSearch: VectorSearchResult
  endToEnd: RAGTestResult
}

/**
 * Initialize database connection with sqlite-vec extension
 */
function initDatabase(): Database.Database {
  if (!existsSync(DB_PATH)) {
    throw new Error(`Database file not found at ${DB_PATH}`)
  }

  const db = new Database(DB_PATH, { readonly: true })

  try {
    // Load sqlite-vec extension
    load(db)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Failed to load sqlite-vec extension:', errorMessage)
    throw error
  }

  return db
}

/**
 * Verify database tables exist and have correct structure
 */
function verifyDatabaseStructure(db: Database.Database): VerificationResult {
  console.log('🔍 Verifying database structure...')

  const results: VerificationResult = {
    tablesExist: false,
    correctStructure: false,
    errors: [],
  }

  try {
    // Check if main tables exist
    const tables = db
      .prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('speeches', 'speech_chunks', 'speech_embeddings')
      `)
      .all() as Array<{ name: string }>

    const tableNames = tables.map((t) => t.name)
    const requiredTables = ['speeches', 'speech_chunks', 'speech_embeddings']
    const missingTables = requiredTables.filter((t) => !tableNames.includes(t))

    if (missingTables.length > 0) {
      results.errors.push(`Missing tables: ${missingTables.join(', ')}`)
      return results
    }

    results.tablesExist = true
    console.log('✅ All required tables exist')

    // Check speech_chunks structure
    const chunkColumns = db.prepare(`PRAGMA table_info(speech_chunks)`).all() as Array<{
      name: string
    }>
    const expectedChunkCols = [
      'id',
      'speech_id',
      'chunk_text',
      'chunk_index',
      'created_at',
    ]
    const actualChunkCols = chunkColumns.map((c) => c.name)

    const missingChunkCols = expectedChunkCols.filter(
      (c) => !actualChunkCols.includes(c)
    )
    if (missingChunkCols.length > 0) {
      results.errors.push(
        `Missing columns in speech_chunks: ${missingChunkCols.join(', ')}`
      )
    }

    // Check speech_embeddings is a virtual table
    const embedTableInfo = db
      .prepare(`
        SELECT sql FROM sqlite_master 
        WHERE type='table' AND name='speech_embeddings'
      `)
      .get() as { sql?: string } | undefined

    if (!embedTableInfo?.sql?.includes('VIRTUAL TABLE')) {
      results.errors.push(
        'speech_embeddings is not a virtual table (sqlite-vec)'
      )
    }

    if (results.errors.length === 0) {
      results.correctStructure = true
      console.log('✅ Database structure is correct')
    } else {
      console.log('❌ Database structure issues found')
      results.errors.forEach((error) => console.log(`   - ${error}`))
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    results.errors.push(`Database structure check failed: ${errorMessage}`)
    console.error('❌ Error verifying database structure:', errorMessage)
  }

  return results
}

/**
 * Verify embeddings are stored and retrievable
 */
function verifyEmbeddings(db: Database.Database): EmbeddingVerificationResult {
  console.log('🔍 Verifying embeddings...')

  const results: EmbeddingVerificationResult = {
    embeddingsExist: false,
    correctFormat: false,
    consistentData: false,
    stats: {},
    errors: [],
  }

  try {
    // Check if embeddings exist
    const embeddingCount = db
      .prepare('SELECT COUNT(*) as count FROM speech_embeddings')
      .get() as { count: number }
    if (embeddingCount.count === 0) {
      results.errors.push('No embeddings found in speech_embeddings table')
      return results
    }

    results.embeddingsExist = true
    results.stats.totalEmbeddings = embeddingCount.count
    console.log(`✅ Found ${embeddingCount.count} embeddings`)

    // Check chunk count matches embedding count
    const chunkCount = db
      .prepare('SELECT COUNT(*) as count FROM speech_chunks')
      .get() as { count: number }
    results.stats.totalChunks = chunkCount.count

    if (chunkCount.count !== embeddingCount.count) {
      results.errors.push(
        `Mismatch: ${chunkCount.count} chunks vs ${embeddingCount.count} embeddings`
      )
    } else {
      console.log('✅ Chunk count matches embedding count')
    }

    // Sample a few embeddings to check format
    const sampleEmbeddings = db
      .prepare(`
        SELECT rowid, embedding FROM speech_embeddings LIMIT 3
      `)
      .all() as Array<{ rowid: number; embedding: string }>

    let validEmbeddings = 0
    for (const sample of sampleEmbeddings) {
      try {
        // For sqlite-vec, embeddings should be stored as binary or in a specific format
        // We'll check if we can query against them
        const testQuery = db
          .prepare(`
            SELECT vec_distance_cosine(embedding, embedding) as self_distance 
            FROM speech_embeddings 
            WHERE rowid = ?
          `)
          .get(sample.rowid) as { self_distance: number } | undefined

        if (testQuery && testQuery.self_distance !== null) {
          validEmbeddings++
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        results.errors.push(
          `Invalid embedding format for chunk ${sample.rowid}: ${errorMessage}`
        )
      }
    }

    if (validEmbeddings === sampleEmbeddings.length) {
      results.correctFormat = true
      console.log('✅ Embedding format is correct')
    } else {
      console.log(
        `❌ ${sampleEmbeddings.length - validEmbeddings} embeddings have invalid format`
      )
    }

    // Check data consistency
    const orphanedEmbeddings = db
      .prepare(`
        SELECT COUNT(*) as count
        FROM speech_embeddings e
        LEFT JOIN speech_chunks c ON e.rowid = c.embedding_id
        WHERE c.embedding_id IS NULL
      `)
      .get() as { count: number }

    const orphanedChunks = db
      .prepare(`
        SELECT COUNT(*) as count
        FROM speech_chunks c
        WHERE c.embedding_id IS NULL
      `)
      .get() as { count: number }

    if (orphanedEmbeddings.count > 0) {
      results.errors.push(
        `${orphanedEmbeddings.count} orphaned embeddings (no matching chunks)`
      )
    }

    if (orphanedChunks.count > 0) {
      results.errors.push(`${orphanedChunks.count} chunks without embeddings`)
    }

    if (orphanedEmbeddings.count === 0 && orphanedChunks.count === 0) {
      results.consistentData = true
      console.log('✅ Data consistency verified')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    results.errors.push(`Embedding verification failed: ${errorMessage}`)
    console.error('❌ Error verifying embeddings:', errorMessage)
  }

  return results
}

/**
 * Test vector search functionality
 */
async function testVectorSearch(db: Database.Database): Promise<VectorSearchResult> {
  console.log('🔍 Testing vector search functionality...')

  const results: VectorSearchResult = {
    searchWorks: false,
    resultsReturned: false,
    relevantResults: false,
    errors: [],
  }

  try {
    // Test basic semantic search
    const testQuery = 'climate change and global warming'
    const searchResults = await semanticSearch(db, testQuery, 5)

    results.searchWorks = true
    console.log('✅ Vector search function executes without errors')

    if (searchResults.length > 0) {
      results.resultsReturned = true
      console.log(`✅ Search returned ${searchResults.length} results`)

      // Check if results have required fields
      const firstResult = searchResults[0]
      const requiredFields = [
        'chunk_id',
        'chunk_text',
        'speech_id',
        'country',
        'speaker',
        'year',
        'distance',
      ]
      const missingFields = requiredFields.filter(
        (field) => !(field in firstResult)
      )

      if (missingFields.length > 0) {
        results.errors.push(
          `Search results missing fields: ${missingFields.join(', ')}`
        )
      } else {
        console.log('✅ Search results have all required fields')
      }

      // Check if distances make sense (should be between 0 and 2 for cosine distance)
      const validDistances = searchResults.every(
        (r) => r.distance >= 0 && r.distance <= 2
      )
      if (validDistances) {
        console.log('✅ Distance scores are in valid range')
      } else {
        results.errors.push(
          'Some distance scores are outside valid range (0-2)'
        )
      }

      // Check if results are sorted by distance
      const sortedByDistance = searchResults.every(
        (r, i) => i === 0 || r.distance >= searchResults[i - 1].distance
      )
      if (sortedByDistance) {
        console.log('✅ Results are properly sorted by distance')
        results.relevantResults = true
      } else {
        results.errors.push('Results are not sorted by distance')
      }

      // Show sample results
      console.log('\n📋 Sample search results:')
      searchResults.slice(0, 3).forEach((result, i) => {
        console.log(
          `   ${i + 1}. ${result.country}, ${result.year} (distance: ${result.distance.toFixed(4)})`
        )
        console.log(`      "${result.chunk_text.slice(0, 100)}..."`)
      })
    } else {
      results.errors.push('Search returned no results')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    results.errors.push(`Vector search test failed: ${errorMessage}`)
    console.error('❌ Error testing vector search:', errorMessage)
  }

  return results
}

/**
 * Test end-to-end RAG pipeline
 */
async function testEndToEndRAG(db: Database.Database): Promise<RAGTestResult> {
  console.log('🔍 Testing end-to-end RAG pipeline...')

  const results: RAGTestResult = {
    ragWorks: false,
    answerGenerated: false,
    sourcesProvided: false,
    errors: [],
  }

  if (!process.env.OPENAI_API_KEY) {
    results.errors.push('OPENAI_API_KEY not set - cannot test RAG pipeline')
    return results
  }

  try {
    const testQuestion = 'What do countries say about climate change?'
    console.log(`Testing with question: "${testQuestion}"`)

    const ragResult = await ragQuery(db, testQuestion, { searchLimit: 3 })

    results.ragWorks = true
    console.log('✅ RAG pipeline executes without errors')

    if (ragResult.answer && ragResult.answer.trim().length > 0) {
      results.answerGenerated = true
      console.log('✅ Answer generated successfully')
      console.log(`   Answer length: ${ragResult.answer.length} characters`)
    } else {
      results.errors.push('No answer generated')
    }

    if (ragResult.sources && ragResult.sources.length > 0) {
      results.sourcesProvided = true
      console.log(`✅ ${ragResult.sources.length} sources provided`)

      // Verify source structure
      const firstSource = ragResult.sources[0]
      const requiredSourceFields = ['country', 'speaker', 'year', 'distance']
      const missingSourceFields = requiredSourceFields.filter(
        (field) => !(field in firstSource)
      )

      if (missingSourceFields.length > 0) {
        results.errors.push(
          `Sources missing fields: ${missingSourceFields.join(', ')}`
        )
      }
    } else {
      results.errors.push('No sources provided')
    }

    // Show sample output
    if (ragResult.answer) {
      console.log('\n📝 Sample RAG output:')
      console.log(`Q: ${ragResult.question}`)
      console.log(
        `A: ${ragResult.answer.slice(0, 300)}${ragResult.answer.length > 300 ? '...' : ''}`
      )

      if (ragResult.sources && ragResult.sources.length > 0) {
        console.log('\n📚 Sources:')
        ragResult.sources.slice(0, 2).forEach((source) => {
          console.log(
            `   - ${source.country}, ${source.year} (${source.speaker})`
          )
        })
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    results.errors.push(`End-to-end RAG test failed: ${errorMessage}`)
    console.error('❌ Error testing RAG pipeline:', errorMessage)
  }

  return results
}

/**
 * Run comprehensive verification suite
 */
async function runFullVerification(): Promise<AllResults> {
  console.log('🚀 Running comprehensive RAG pipeline verification\n')

  const db = initDatabase()
  const allResults: AllResults = {} as AllResults

  try {
    // 1. Verify database structure
    allResults.structure = verifyDatabaseStructure(db)
    console.log()

    // 2. Verify embeddings
    allResults.embeddings = verifyEmbeddings(db)
    console.log()

    // 3. Test vector search
    allResults.vectorSearch = await testVectorSearch(db)
    console.log()

    // 4. Test end-to-end RAG (only if previous tests pass)
    if (
      allResults.structure.correctStructure &&
      allResults.embeddings.embeddingsExist &&
      allResults.vectorSearch.searchWorks
    ) {
      allResults.endToEnd = await testEndToEndRAG(db)
    } else {
      console.log('⏭️  Skipping end-to-end test due to previous failures')
      allResults.endToEnd = { 
        ragWorks: false,
        answerGenerated: false,
        sourcesProvided: false,
        errors: ['Skipped due to previous failures'] 
      }
    }
  } finally {
    db.close()
  }

  // Summary report
  console.log('\n' + '='.repeat(80))
  console.log('📊 VERIFICATION SUMMARY')
  console.log('='.repeat(80))

  const sections = [
    { name: 'Database Structure', result: allResults.structure },
    { name: 'Embeddings', result: allResults.embeddings },
    { name: 'Vector Search', result: allResults.vectorSearch },
    { name: 'End-to-End RAG', result: allResults.endToEnd },
  ]

  let overallSuccess = true
  for (const section of sections) {
    const hasErrors = section.result.errors && section.result.errors.length > 0
    const status = hasErrors ? '❌ FAIL' : '✅ PASS'
    console.log(`${status} ${section.name}`)

    if (hasErrors) {
      overallSuccess = false
      section.result.errors.forEach((error) => {
        console.log(`   - ${error}`)
      })
    }
  }

  console.log('='.repeat(80))
  if (overallSuccess) {
    console.log('🎉 All verifications passed! RAG pipeline is ready to use.')
  } else {
    console.log(
      '⚠️  Some verifications failed. Please address the issues above.'
    )
  }

  return allResults
}

/**
 * Show database statistics
 */
async function showStats(): Promise<void> {
  console.log('📊 RAG Pipeline Statistics\n')

  const db = initDatabase()

  try {
    const stats = getSearchStats(db)

    console.log('📈 Overview:')
    console.log(
      `   Total Chunks: ${stats.totalChunks?.toLocaleString() || 'N/A'}`
    )
    console.log(
      `   Total Embeddings: ${stats.totalEmbeddings?.toLocaleString() || 'N/A'}`
    )
    console.log(
      `   Avg Chunks per Speech: ${stats.avgChunksPerSpeech || 'N/A'}`
    )
    console.log(
      `   Min Chunks per Speech: ${stats.minChunksPerSpeech || 'N/A'}`
    )
    console.log(
      `   Max Chunks per Speech: ${stats.maxChunksPerSpeech || 'N/A'}`
    )

    if (stats.countryCoverage) {
      console.log('\n🌍 Top Countries by Chunk Count:')
      stats.countryCoverage.slice(0, 10).forEach((country, i) => {
        console.log(
          `   ${i + 1}. ${country.country}: ${country.chunks} chunks (${country.speeches} speeches)`
        )
      })
    }

    if (stats.yearCoverage) {
      console.log('\n📅 Recent Years Coverage:')
      stats.yearCoverage.slice(0, 10).forEach((year, i) => {
        console.log(
          `   ${i + 1}. ${year.year}: ${year.chunks} chunks (${year.speeches} speeches)`
        )
      })
    }
  } finally {
    db.close()
  }
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  const command = process.argv[2]

  try {
    switch (command) {
      case 'verify':
      case undefined:
        await runFullVerification()
        break

      case 'stats':
        await showStats()
        break

      case 'structure': {
        const db = initDatabase()
        verifyDatabaseStructure(db)
        db.close()
        break
      }

      case 'embeddings': {
        const db2 = initDatabase()
        verifyEmbeddings(db2)
        db2.close()
        break
      }

      case 'search': {
        const db3 = initDatabase()
        await testVectorSearch(db3)
        db3.close()
        break
      }

      case 'rag': {
        const db4 = initDatabase()
        await testEndToEndRAG(db4)
        db4.close()
        break
      }

      default:
        console.log('Usage: node verify-rag.js [command]')
        console.log('')
        console.log('Commands:')
        console.log('  verify (default)  - Run full verification suite')
        console.log('  stats            - Show database statistics')
        console.log('  structure        - Verify database structure only')
        console.log('  embeddings       - Verify embeddings only')
        console.log('  search           - Test vector search only')
        console.log('  rag              - Test end-to-end RAG only')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Verification failed:', errorMessage)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export {
  verifyDatabaseStructure,
  verifyEmbeddings,
  testVectorSearch,
  testEndToEndRAG,
  runFullVerification,
  showStats,
  type VerificationResult,
  type EmbeddingVerificationResult,
  type VectorSearchResult,
  type RAGTestResult,
  type AllResults,
}
