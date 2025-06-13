# RAG-TS Folder Structure

This document describes the reorganized structure of the `rag-ts` folder, which makes the distinction clear between setup, runtime, and testing components.

## Folder Structure

```
rag-ts/
├── setup/              # Database preparation (run once)
│   ├── setup-vector-db.ts
│   ├── index.ts
│   └── README.md
├── runtime/            # Core RAG functionality (used by web app)
│   ├── vector-search.ts
│   ├── rag-pipeline.ts
│   ├── index.ts
│   └── README.md
├── tests/              # Testing and verification (development)
│   ├── verify-rag.ts
│   ├── examples.ts
│   ├── debug-test.ts
│   ├── test-sqlite-vec.ts
│   ├── index.ts
│   └── README.md
├── index.ts            # Main module exports
└── README.md          # Main documentation
```

## Module Purposes

### 🔧 Setup Module (`setup/`)

**Purpose**: One-time database preparation and embedding generation

- Creates database tables for speech chunks and embeddings
- Chunks all speeches into searchable segments
- Generates OpenAI embeddings for each chunk
- Stores embeddings in sqlite-vec virtual table

**When to use**: Run once before using the RAG pipeline

### ⚡ Runtime Module (`runtime/`)

**Purpose**: Live query processing for the web application

- Semantic search across speech embeddings
- Full RAG pipeline with answer generation
- Database connection management
- Performance-optimized for production use

**When to use**: Imported by web app for user queries

### 🧪 Tests Module (`tests/`)

**Purpose**: Development utilities and verification

- Comprehensive system verification
- Usage examples and demonstrations
- Debug tools for troubleshooting
- sqlite-vec extension testing

**When to use**: During development and debugging

## Updated NPM Scripts

The following npm scripts have been updated to reflect the new structure:

```json
{
  "rag:setup": "node rag-ts/setup/setup-vector-db.ts",
  "rag:setup-test": "node rag-ts/setup/setup-vector-db.ts 50",
  "rag:verify": "node rag-ts/tests/verify-rag.ts",
  "rag:stats": "node rag-ts/tests/verify-rag.ts stats",
  "rag:chat": "node rag-ts/runtime/rag-pipeline.ts",
  "rag:examples": "node rag-ts/tests/examples.ts"
}
```

## Import Patterns

### For Web App (Production)

```typescript
// Import runtime functionality
import { ragQuery, semanticSearch, initDatabase } from './rag-ts/runtime'

// Or use the main index (exports runtime by default)
import { ragQuery, semanticSearch, initDatabase } from './rag-ts'
```

### For Setup Scripts

```typescript
// Import setup functionality
import { Setup } from './rag-ts'
// or
import * as Setup from './rag-ts/setup'
```

### For Testing/Development

```typescript
// Import test utilities
import { Tests } from './rag-ts'
// or
import * as Tests from './rag-ts/tests'
```

## Migration Notes

All import paths have been updated:

- Web app imports now point to `runtime/` folder
- Test scripts import from `runtime/` folder as needed
- NPM scripts updated to use new file paths
- All functionality remains the same, only organization changed

## Benefits of New Structure

1. **Clear Separation**: Easy to understand what each part does
2. **Better Imports**: Runtime code separate from setup and testing
3. **Maintainability**: Easier to maintain and extend each module
4. **Documentation**: Each folder has its own README explaining its purpose
5. **Development Flow**: Clear workflow from setup → runtime → testing
