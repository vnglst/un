# UN General Assembly Speeches

A modern web application for browsing and searching speeches from the UN General Assembly. Built with React Router v7, TypeScript, and D3.js for data visualization.

## Features

- 🌍 **Interactive Globe**: Explore an interactive 3D globe showing speech frequency by country
- 🔍 **Advanced Search**: Full-text search with multiple modes (phrase, exact, fuzzy matching)
- 📊 **Rich Filtering**: Filter by country, year, session, and speaker
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- ⚡ **Fast Performance**: SQLite database with full-text search capabilities

## Tech Stack

- **Frontend**: React Router v7, TypeScript, Tailwind CSS
- **Visualization**: D3.js for interactive globe and data visualization
- **Database**: SQLite with FTS (Full-Text Search)
- **Backend**: Node.js with Better SQLite3
- **Deployment**: Docker with multi-stage builds

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to view the application.

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

The application will be available at `http://localhost:3000`.

See [DOCKER.md](./DOCKER.md) for detailed deployment instructions.

## Project Structure

```
app/
├── routes/           # React Router pages
│   ├── home.tsx     # Main search interface
│   ├── globe.tsx    # Interactive globe view
│   ├── country.$code.tsx  # Country-specific speeches
│   └── speech.$id.tsx     # Individual speech details
├── components/      # Reusable UI components
├── lib/            # Database utilities and helpers
└── app.css         # Global styles
```

## Database Schema

The application uses a SQLite database with the following structure:

- **speeches**: Main table containing speech data (country, year, session, speaker, text)
- **speeches_fts**: Full-text search index for efficient text searching

## License

ISC
