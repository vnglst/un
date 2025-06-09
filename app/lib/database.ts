import Database from "better-sqlite3";
import { join } from "path";

const db = new Database(join(process.cwd(), "un_speeches.db"));

// Initialize FTS table and triggers on database connection
export function initializeFTS(): void {
  try {
    // Create FTS table if it doesn't exist
    db.prepare(
      `
      CREATE VIRTUAL TABLE IF NOT EXISTS speeches_fts 
      USING fts5(text, speaker, country_name, content=speeches, content_rowid=id)
    `
    ).run();

    // Create triggers to keep FTS in sync with main table
    db.prepare(
      `
      CREATE TRIGGER IF NOT EXISTS speeches_ai AFTER INSERT ON speeches BEGIN
        INSERT INTO speeches_fts(rowid, text, speaker, country_name) 
        VALUES (new.id, new.text, new.speaker, new.country_name);
      END
    `
    ).run();

    db.prepare(
      `
      CREATE TRIGGER IF NOT EXISTS speeches_ad AFTER DELETE ON speeches BEGIN
        INSERT INTO speeches_fts(speeches_fts, rowid, text, speaker, country_name) 
        VALUES('delete', old.id, old.text, old.speaker, old.country_name);
      END
    `
    ).run();

    db.prepare(
      `
      CREATE TRIGGER IF NOT EXISTS speeches_au AFTER UPDATE ON speeches BEGIN
        INSERT INTO speeches_fts(speeches_fts, rowid, text, speaker, country_name) 
        VALUES('delete', old.id, old.text, old.speaker, old.country_name);
        INSERT INTO speeches_fts(rowid, text, speaker, country_name) 
        VALUES (new.id, new.text, new.speaker, new.country_name);
      END
    `
    ).run();

    // Check if FTS table is empty and rebuild if necessary
    const ftsCount = db.prepare("SELECT COUNT(*) as count FROM speeches_fts").get() as { count: number };
    if (ftsCount.count === 0) {
      rebuildFTSIndex();
    }
  } catch (error) {
    console.error("Error initializing FTS:", error);
  }
}

// Initialize FTS on module load
initializeFTS();

export interface Speech {
  id: number;
  country_name: string | null;
  country_code: string;
  session: number;
  year: number;
  speaker: string | null;
  post: string;
  text: string;
}

export interface SearchFilters {
  country?: string;
  year?: number;
  session?: number;
  search?: string;
  searchMode?: "exact" | "phrase" | "fuzzy"; // Optional search mode for advanced queries
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SpeechesResult {
  speeches: Speech[];
  pagination: PaginationInfo;
}

export function getAllSpeeches(page: number = 1, limit: number = 20): SpeechesResult {
  let query = "SELECT * FROM speeches";
  let countQuery = "SELECT COUNT(*) as total FROM speeches";

  // Get total count
  const totalResult = db.prepare(countQuery).get() as { total: number };
  const total = totalResult.total;
  const totalPages = Math.ceil(total / limit);

  // Add ordering and pagination
  query += " ORDER BY year DESC, session DESC, country_name ASC";
  query += " LIMIT ? OFFSET ?";

  const speeches = db.prepare(query).all(limit, (page - 1) * limit) as Speech[];

  return {
    speeches,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export function getSpeechById(id: number): Speech | null {
  const query = "SELECT * FROM speeches WHERE id = ?";
  return db.prepare(query).get(id) as Speech | null;
}

export function getCountries(): Array<{ country_name: string; country_code: string }> {
  const query =
    "SELECT DISTINCT country_name, country_code FROM speeches WHERE country_name IS NOT NULL ORDER BY country_name ASC";
  return db.prepare(query).all() as Array<{ country_name: string; country_code: string }>;
}

export function getYears(): number[] {
  const query = "SELECT DISTINCT year FROM speeches WHERE year IS NOT NULL ORDER BY year DESC";
  const results = db.prepare(query).all() as Array<{ year: number }>;
  return results.map((r) => r.year);
}

export function getSessions(): number[] {
  const query = "SELECT DISTINCT session FROM speeches WHERE session IS NOT NULL ORDER BY session DESC";
  const results = db.prepare(query).all() as Array<{ session: number }>;
  return results.map((r) => r.session);
}

export interface CountrySpeechCount {
  country_code: string;
  country_name: string | null;
  speech_count: number;
}

export function getCountrySpeechCounts(): CountrySpeechCount[] {
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
  `;
  return db.prepare(query).all() as CountrySpeechCount[];
}

export function getSpeechesByCountryCode(countryCode: string, page: number = 1, limit: number = 20): SpeechesResult {
  let query = "SELECT * FROM speeches WHERE country_code = ?";
  let countQuery = "SELECT COUNT(*) as total FROM speeches WHERE country_code = ?";

  // Get total count
  const totalResult = db.prepare(countQuery).get(countryCode) as { total: number };
  const total = totalResult.total;
  const totalPages = Math.ceil(total / limit);

  // Add ordering and pagination
  query += " ORDER BY year DESC, session DESC";
  query += " LIMIT ? OFFSET ?";

  const speeches = db.prepare(query).all(countryCode, limit, (page - 1) * limit) as Speech[];

  return {
    speeches,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export function searchSpeeches(filters: SearchFilters = {}, page: number = 1, limit: number = 20): SpeechesResult {
  // If there's a search term, use full text search for better performance and features
  if (filters.search && filters.search.trim()) {
    return searchSpeechesWithFTS(filters, page, limit);
  }

  // Otherwise use regular filtering
  let whereConditions: string[] = [];
  let queryParams: any[] = [];

  if (filters.country) {
    whereConditions.push("country_code = ?");
    queryParams.push(filters.country);
  }

  if (filters.year) {
    whereConditions.push("year = ?");
    queryParams.push(filters.year);
  }

  if (filters.session) {
    whereConditions.push("session = ?");
    queryParams.push(filters.session);
  }

  // Build the WHERE clause
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  // Build count query
  const countQuery = `SELECT COUNT(*) as total FROM speeches ${whereClause}`;
  const totalResult = db.prepare(countQuery).get(...queryParams) as { total: number };
  const total = totalResult.total;
  const totalPages = Math.ceil(total / limit);

  // Build main query with ordering and pagination
  let query = `SELECT * FROM speeches ${whereClause}`;
  query += " ORDER BY year DESC, session DESC, country_name ASC";
  query += " LIMIT ? OFFSET ?";

  const speeches = db.prepare(query).all(...queryParams, limit, (page - 1) * limit) as Speech[];

  return {
    speeches,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export function searchSpeechesWithFTS(
  filters: SearchFilters = {},
  page: number = 1,
  limit: number = 20
): SpeechesResult {
  let whereConditions: string[] = [];
  let queryParams: any[] = [];
  let joinClause = "";
  let fromClause = "FROM speeches";

  // Use FTS search if there's a search term
  if (filters.search && filters.search.trim()) {
    const searchTerm = filters.search.trim();

    // Handle different search modes
    let ftsQuery: string;
    switch (filters.searchMode) {
      case "exact":
        // Exact phrase search
        ftsQuery = `"${searchTerm.replace(/"/g, '""')}"`;
        break;
      case "fuzzy":
        // Split into individual terms for OR search
        const terms = searchTerm.split(/\s+/).map((term) => term.replace(/"/g, '""'));
        ftsQuery = terms.join(" OR ");
        break;
      case "phrase":
      default:
        // Default phrase search with some flexibility
        const escapedSearchTerm = searchTerm.replace(/"/g, '""');
        ftsQuery = searchTerm.includes(" ") ? `"${escapedSearchTerm}"` : escapedSearchTerm;
        break;
    }

    joinClause = "INNER JOIN speeches_fts ON speeches.id = speeches_fts.rowid";
    whereConditions.push("speeches_fts MATCH ?");
    queryParams.push(ftsQuery);
    fromClause = "FROM speeches";
  }

  // Add other filters
  if (filters.country) {
    whereConditions.push("country_code = ?");
    queryParams.push(filters.country);
  }

  if (filters.year) {
    whereConditions.push("year = ?");
    queryParams.push(filters.year);
  }

  if (filters.session) {
    whereConditions.push("session = ?");
    queryParams.push(filters.session);
  }

  // Build the WHERE clause
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  // Build count query
  const countQuery = `SELECT COUNT(*) as total ${fromClause} ${joinClause} ${whereClause}`;
  const totalResult = db.prepare(countQuery).get(...queryParams) as { total: number };
  const total = totalResult.total;
  const totalPages = Math.ceil(total / limit);

  // Build main query with ordering and pagination
  // When using FTS, we can order by relevance (bm25) or stick with chronological
  let query = `SELECT speeches.* ${fromClause} ${joinClause} ${whereClause}`;

  if (filters.search && filters.search.trim()) {
    // Order by relevance first, then by year/session
    query += " ORDER BY bm25(speeches_fts) ASC, year DESC, session DESC";
  } else {
    query += " ORDER BY year DESC, session DESC, country_name ASC";
  }

  query += " LIMIT ? OFFSET ?";

  const speeches = db.prepare(query).all(...queryParams, limit, (page - 1) * limit) as Speech[];

  return {
    speeches,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

// Utility function to rebuild FTS index (useful for maintenance)
export function rebuildFTSIndex(): void {
  try {
    db.prepare("INSERT INTO speeches_fts(speeches_fts) VALUES('rebuild')").run();
  } catch (error) {
    console.error("Error rebuilding FTS index:", error);
    throw error;
  }
}

// Function to get search suggestions based on partial text
export function getSearchSuggestions(partialText: string, limit: number = 10): string[] {
  if (!partialText || partialText.trim().length < 2) {
    return [];
  }

  const searchTerm = partialText.trim();

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
  `;

  const searchPattern = `%${searchTerm}%`;
  const results = db.prepare(query).all(searchPattern, searchPattern, searchPattern, searchPattern, limit) as Array<{
    suggestion: string;
  }>;

  return results.map((r) => r.suggestion).filter(Boolean);
}

// Function to get highlighted search results (returns text with search terms highlighted)
export interface HighlightedSpeech extends Speech {
  highlighted_text?: string;
  highlighted_speaker?: string;
  highlighted_country_name?: string;
}

export function searchSpeechesWithHighlights(
  filters: SearchFilters = {},
  page: number = 1,
  limit: number = 20
): { speeches: HighlightedSpeech[]; pagination: PaginationInfo } {
  if (!filters.search || !filters.search.trim()) {
    // If no search term, return regular results
    const result = searchSpeeches(filters, page, limit);
    return {
      speeches: result.speeches as HighlightedSpeech[],
      pagination: result.pagination,
    };
  }

  let whereConditions: string[] = [];
  let queryParams: any[] = [];

  const searchTerm = filters.search.trim();

  // Handle different search modes
  let ftsQuery: string;
  switch (filters.searchMode) {
    case "exact":
      ftsQuery = `"${searchTerm.replace(/"/g, '""')}"`;
      break;
    case "fuzzy":
      const terms = searchTerm.split(/\s+/).map((term) => term.replace(/"/g, '""'));
      ftsQuery = terms.join(" OR ");
      break;
    case "phrase":
    default:
      const escapedSearchTerm = searchTerm.replace(/"/g, '""');
      ftsQuery = searchTerm.includes(" ") ? `"${escapedSearchTerm}"` : escapedSearchTerm;
      break;
  }

  const joinClause = "INNER JOIN speeches_fts ON speeches.id = speeches_fts.rowid";
  whereConditions.push("speeches_fts MATCH ?");
  queryParams.push(ftsQuery);

  // Add other filters
  if (filters.country) {
    whereConditions.push("country_code = ?");
    queryParams.push(filters.country);
  }

  if (filters.year) {
    whereConditions.push("year = ?");
    queryParams.push(filters.year);
  }

  if (filters.session) {
    whereConditions.push("session = ?");
    queryParams.push(filters.session);
  }

  const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

  // Build count query
  const countQuery = `SELECT COUNT(*) as total FROM speeches ${joinClause} ${whereClause}`;
  const totalResult = db.prepare(countQuery).get(...queryParams) as { total: number };
  const total = totalResult.total;
  const totalPages = Math.ceil(total / limit);

  // Build main query with snippets for highlighting
  let query = `
    SELECT 
      speeches.*,
      snippet(speeches_fts, 0, '<mark>', '</mark>', '...', 32) as highlighted_text,
      snippet(speeches_fts, 1, '<mark>', '</mark>', '...', 32) as highlighted_speaker,
      snippet(speeches_fts, 2, '<mark>', '</mark>', '...', 32) as highlighted_country_name
    FROM speeches ${joinClause} ${whereClause}
    ORDER BY bm25(speeches_fts) ASC, year DESC, session DESC
    LIMIT ? OFFSET ?
  `;

  const speeches = db.prepare(query).all(...queryParams, limit, (page - 1) * limit) as HighlightedSpeech[];

  return {
    speeches,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}
