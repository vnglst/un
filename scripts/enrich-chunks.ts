#!/usr/bin/env node --experimental-strip-types

/**
 * Enrich chunks with LLM-generated metadata using OpenRouter.
 *
 * This script processes chunks and uses an LLM to extract:
 * - A 1-2 sentence summary
 * - Key themes/topics (as JSON array)
 * - Named entities (people, countries, organizations)
 * - Notable content (quotes, statistics, proposals)
 *
 * Usage:
 *   OPENROUTER_API_KEY=xxx npm run db:enrich -- [limit] [model]
 *
 * Examples:
 *   OPENROUTER_API_KEY=xxx npm run db:enrich -- 10
 *   OPENROUTER_API_KEY=xxx npm run db:enrich -- 100 deepseek/deepseek-chat-v3-0324
 *   OPENROUTER_API_KEY=xxx npm run db:enrich -- 100 google/gemini-2.0-flash-001
 *
 * Cost-effective models (2025 pricing per 1M tokens):
 *   - deepseek/deepseek-chat-v3-0324 : $0.25 in / $0.38 out  (best value, very capable)
 *   - google/gemini-2.0-flash-001    : $0.10 in / $0.40 out  (fast, 1M context)
 *   - google/gemini-3-flash-preview  : $0.50 in / $3.00 out  (thinking mode, best reasoning)
 *   - anthropic/claude-3.5-haiku     : $0.80 in / $4.00 out  (highest quality)
 *
 * For ~6,500 chunks (2024 data), estimated costs:
 *   - deepseek-chat-v3:    ~$0.05 - $0.10 (essentially free!)
 *   - gemini-2.0-flash:    ~$0.05 - $0.15
 *   - gemini-3-flash:      ~$4 - $5
 *   - claude-3.5-haiku:    ~$1 - $2
 */

import Database from 'better-sqlite3'
import { resolve } from 'path'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_MODEL = 'deepseek/deepseek-chat-v3-0324'

interface ChunkToEnrich {
  id: number
  text: string
  speech_id: number
  year: number
  country: string
  speaker: string
}

interface EnrichedMetadata {
  summary: string
  themes: string[]
  entities: {
    people: string[]
    countries: string[]
    organizations: string[]
  }
  notable: string | null
}

const log = {
  info: (msg: string, data?: unknown) =>
    console.log(`[INFO] ${msg}`, data ? JSON.stringify(data) : ''),
  error: (msg: string, data?: unknown) =>
    console.error(`[ERROR] ${msg}`, data ? JSON.stringify(data) : ''),
}

async function extractMetadata(
  chunk: ChunkToEnrich,
  model: string
): Promise<EnrichedMetadata> {
  const prompt = `Analyze this excerpt from a UN General Assembly speech by ${chunk.speaker || 'unknown speaker'} from ${chunk.country} in ${chunk.year}.

TEXT:
${chunk.text}

Extract the following in JSON format:
{
  "summary": "1-2 sentence summary of the main point",
  "themes": ["array", "of", "key", "themes"], // e.g., "nuclear disarmament", "climate change", "human rights", "territorial sovereignty"
  "entities": {
    "people": ["names of people mentioned"],
    "countries": ["countries mentioned"],
    "organizations": ["UN bodies, NGOs, etc."]
  },
  "notable": "Any notable quotes, statistics, or proposals. Null if none."
}

Respond with ONLY the JSON object, no markdown code blocks.`

  const response = await fetch(OPENROUTER_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://github.com/vnglst/un',
      'X-Title': 'UN Speeches Research',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} ${error}`)
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>
    usage?: { prompt_tokens: number; completion_tokens: number }
  }

  const content = data.choices[0]?.message?.content || '{}'

  // Clean up response - remove markdown code blocks if present
  const cleanedContent = content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  try {
    return JSON.parse(cleanedContent) as EnrichedMetadata
  } catch {
    log.error('Failed to parse LLM response', { content: cleanedContent })
    return {
      summary: '',
      themes: [],
      entities: { people: [], countries: [], organizations: [] },
      notable: null,
    }
  }
}

function getChunksToEnrich(
  db: ReturnType<typeof Database>,
  limit: number
): ChunkToEnrich[] {
  const query = `
    SELECT
      c.id,
      c.text,
      c.speech_id,
      s.year,
      s.country_name as country,
      s.speaker
    FROM chunks c
    JOIN speeches s ON c.speech_id = s.id
    WHERE c.summary IS NULL
    ORDER BY s.year DESC, c.id
    LIMIT ?
  `
  return db.prepare(query).all(limit) as ChunkToEnrich[]
}

function updateChunkMetadata(
  db: ReturnType<typeof Database>,
  chunkId: number,
  metadata: EnrichedMetadata
) {
  const stmt = db.prepare(`
    UPDATE chunks
    SET summary = ?,
        themes = ?,
        entities = ?,
        notable = ?
    WHERE id = ?
  `)

  stmt.run(
    metadata.summary,
    JSON.stringify(metadata.themes),
    JSON.stringify(metadata.entities),
    metadata.notable,
    chunkId
  )
}

async function main() {
  if (!OPENROUTER_API_KEY) {
    console.error('Error: OPENROUTER_API_KEY environment variable is required')
    console.error('')
    console.error(
      'Usage: OPENROUTER_API_KEY=xxx npm run db:enrich -- [limit] [model]'
    )
    console.error('')
    console.error('Cost-effective models (2025):')
    console.error(
      '  deepseek/deepseek-chat-v3-0324  - best value ($0.25/$0.38 per 1M) [DEFAULT]'
    )
    console.error(
      '  google/gemini-2.0-flash-001     - fast ($0.10/$0.40 per 1M)'
    )
    console.error(
      '  google/gemini-3-flash-preview   - thinking mode ($0.50/$3.00 per 1M)'
    )
    console.error(
      '  anthropic/claude-3.5-haiku      - highest quality ($0.80/$4.00 per 1M)'
    )
    process.exit(1)
  }

  const args = process.argv.slice(2)
  const limit = args[0] ? parseInt(args[0]) : 10
  const model = args[1] || DEFAULT_MODEL

  log.info('Starting chunk enrichment', { limit, model })

  const dbPath = resolve(process.cwd(), 'data', 'un_speeches.db')
  const db = new Database(dbPath)

  try {
    const chunks = getChunksToEnrich(db, limit)

    if (chunks.length === 0) {
      log.info('No chunks to enrich')
      process.exit(0)
    }

    log.info('Chunks to process', { count: chunks.length })

    let processed = 0
    let errors = 0
    const startTime = Date.now()

    for (const chunk of chunks) {
      try {
        const metadata = await extractMetadata(chunk, model)
        updateChunkMetadata(db, chunk.id, metadata)

        processed++

        if (processed % 10 === 0 || processed === chunks.length) {
          const elapsed = (Date.now() - startTime) / 1000
          const rate = processed / elapsed
          const remaining = (chunks.length - processed) / rate
          log.info(`Progress: ${processed}/${chunks.length}`, {
            elapsed: `${elapsed.toFixed(0)}s`,
            rate: `${rate.toFixed(1)}/s`,
            eta: `${remaining.toFixed(0)}s`,
          })
        }

        // Rate limiting - be nice to the API
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        errors++
        log.error('Failed to process chunk', {
          chunkId: chunk.id,
          error: error instanceof Error ? error.message : String(error),
        })

        // Back off on errors
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    // Show sample of enriched data
    const sample = db
      .prepare(
        `
      SELECT id, summary, themes, notable
      FROM chunks
      WHERE summary IS NOT NULL
      ORDER BY id DESC
      LIMIT 3
    `
      )
      .all()

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)

    log.info('Enrichment completed', {
      processed,
      errors,
      totalTime: `${totalTime}s`,
    })

    console.log('\nSample enriched chunks:')
    for (const s of sample as Array<{
      id: number
      summary: string
      themes: string
      notable: string | null
    }>) {
      console.log(`\n[Chunk ${s.id}]`)
      console.log(`Summary: ${s.summary}`)
      console.log(`Themes: ${s.themes}`)
      if (s.notable) console.log(`Notable: ${s.notable}`)
    }
  } finally {
    db.close()
  }
}

main()
