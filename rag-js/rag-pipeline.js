#!/usr/bin/env node

/**
 * Complete RAG (Retrieval-Augmented Generation) pipeline
 * Combines semantic search with OpenAI completion for Q&A
 */

import { OpenAI } from 'openai'
import { config } from 'dotenv'
import {
  initDatabase,
  semanticSearch,
  getChunkContext,
  advancedSearch,
} from './vector-search.js'

// Load environment variables
config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generate an answer using retrieved context and OpenAI
 */
async function generateAnswer(question, contexts, options = {}) {
  const {
    model = 'gpt-4o',
    temperature = 0.1,
    maxTokens = 1000,
    includeMetadata = true,
  } = options

  // Prepare context information
  const contextText = contexts
    .map((ctx, i) => {
      const metadata = includeMetadata
        ? `[Source ${i + 1}: ${ctx.country}, ${ctx.year}, ${ctx.speaker}]`
        : `[Source ${i + 1}]`

      return `${metadata}\n${ctx.chunk_text}`
    })
    .join('\n\n')

  const systemPrompt = `You are an expert analyst of UN General Assembly speeches. Your task is to answer questions based ONLY on the provided speech excerpts. 

Guidelines:
- Base your answer strictly on the provided context
- If the context doesn't contain enough information to answer the question, say so
- When referencing information, mention which source(s) you're using
- Be precise and factual
- If multiple sources provide conflicting information, note the discrepancy
- Focus on direct quotes when possible`

  const userPrompt = `Context from UN speeches:

${contextText}

Question: ${question}

Please provide a comprehensive answer based on the provided context.`

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    })

    return {
      answer: response.choices[0].message.content,
      usage: response.usage,
      model: response.model,
    }
  } catch (error) {
    console.error('Error generating answer:', error.message)
    throw error
  }
}

/**
 * Perform complete RAG pipeline: search + generate
 */
async function ragQuery(db, question, options = {}) {
  const {
    searchLimit = 5,
    includeContext = true,
    filters = {},
    searchThreshold = null,
  } = options

  try {
    console.log(`🔍 Searching for: "${question}"`)

    // Perform semantic search
    let searchResults
    if (Object.keys(filters).length > 0) {
      searchResults = await advancedSearch(db, question, filters, searchLimit)
    } else {
      searchResults = await semanticSearch(
        db,
        question,
        searchLimit,
        searchThreshold
      )
    }

    if (searchResults.length === 0) {
      return {
        answer:
          "I couldn't find any relevant information in the UN speeches database to answer your question.",
        sources: [],
        searchResults: [],
      }
    }

    console.log(`📚 Found ${searchResults.length} relevant chunks`)

    // Optionally enhance with context
    let contexts = searchResults
    if (includeContext) {
      contexts = searchResults.map((result) => {
        const contextInfo = getChunkContext(db, result.chunk_id, 1)
        return {
          ...result,
          enhanced_text: contextInfo
            ? contextInfo.fullContext
            : result.chunk_text,
        }
      })
    }

    // Generate answer
    console.log('🤖 Generating answer...')
    const answerResult = await generateAnswer(question, contexts)

    // Prepare sources information
    const sources = searchResults.map((result, i) => ({
      index: i + 1,
      chunk_id: result.chunk_id,
      speech_id: result.speech_id,
      country: result.country,
      speaker: result.speaker,
      year: result.year,
      session: result.session,
      distance: Math.round(result.distance * 1000) / 1000,
      preview: result.chunk_text.slice(0, 200) + '...',
    }))

    return {
      question,
      answer: answerResult.answer,
      sources,
      searchResults,
      metadata: {
        model: answerResult.model,
        usage: answerResult.usage,
        search_count: searchResults.length,
        filters_applied: Object.keys(filters),
      },
    }
  } catch (error) {
    console.error('Error in RAG query:', error.message)
    throw error
  }
}

/**
 * Compare perspectives from different countries/speakers
 */
async function compareperspectives(
  db,
  topic,
  countries = [],
  speakers = [],
  options = {}
) {
  const { searchLimit = 3 } = options

  console.log(`🔍 Comparing perspectives on: "${topic}"`)

  const perspectives = []

  // Search for each country
  for (const country of countries) {
    try {
      const results = await advancedSearch(db, topic, { country }, searchLimit)
      if (results.length > 0) {
        const answerResult = await generateAnswer(
          `What is ${country}'s perspective on ${topic}?`,
          results,
          { includeMetadata: false }
        )

        perspectives.push({
          type: 'country',
          entity: country,
          perspective: answerResult.answer,
          sources: results.length,
          sample_years: [...new Set(results.map((r) => r.year))].sort(),
        })
      }
    } catch (error) {
      console.error(`Error getting perspective for ${country}:`, error.message)
    }
  }

  // Search for each speaker
  for (const speaker of speakers) {
    try {
      const results = await advancedSearch(db, topic, { speaker }, searchLimit)
      if (results.length > 0) {
        const answerResult = await generateAnswer(
          `What is ${speaker}'s perspective on ${topic}?`,
          results,
          { includeMetadata: false }
        )

        perspectives.push({
          type: 'speaker',
          entity: speaker,
          perspective: answerResult.answer,
          sources: results.length,
          sample_years: [...new Set(results.map((r) => r.year))].sort(),
        })
      }
    } catch (error) {
      console.error(`Error getting perspective for ${speaker}:`, error.message)
    }
  }

  return {
    topic,
    perspectives,
    summary: `Found ${perspectives.length} perspectives on "${topic}"`,
  }
}

/**
 * Interactive chat interface
 */
async function startChatInterface() {
  console.log('🚀 Starting UN Speeches RAG Chat Interface')
  console.log('Ask questions about UN speeches. Type "exit" to quit.\n')

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is required')
    process.exit(1)
  }

  const db = initDatabase()

  // Import readline for interactive input
  const { createInterface } = await import('readline')
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const askQuestion = (prompt) => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve)
    })
  }

  try {
    while (true) {
      const question = await askQuestion('\n❓ Your question: ')

      if (question.toLowerCase().trim() === 'exit') {
        console.log('👋 Goodbye!')
        break
      }

      if (!question.trim()) {
        continue
      }

      try {
        const startTime = Date.now()
        const result = await ragQuery(db, question)
        const duration = Date.now() - startTime

        console.log('\n📝 Answer:')
        console.log(result.answer)

        console.log('\n📚 Sources:')
        result.sources.forEach((source) => {
          console.log(
            `   ${source.index}. ${source.country}, ${source.year} (${source.speaker})`
          )
          console.log(
            `      Distance: ${source.distance}, Preview: ${source.preview}`
          )
        })

        console.log(`\n⏱️  Query completed in ${duration}ms`)
        console.log('─'.repeat(80))
      } catch (error) {
        console.error('❌ Error processing question:', error.message)
      }
    }
  } finally {
    rl.close()
    db.close()
  }
}

/**
 * Command line interface
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    // Start interactive chat
    await startChatInterface()
    return
  }

  const command = args[0]

  if (command === 'query') {
    const question = args.slice(1).join(' ')
    if (!question) {
      console.error('Usage: node rag-pipeline.js query "your question here"')
      process.exit(1)
    }

    const db = initDatabase()
    try {
      const result = await ragQuery(db, question)

      console.log('Question:', result.question)
      console.log('\nAnswer:')
      console.log(result.answer)

      console.log('\nSources:')
      result.sources.forEach((source) => {
        console.log(
          `${source.index}. ${source.country}, ${source.year} (${source.speaker}) - Distance: ${source.distance}`
        )
      })
    } finally {
      db.close()
    }
  } else if (command === 'compare') {
    const topic = args[1]
    const countries = args.slice(2)

    if (!topic || countries.length === 0) {
      console.error(
        'Usage: node rag-pipeline.js compare "topic" country1 country2 ...'
      )
      process.exit(1)
    }

    const db = initDatabase()
    try {
      const result = await compareperspectives(db, topic, countries)

      console.log(`Topic: ${result.topic}`)
      console.log(`\n${result.summary}`)

      result.perspectives.forEach((p) => {
        console.log(
          `\n--- ${p.entity} (${p.sources} sources, years: ${p.sample_years.join(', ')}) ---`
        )
        console.log(p.perspective)
      })
    } finally {
      db.close()
    }
  } else {
    console.log('Available commands:')
    console.log(
      '  node rag-pipeline.js                     # Start interactive chat'
    )
    console.log(
      '  node rag-pipeline.js query "question"    # Ask a single question'
    )
    console.log(
      '  node rag-pipeline.js compare "topic" country1 country2  # Compare perspectives'
    )
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { generateAnswer, ragQuery, compareperspectives, startChatInterface }
