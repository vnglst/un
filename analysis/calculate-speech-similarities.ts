import Database from 'better-sqlite3'
import { join } from 'path'
import { load } from 'sqlite-vec'
import fs from 'fs'

interface SpeechEmbedding {
  speechId: number
  embeddingId: number
  country: string
  year: number
  speaker: string
}

function openDatabase(): Database.Database {
  const dbPath = join(process.cwd(), 'data', 'un_speeches.db')
  const db = new Database(dbPath, { readonly: false })

  // Load sqlite-vec extension
  load(db)
  console.log('✅ sqlite-vec extension loaded')

  return db
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

async function calculateAllSpeechSimilarities(options: {
  year?: number
  forceRecalculate?: boolean
  batchSize?: number
  similarityThreshold?: number
}) {
  const {
    year,
    forceRecalculate = false,
    batchSize = 100,
    similarityThreshold = 0.5,
  } = options

  console.log('🔍 Starting speech similarity calculation...')

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

  // Function to get embedding by ID
  function getEmbedding(embeddingId: number): number[] {
    const result = db
      .prepare('SELECT embedding FROM speech_embeddings WHERE rowid = ?')
      .get(embeddingId) as { embedding: Float32Array } | undefined
    if (!result) throw new Error(`Embedding not found for ID ${embeddingId}`)
    return Array.from(result.embedding)
  }

  // Prepare insert statement
  const insertSimilarity = db.prepare(`
    INSERT OR REPLACE INTO speech_similarities (speech1_id, speech2_id, similarity)
    VALUES (?, ?, ?)
  `)

  console.log('🧮 Computing pairwise similarities...')
  let totalPairs = 0
  let insertedPairs = 0
  const startTime = Date.now()

  // Process in batches for better performance
  for (let i = 0; i < speeches.length; i += batchSize) {
    const batch = speeches.slice(i, i + batchSize)

    // Begin transaction for this batch
    const transaction = db.transaction(() => {
      for (const speech1 of batch) {
        const embedding1 = getEmbedding(speech1.embeddingId)

        for (const speech2 of speeches) {
          // Skip self-similarity and duplicate pairs (speech1_id < speech2_id)
          if (speech1.speechId >= speech2.speechId) continue

          totalPairs++

          // Check if similarity already exists (unless force recalculate)
          if (!forceRecalculate) {
            const existing = db
              .prepare(
                'SELECT 1 FROM speech_similarities WHERE speech1_id = ? AND speech2_id = ?'
              )
              .get(speech1.speechId, speech2.speechId)
            if (existing) continue
          }

          const embedding2 = getEmbedding(speech2.embeddingId)
          const similarity = cosineSimilarity(embedding1, embedding2)

          // Only store similarities above threshold to save space
          if (similarity >= similarityThreshold) {
            insertSimilarity.run(speech1.speechId, speech2.speechId, similarity)
            insertedPairs++
          }
        }
      }
    })

    transaction()

    const progress = (((i + batch.length) / speeches.length) * 100).toFixed(1)
    const elapsed = (Date.now() - startTime) / 1000
    const estimated = (elapsed / (i + batch.length)) * speeches.length
    console.log(
      `  Progress: ${progress}% (${i + batch.length}/${speeches.length} speeches) - ${elapsed.toFixed(1)}s elapsed, ~${estimated.toFixed(1)}s total`
    )
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

  console.log(`\n📈 Similarity Calculation Complete!`)
  console.log(`  Processing time: ${elapsedTime.toFixed(1)} seconds`)
  console.log(`  Total speech pairs processed: ${totalPairs.toLocaleString()}`)
  console.log(
    `  Similarities stored (>=${similarityThreshold}): ${insertedPairs.toLocaleString()}`
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
  console.log('✅ Analysis complete!')
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
      case '--help':
        console.log(`
Usage: node calculate-speech-similarities.ts [options]

Options:
  --year <year>         Calculate similarities only for specific year
  --force               Force recalculation of existing similarities
  --batch-size <size>   Number of speeches to process per batch (default: 100)
  --threshold <value>   Minimum similarity to store (default: 0.5)
  --help               Show this help message

Examples:
  node calculate-speech-similarities.ts                    # Calculate all similarities
  node calculate-speech-similarities.ts --year 2024       # Only 2024 speeches  
  node calculate-speech-similarities.ts --force           # Recalculate everything
  node calculate-speech-similarities.ts --threshold 0.7   # Only store high similarities
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
