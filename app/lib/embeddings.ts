import { pipeline } from '@xenova/transformers'
import { logger } from './logger.js'

// Global embedder instance (lazy loaded)
let embedder: Awaited<ReturnType<typeof pipeline>> | null = null

/**
 * Initialize the embedding model
 * Uses Xenova/bge-small-en-v1.5 (384 dimensions, 133MB)
 * Good quality and small footprint
 */
async function initEmbedder() {
  if (!embedder) {
    logger.info('Initializing local embedding model', {
      model: 'Xenova/bge-small-en-v1.5',
      dimensions: 384,
    })

    embedder = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5')

    logger.info('Embedding model initialized successfully')
  }
  return embedder
}

/**
 * Generate embeddings for an array of texts
 * @param texts - Array of text strings to embed
 * @returns Array of embedding vectors (each is a number[])
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const model = await initEmbedder()

  logger.debug('Generating embeddings', { textCount: texts.length })

  const startTime = Date.now()

  const embeddings = await Promise.all(
    texts.map(async (text) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const output = await model(text, {
        pooling: 'mean',
        normalize: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return Array.from((output as any).data) as number[]
    })
  )

  const duration = Date.now() - startTime
  logger.info('Embeddings generated', {
    count: embeddings.length,
    dimensions: embeddings[0]?.length || 0,
    durationMs: duration,
    avgMs: Math.round(duration / embeddings.length),
  })

  return embeddings
}

/**
 * Generate embedding for a single text
 * @param text - Text string to embed
 * @returns Embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const [embedding] = await generateEmbeddings([text])
  return embedding
}

/**
 * Get the embedding dimension size (384 for bge-small-en-v1.5)
 */
export const EMBEDDING_DIMENSIONS = 384
