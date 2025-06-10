import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync, statSync } from 'fs'
import { logger, timeOperation, type LogContext } from './logger'

// Always use data directory for both development and production
const dbPath = join(process.cwd(), 'data', 'un_speeches.db')

logger.info('Initializing database connection', { path: dbPath })

// Log database file size
if (existsSync(dbPath)) {
  const stats = statSync(dbPath)
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
  logger.info('Database file found', {
    path: dbPath,
    sizeMB: `${sizeMB} MB`,
    lastModified: stats.mtime.toISOString(),
  })
} else {
  logger.error('Database file not found', { path: dbPath })
  throw new Error(`Database file not found at ${dbPath}`)
}

const db = new Database(dbPath, { readonly: true })
logger.info('Database connection established')

// Health check functions
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
      .get() as {
      count: number
    }
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

// Initialize FTS table and triggers on database connection
function initializeFTS(): void {
  logger.info('Initializing FTS (Full Text Search)')
  try {
    // Create FTS table if it doesn't exist
    const createFTSQuery = `
      CREATE VIRTUAL TABLE IF NOT EXISTS speeches_fts 
      USING fts5(text, speaker, country_name, content=speeches, content_rowid=id)
    `
    logger.debug('Creating FTS table', { query: createFTSQuery.trim() })
    db.prepare(createFTSQuery).run()

    // Create triggers to keep FTS in sync with main table
    const insertTriggerQuery = `
      CREATE TRIGGER IF NOT EXISTS speeches_ai AFTER INSERT ON speeches BEGIN
        INSERT INTO speeches_fts(rowid, text, speaker, country_name) 
        VALUES (new.id, new.text, new.speaker, new.country_name);
      END
    `
    logger.debug('Creating insert trigger', {
      query: insertTriggerQuery.trim(),
    })
    db.prepare(insertTriggerQuery).run()

    const deleteTriggerQuery = `
      CREATE TRIGGER IF NOT EXISTS speeches_ad AFTER DELETE ON speeches BEGIN
        INSERT INTO speeches_fts(speeches_fts, rowid, text, speaker, country_name) 
        VALUES('delete', old.id, old.text, old.speaker, old.country_name);
      END
    `
    logger.debug('Creating delete trigger', {
      query: deleteTriggerQuery.trim(),
    })
    db.prepare(deleteTriggerQuery).run()

    const updateTriggerQuery = `
      CREATE TRIGGER IF NOT EXISTS speeches_au AFTER UPDATE ON speeches BEGIN
        INSERT INTO speeches_fts(speeches_fts, rowid, text, speaker, country_name) 
        VALUES('delete', old.id, old.text, old.speaker, old.country_name);
        INSERT INTO speeches_fts(rowid, text, speaker, country_name) 
        VALUES (new.id, new.text, new.speaker, new.country_name);
      END
    `
    logger.debug('Creating update trigger', {
      query: updateTriggerQuery.trim(),
    })
    db.prepare(updateTriggerQuery).run()

    // Check if FTS table is empty and rebuild if necessary
    const ftsCount = db
      .prepare('SELECT COUNT(*) as count FROM speeches_fts')
      .get() as { count: number }

    logger.info('FTS index status', { recordCount: ftsCount.count })

    if (ftsCount.count === 0) {
      logger.warn('FTS index is empty, rebuilding...')
      rebuildFTSIndex()
    }

    logger.info('FTS initialization completed successfully')
  } catch (error) {
    logger.error('Error initializing FTS', error)
  }
}

// Initialize FTS on module load
initializeFTS()

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

interface SpeechesResult {
  speeches: Speech[]
  pagination: PaginationInfo
}

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

export interface CountrySpeechCount {
  country_code: string
  country_name: string | null
  speech_count: number
}

export function getCountrySpeechCounts(): CountrySpeechCount[] {
  logger.debug('Getting country speech counts')
  const query = `
    SELECT 
      country_code,
      (SELECT country_name 
       FROM speeches s2 
       WHERE s2.country_code = speeches.country_code 
       ORDER BY year DESC, session DESC 
       LIMIT 1) as country_name,
      COUNT(*) as speech_count
    FROM speeches 
    WHERE country_code IS NOT NULL
    GROUP BY country_code
    ORDER BY speech_count DESC
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

export function getSpeechesByCountryCode(
  countryCode: string,
  page: number = 1,
  limit: number = 20
): SpeechesResult {
  logger.debug('Getting speeches by country code', { countryCode, page, limit })

  return timeOperation(`getSpeechesByCountryCode(${countryCode})`, () => {
    let query = 'SELECT * FROM speeches WHERE country_code = ?'
    const countQuery =
      'SELECT COUNT(*) as total FROM speeches WHERE country_code = ?'

    // Get total count
    const totalResult = db.prepare(countQuery).get(countryCode) as {
      total: number
    }
    const total = totalResult.total
    const totalPages = Math.ceil(total / limit)

    logger.debug('Country speeches count', { countryCode, total, totalPages })

    // Add ordering and pagination
    query += ' ORDER BY year DESC, session DESC'
    query += ' LIMIT ? OFFSET ?'

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
    // Otherwise use regular filtering
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
    let query = `SELECT * FROM speeches ${whereClause}`
    query += ' ORDER BY year DESC, session DESC, country_name ASC'
    query += ' LIMIT ? OFFSET ?'

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
    const whereConditions: string[] = []
    const queryParams: (string | number)[] = []
    let joinClause = ''
    let fromClause = 'FROM speeches'

    // Use FTS search if there's a search term
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim()
      logger.debug('FTS search term', { searchTerm, mode: filters.searchMode })

      // Handle different search modes
      let ftsQuery: string
      switch (filters.searchMode) {
        case 'exact':
          // Exact phrase search
          ftsQuery = `"${searchTerm.replace(/"/g, '""')}"`
          break
        case 'fuzzy': {
          // Split into individual terms for OR search
          const terms = searchTerm
            .split(/\s+/)
            .map((term) => term.replace(/"/g, '""'))
          ftsQuery = terms.join(' OR ')
          break
        }
        case 'phrase':
        default: {
          // Default phrase search with some flexibility
          const escapedSearchTerm = searchTerm.replace(/"/g, '""')
          ftsQuery = searchTerm.includes(' ')
            ? `"${escapedSearchTerm}"`
            : escapedSearchTerm
          break
        }
      }

      logger.debug('FTS query generated', { ftsQuery })

      joinClause = 'INNER JOIN speeches_fts ON speeches.id = speeches_fts.rowid'
      whereConditions.push('speeches_fts MATCH ?')
      queryParams.push(ftsQuery)
      fromClause = 'FROM speeches'
    }

    // Add other filters
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

    // Build the WHERE clause
    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    logger.debug('FTS query conditions', { whereConditions, queryParams })

    // Build count query
    const countQuery = `SELECT COUNT(*) as total ${fromClause} ${joinClause} ${whereClause}`
    const totalResult = db.prepare(countQuery).get(...queryParams) as {
      total: number
    }
    const total = totalResult.total
    const totalPages = Math.ceil(total / limit)

    logger.debug('FTS count result', { total, totalPages })

    // Build main query with ordering and pagination
    // When using FTS, we can order by relevance (bm25) or stick with chronological
    let query = `SELECT speeches.* ${fromClause} ${joinClause} ${whereClause}`

    if (filters.search && filters.search.trim()) {
      // Order by relevance first, then by year/session
      query += ' ORDER BY bm25(speeches_fts) ASC, year DESC, session DESC'
    } else {
      query += ' ORDER BY year DESC, session DESC, country_name ASC'
    }

    query += ' LIMIT ? OFFSET ?'

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

// Utility function to rebuild FTS index (useful for maintenance)
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

// Function to get search suggestions based on partial text
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

    const searchPattern = `%${searchTerm}%`
    const results = db
      .prepare(query)
      .all(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        limit
      ) as Array<{
      suggestion: string
    }>

    const suggestions = results.map((r) => r.suggestion).filter(Boolean)
    logger.debug('Search suggestions result', {
      partialText,
      suggestionsCount: suggestions.length,
      suggestions: suggestions.slice(0, 3), // Log first 3 for debugging
    })

    return suggestions
  })
}

// Function to get highlighted search results (returns text with search terms highlighted)
export interface HighlightedSpeech extends Speech {
  highlighted_text?: string
  highlighted_speaker?: string
  highlighted_country_name?: string
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
    const whereConditions: string[] = []
    const queryParams: (string | number)[] = []

    const searchTerm = filters.search!.trim()
    logger.debug('Highlighted search term', {
      searchTerm,
      mode: filters.searchMode,
    })

    // Handle different search modes
    let ftsQuery: string
    switch (filters.searchMode) {
      case 'exact':
        ftsQuery = `"${searchTerm.replace(/"/g, '""')}"`
        break
      case 'fuzzy': {
        const terms = searchTerm
          .split(/\s+/)
          .map((term) => term.replace(/"/g, '""'))
        ftsQuery = terms.join(' OR ')
        break
      }
      case 'phrase':
      default: {
        const escapedSearchTerm = searchTerm.replace(/"/g, '""')
        ftsQuery = searchTerm.includes(' ')
          ? `"${escapedSearchTerm}"`
          : escapedSearchTerm
        break
      }
    }

    logger.debug('Highlighted FTS query generated', { ftsQuery })

    const joinClause =
      'INNER JOIN speeches_fts ON speeches.id = speeches_fts.rowid'
    whereConditions.push('speeches_fts MATCH ?')
    queryParams.push(ftsQuery)

    // Add other filters
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
