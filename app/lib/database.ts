import Database from "better-sqlite3";
import { join } from "path";

const db = new Database(join(process.cwd(), "un_speeches.db"));

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
      MAX(country_name) as country_name,
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
  let whereConditions: string[] = [];
  let queryParams: any[] = [];

  // Build WHERE conditions based on filters
  if (filters.search && filters.search.trim()) {
    whereConditions.push("(text LIKE ? OR speaker LIKE ? OR country_name LIKE ?)");
    const searchTerm = `%${filters.search.trim()}%`;
    queryParams.push(searchTerm, searchTerm, searchTerm);
  }

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
