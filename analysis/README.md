# UN Speeches - Speech Similarity Analysis

This folder contains the speech similarity analysis system that computes semantic similarities between UN General Assembly speeches using vector embeddings.

## Current System (Database-backed)

- **`calculate-speech-similarities.ts`** - Main script to compute and store pairwise similarities in the database
- **Scalable**: Processes all speeches with configurable batch sizes and thresholds
- **Re-runnable**: Can recalculate similarities after new embeddings are added
- **Database Integration**: Stores results in `speech_similarities` table for fast querying

## Usage

```bash
# Calculate similarities for all speeches
npm run analysis:similarities

# Calculate only for 2024 speeches
npm run analysis:similarities:2024

# Force recalculation of existing similarities
npm run analysis:similarities:force

# Custom options
npm run analysis:similarities -- --year 2023 --threshold 0.7 --batch-size 50
```

## Command Line Options

- `--year <year>`: Calculate similarities only for specific year
- `--force`: Force recalculation of existing similarities
- `--batch-size <size>`: Number of speeches to process per batch (default: 100)
- `--threshold <value>`: Minimum similarity to store (default: 0.5)
- `--help`: Show help message

## Web Interface

Visit `/analysis` on the website to explore the interactive similarity matrix with:

- Dynamic year filtering
- Adjustable similarity thresholds
- Interactive D3.js visualization
- Real-time data loading from the database

## Database Schema

The analysis uses the `speech_similarities` table:

```sql
CREATE TABLE speech_similarities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    speech1_id INTEGER NOT NULL,
    speech2_id INTEGER NOT NULL,
    similarity REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Performance

- **Scalable**: Handles all speeches in the database (100+ countries, multiple years)
- **Efficient**: Uses batch processing and database transactions
- **Fast**: Typical processing ~192 speeches in under 10 seconds
- **Storage**: Only stores similarities above threshold to optimize space

## Migration

To set up the similarity system:

1. Create the database table: `npm run migrate:similarities`
2. Calculate similarities: `npm run analysis:similarities:2024`
3. Visit `/analysis` to explore the results

## Technical Details

- **Similarity Metric**: Cosine similarity between 1536-dimensional embeddings
- **Embedding Model**: OpenAI's text-embedding-3-small
- **Database**: SQLite with sqlite-vec extension for efficient vector operations
- **Indexing**: Optimized indexes for fast similarity lookups and top-k queries
