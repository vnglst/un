import { parentPort, workerData } from 'worker_threads'
import Database from 'better-sqlite3'
import { join } from 'path'
import { load } from 'sqlite-vec'

interface WorkerData {
  speechBatch: Array<{
    speechId: number
    embeddingId: number
    country: string
    year: number
    speaker: string
  }>
  allSpeeches: Array<{
    speechId: number
    embeddingId: number
    country: string
    year: number
    speaker: string
  }>
  similarityThreshold: number
  forceRecalculate: boolean
}

interface SimilarityResult {
  speech1Id: number
  speech2Id: number
  similarity: number
}

function openDatabase(): Database.Database {
  const dbPath = join(process.cwd(), 'data', 'un_speeches.db')
  const db = new Database(dbPath, { readonly: true })

  // Load sqlite-vec extension with error handling
  try {
    load(db)
  } catch {
    console.warn('⚠️  Failed to load sqlite-vec extension in worker')
  }

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

// Main worker function
function processSpeeches() {
  const { speechBatch, allSpeeches, similarityThreshold, forceRecalculate } =
    workerData as WorkerData

  const db = openDatabase()
  const results: SimilarityResult[] = []

  // Function to get embedding by ID
  function getEmbedding(embeddingId: number): number[] {
    const result = db
      .prepare('SELECT embedding FROM speech_embeddings WHERE rowid = ?')
      .get(embeddingId) as { embedding: Float32Array } | undefined
    if (!result) throw new Error(`Embedding not found for ID ${embeddingId}`)
    return Array.from(result.embedding)
  }

  // Check if similarity already exists
  const checkExisting = db.prepare(
    'SELECT 1 FROM speech_similarities WHERE speech1_id = ? AND speech2_id = ?'
  )

  for (const speech1 of speechBatch) {
    const embedding1 = getEmbedding(speech1.embeddingId)

    for (const speech2 of allSpeeches) {
      // Skip self-similarity and duplicate pairs (speech1_id < speech2_id)
      if (speech1.speechId >= speech2.speechId) continue

      // Check if similarity already exists (unless force recalculate)
      if (!forceRecalculate) {
        const existing = checkExisting.get(speech1.speechId, speech2.speechId)
        if (existing) continue
      }

      const embedding2 = getEmbedding(speech2.embeddingId)
      const similarity = cosineSimilarity(embedding1, embedding2)

      // Only store similarities above threshold to save space
      if (similarity >= similarityThreshold) {
        results.push({
          speech1Id: speech1.speechId,
          speech2Id: speech2.speechId,
          similarity,
        })
      }
    }
  }

  db.close()
  return results
}

// Execute the worker
try {
  const results = processSpeeches()
  parentPort?.postMessage({ success: true, results })
} catch (error) {
  parentPort?.postMessage({
    success: false,
    error: error instanceof Error ? error.message : String(error),
  })
}
