# UN Speeches Database

## Deployment

### Push database to production

```bash
npm run db:push
# or directly:
./update-db.sh
```

This script copies the local database (`data/un_speeches.db`) to the production server via rsync. It checks disk space before copying and sets proper permissions.

## Tables

### speeches

Main table with UN General Assembly speeches (1946-2024).

- `id`, `country_name`, `country_code`, `year`, `session`, `speaker`, `post`, `text`

### chunks

Speeches split into ~1500 char segments at sentence boundaries for semantic search.

- `id`, `speech_id`, `chunk_index`, `text`, `char_start`, `char_end`
- `summary`, `themes`, `entities`, `notable` - LLM-generated metadata

### chunk_embeddings

384-dim vectors (bge-small-en-v1.5) for each chunk.

- `chunk_id`, `embedding` (BLOB), `dimensions`, `model`

### speech_embeddings

Legacy whole-speech embeddings (less useful than chunk embeddings).

### notable_figures

Historical figures quoted in UN speeches.

- `id`, `name`, `category`, `subcategory`, `description`, `search_patterns` (JSON)

### quotations

Extracted quotes and mentions of notable figures.

- `id`, `figure_id`, `speech_id`, `chunk_id`, `quote_text`, `context_text`
- `year`, `country_name`, `is_direct_quote`, `confidence_score`

### Effective query patterns

```sql
-- Check chunk availability first
SELECT MIN(s.year), MAX(s.year), COUNT(DISTINCT s.year)
FROM chunks c JOIN speeches s ON c.speech_id = s.id;

-- Count mentions with decade grouping (UNION ALL for multiple people)
SELECT
  CASE WHEN year < 2020 THEN '2010s' ELSE '2020s' END as decade,
  'Person Name' as person,
  COUNT(*) as mentions
FROM chunks c JOIN speeches s ON c.speech_id = s.id
WHERE c.text LIKE '%Person Name%'
GROUP BY 1
UNION ALL
-- repeat for each person...
ORDER BY mentions DESC;

-- Extract quotations with context
SELECT SUBSTR(c.text, 1, 1500), s.year, s.country_name
FROM chunks c JOIN speeches s ON c.speech_id = s.id
WHERE c.text LIKE '%Name%'
  AND (c.text LIKE '%said%' OR c.text LIKE '%words%' OR c.text LIKE '%wrote%');
```

### Tracking terminology evolution

```sql
-- Count term mentions by year (for charting)
SELECT year, COUNT(*) as mentions
FROM speeches
WHERE text LIKE '%two-state solution%'
GROUP BY year ORDER BY year;

-- Decade grouping with flexible ranges
SELECT
  CASE
    WHEN year < 1960 THEN '1950s'
    WHEN year < 1970 THEN '1960s'
    WHEN year < 1980 THEN '1970s'
    -- etc.
  END as decade,
  COUNT(*) as mentions
FROM speeches
WHERE text LIKE '%Palestinian people%'
GROUP BY 1 ORDER BY 1;

-- Count distinct countries mentioning a term by decade
SELECT decade, COUNT(DISTINCT country_name) as countries
FROM (
  SELECT country_name,
    CASE WHEN year < 2010 THEN '2000s' ELSE '2010s' END as decade
  FROM speeches WHERE text LIKE '%two-state solution%'
) GROUP BY 1;
```

### Finding speech IDs for linking

```sql
-- Get speech ID with quote context for research pages
SELECT id, year, country_name, speaker,
  SUBSTR(text, INSTR(LOWER(text), 'search term'), 600) as context
FROM speeches
WHERE year = 2001 AND country_name = 'Palestine'
  AND text LIKE '%two-state solution%'
LIMIT 1;

-- Use INSTR to extract text around a specific phrase
SELECT country_name, speaker,
  SUBSTR(text, INSTR(LOWER(text), 'partition'), 800)
FROM speeches
WHERE text LIKE '%partition%' AND text LIKE '%Palestine%';
```

### Tips

- Use name variations: `'%Mahatma Gandhi%' OR '%Mohandas Gandhi%'`
- JOIN chunks to speeches for year/country context
- SUBSTR truncates long text to avoid output overflow
- Quotation patterns: "said", "wrote", "words of", "quote", "once said"
- Chunks exist for all years (1946-2024), covering 79 distinct years
- Use `INSTR(LOWER(text), 'term')` to find position of a term for extracting context
- For historical research, query `speeches` table directly (faster for full-text LIKE searches)
- Pipe query results through `head -N` to limit output when exploring

## Quotation Extraction Lessons

### Unicode vs ASCII Characters

The database contains Unicode curly quotes (`"` `"` `'` `'`) in addition to ASCII quotes (`"` `'`). Any regex matching quoted text must handle both:

```python
QUOTE_OPEN = r'[\"\'\u201c\u2018\u00ab]'   # " ' " ' «
QUOTE_CLOSE = r'[\"\'\u201d\u2019\u00bb]'  # " ' " ' »
```

**Debugging tip**: If pattern matching yields unexpected temporal gaps (e.g., only matches before 1994), suspect character encoding issues. Check for Unicode variants of the characters you're matching.

### Name Pattern False Positives

Simple name patterns cause massive false positives:

| Pattern | Problem | False matches |
|---------|---------|---------------|
| `Christ` | Matches "Christian", "Christopher" | 936 of 1009 |
| `Gandhi` | Matches "Indira Gandhi", "Rajiv Gandhi" | 163 of 234 |
| `Muhammad` | Matches various names | Many |
| `Buddha` | Matches "Buddhist" | Many |

**Solution**: Use specific patterns that require full names or attribution phrases:

```python
# Bad: ["Gandhi", "Christ", "Muhammad"]
# Good:
["Mahatma Gandhi", "Mohandas Gandhi", "M.K. Gandhi", "Gandhiji"]
["Jesus Christ", "Jesus said", "Christ said", "Christ taught"]
["Prophet Muhammad", "Muhammad said", "teachings of Muhammad"]
```

### Attribution Detection

Finding text NEAR a name is not the same as finding a quote FROM that person. Require explicit attribution patterns:

```python
# Patterns that verify attribution TO the figure
rf'{name}\s+(once\s+)?said[,:.;]?\s*{quote}'     # "Gandhi said '...'"
rf'as\s+{name}\s+(said|wrote)[,:.;]?\s*{quote}'  # "As Gandhi said, '...'"
rf'{quote}\s*[-–—]\s*{name}'                      # "'...' - Gandhi"
rf'in the words of\s+{name}[,:.;]?\s*{quote}'    # "In the words of Gandhi"
```

Without these patterns, you'll extract quotes that happen to be near a name mention but are actually from someone else entirely.

### Data Quality Verification

Always verify extracted data with:

1. **Random sampling**: Check 5-10 random entries from different categories
2. **Temporal analysis**: Results should span all years if the data does - gaps suggest bugs
3. **Category breakdown**: Compare counts across categories to spot anomalies
4. **Sample direct quotes**: Verify attributed quotes are actually attributed correctly

```sql
-- Quick quality check: distribution across decades
SELECT (year / 10) * 10 as decade, COUNT(*)
FROM quotations GROUP BY 1 ORDER BY 1;

-- Verify specific figure's mentions make sense
SELECT quote_text, year, country_name
FROM quotations WHERE figure_id = X LIMIT 10;
```
