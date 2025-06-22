import Database from 'better-sqlite3'
import { join } from 'path'
import { load } from 'sqlite-vec'
import fs from 'fs'
import { Worker } from 'worker_threads'
import { cpus } from 'os'

interface SpeechEmbedding {
  speechId: number
  embeddingId: number
  country: string
  year: number
  speaker: string
}

interface SimilarityResult {
  speech1Id: number
  speech2Id: number
  similarity: number
}

interface WorkerResult {
  success: boolean
  results?: SimilarityResult[]
  error?: string
}

function openDatabase(): Database.Database {
  const dbPath = join(process.cwd(), 'data', 'un_speeches.db')
  const db = new Database(dbPath, { readonly: false })

  // Load sqlite-vec extension with error handling
  try {
    load(db)
    console.log('✅ sqlite-vec extension loaded')
  } catch (error) {
    console.warn(
      '⚠️  Failed to load sqlite-vec extension:',
      error instanceof Error ? error.message : String(error)
    )
    console.warn('⚠️  Vector similarity calculations will not be available')
  }

  return db
}

function runWorker(
  speechBatch: SpeechEmbedding[],
  allSpeeches: SpeechEmbedding[],
  similarityThreshold: number,
  forceRecalculate: boolean
): Promise<SimilarityResult[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('./similarity-worker.ts', import.meta.url),
      {
        workerData: {
          speechBatch,
          allSpeeches,
          similarityThreshold,
          forceRecalculate,
        },
      }
    )

    worker.on('message', (result: WorkerResult) => {
      if (result.success && result.results) {
        resolve(result.results)
      } else {
        reject(new Error(result.error || 'Unknown worker error'))
      }
    })

    worker.on('error', reject)
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`))
      }
    })
  })
}

async function calculateAllSpeechSimilarities(options: {
  year?: number
  forceRecalculate?: boolean
  batchSize?: number
  similarityThreshold?: number
  maxWorkers?: number
}) {
  const {
    year,
    forceRecalculate = false,
    batchSize = 50, // Reduced default batch size for better worker distribution
    similarityThreshold = 0.5,
    maxWorkers = Math.min(cpus().length, 8), // Use up to 8 workers
  } = options

  console.log('🔍 Starting concurrent speech similarity calculation...')
  console.log(`🧵 Using ${maxWorkers} worker threads`)

  const db = openDatabase()

  // Create similarities table if it doesn't exist
  const schemaSQL = fs.readFileSync(
    join(process.cwd(), 'scripts', 'create-similarities-table.sql'),
    'utf8'
  )
  db.exec(schemaSQL)
  console.log('✅ Similarities table ready')

  // Clear existing similarities if force recalculate
  if (forceRecalculate) {
    const whereClause = year
      ? `WHERE s1.year = ${year} OR s2.year = ${year}`
      : ''
    db.exec(`
      DELETE FROM speech_similarities 
      WHERE speech1_id IN (SELECT id FROM speeches ${whereClause})
         OR speech2_id IN (SELECT id FROM speeches ${whereClause})
    `)
    console.log('🗑️ Cleared existing similarities')
  }

  // Get all speeches with embeddings
  const query = `
    SELECT DISTINCT
      s.id as speechId,
      sc.embedding_id as embeddingId,
      s.country_code as country,
      s.year,
      s.speaker
    FROM speeches s
    JOIN speech_chunks sc ON s.id = sc.speech_id 
    WHERE sc.embedding_id IS NOT NULL
    AND sc.chunk_index = 0
    ${year ? `AND s.year = ${year}` : ''}
    ORDER BY s.year, s.country_code
  `

  const speeches = db.prepare(query).all() as SpeechEmbedding[]
  console.log(`📊 Found ${speeches.length} speeches with embeddings`)

  if (speeches.length === 0) {
    console.log('❌ No speeches found')
    db.close()
    return
  }

  // Prepare insert statement
  const insertSimilarity = db.prepare(`
    INSERT OR REPLACE INTO speech_similarities (speech1_id, speech2_id, similarity)
    VALUES (?, ?, ?)
  `)

  console.log('🧮 Computing pairwise similarities with concurrent workers...')
  const startTime = Date.now()
  let totalInserted = 0

  // Split speeches into batches for workers
  const speechBatches: SpeechEmbedding[][] = []
  for (let i = 0; i < speeches.length; i += batchSize) {
    speechBatches.push(speeches.slice(i, i + batchSize))
  }

  console.log(
    `📦 Created ${speechBatches.length} batches of ~${batchSize} speeches each`
  )

  // Process batches concurrently with limited workers
  for (let i = 0; i < speechBatches.length; i += maxWorkers) {
    const currentBatches = speechBatches.slice(i, i + maxWorkers)

    // Create promises for current batch of workers
    const workerPromises = currentBatches.map((batch) =>
      runWorker(batch, speeches, similarityThreshold, forceRecalculate)
    )

    try {
      // Wait for all workers in this batch to complete
      const batchResults = await Promise.all(workerPromises)

      // Insert all results from this batch
      const transaction = db.transaction(() => {
        for (const workerResults of batchResults) {
          for (const result of workerResults) {
            insertSimilarity.run(
              result.speech1Id,
              result.speech2Id,
              result.similarity
            )
            totalInserted++
          }
        }
      })

      transaction()

      // Progress reporting
      const completedBatches = Math.min(i + maxWorkers, speechBatches.length)
      const progress = (
        (completedBatches / speechBatches.length) *
        100
      ).toFixed(1)
      const elapsed = (Date.now() - startTime) / 1000
      const estimated = (elapsed / completedBatches) * speechBatches.length

      console.log(
        `  Progress: ${progress}% (${completedBatches}/${speechBatches.length} batches) - ${elapsed.toFixed(1)}s elapsed, ~${estimated.toFixed(1)}s total`
      )
    } catch (error) {
      console.error('❌ Error in worker batch:', error)
      throw error
    }
  }

  // Get statistics
  const stats = db
    .prepare(
      `
    SELECT 
      COUNT(*) as total_similarities,
      AVG(similarity) as avg_similarity,
      MAX(similarity) as max_similarity,
      MIN(similarity) as min_similarity
    FROM speech_similarities
  `
    )
    .get() as {
    total_similarities: number
    avg_similarity: number
    max_similarity: number
    min_similarity: number
  }

  const elapsedTime = (Date.now() - startTime) / 1000
  const estimatedTotalPairs = (speeches.length * (speeches.length - 1)) / 2

  console.log(`\n📈 Concurrent Similarity Calculation Complete!`)
  console.log(`  Processing time: ${elapsedTime.toFixed(1)} seconds`)
  console.log(
    `  Estimated total speech pairs: ${estimatedTotalPairs.toLocaleString()}`
  )
  console.log(
    `  Similarities stored (>=${similarityThreshold}): ${totalInserted.toLocaleString()}`
  )
  console.log(`  Database statistics:`)
  console.log(
    `    Total similarities in DB: ${stats.total_similarities.toLocaleString()}`
  )
  console.log(`    Average similarity: ${stats.avg_similarity.toFixed(4)}`)
  console.log(`    Maximum similarity: ${stats.max_similarity.toFixed(4)}`)
  console.log(`    Minimum similarity: ${stats.min_similarity.toFixed(4)}`)

  // Show top 10 most similar pairs
  const topPairs = db
    .prepare(
      `
    SELECT 
      s1.country_code as country1,
      s1.speaker as speaker1,
      s1.year as year1,
      s2.country_code as country2,
      s2.speaker as speaker2,
      s2.year as year2,
      ss.similarity
    FROM speech_similarities ss
    JOIN speeches s1 ON ss.speech1_id = s1.id
    JOIN speeches s2 ON ss.speech2_id = s2.id
    ORDER BY ss.similarity DESC
    LIMIT 10
  `
    )
    .all() as Array<{
    country1: string
    speaker1: string
    year1: number
    country2: string
    speaker2: string
    year2: number
    similarity: number
  }>

  console.log(`\n🔝 Top 10 Most Similar Speech Pairs:`)
  topPairs.forEach((pair, idx) => {
    console.log(
      `  ${idx + 1}. ${pair.country1} (${pair.year1}) ↔ ${pair.country2} (${pair.year2}) - ${pair.similarity.toFixed(4)}`
    )
    console.log(`     ${pair.speaker1} | ${pair.speaker2}`)
  })

  db.close()
  console.log('✅ Concurrent analysis complete!')
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const options: Parameters<typeof calculateAllSpeechSimilarities>[0] = {}

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--year':
        options.year = parseInt(args[++i])
        break
      case '--force':
        options.forceRecalculate = true
        break
      case '--batch-size':
        options.batchSize = parseInt(args[++i])
        break
      case '--threshold':
        options.similarityThreshold = parseFloat(args[++i])
        break
      case '--max-workers':
        options.maxWorkers = parseInt(args[++i])
        break
      case '--help':
        console.log(`
Usage: node calculate-speech-similarities.ts [options]

Options:
  --year <year>         Calculate similarities only for specific year
  --force               Force recalculation of existing similarities
  --batch-size <size>   Number of speeches to process per batch (default: 50)
  --threshold <value>   Minimum similarity to store (default: 0.5)
  --max-workers <num>   Maximum number of worker threads (default: min(CPU cores, 8))
  --help               Show this help message

Examples:
  node calculate-speech-similarities.ts                    # Calculate all similarities
  node calculate-speech-similarities.ts --year 2024       # Only 2024 speeches  
  node calculate-speech-similarities.ts --force           # Recalculate everything
  node calculate-speech-similarities.ts --threshold 0.7   # Only store high similarities
  node calculate-speech-similarities.ts --max-workers 4   # Use 4 worker threads
        `)
        process.exit(0)
    }
  }

  try {
    await calculateAllSpeechSimilarities(options)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Run main function if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { calculateAllSpeechSimilarities }
