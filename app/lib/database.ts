import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync, statSync } from 'fs'
import { load } from 'sqlite-vec'
import { logger, timeOperation, type LogContext } from './logger'

// =============================================================================
// DATABASE CONFIGURATION & INITIALIZATION
// =============================================================================

/**
 * Initialize database connection with proper error handling and logging
 */
function initializeDatabase(): Database.Database {
  const dbPath = join(process.cwd(), 'data', 'un_speeches.db')

  logger.info('Initializing database connection', { path: dbPath })

  // Validate database file exists
  if (!existsSync(dbPath)) {
    logger.error('Database file not found', { path: dbPath })
    logger.error(
      'Please run "npm run download-db" to download the database file'
    )
    throw new Error(
      `Database file not found at ${dbPath}. Run "npm run download-db" to download it.`
    )
  }

  // Log database file information
  const stats = statSync(dbPath)
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
  logger.info('Database file found', {
    path: dbPath,
    sizeMB: `${sizeMB} MB`,
    lastModified: stats.mtime.toISOString(),
  })

  // Create database connection
  const database = new Database(dbPath, { readonly: true })

  // Load sqlite-vec extension for vector operations
  load(database)
  logger.info('sqlite-vec extension loaded')

  logger.info('Database connection established')

  return database
}

const db = initializeDatabase()

// =============================================================================
// HEALTH CHECK & DIAGNOSTICS
// =============================================================================

export function isDatabaseHealthy(): boolean {
  try {
    const result = db.prepare('SELECT 1 as test').get() as { test: number }
    return result?.test === 1
  } catch (error) {
    logger.error('Database health check failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

export function getDatabaseStats(): {
  healthy: boolean
  speechCount?: number
  sizeMB?: string
  error?: string
} {
  try {
    if (!isDatabaseHealthy()) {
      return { healthy: false, error: 'Database connection failed' }
    }

    const countResult = db
      .prepare('SELECT COUNT(*) as count FROM speeches')
      .get() as { count: number }

    const dbPath = join(process.cwd(), 'data', 'un_speeches.db')
    const stats = statSync(dbPath)
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2)

    return {
      healthy: true,
      speechCount: countResult.count,
      sizeMB: `${sizeMB} MB`,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('Failed to get database stats', { error: errorMessage })
    return { healthy: false, error: errorMessage }
  }
}

// =============================================================================
// FULL TEXT SEARCH (FTS) INITIALIZATION
// =============================================================================

/**
 * Create FTS virtual table for full-text search capabilities
 */
function createFTSTable(): void {
  const createFTSQuery = `
    CREATE VIRTUAL TABLE IF NOT EXISTS speeches_fts 
    USING fts5(text, speaker, country_name, content=speeches, content_rowid=id)
  `
  logger.debug('Creating FTS table', { query: createFTSQuery.trim() })
  db.prepare(createFTSQuery).run()
}

/**
 * Create database triggers to keep FTS index synchronized with main table
 */
function createFTSTriggers(): void {
  const triggers = [
    {
      name: 'speeches_ai',
      event: 'AFTER INSERT',
      action: `
        INSERT INTO speeches_fts(rowid, text, speaker, country_name) 
        VALUES (new.id, new.text, new.speaker, new.country_name);
      `,
    },
    {
      name: 'speeches_ad',
      event: 'AFTER DELETE',
      action: `
        INSERT INTO speeches_fts(speeches_fts, rowid, text, speaker, country_name) 
        VALUES('delete', old.id, old.text, old.speaker, old.country_name);
      `,
    },
    {
      name: 'speeches_au',
      event: 'AFTER UPDATE',
      action: `
        INSERT INTO speeches_fts(speeches_fts, rowid, text, speaker, country_name) 
        VALUES('delete', old.id, old.text, old.speaker, old.country_name);
        INSERT INTO speeches_fts(rowid, text, speaker, country_name) 
        VALUES (new.id, new.text, new.speaker, new.country_name);
      `,
    },
  ]

  triggers.forEach(({ name, event, action }) => {
    const triggerQuery = `CREATE TRIGGER IF NOT EXISTS ${name} ${event} ON speeches BEGIN ${action} END`
    logger.debug(`Creating ${event.toLowerCase()} trigger`, {
      query: triggerQuery.trim(),
    })
    db.prepare(triggerQuery).run()
  })
}

/**
 * Check FTS index status and rebuild if necessary
 */
function validateAndRebuildFTSIfNeeded(): void {
  const ftsCount = db
    .prepare('SELECT COUNT(*) as count FROM speeches_fts')
    .get() as { count: number }

  logger.info('FTS index status', { recordCount: ftsCount.count })

  if (ftsCount.count === 0) {
    logger.warn('FTS index is empty, rebuilding...')
    rebuildFTSIndex()
  }
}

/**
 * Utility function to rebuild FTS index (useful for maintenance)
 */
function rebuildFTSIndex(): void {
  logger.info('Rebuilding FTS index')
  try {
    const start = Date.now()
    db.prepare("INSERT INTO speeches_fts(speeches_fts) VALUES('rebuild')").run()
    const duration = Date.now() - start
    logger.info('FTS index rebuild completed', { duration: `${duration}ms` })
  } catch (error) {
    logger.error('Error rebuilding FTS index', error)
    throw error
  }
}

/**
 * Initialize FTS table and triggers on database connection
 */
function initializeFTS(): void {
  logger.info('Initializing FTS (Full Text Search)')
  try {
    createFTSTable()
    createFTSTriggers()
    validateAndRebuildFTSIfNeeded()
    logger.info('FTS initialization completed successfully')
  } catch (error) {
    logger.error('Error initializing FTS', error)
  }
}

// Initialize FTS on module load
initializeFTS()

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface Speech {
  id: number
  country_name: string | null
  country_code: string
  session: number
  year: number
  speaker: string | null
  post: string
  text: string
}

export interface SearchFilters {
  country?: string
  year?: number
  session?: number
  search?: string
  searchMode?: 'exact' | 'phrase' | 'fuzzy' // Optional search mode for advanced queries
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface CountrySpeechCount {
  country_code: string
  country_name: string | null
  speech_count: number
}

export interface HighlightedSpeech extends Speech {
  highlighted_text?: string
  highlighted_speaker?: string
  highlighted_country_name?: string
}

interface SpeechesResult {
  speeches: Speech[]
  pagination: PaginationInfo
}

// =============================================================================
// BASIC SPEECH QUERIES
// =============================================================================

export function getSpeechById(id: number): Speech | null {
  logger.debug('Getting speech by ID', { id })
  const query = 'SELECT * FROM speeches WHERE id = ?'

  return timeOperation(`getSpeechById(${id})`, () => {
    const result = db.prepare(query).get(id) as Speech | null
    logger.debug('Speech query result', {
      id,
      found: !!result,
      speaker: result?.speaker,
      country: result?.country_name,
    })
    return result
  })
}

// =============================================================================
// METADATA QUERIES
// =============================================================================

export function getCountries(): Array<{
  country_name: string
  country_code: string
}> {
  logger.debug('Getting countries list')
  const query =
    'SELECT DISTINCT country_name, country_code FROM speeches WHERE country_name IS NOT NULL ORDER BY country_name ASC'

  return timeOperation('getCountries', () => {
    const results = db.prepare(query).all() as Array<{
      country_name: string
      country_code: string
    }>
    logger.debug('Countries query result', { count: results.length })
    return results
  })
}

export function getYears(): number[] {
  logger.debug('Getting years list')
  const query =
    'SELECT DISTINCT year FROM speeches WHERE year IS NOT NULL ORDER BY year DESC'

  return timeOperation('getYears', () => {
    const results = db.prepare(query).all() as Array<{ year: number }>
    const years = results.map((r) => r.year)
    logger.debug('Years query result', {
      count: years.length,
      range: `${Math.min(...years)}-${Math.max(...years)}`,
    })
    return years
  })
}

export function getSessions(): number[] {
  logger.debug('Getting sessions list')
  const query =
    'SELECT DISTINCT session FROM speeches WHERE session IS NOT NULL ORDER BY session DESC'

  return timeOperation('getSessions', () => {
    const results = db.prepare(query).all() as Array<{ session: number }>
    const sessions = results.map((r) => r.session)
    logger.debug('Sessions query result', {
      count: sessions.length,
      range: `${Math.min(...sessions)}-${Math.max(...sessions)}`,
    })
    return sessions
  })
}

export function getSpeakers(): string[] {
  logger.debug('Getting speakers list')
  const query =
    'SELECT DISTINCT speaker FROM speeches WHERE speaker IS NOT NULL ORDER BY speaker ASC'

  return timeOperation('getSpeakers', () => {
    const results = db.prepare(query).all() as Array<{ speaker: string }>
    const speakers = results.map((r) => r.speaker)
    logger.debug('Speakers query result', { count: speakers.length })
    return speakers
  })
}

export function getRoles(): string[] {
  logger.debug('Getting roles list')
  const query =
    'SELECT DISTINCT post FROM speeches WHERE post IS NOT NULL ORDER BY post ASC'

  return timeOperation('getRoles', () => {
    const results = db.prepare(query).all() as Array<{ post: string }>
    const roles = results.map((r) => r.post)
    logger.debug('Roles query result', { count: roles.length })
    return roles
  })
}

export function getAllSpeechIds(): number[] {
  logger.debug('Getting all speech IDs')
  const query = 'SELECT id FROM speeches ORDER BY id ASC'

  return timeOperation('getAllSpeechIds', () => {
    const results = db.prepare(query).all() as Array<{ id: number }>
    const ids = results.map((r) => r.id)
    logger.debug('Speech IDs query result', { count: ids.length })
    return ids
  })
}

export function getCountrySpeechCounts(): CountrySpeechCount[] {
  logger.debug('Getting country speech counts')
  const query = `
    WITH country_latest AS (
      SELECT 
        country_code,
        country_name,
        ROW_NUMBER() OVER (
          PARTITION BY country_code 
          ORDER BY year DESC, session DESC
        ) as rn
      FROM speeches 
      WHERE country_code IS NOT NULL 
        AND country_name IS NOT NULL
    ),
    country_counts AS (
      SELECT 
        country_code,
        COUNT(*) as speech_count
      FROM speeches 
      WHERE country_code IS NOT NULL
      GROUP BY country_code
    )
    SELECT 
      cc.country_code,
      cl.country_name,
      cc.speech_count
    FROM country_counts cc
    JOIN country_latest cl ON cc.country_code = cl.country_code
    WHERE cl.rn = 1
    ORDER BY cc.speech_count DESC
  `

  return timeOperation('getCountrySpeechCounts', () => {
    const results = db.prepare(query).all() as CountrySpeechCount[]
    logger.debug('Country speech counts result', {
      count: results.length,
      totalSpeeches: results.reduce((sum, c) => sum + c.speech_count, 0),
      topCountry: results[0]?.country_name,
    })
    return results
  })
}

// =============================================================================
// COUNTRY-SPECIFIC QUERIES
// =============================================================================

export function getSpeechesByCountryCode(
  countryCode: string,
  page: number = 1,
  limit: number = 20
): SpeechesResult {
  logger.debug('Getting speeches by country code', { countryCode, page, limit })

  return timeOperation(`getSpeechesByCountryCode(${countryCode})`, () => {
    const countQuery =
      'SELECT COUNT(*) as total FROM speeches WHERE country_code = ?'

    // Get total count
    const totalResult = db.prepare(countQuery).get(countryCode) as {
      total: number
    }
    const total = totalResult.total
    const totalPages = Math.ceil(total / limit)

    logger.debug('Country speeches count', { countryCode, total, totalPages })

    // Build main query with ordering and pagination
    const query = `
      SELECT * FROM speeches 
      WHERE country_code = ? 
      ORDER BY year DESC, session DESC
      LIMIT ? OFFSET ?
    `

    const speeches = db
      .prepare(query)
      .all(countryCode, limit, (page - 1) * limit) as Speech[]

    logger.debug('Country speeches query result', {
      countryCode,
      page,
      returnedCount: speeches.length,
      total,
    })

    return {
      speeches,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  })
}

// =============================================================================
// SEARCH FUNCTIONALITY
// =============================================================================

/**
 * Build FTS query string based on search mode and term
 */
function buildFTSQuery(
  searchTerm: string,
  searchMode?: 'exact' | 'phrase' | 'fuzzy'
): string {
  switch (searchMode) {
    case 'exact':
      return `"${searchTerm.replace(/"/g, '""')}"`
    case 'fuzzy': {
      const terms = searchTerm
        .split(/\s+/)
        .map((term) => term.replace(/"/g, '""'))
      return terms.join(' OR ')
    }
    case 'phrase':
    default: {
      const escapedSearchTerm = searchTerm.replace(/"/g, '""')
      return searchTerm.includes(' ')
        ? `"${escapedSearchTerm}"`
        : escapedSearchTerm
    }
  }
}

/**
 * Build query conditions and parameters for filtering
 */
function buildQueryConditions(filters: SearchFilters): {
  whereConditions: string[]
  queryParams: (string | number)[]
} {
  const whereConditions: string[] = []
  const queryParams: (string | number)[] = []

  if (filters.country) {
    whereConditions.push('country_code = ?')
    queryParams.push(filters.country)
  }

  if (filters.year) {
    whereConditions.push('year = ?')
    queryParams.push(filters.year)
  }

  if (filters.session) {
    whereConditions.push('session = ?')
    queryParams.push(filters.session)
  }

  return { whereConditions, queryParams }
}

export function searchSpeeches(
  filters: SearchFilters = {},
  page: number = 1,
  limit: number = 20
): SpeechesResult {
  logger.debug('Searching speeches', { filters, page, limit })

  // If there's a search term, use full text search for better performance and features
  if (filters.search && filters.search.trim()) {
    logger.debug('Using FTS for search')
    return searchSpeechesWithFTS(filters, page, limit)
  }

  logger.debug('Using regular filtering (no search term)')

  return timeOperation('searchSpeeches', () => {
    const { whereConditions, queryParams } = buildQueryConditions(filters)

    // Build the WHERE clause
    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    logger.debug('Search query conditions', { whereConditions, queryParams })

    // Build count query
    const countQuery = `SELECT COUNT(*) as total FROM speeches ${whereClause}`
    const totalResult = db.prepare(countQuery).get(...queryParams) as {
      total: number
    }
    const total = totalResult.total
    const totalPages = Math.ceil(total / limit)

    logger.debug('Search count result', { total, totalPages })

    // Build main query with ordering and pagination
    const query = `
      SELECT * FROM speeches ${whereClause}
      ORDER BY year DESC, session DESC, country_name ASC
      LIMIT ? OFFSET ?
    `

    const speeches = db
      .prepare(query)
      .all(...queryParams, limit, (page - 1) * limit) as Speech[]

    logger.searchQuery(filters as LogContext, speeches.length)

    return {
      speeches,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  })
}

function searchSpeechesWithFTS(
  filters: SearchFilters = {},
  page: number = 1,
  limit: number = 20
): SpeechesResult {
  logger.debug('Executing FTS search', { filters, page, limit })

  return timeOperation('searchSpeechesWithFTS', () => {
    const { whereConditions, queryParams } = buildQueryConditions(filters)

    // Handle FTS search if search term exists
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim()
      logger.debug('FTS search term', { searchTerm, mode: filters.searchMode })

      const ftsQuery = buildFTSQuery(searchTerm, filters.searchMode)
      logger.debug('FTS query generated', { ftsQuery })

      whereConditions.unshift('speeches_fts MATCH ?')
      queryParams.unshift(ftsQuery)
    }

    const joinClause =
      'INNER JOIN speeches_fts ON speeches.id = speeches_fts.rowid'
    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    logger.debug('FTS query conditions', { whereConditions, queryParams })

    // Build count query
    const countQuery = `SELECT COUNT(*) as total FROM speeches ${joinClause} ${whereClause}`
    const totalResult = db.prepare(countQuery).get(...queryParams) as {
      total: number
    }
    const total = totalResult.total
    const totalPages = Math.ceil(total / limit)

    logger.debug('FTS count result', { total, totalPages })

    // Build main query with ordering and pagination
    const orderBy =
      filters.search && filters.search.trim()
        ? 'ORDER BY bm25(speeches_fts) ASC, year DESC, session DESC'
        : 'ORDER BY year DESC, session DESC, country_name ASC'

    const query = `
      SELECT speeches.* FROM speeches ${joinClause} ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `

    const speeches = db
      .prepare(query)
      .all(...queryParams, limit, (page - 1) * limit) as Speech[]

    logger.searchQuery(filters as LogContext, speeches.length)

    return {
      speeches,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  })
}

// =============================================================================
// ADVANCED SEARCH FEATURES
// =============================================================================

export function getSearchSuggestions(
  partialText: string,
  limit: number = 10
): string[] {
  logger.debug('Getting search suggestions', { partialText, limit })

  if (!partialText || partialText.trim().length < 2) {
    logger.debug('Search suggestions: text too short')
    return []
  }

  return timeOperation('getSearchSuggestions', () => {
    const searchTerm = partialText.trim()
    const searchPattern = `%${searchTerm}%`

    // Get common words/phrases from speeches that match the partial text
    const query = `
      SELECT DISTINCT 
        CASE 
          WHEN speaker LIKE ? THEN speaker
          WHEN country_name LIKE ? THEN country_name
          ELSE NULL
        END as suggestion
      FROM speeches 
      WHERE (speaker LIKE ? OR country_name LIKE ?) 
        AND suggestion IS NOT NULL
      ORDER BY suggestion
      LIMIT ?
    `

    const results = db
      .prepare(query)
      .all(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        limit
      ) as Array<{ suggestion: string }>

    const suggestions = results.map((r) => r.suggestion).filter(Boolean)
    logger.debug('Search suggestions result', {
      partialText,
      suggestionsCount: suggestions.length,
      suggestions: suggestions.slice(0, 3), // Log first 3 for debugging
    })

    return suggestions
  })
}

export function searchSpeechesWithHighlights(
  filters: SearchFilters = {},
  page: number = 1,
  limit: number = 20
): { speeches: HighlightedSpeech[]; pagination: PaginationInfo } {
  logger.debug('Searching speeches with highlights', { filters, page, limit })

  if (!filters.search || !filters.search.trim()) {
    logger.debug('No search term, using regular search')
    // If no search term, return regular results
    const result = searchSpeeches(filters, page, limit)
    return {
      speeches: result.speeches as HighlightedSpeech[],
      pagination: result.pagination,
    }
  }

  return timeOperation('searchSpeechesWithHighlights', () => {
    const { whereConditions, queryParams } = buildQueryConditions(filters)

    const searchTerm = filters.search!.trim()
    logger.debug('Highlighted search term', {
      searchTerm,
      mode: filters.searchMode,
    })

    const ftsQuery = buildFTSQuery(searchTerm, filters.searchMode)
    logger.debug('Highlighted FTS query generated', { ftsQuery })

    whereConditions.unshift('speeches_fts MATCH ?')
    queryParams.unshift(ftsQuery)

    const joinClause =
      'INNER JOIN speeches_fts ON speeches.id = speeches_fts.rowid'
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`

    logger.debug('Highlighted query conditions', {
      whereConditions,
      queryParams,
    })

    // Build count query
    const countQuery = `SELECT COUNT(*) as total FROM speeches ${joinClause} ${whereClause}`
    const totalResult = db.prepare(countQuery).get(...queryParams) as {
      total: number
    }
    const total = totalResult.total
    const totalPages = Math.ceil(total / limit)

    logger.debug('Highlighted count result', { total, totalPages })

    // Build main query with snippets for highlighting
    const query = `
      SELECT 
        speeches.*,
        snippet(speeches_fts, 0, '<mark>', '</mark>', '...', 32) as highlighted_text,
        snippet(speeches_fts, 1, '<mark>', '</mark>', '...', 32) as highlighted_speaker,
        snippet(speeches_fts, 2, '<mark>', '</mark>', '...', 32) as highlighted_country_name
      FROM speeches ${joinClause} ${whereClause}
      ORDER BY bm25(speeches_fts) ASC, year DESC, session DESC
      LIMIT ? OFFSET ?
    `

    const speeches = db
      .prepare(query)
      .all(...queryParams, limit, (page - 1) * limit) as HighlightedSpeech[]

    logger.searchQuery(filters as LogContext, speeches.length)

    return {
      speeches,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  })
}

// =============================================================================
// SIMILARITY FUNCTIONS
// =============================================================================

export interface SpeechMetadata {
  id: number
  country: string
  speaker: string
  post: string
  date: string
  year: number
}

export interface SimilarityData {
  speeches: SpeechMetadata[]
  similarities: Array<{
    speech1_id: number
    speech2_id: number
    similarity: number
  }>
  matrix?: number[][]
}

/**
 * Get available countries for similarity analysis
 */
export function getSimilarityCountries(
  year?: number,
  threshold: number = 0.3
): string[] {
  const context: LogContext = {
    year,
    threshold,
    operation: 'getSimilarityCountries',
  }

  return timeOperation('getSimilarityCountries', () => {
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

    if (year) {
      countryQuery += ' AND s.year = ?'
      countryParams.push(year)
    }

    countryQuery += ' ORDER BY country'

    const results = db.prepare(countryQuery).all(...countryParams) as {
      country: string
    }[]

    logger.info('Retrieved similarity countries', {
      ...context,
      count: results.length,
    })

    return results.map((r) => r.country)
  })
}

/**
 * Get similarity analysis data for specified countries and year
 */
export function getSimilarityAnalysis(
  countries: string[],
  year?: number,
  threshold: number = 0.3,
  includeMatrix: boolean = false
): SimilarityData {
  const context: LogContext = {
    countries,
    year,
    threshold,
    includeMatrix,
    operation: 'getSimilarityAnalysis',
  }

  return timeOperation('getSimilarityAnalysis', () => {
    // Get speeches for the selected countries and year - limit to 2 per country to avoid performance issues
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

    if (year) {
      speechQuery += ` AND s.year = ?`
      params.push(year)
    }

    // Filter by countries if provided
    if (countries.length > 0) {
      const countryPlaceholders = countries.map(() => '?').join(',')
      speechQuery += ` AND COALESCE(s.country_name, s.country_code) IN (${countryPlaceholders})`
      params.push(...countries)
    }

    speechQuery += ` ORDER BY COALESCE(s.country_name, s.country_code), s.year DESC`

    const allSpeeches = db
      .prepare(speechQuery)
      .all(...params) as SpeechMetadata[]

    // Limit to 2 speeches per country to avoid performance issues
    const speechesByCountry = new Map<string, SpeechMetadata[]>()
    for (const speech of allSpeeches) {
      if (!speechesByCountry.has(speech.country)) {
        speechesByCountry.set(speech.country, [])
      }
      const countrySpeeches = speechesByCountry.get(speech.country)!
      if (countrySpeeches.length < 2) {
        countrySpeeches.push(speech)
      }
    }

    const speeches = Array.from(speechesByCountry.values()).flat()

    if (speeches.length === 0) {
      logger.info('No speeches found for similarity analysis', context)
      return { speeches: [], similarities: [] }
    }

    // Get similarities for these speeches
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

    const result: SimilarityData = {
      speeches,
      similarities,
    }

    // If matrix format is requested, convert to matrix
    if (includeMatrix) {
      const matrix: number[][] = Array(speeches.length)
        .fill(null)
        .map(() => Array(speeches.length).fill(0))

      // Create speech ID to index mapping
      const idToIndex = new Map<number, number>()
      speeches.forEach((speech, index) => {
        idToIndex.set(speech.id, index)
      })

      // Fill the matrix with similarity data
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

      result.matrix = matrix
    }

    logger.info('Retrieved similarity analysis', {
      ...context,
      speechCount: speeches.length,
      similarityCount: similarities.length,
    })

    return result
  })
}

export interface SimilarityComparison {
  speech1: {
    id: number
    country: string
    speaker: string
    post: string
    date: string
    year: number
  }
  speech2: {
    id: number
    country: string
    speaker: string
    post: string
    date: string
    year: number
  }
  overall_similarity: number
  chunk_similarities: Array<{
    chunk1_text: string
    chunk2_text: string
    similarity: number
    chunk1_position: number
    chunk2_position: number
  }>
  total_chunks: number
}

/**
 * Get similarity comparison between two speeches
 */
export function getSimilarityComparison(
  speech1Id: string,
  speech2Id: string
): SimilarityComparison {
  const context: LogContext = {
    speech1Id,
    speech2Id,
    operation: 'getSimilarityComparison',
  }

  return timeOperation('getSimilarityComparison', () => {
    // Get speech metadata
    const speechQuery = `
      SELECT 
        s.id,
        COALESCE(s.country_name, s.country_code) as country,
        s.speaker,
        s.post,
        s.year || '-01-01' as date,
        s.year
      FROM speeches s
      WHERE s.id IN (?, ?)
    `

    const speeches = db
      .prepare(speechQuery)
      .all(speech1Id, speech2Id) as Array<{
      id: number
      country: string
      speaker: string
      post: string
      date: string
      year: number
    }>

    if (speeches.length !== 2) {
      throw new Error('One or both speeches not found')
    }

    const speech1 = speeches.find((s) => s.id === parseInt(speech1Id))!
    const speech2 = speeches.find((s) => s.id === parseInt(speech2Id))!

    // Get overall similarity
    const overallSimilarityQuery = `
      SELECT similarity 
      FROM speech_similarities 
      WHERE (speech1_id = ? AND speech2_id = ?) OR (speech1_id = ? AND speech2_id = ?)
    `

    const overallSimilarityResult = db
      .prepare(overallSimilarityQuery)
      .get(speech1Id, speech2Id, speech2Id, speech1Id) as
      | { similarity: number }
      | undefined

    if (!overallSimilarityResult) {
      throw new Error('Similarity data not found for these speeches')
    }

    // Get chunk similarities using sqlite-vec real-time calculation
    let chunkSimilarities: Array<{
      chunk1_text: string
      chunk2_text: string
      similarity: number
      chunk1_position: number
      chunk2_position: number
    }> = []

    let totalChunks = 0

    try {
      // Real-time chunk similarity calculation using sqlite-vec
      const chunkSimilarityQuery = `
        SELECT 
          c1.chunk_text as chunk1_text,
          c2.chunk_text as chunk2_text,
          (1 - vec_distance_cosine(e1.embedding, e2.embedding)) as similarity,
          c1.chunk_index as chunk1_position,
          c2.chunk_index as chunk2_position
        FROM speech_chunks c1
        JOIN speech_embeddings e1 ON c1.embedding_id = e1.rowid
        JOIN speech_chunks c2 ON c2.speech_id = ?
        JOIN speech_embeddings e2 ON c2.embedding_id = e2.rowid
        WHERE c1.speech_id = ?
          AND c1.embedding_id IS NOT NULL 
          AND c2.embedding_id IS NOT NULL
          AND (1 - vec_distance_cosine(e1.embedding, e2.embedding)) >= 0.3
        ORDER BY similarity DESC
        LIMIT 50
      `

      chunkSimilarities = db
        .prepare(chunkSimilarityQuery)
        .all(speech2Id, speech1Id) as Array<{
        chunk1_text: string
        chunk2_text: string
        similarity: number
        chunk1_position: number
        chunk2_position: number
      }>

      // Get total number of chunk pairs (for display purposes)
      const totalChunksQuery = `
        SELECT 
          COUNT(*) as total
        FROM speech_chunks c1
        JOIN speech_chunks c2 ON c2.speech_id = ?
        WHERE c1.speech_id = ?
          AND c1.embedding_id IS NOT NULL 
          AND c2.embedding_id IS NOT NULL
      `

      const totalResult = db
        .prepare(totalChunksQuery)
        .get(speech2Id, speech1Id) as { total: number } | undefined

      totalChunks = totalResult?.total || 0

      logger.info('Calculated chunk similarities using sqlite-vec', {
        ...context,
        chunkSimilaritiesCount: chunkSimilarities.length,
        totalChunks,
      })
    } catch (error) {
      // If speech_chunks or speech_embeddings tables don't exist, return empty array
      logger.info(
        'speech_chunks/speech_embeddings tables not found or error calculating similarities',
        {
          ...context,
          error: error instanceof Error ? error.message : String(error),
        }
      )
    }

    return {
      speech1,
      speech2,
      overall_similarity: overallSimilarityResult.similarity,
      chunk_similarities: chunkSimilarities,
      total_chunks: totalChunks,
    }
  })
}
