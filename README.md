# UN General Assembly Speeches Browser

A modern web application for browsing and searching UN General Assembly speeches (1946-2024). Built with React Router v7, TypeScript, and D3.js, featuring advanced AI-powered search and analysis capabilities.

## Features

- 🌍 **Interactive Globe**: Explore an interactive 3D globe showing speech frequency by country
- 🔍 **Advanced Search**: Full-text search with multiple modes (phrase, exact, fuzzy matching)
- 📊 **Rich Filtering**: Filter by country, year, session, and speaker
- 🤖 **RAG Search**: Ask questions about speeches using advanced AI and vector search
- 🧠 **AI Research Agent**: Command-line AI agent for deep research and analysis
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- ⚡ **Fast Performance**: SQLite database with full-text search and vector embeddings

## 🚀 Tech Stack

- **Frontend**: React Router v7, TypeScript, Tailwind CSS v4
- **Visualization**: D3.js for interactive globe visualization
- **Database**: SQLite with FTS (Full-Text Search) and sqlite-vec for embeddings
- **AI/ML**: Vector embeddings for RAG search functionality, OpenAI GPT models
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

### 🤖 AI Research Agent

For advanced research and analysis, use the command-line AI agent:

```bash
# Interactive chat session
npm run agent chat

# Ask a single question
npm run agent ask "What are the main themes in recent African speeches?"

# View example queries
npm run agent examples

# Test setup
npm run agent:test
```

**Requirements**: Set `OPENAI_API_KEY` in your `.env` file for AI functionality.

See [scripts/README.md](scripts/README.md) for detailed agent documentation.

## 📁 Project Structure

```
app/
├── routes/           # React Router v7 pages
│   ├── home.tsx     # Main search interface
│   ├── globe.tsx    # Interactive globe visualization
│   ├── rag.tsx      # AI-powered RAG search interface
│   ├── country.$code.tsx  # Country-specific speeches
│   └── speech.$id.tsx     # Individual speech details
├── components/      # Reusable UI components
├── lib/            # Database utilities and helpers
└── app.css         # Global styles

scripts/
├── lib/            # AI agent framework
│   ├── agent.ts    # Core AI agent implementation
│   └── database-tools.ts  # Database utilities for agent
├── agents/         # Agent configurations
│   └── un-researcher.yaml # UN research agent config
└── un-research-agent.ts   # CLI interface

data/
└── un_speeches.db  # SQLite database with UN speeches
```

## 🗃️ Database Schema

The application uses a SQLite database with the following structure:

- **speeches**: Main table containing speech data (country, year, session, speaker, text)
- **speeches_fts**: Full-text search index for efficient text searching
- **speech_embeddings**: Vector embeddings for RAG search functionality
- **speech_chunks**: Text chunks for efficient vector search

## 🚢 Deployment

### Docker

```bash
# Build the Docker image
docker build -t un-speeches .

# Run the container
docker run -p 3000:3000 un-speeches
```

### Environment Variables

```bash
# Required for AI functionality
OPENAI_API_KEY=your_openai_api_key

# Optional for development
NODE_ENV=development
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run typecheck` and `npm run lint`
5. Submit a pull request

## 📄 License

ISC
