import { type LoaderFunctionArgs } from 'react-router'
import Database from 'better-sqlite3'
import { join } from 'path'

function openDatabase(): Database.Database {
  const dbPath = join(process.cwd(), 'data', 'un_speeches.db')
  return new Database(dbPath, { readonly: true })
}

interface SpeechMetadata {
  id: number
  country: string
  speaker: string
  post: string
  date: string
  year: number
}

interface SimilarityResponse {
  speeches: SpeechMetadata[]
  similarities: Array<{
    speech1_id: number
    speech2_id: number
    similarity: number
  }>
  matrix?: number[][]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const year = url.searchParams.get('year')
  const threshold = parseFloat(url.searchParams.get('threshold') || '0.5')
  const format = url.searchParams.get('format') || 'list' // 'list', 'matrix', or 'countries'
  const countries =
    url.searchParams.get('countries')?.split(',').filter(Boolean) || []

  try {
    const db = openDatabase()

    // If format is 'countries', return available countries
    if (format === 'countries') {
      let countryQuery = `
        SELECT DISTINCT COALESCE(s.country_name, s.country_code) as country
        FROM speeches s
        WHERE EXISTS (
          SELECT 1 FROM speech_similarities ss 
          WHERE (ss.speech1_id = s.id OR ss.speech2_id = s.id)
          AND ss.similarity >= ?
        )
      `
      const countryParams: (number | string)[] = [threshold]

      if (year && year !== 'all') {
        countryQuery += ' AND s.year = ?'
        countryParams.push(parseInt(year))
      }

      countryQuery += ' ORDER BY country'

      const countryResults = db.prepare(countryQuery).all(...countryParams) as {
        country: string
      }[]

      return Response.json({
        countries: countryResults.map((r) => r.country),
      })
    }

    // Get speeches for the selected countries and year (without similarity filtering)
    let speechQuery = `
      SELECT DISTINCT
        s.id,
        COALESCE(s.country_name, s.country_code) as country,
        s.speaker,
        s.post,
        s.year || '-01-01' as date,
        s.year
      FROM speeches s
      WHERE 1=1
    `

    const params: (number | string)[] = []

    if (year && year !== 'all') {
      speechQuery += ` AND s.year = ?`
      params.push(parseInt(year))
    }

    // Filter by countries if provided
    if (countries.length > 0) {
      const countryPlaceholders = countries.map(() => '?').join(',')
      speechQuery += ` AND COALESCE(s.country_name, s.country_code) IN (${countryPlaceholders})`
      params.push(...countries)
    }

    speechQuery += ` ORDER BY COALESCE(s.country_name, s.country_code), s.year`

    const speeches = db.prepare(speechQuery).all(...params) as SpeechMetadata[]

    if (speeches.length === 0) {
      db.close()
      return Response.json({ speeches: [], similarities: [] })
    }

    // Get similarities for these speeches (apply threshold here, not in speech selection)
    const speechIds = speeches.map((s) => s.id)
    const placeholders = speechIds.map(() => '?').join(',')

    const similarityQuery = `
      SELECT speech1_id, speech2_id, similarity
      FROM speech_similarities
      WHERE speech1_id IN (${placeholders})
        AND speech2_id IN (${placeholders})
        AND similarity >= ?
      ORDER BY similarity DESC
    `

    const similarities = db
      .prepare(similarityQuery)
      .all(...speechIds, ...speechIds, threshold) as Array<{
      speech1_id: number
      speech2_id: number
      similarity: number
    }>

    const response: SimilarityResponse = {
      speeches,
      similarities,
    }

    // If matrix format is requested, convert to matrix
    if (format === 'matrix') {
      const matrix: number[][] = Array(speeches.length)
        .fill(null)
        .map(() => Array(speeches.length).fill(0))

      // Create speech ID to index mapping
      const idToIndex = new Map<number, number>()
      speeches.forEach((speech, index) => {
        idToIndex.set(speech.id, index)
      })

      // Fill the matrix with similarity data (only for pairs above threshold)
      similarities.forEach(({ speech1_id, speech2_id, similarity }) => {
        const index1 = idToIndex.get(speech1_id)
        const index2 = idToIndex.get(speech2_id)

        if (index1 !== undefined && index2 !== undefined) {
          matrix[index1][index2] = similarity
          matrix[index2][index1] = similarity // Symmetric matrix
        }
      })

      // Set diagonal to 1 (self-similarity)
      for (let i = 0; i < speeches.length; i++) {
        matrix[i][i] = 1
      }

      response.matrix = matrix
    }

    db.close()
    return Response.json(response)
  } catch (error) {
    console.error('Error fetching similarities:', error)
    return Response.json(
      { error: 'Failed to fetch similarities' },
      { status: 500 }
    )
  }
}
