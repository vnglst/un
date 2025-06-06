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

export function getAllSpeeches(page: number = 1, limit: number = 20, filters: SearchFilters = {}): SpeechesResult {
  let query = "SELECT * FROM speeches";
  let countQuery = "SELECT COUNT(*) as total FROM speeches";
  const params: any[] = [];
  const conditions: string[] = [];

  // Add filters
  if (filters.country) {
    conditions.push("(country_name LIKE ? OR country_code LIKE ?)");
    params.push(`%${filters.country}%`, `%${filters.country}%`);
  }

  if (filters.year) {
    conditions.push("year = ?");
    params.push(filters.year);
  }

  if (filters.session) {
    conditions.push("session = ?");
    params.push(filters.session);
  }

  if (filters.search) {
    conditions.push("(text LIKE ? OR speaker LIKE ? OR post LIKE ?)");
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }

  if (conditions.length > 0) {
    const whereClause = " WHERE " + conditions.join(" AND ");
    query += whereClause;
    countQuery += whereClause;
  }

  // Get total count
  const totalResult = db.prepare(countQuery).get(...params) as { total: number };
  const total = totalResult.total;
  const totalPages = Math.ceil(total / limit);

  // Add ordering and pagination
  query += " ORDER BY year DESC, session DESC, country_name ASC";
  query += " LIMIT ? OFFSET ?";
  params.push(limit, (page - 1) * limit);

  const speeches = db.prepare(query).all(...params) as Speech[];

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
