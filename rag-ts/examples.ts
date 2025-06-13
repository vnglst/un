#!/usr/bin/env node

/**
 * Example usage of the UN Speeches RAG pipeline
 * Demonstrates various capabilities and use cases
 */

import { config } from 'dotenv'
import {
  initDatabase,
  semanticSearch,
  advancedSearch,
  getSearchStats,
} from './vector-search.js'
import { ragQuery, compareperspectives } from './rag-pipeline.js'

// Load environment variables
config()

async function runExamples(): Promise<void> {
  console.log('🚀 UN Speeches RAG Pipeline Examples\n')

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is required')
    console.error(
      'Please set your OpenAI API key in the environment or .env file'
    )
    process.exit(1)
  }

  const db = initDatabase()

  try {
    // Example 1: Basic Statistics
    console.log('📊 Example 1: Database Statistics')
    console.log('='.repeat(50))

    const stats = getSearchStats(db)
    console.log(`Total chunks: ${stats.totalChunks?.toLocaleString() || 'N/A'}`)
    console.log(
      `Total embeddings: ${stats.totalEmbeddings?.toLocaleString() || 'N/A'}`
    )
    console.log(
      `Average chunks per speech: ${stats.avgChunksPerSpeech || 'N/A'}`
    )

    if (stats.countryCoverage && stats.countryCoverage.length > 0) {
      console.log(`\nTop 3 countries by coverage:`)
      stats.countryCoverage.slice(0, 3).forEach((country, i) => {
        console.log(`  ${i + 1}. ${country.country}: ${country.chunks} chunks`)
      })
    }

    // Example 2: Semantic Search
    console.log('\n\n🔍 Example 2: Semantic Search')
    console.log('='.repeat(50))

    const searchQuery = 'climate change and environmental protection'
    console.log(`Searching for: "${searchQuery}"`)

    const searchResults = await semanticSearch(db, searchQuery, 3)
    console.log(`\nFound ${searchResults.length} relevant chunks:`)

    searchResults.forEach((result, i) => {
      console.log(
        `\n${i + 1}. ${result.country}, ${result.year} (${result.speaker})`
      )
      console.log(`   Distance: ${result.distance.toFixed(4)}`)
      console.log(`   Preview: "${result.chunk_text.slice(0, 150)}..."`)
    })

    // Example 3: Advanced Search with Filters
    console.log('\n\n🎯 Example 3: Advanced Search with Filters')
    console.log('='.repeat(50))

    const advancedQuery = 'nuclear weapons and disarmament'
    const filters = { minYear: 2020, maxYear: 2023 }
    console.log(`Searching for: "${advancedQuery}"`)
    console.log(`Filters: Years ${filters.minYear}-${filters.maxYear}`)

    const advancedResults = await advancedSearch(db, advancedQuery, filters, 3)
    console.log(`\nFound ${advancedResults.length} results:`)

    advancedResults.forEach((result, i) => {
      console.log(
        `${i + 1}. ${result.country}, ${result.year} - Distance: ${result.distance.toFixed(4)}`
      )
    })

    // Example 4: RAG Question Answering
    console.log('\n\n🤖 Example 4: RAG Question Answering')
    console.log('='.repeat(50))

    const question =
      'What are the main concerns about artificial intelligence mentioned in UN speeches?'
    console.log(`Question: "${question}"`)
    console.log('\nGenerating answer...')

    const ragResult = await ragQuery(db, question, { searchLimit: 4 })

    console.log('\n📝 Answer:')
    console.log(ragResult.answer)

    console.log('\n📚 Sources:')
    ragResult.sources.forEach((source) => {
      console.log(
        `  • ${source.country}, ${source.year} (${source.speaker}) - Distance: ${source.distance}`
      )
    })

    // Example 5: Perspective Comparison
    console.log('\n\n⚖️  Example 5: Perspective Comparison')
    console.log('='.repeat(50))

    const topic = 'international cooperation'
    const countries = ['United States', 'China', 'Russia']
    console.log(`Comparing perspectives on: "${topic}"`)
    console.log(`Countries: ${countries.join(', ')}`)

    const comparison = await compareperspectives(db, topic, countries, [], {
      searchLimit: 2,
    })

    console.log(`\n${comparison.summary}`)
    comparison.perspectives.forEach((perspective) => {
      console.log(`\n--- ${perspective.entity} ---`)
      console.log(
        `Sources: ${perspective.sources} (Years: ${perspective.sample_years.join(', ')})`
      )
      console.log(
        perspective.perspective.slice(0, 300) +
          (perspective.perspective.length > 300 ? '...' : '')
      )
    })

    // Example 6: Similar Chunk Finding
    console.log('\n\n🔗 Example 6: Finding Similar Content')
    console.log('='.repeat(50))

    // Get a sample chunk first
    const sampleChunk = db
      .prepare(`
        SELECT c.id, c.chunk_text, s.country_name as country, s.year, s.speaker
        FROM speech_chunks c
        JOIN speeches s ON c.speech_id = s.id
        WHERE c.chunk_text LIKE '%peace%'
        LIMIT 1
      `)
      .get() as {
        id: number
        chunk_text: string
        country: string
        year: number
        speaker: string
      } | undefined

    if (sampleChunk) {
      console.log(
        `Finding content similar to chunk from ${sampleChunk.country}, ${sampleChunk.year}:`
      )
      console.log(`"${sampleChunk.chunk_text.slice(0, 100)}..."`)

      // This would need to be implemented in vector-search.js
      console.log(
        '\n(Similar content search would be implemented using findSimilarChunks function)'
      )
    }

    console.log('\n🎉 Examples completed successfully!')
    console.log('\nTo try these features interactively, run:')
    console.log('  node rag-pipeline.js')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Error running examples:', errorMessage)
    if (error instanceof Error && error.stack) {
      console.error(error.stack)
    }
  } finally {
    db.close()
  }
}

// Run examples
runExamples().catch(console.error)
