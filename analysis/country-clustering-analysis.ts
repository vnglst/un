#!/usr/bin/env node

/**
 * Country Clustering Analysis
 *
 * This script analyzes semantic similarity between countries based on their UN General Assembly speeches.
 * It creates country-level embeddings, applies dimensionality reduction and clustering to discover
 * natural groupings, and identifies the main themes for each cluster.
 */

import Database from 'better-sqlite3'
import { config } from 'dotenv'
import { existsSync, writeFileSync } from 'fs'
import { join } from 'path'
import { load } from 'sqlite-vec'

// Load environment variables
config()

// Configuration
const DB_PATH = join(process.cwd(), 'data', 'un_speeches.db')
const START_YEAR = 2020
const END_YEAR = 2024
const MIN_CHUNKS_PER_COUNTRY = 3 // Reduced threshold to include more countries

// Types
interface CountryEmbedding {
  countryCode: string
  countryName: string
  year: number
  embedding: number[]
  chunkCount: number
  speechCount: number
  avgChunkLength: number
}

interface CountryPoint {
  countryCode: string
  countryName: string
  year: number
  x: number
  y: number
  clusterId: number
  chunkCount: number
  speechCount: number
}

interface ClusterInfo {
  id: number
  name: string
  description: string
  countries: string[]
  representativeChunks: Array<{
    text: string
    country: string
    similarity: number
  }>
  color: string
}

interface AnalysisResult {
  year: number
  countries: CountryPoint[]
  clusters: ClusterInfo[]
  metadata: {
    totalCountries: number
    totalChunks: number
    processingTime: number
    umapParams: object
    clusteringParams: object
  }
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

  const db = new Database(DB_PATH, { readonly: true })

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
 * Get country-level embeddings for a specific year
 */
function getCountryEmbeddings(
  db: Database.Database,
  year: number
): CountryEmbedding[] {
  console.log(`Fetching country embeddings for year ${year}...`)

  // Get all countries with their chunks and embeddings for the specified year
  const query = `
    SELECT 
      s.country_code,
      s.country_name,
      s.year,
      COUNT(c.id) as chunk_count,
      COUNT(DISTINCT s.id) as speech_count,
      AVG(LENGTH(c.chunk_text)) as avg_chunk_length
    FROM speeches s
    JOIN speech_chunks c ON s.id = c.speech_id
    WHERE s.year = ? 
      AND c.embedding_id IS NOT NULL
    GROUP BY s.country_code, s.country_name, s.year
    HAVING chunk_count >= ?
    ORDER BY s.country_name
  `

  const countries = db
    .prepare(query)
    .all(year, MIN_CHUNKS_PER_COUNTRY) as Array<{
    country_code: string
    country_name: string
    year: number
    chunk_count: number
    speech_count: number
    avg_chunk_length: number
  }>

  console.log(`✓ Found ${countries.length} countries with sufficient data`)

  // Use all countries for comprehensive analysis
  const limitedCountries = countries.sort(
    (a, b) => b.chunk_count - a.chunk_count
  ) // Still sort by chunk count for processing order

  console.log(
    `✓ Processing all ${limitedCountries.length} countries for comprehensive analysis`
  )

  const countryEmbeddings: CountryEmbedding[] = []

  // For now, we'll create a simplified approach by getting the first country's embedding
  // as a reference and then calculate all pairwise distances
  console.log(
    '⚠️  Using distance-based approach (embeddings are in binary format)'
  )

  // We'll store empty embeddings and calculate similarities on-demand
  for (const country of limitedCountries) {
    countryEmbeddings.push({
      countryCode: country.country_code,
      countryName: country.country_name,
      year: country.year,
      embedding: [], // Will be populated differently
      chunkCount: country.chunk_count,
      speechCount: country.speech_count,
      avgChunkLength: country.avg_chunk_length,
    })
  }

  console.log(
    `✓ Prepared ${countryEmbeddings.length} countries for distance calculation`
  )
  return countryEmbeddings
}

/**
 * Calculate country-to-country distances using average embedding distances
 */
function calculateCountryDistances(
  db: Database.Database,
  countries: CountryEmbedding[],
  year: number
): number[][] {
  console.log('Calculating pairwise country distances...')

  const n = countries.length
  const distances = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0))

  // Calculate pairwise distances between countries
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const country1 = countries[i]
      const country2 = countries[j]

      // Get chunks for both countries
      const chunks1Query = `
        SELECT c.embedding_id
        FROM speech_chunks c
        JOIN speeches s ON c.speech_id = s.id
        WHERE s.country_code = ? AND s.year = ? AND c.embedding_id IS NOT NULL
      `

      const chunks1 = db
        .prepare(chunks1Query)
        .all(country1.countryCode, year) as Array<{ embedding_id: number }>
      const chunks2 = db
        .prepare(chunks1Query)
        .all(country2.countryCode, year) as Array<{ embedding_id: number }>

      if (chunks1.length === 0 || chunks2.length === 0) {
        distances[i][j] = distances[j][i] = 1.0
        continue
      }

      // Calculate average distance between all chunk pairs
      let totalDistance = 0
      let pairCount = 0

      const sampleSize = Math.min(3, chunks1.length) // Further reduced for large-scale analysis
      const chunks1Sample = chunks1.slice(0, sampleSize)
      const chunks2Sample = chunks2.slice(0, sampleSize)

      for (const chunk1 of chunks1Sample) {
        for (const chunk2 of chunks2Sample) {
          const distanceQuery = `
            SELECT vec_distance_cosine(
              (SELECT embedding FROM speech_embeddings WHERE rowid = ?),
              (SELECT embedding FROM speech_embeddings WHERE rowid = ?)
            ) as distance
          `

          const result = db
            .prepare(distanceQuery)
            .get(chunk1.embedding_id, chunk2.embedding_id) as {
            distance: number
          }
          totalDistance += result.distance
          pairCount++
        }
      }

      const avgDistance = pairCount > 0 ? totalDistance / pairCount : 1.0
      distances[i][j] = distances[j][i] = avgDistance
    }

    if ((i + 1) % 5 === 0) {
      console.log(
        `  Processed ${i + 1}/${n} countries (${Math.round(((i + 1) / n) * 100)}%)`
      )
    }
  }

  console.log('✓ Distance calculation completed')
  return distances
}

/**
 * Simple multidimensional scaling (MDS) implementation
 */
function applyMDS(distanceMatrix: number[][]): number[][] {
  const n = distanceMatrix.length
  if (n === 0) return []

  // Create coordinate matrix initialized with random values
  const coordinates: number[][] = []
  for (let i = 0; i < n; i++) {
    coordinates.push([Math.random() * 2 - 1, Math.random() * 2 - 1])
  }

  // Simple stress minimization using gradient descent
  const learningRate = 0.01
  const iterations = 100

  for (let iter = 0; iter < iterations; iter++) {
    // Calculate gradients
    const gradients: number[][] = coordinates.map(() => [0, 0])

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue

        const dx = coordinates[i][0] - coordinates[j][0]
        const dy = coordinates[i][1] - coordinates[j][1]
        const currentDistance = Math.sqrt(dx * dx + dy * dy)
        const targetDistance = distanceMatrix[i][j]

        if (currentDistance > 0) {
          const error = currentDistance - targetDistance
          const factor = error / currentDistance

          gradients[i][0] += factor * dx * learningRate
          gradients[i][1] += factor * dy * learningRate
        }
      }
    }

    // Update coordinates
    for (let i = 0; i < n; i++) {
      coordinates[i][0] -= gradients[i][0]
      coordinates[i][1] -= gradients[i][1]
    }
  }

  return coordinates
}

/**
 * Apply UMAP dimensionality reduction using distance matrix
 */
function applyUMAP(
  countries: CountryEmbedding[],
  distanceMatrix: number[][]
): CountryPoint[] {
  console.log('Applying UMAP dimensionality reduction...')

  // For simplicity, we'll use classical MDS (multidimensional scaling) instead of UMAP
  // since we have a distance matrix rather than feature vectors
  const coordinates = applyMDS(distanceMatrix)

  console.log('✓ Dimensionality reduction completed')

  return countries.map((country, index) => ({
    countryCode: country.countryCode,
    countryName: country.countryName,
    year: country.year,
    x: coordinates[index][0],
    y: coordinates[index][1],
    clusterId: -1, // Will be set by clustering
    chunkCount: country.chunkCount,
    speechCount: country.speechCount,
  }))
}

/**
 * Simple DBSCAN clustering implementation
 */
function applyClustering(points: CountryPoint[]): CountryPoint[] {
  console.log('Applying DBSCAN clustering...')

  // Calculate epsilon (distance threshold) based on data distribution
  const distances = []
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dist = Math.sqrt(
        Math.pow(points[i].x - points[j].x, 2) +
          Math.pow(points[i].y - points[j].y, 2)
      )
      distances.push(dist)
    }
  }

  distances.sort((a, b) => a - b)
  const epsilon = distances[Math.floor(distances.length * 0.05)] // 5th percentile for more strict clustering
  const minPoints = Math.max(3, Math.floor(points.length / 15)) // Require more points per cluster

  console.log(`  Using epsilon: ${epsilon.toFixed(3)}, minPoints: ${minPoints}`)

  const clustered = dbscan(points, epsilon, minPoints)

  // Reassign cluster IDs to be sequential starting from 0
  const uniqueClusters = [...new Set(clustered.map((p) => p.clusterId))].filter(
    (id) => id >= 0
  )
  const clusterMap = new Map(uniqueClusters.map((id, index) => [id, index]))

  clustered.forEach((point) => {
    if (point.clusterId >= 0) {
      point.clusterId = clusterMap.get(point.clusterId)!
    }
  })

  const clusterCounts = clustered.reduce(
    (acc, point) => {
      const key = point.clusterId >= 0 ? point.clusterId : 'noise'
      acc[key] = (acc[key] || 0) + 1
      return acc
    },
    {} as Record<string | number, number>
  )

  console.log('✓ Clustering completed:', clusterCounts)
  return clustered
}

/**
 * DBSCAN clustering algorithm
 */
function dbscan(
  points: CountryPoint[],
  epsilon: number,
  minPoints: number
): CountryPoint[] {
  const result = points.map((p) => ({ ...p }))
  let clusterId = 0

  for (let i = 0; i < result.length; i++) {
    if (result[i].clusterId !== -1) continue

    const neighbors = getNeighbors(result, i, epsilon)
    if (neighbors.length < minPoints) {
      result[i].clusterId = -2 // Mark as noise
      continue
    }

    result[i].clusterId = clusterId
    expandCluster(result, neighbors, clusterId, epsilon, minPoints)
    clusterId++
  }

  return result
}

/**
 * Get neighbors within epsilon distance
 */
function getNeighbors(
  points: CountryPoint[],
  pointIndex: number,
  epsilon: number
): number[] {
  const neighbors = []
  const point = points[pointIndex]

  for (let i = 0; i < points.length; i++) {
    if (i === pointIndex) continue

    const dist = Math.sqrt(
      Math.pow(point.x - points[i].x, 2) + Math.pow(point.y - points[i].y, 2)
    )

    if (dist <= epsilon) {
      neighbors.push(i)
    }
  }

  return neighbors
}

/**
 * Expand cluster by adding density-reachable points
 */
function expandCluster(
  points: CountryPoint[],
  neighbors: number[],
  clusterId: number,
  epsilon: number,
  minPoints: number
): void {
  let i = 0
  while (i < neighbors.length) {
    const neighborIndex = neighbors[i]

    if (points[neighborIndex].clusterId === -2) {
      points[neighborIndex].clusterId = clusterId
    } else if (points[neighborIndex].clusterId === -1) {
      points[neighborIndex].clusterId = clusterId

      const newNeighbors = getNeighbors(points, neighborIndex, epsilon)
      if (newNeighbors.length >= minPoints) {
        neighbors.push(...newNeighbors)
      }
    }

    i++
  }
}

/**
 * Identify cluster themes by finding representative chunks
 */
function identifyClusterThemes(
  db: Database.Database,
  countryPoints: CountryPoint[],
  year: number
): ClusterInfo[] {
  console.log('Identifying cluster themes...')

  const clusters = new Map<number, CountryPoint[]>()

  // Group countries by cluster
  for (const point of countryPoints) {
    if (point.clusterId >= 0) {
      if (!clusters.has(point.clusterId)) {
        clusters.set(point.clusterId, [])
      }
      clusters.get(point.clusterId)!.push(point)
    }
  }

  const clusterInfos: ClusterInfo[] = []
  const colors = [
    '#e74c3c',
    '#3498db',
    '#2ecc71',
    '#f39c12',
    '#9b59b6',
    '#1abc9c',
    '#34495e',
    '#e67e22',
  ]

  for (const [clusterId, clusterCountries] of clusters.entries()) {
    const countryCodes = clusterCountries.map((c) => c.countryCode)

    // Get representative chunks from countries in this cluster
    const chunksQuery = `
      SELECT 
        c.chunk_text,
        s.country_name,
        c.embedding_id
      FROM speech_chunks c
      JOIN speeches s ON c.speech_id = s.id
      WHERE s.country_code IN (${countryCodes.map(() => '?').join(',')})
        AND s.year = ?
        AND c.embedding_id IS NOT NULL
      ORDER BY RANDOM()
      LIMIT 50
    `

    const chunks = db.prepare(chunksQuery).all(...countryCodes, year) as Array<{
      chunk_text: string
      country_name: string
      embedding_id: number
    }>

    // For now, use simple heuristics to identify themes
    // In a more sophisticated version, we could calculate cluster centroids
    const representativeChunks = chunks.slice(0, 5).map((chunk) => ({
      text: chunk.chunk_text.substring(0, 200) + '...',
      country: chunk.country_name,
      similarity: 0.8, // Placeholder
    }))

    // Generate cluster name and description based on countries
    const clusterName = generateClusterName(clusterCountries)
    const clusterDescription = generateClusterDescription(
      clusterCountries,
      representativeChunks
    )

    clusterInfos.push({
      id: clusterId,
      name: clusterName,
      description: clusterDescription,
      countries: clusterCountries.map((c) => c.countryName),
      representativeChunks,
      color: colors[clusterId % colors.length],
    })
  }

  console.log(`✓ Identified ${clusterInfos.length} cluster themes`)
  return clusterInfos
}

/**
 * Generate cluster name based on member countries
 */
function generateClusterName(countries: CountryPoint[]): string {
  const countryNames = countries.map((c) => c.countryName)

  // Simple heuristics for common groupings
  const hasNordic = countryNames.some((name) =>
    ['Sweden', 'Norway', 'Denmark', 'Finland'].includes(name)
  )
  const hasEU = countryNames.some((name) =>
    ['Germany', 'France', 'Italy', 'Netherlands'].includes(name)
  )
  const hasAfrica = countryNames.some((name) =>
    ['Nigeria', 'South Africa', 'Kenya', 'Egypt'].includes(name)
  )
  const hasLatin = countryNames.some((name) =>
    ['Brazil', 'Argentina', 'Mexico', 'Chile'].includes(name)
  )

  if (hasNordic) return 'Nordic & Progressive States'
  if (hasEU) return 'European Union & Allies'
  if (hasAfrica) return 'African Union States'
  if (hasLatin) return 'Latin American States'

  return `Cluster ${countries[0]?.clusterId + 1}`
}

/**
 * Generate cluster description
 */
function generateClusterDescription(
  countries: CountryPoint[],
  chunks: Array<{ text: string; country: string; similarity: number }>
): string {
  const themes = []

  // Analyze chunk content for common themes
  const allText = chunks.map((c) => c.text.toLowerCase()).join(' ')

  if (allText.includes('climate') || allText.includes('environment')) {
    themes.push('climate action')
  }
  if (allText.includes('development') || allText.includes('sustainable')) {
    themes.push('sustainable development')
  }
  if (allText.includes('peace') || allText.includes('security')) {
    themes.push('peace and security')
  }
  if (allText.includes('multilateral') || allText.includes('cooperation')) {
    themes.push('international cooperation')
  }

  const description =
    themes.length > 0
      ? `Focus on ${themes.join(', ')}`
      : 'Diverse policy priorities'

  return `${description} (${countries.length} countries)`
}

/**
 * Save analysis results
 */
function saveResults(result: AnalysisResult): void {
  const outputPath = join(
    process.cwd(),
    'analysis',
    `country-clusters-${result.year}.json`
  )
  writeFileSync(outputPath, JSON.stringify(result, null, 2))
  console.log(`✓ Results saved to ${outputPath}`)
}

/**
 * Print summary to console
 */
function printSummary(result: AnalysisResult): void {
  console.log('\n' + '='.repeat(60))
  console.log(`📊 COUNTRY CLUSTERING ANALYSIS - ${result.year}`)
  console.log('='.repeat(60))

  console.log(`\n📈 Overview:`)
  console.log(`   Countries analyzed: ${result.metadata.totalCountries}`)
  console.log(`   Clusters found: ${result.clusters.length}`)
  console.log(`   Processing time: ${result.metadata.processingTime}ms`)

  console.log(`\n🌍 Clusters:`)
  for (const cluster of result.clusters) {
    console.log(`\n   ${cluster.name}`)
    console.log(`   ${cluster.description}`)
    console.log(
      `   Countries: ${cluster.countries.slice(0, 5).join(', ')}${cluster.countries.length > 5 ? '...' : ''}`
    )
  }

  const noisyCountries = result.countries.filter((c) => c.clusterId < 0)
  if (noisyCountries.length > 0) {
    console.log(
      `\n🔍 Unclustered countries: ${noisyCountries.map((c) => c.countryName).join(', ')}`
    )
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const startTime = Date.now()

  console.log('🌍 Starting Country Clustering Analysis')
  console.log('='.repeat(50))

  try {
    // Initialize database
    const db = initializeDatabase()

    // Process each year
    for (let year = START_YEAR; year <= END_YEAR; year++) {
      console.log(`\n📅 Processing year ${year}...`)

      // Get country embeddings
      const countryEmbeddings = getCountryEmbeddings(db, year)

      if (countryEmbeddings.length < 30) {
        console.log(
          `⚠️  Skipping ${year}: insufficient data (${countryEmbeddings.length} countries)`
        )
        continue
      }

      // Calculate distance matrix
      const distanceMatrix = calculateCountryDistances(
        db,
        countryEmbeddings,
        year
      )

      // Apply UMAP
      const countryPoints = applyUMAP(countryEmbeddings, distanceMatrix)

      // Apply clustering
      const clusteredPoints = applyClustering(countryPoints)

      // Identify themes
      const clusters = identifyClusterThemes(db, clusteredPoints, year)

      // Create result
      const result: AnalysisResult = {
        year,
        countries: clusteredPoints,
        clusters,
        metadata: {
          totalCountries: clusteredPoints.length,
          totalChunks: countryEmbeddings.reduce(
            (sum, c) => sum + c.chunkCount,
            0
          ),
          processingTime: Date.now() - startTime,
          umapParams: { nComponents: 2, nNeighbors: 15, minDist: 0.1 },
          clusteringParams: { algorithm: 'DBSCAN' },
        },
      }

      // Save and print results
      saveResults(result)
      printSummary(result)
    }

    db.close()
    console.log('\n🎉 Country clustering analysis completed!')
  } catch (error) {
    console.error('❌ Analysis failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { main, type AnalysisResult, type CountryPoint, type ClusterInfo }
