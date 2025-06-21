import Database from 'better-sqlite3'
import { join } from 'path'
import { load } from 'sqlite-vec'
import fs from 'fs'

interface Speech {
  id: number
  country: string
  speaker: string
  title: string
  date: string
  embeddingId: number
}

interface SimilarityData {
  speeches: Array<{
    id: number
    country: string
    speaker: string
    title: string
    date: string
    index: number
  }>
  similarities: number[][]
}

function openDatabase(): Database.Database {
  const dbPath = join(process.cwd(), 'data', 'un_speeches.db')
  const db = new Database(dbPath, { readonly: true })

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

async function analyzeSpeechSimilarity2024() {
  console.log('🔍 Starting 2024 speech similarity analysis...')

  const db = openDatabase()

  // Get all 2024 speeches with embeddings
  const query = `
    SELECT DISTINCT
      s.id,
      s.country_code as country,
      s.speaker,
      s.text as title,
      s.year || '-' || s.session as date,
      sc.embedding_id
    FROM speeches s
    JOIN speech_chunks sc ON s.id = sc.speech_id 
    WHERE s.year = 2024 
    AND sc.embedding_id IS NOT NULL
    AND sc.chunk_index = 0
    ORDER BY s.country_code
  `

  const allRows = db.prepare(query).all() as Array<{
    id: number
    country: string
    speaker: string
    title: string
    date: string
    embedding_id: number
  }>
  console.log(`📊 Found ${allRows.length} speeches from 2024 with embeddings`)

  // Select 40 representative countries (mix of major powers, regions, and interesting cases)
  const selectedCountries = [
    'USA',
    'CHN',
    'RUS',
    'GBR',
    'FRA',
    'DEU',
    'JPN',
    'IND',
    'BRA',
    'CAN',
    'AUS',
    'KOR',
    'ITA',
    'ESP',
    'NLD',
    'ISR',
    'PSE',
    'UKR',
    'TUR',
    'IRN',
    'SAU',
    'EGY',
    'ZAF',
    'NGA',
    'KEN',
    'ETH',
    'GHA',
    'SEN',
    'RWA',
    'AGO',
    'ARG',
    'MEX',
    'CHL',
    'COL',
    'PER',
    'VEN',
    'NOR',
    'SWE',
    'DNK',
    'FIN',
  ]

  // Filter to only selected countries
  const rows = allRows.filter((row) => selectedCountries.includes(row.country))
  console.log(
    `🎯 Selected ${rows.length} countries for analysis: ${rows.map((r) => r.country).join(', ')}`
  )

  if (rows.length === 0) {
    console.log('❌ No speeches found for selected countries')
    return
  }

  // Parse embeddings and prepare speech data
  const speeches: Speech[] = rows.map((row) => ({
    id: row.id,
    country: row.country,
    speaker: row.speaker,
    title: row.title.substring(0, 100) + '...', // Truncate for display
    date: row.date,
    embeddingId: row.embedding_id,
  }))

  // Function to get embedding by ID
  function getEmbedding(embeddingId: number): number[] {
    const result = db
      .prepare('SELECT embedding FROM speech_embeddings WHERE rowid = ?')
      .get(embeddingId) as { embedding: Float32Array } | undefined
    if (!result) throw new Error(`Embedding not found for ID ${embeddingId}`)
    return Array.from(result.embedding)
  }

  console.log('🧮 Computing pairwise similarities...')
  const similarities: number[][] = []

  // Compute similarity matrix
  for (let i = 0; i < speeches.length; i++) {
    similarities[i] = []
    for (let j = 0; j < speeches.length; j++) {
      if (i === j) {
        similarities[i][j] = 1.0 // Self-similarity
      } else if (i > j) {
        similarities[i][j] = similarities[j][i] // Use symmetry
      } else {
        const embedding1 = getEmbedding(speeches[i].embeddingId)
        const embedding2 = getEmbedding(speeches[j].embeddingId)
        const sim = cosineSimilarity(embedding1, embedding2)
        similarities[i][j] = sim
      }
    }

    if ((i + 1) % 20 === 0) {
      console.log(`  Progress: ${i + 1}/${speeches.length} rows completed`)
    }
  }

  // Prepare data for visualization
  const visualizationData: SimilarityData = {
    speeches: speeches.map((speech, index) => ({
      id: speech.id,
      country: speech.country,
      speaker: speech.speaker,
      title: speech.title,
      date: speech.date,
      index,
    })),
    similarities,
  }

  // Save results
  const outputPath =
    '/Users/koenvangilst/Code/un-speeches-v2/analysis/speech-similarity-2024.json'
  fs.writeFileSync(outputPath, JSON.stringify(visualizationData, null, 2))
  console.log(`💾 Results saved to ${outputPath}`)

  // Print some statistics
  const allSimilarities = similarities.flat().filter((sim) => sim < 1.0) // Exclude self-similarities
  const avgSimilarity =
    allSimilarities.reduce((a, b) => a + b, 0) / allSimilarities.length
  const maxSimilarity = Math.max(...allSimilarities)
  const minSimilarity = Math.min(...allSimilarities)

  console.log(`\n📈 Similarity Statistics:`)
  console.log(`  Average similarity: ${avgSimilarity.toFixed(4)}`)
  console.log(`  Maximum similarity: ${maxSimilarity.toFixed(4)}`)
  console.log(`  Minimum similarity: ${minSimilarity.toFixed(4)}`)

  // Find top similar pairs
  const pairs: Array<{ speech1: number; speech2: number; similarity: number }> =
    []
  for (let i = 0; i < speeches.length; i++) {
    for (let j = i + 1; j < speeches.length; j++) {
      pairs.push({
        speech1: i,
        speech2: j,
        similarity: similarities[i][j],
      })
    }
  }

  const topPairs = pairs
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10)
  console.log(`\n🔝 Top 10 Most Similar Speech Pairs:`)
  topPairs.forEach((pair, idx) => {
    const speech1 = speeches[pair.speech1]
    const speech2 = speeches[pair.speech2]
    console.log(
      `  ${idx + 1}. ${speech1.country} ↔ ${speech2.country} (${pair.similarity.toFixed(4)})`
    )
  })

  db.close()
  console.log('✅ Analysis complete!')
}

// Run the analysis
analyzeSpeechSimilarity2024().catch(console.error)
