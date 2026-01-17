# UN Speeches Database

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

### Tips

- Use name variations: `'%Mahatma Gandhi%' OR '%Mohandas Gandhi%'`
- JOIN chunks to speeches for year/country context
- SUBSTR truncates long text to avoid output overflow
- Quotation patterns: "said", "wrote", "words of", "quote", "once said"
- Chunks only exist for 2018-2024 currently
