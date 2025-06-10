-- Database optimization indexes for UN Speeches application
-- Run this script to add performance-critical indexes

-- 1. Index for country-based queries (most important)
-- Used by: getCountrySpeechCounts, getSpeechesByCountryCode, filtering
CREATE INDEX IF NOT EXISTS idx_speeches_country_code ON speeches(country_code);

-- 2. Composite index for date-based ordering (very common pattern)
-- Used by: ORDER BY year DESC, session DESC in most queries
CREATE INDEX IF NOT EXISTS idx_speeches_year_session ON speeches(year DESC, session DESC);

-- 3. Composite index for country + date ordering (country page performance)
-- Used by: getSpeechesByCountryCode ordering
CREATE INDEX IF NOT EXISTS idx_speeches_country_year_session ON speeches(country_code, year DESC, session DESC);

-- 4. Index for year filtering
-- Used by: search filters, getYears()
CREATE INDEX IF NOT EXISTS idx_speeches_year ON speeches(year);

-- 5. Index for session filtering
-- Used by: search filters, getSessions()
CREATE INDEX IF NOT EXISTS idx_speeches_session ON speeches(session);

-- 6. Composite index for filtering combinations
-- Used by: search with multiple filters
CREATE INDEX IF NOT EXISTS idx_speeches_filters ON speeches(country_code, year, session);

-- 7. Index for country_name queries (metadata queries)
-- Used by: getCountries()
CREATE INDEX IF NOT EXISTS idx_speeches_country_name ON speeches(country_name);

-- 8. Composite index for the optimized getCountrySpeechCounts CTE
-- This helps with the window function partitioning and ordering
CREATE INDEX IF NOT EXISTS idx_speeches_country_name_year_session ON speeches(country_code, country_name, year DESC, session DESC);

-- Analyze tables to update query planner statistics
ANALYZE speeches;
ANALYZE speeches_fts;
