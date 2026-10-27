# UN General Assembly Speeches Browser

A modern web application for browsing and searching UN General Assembly speeches (1946-2024). Built with React Router v7, TypeScript, and Tailwind CSS v4.

## Features

- 🔍 **Advanced Search**: Full-text search with multiple modes (phrase, exact, fuzzy matching)
- 📊 **Rich Filtering**: Filter by country, year, session, and speaker
- 📖 **Research Section**: Data analysis and visualizations on topics like quotations, Greenland, the two-state solution, and rearmament discourse
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- ⚡ **Fast Performance**: SQLite database with full-text search and vector embeddings

## 🚀 Tech Stack

- **Frontend**: React Router v7, TypeScript, Tailwind CSS v4
- **Database**: SQLite with FTS (Full-Text Search) and sqlite-vec for embeddings
- **Backend**: Node.js with Better SQLite3
- **Deployment**: Docker with multi-stage builds

## 📦 Quick Start

### Development

```bash
# Install dependencies
npm install

# Set up database (download if needed)
./update-db.sh

# Start development server
npm run dev
```

Visit `http://localhost:5173` to view the application.

## 📁 Project Structure

```
app/
├── routes/           # React Router v7 pages
│   ├── home.tsx     # Main search interface
│   ├── country.$code.tsx  # Country-specific speeches
│   ├── speech.$id.tsx     # Individual speech details
│   └── research.*.tsx     # Research pages (quotations, greenland, etc.)
├── components/      # Reusable UI components
├── lib/            # Database utilities and helpers
└── app.css         # Global styles

scripts/               # Database and data processing utilities

data/
└── un_speeches.db  # SQLite database with UN speeches
```

## 🗃️ Database Schema

The application uses a SQLite database with the following structure:

- **speeches**: Main table containing speech data (country, year, session, speaker, text)
- **speeches_fts**: Full-text search index for efficient text searching
- **chunks**: Speeches split into ~1500 char segments for semantic search
- **chunk_embeddings**: 384-dim vectors (bge-small-en-v1.5) for RAG search
- **quotations**: Extracted quotes from notable figures (used in research pages)

## 🚢 Deployment

### Docker

```bash
# Build the Docker image
docker build -t un-speeches .

# Run the container
docker run -p 3000:3000 un-speeches
```

## Automated critical dependency fixes

The existing self-hosted Renovate GitHub App handles only CRITICAL npm
vulnerability alerts. Ordinary updates and Renovate's own automerge are disabled.
The trusted infrastructure runner verifies dependency-only changes, runs
`npm ci` and `npm run verify:dependencies` without credentials, then publishes
`un/dependencies` and merges the exact verified commit. Failed or unsupported
updates remain open for manual review. Native checks use only an in-memory
database; no production database, embeddings or paid API jobs are used.
Docker image updates are outside this policy.
