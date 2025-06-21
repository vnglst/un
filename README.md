# UN General Assembly Speeches

A modern web application for browsing and searching speeches from the UN General Assembly. Built with React Router v7, TypeScript, and D3.js for data visualization.

## Features

- 🌍 **Interactive Globe**: Explore an interactive 3D globe showing speech frequency by country
- 🔍 **Advanced Search**: Full-text search with multiple modes (phrase, exact, fuzzy matching)
- 📊 **Rich Filtering**: Filter by country, year, session, and speaker
- � **Speech Analysis**: Semantic similarity analysis between speeches using AI embeddings
- �📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- ⚡ **Fast Performance**: SQLite database with full-text search capabilities

## Tech Stack

- **Frontend**: React Router v7, TypeScript, Tailwind CSS
- **Visualization**: D3.js for interactive globe and similarity matrix
- **Database**: SQLite with FTS (Full-Text Search) and sqlite-vec for embeddings
- **AI/ML**: Vector embeddings for semantic similarity analysis
- **Backend**: Node.js with Better SQLite3
- **Deployment**: Docker with multi-stage builds

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Set up database (includes similarities table)
npm run migrate:similarities

# Start development server
npm run dev
```

Visit `http://localhost:5173` to view the application.

### Speech Similarity Analysis

The application includes advanced semantic similarity analysis between speeches:

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

## Project Structure

```
app/
├── routes/           # React Router pages
│   ├── home.tsx     # Main search interface
│   ├── globe.tsx    # Interactive globe view
│   ├── analysis.tsx # Speech similarity analysis
│   ├── country.$code.tsx  # Country-specific speeches
│   └── speech.$id.tsx     # Individual speech details
├── components/      # Reusable UI components
├── lib/            # Database utilities and helpers
└── app.css         # Global styles

analysis/
├── calculate-speech-similarities.ts  # Main similarity calculation script
└── README.md                        # Analysis documentation

scripts/
├── create-similarities-table.js     # Database migration script
└── create-similarities-table.sql    # Table schema
```

## Database Schema

The application uses a SQLite database with the following structure:

- **speeches**: Main table containing speech data (country, year, session, speaker, text)
- **speeches_fts**: Full-text search index for efficient text searching
- **speech_similarities**: Precomputed similarity scores between speech pairs
- **speech_embeddings**: Vector embeddings for semantic analysis

## Speech Similarity Analysis

The similarity analysis uses cosine similarity between vector embeddings to find semantically similar speeches. Key features:

- **Scalable**: Processes all speeches with configurable batch sizes
- **Re-runnable**: Can recalculate similarities after new embeddings are added
- **Filtered**: Only stores similarities above a configurable threshold
- **Interactive**: Web interface with dynamic filtering and visualization

Visit `/analysis` to explore the interactive similarity matrix.

## License

ISC
