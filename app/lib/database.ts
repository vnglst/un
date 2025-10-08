import Database from 'better-sqlite3'
import { join, resolve } from 'path'
import { existsSync, statSync, mkdirSync } from 'fs'
import { load } from 'sqlite-vec'
import { logger, timeOperation, type LogContext } from './logger'

// =============================================================================
// DATABASE CONFIGURATION & INITIALIZATION
// =============================================================================

/**
 * Initialize database connection with proper error handling and logging
 */
function initializeDatabase(): Database.Database {
  // Use consistent data directory for both dev and production
  const dataDir = resolve(process.cwd(), 'data')
  const dbPath = join(dataDir, 'un_speeches.db')

  // Ensure data directory exists
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  logger.info('Initializing database connection', { path: dbPath })

  // Validate database file exists
  if (!existsSync(dbPath)) {
    logger.error('Database file not found', { path: dbPath })
    logger.error(
      'Database must be provided manually. In development, run "./update-db.sh" to get the database.'
    )
    throw new Error(
      `Database file not found at ${dbPath}. Database must be provided manually - no automatic download available.`
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

  // Create database connection - remove readonly restriction for FTS setup
  const database = new Database(dbPath, { readonly: false })

  // Load sqlite-vec extension for vector operations (with error handling)
  try {
    load(database)
    logger.info('sqlite-vec extension loaded successfully')
  } catch (error) {
    logger.warn('Failed to load sqlite-vec extension', {
      error: error instanceof Error ? error.message : String(error),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    })
    logger.warn('Vector search functionality will be disabled')

    // Try to provide more specific guidance
    if (
      error instanceof Error &&
      error.message.includes('No such file or directory')
    ) {
      logger.info('This appears to be a missing native module issue. Consider:')
      logger.info('1. Rebuilding native modules: npm rebuild sqlite-vec')
      logger.info('2. Installing platform-specific dependencies')
      logger.info(
        '3. Using a different base image or installing required system libraries'
      )
    }
  }

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
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    const errorCode =
      error instanceof Error && 'code' in error ? error.code : undefined

    logger.error('Database health check failed', {
      error: errorMessage,
      stack: errorStack,
      code: errorCode,
      type: error?.constructor?.name || typeof error,
      dbPath: join(process.cwd(), 'data', 'un_speeches.db'),
      dbExists: existsSync(join(process.cwd(), 'data', 'un_speeches.db')),
    })
    return false
  }
}

export function getDatabaseStats(): {
  healthy: boolean
  speechCount?: number
  sizeMB?: string
  countriesCount?: number
  yearsSpanned?: string
  avgSpeechLength?: number
  error?: string
} {
  try {
    if (!isDatabaseHealthy()) {
      return { healthy: false, error: 'Database connection failed' }
    }

    const startTime = performance.now()

    // Get speech count
    const countResult = db
      .prepare('SELECT COUNT(*) as count FROM speeches')
      .get() as { count: number }

    // Get unique countries count
    const countriesResult = db
      .prepare('SELECT COUNT(DISTINCT country_code) as count FROM speeches')
      .get() as { count: number }

    // Get year range
    const yearRangeResult = db
      .prepare(
        'SELECT MIN(year) as min_year, MAX(year) as max_year FROM speeches'
      )
      .get() as { min_year: number; max_year: number }

    // Get average speech length
    const avgLengthResult = db
      .prepare(
        'SELECT AVG(LENGTH(text)) as avg_length FROM speeches WHERE text IS NOT NULL'
      )
      .get() as { avg_length: number }

    // Get database file size
    const dbPath = join(process.cwd(), 'data', 'un_speeches.db')
    const stats = statSync(dbPath)
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2)

    const queryTime = performance.now() - startTime
    logger.debug('Database stats retrieved', {
      queryTime: `${queryTime.toFixed(2)}ms`,
      speechCount: countResult.count,
      countriesCount: countriesResult.count,
    })

    return {
      healthy: true,
      speechCount: countResult.count,
      sizeMB: `${sizeMB} MB`,
      countriesCount: countriesResult.count,
      yearsSpanned: `${yearRangeResult.min_year}-${yearRangeResult.max_year}`,
      avgSpeechLength: Math.round(avgLengthResult.avg_length),
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
// =============================================================================
// EXPORT ALL FUNCTIONS
// =============================================================================
