# Tests Module

This module contains testing, verification, and example scripts for development and debugging.

## Purpose

The tests module provides **development utilities** for:

1. Verifying the RAG pipeline is working correctly
2. Testing database connectivity and sqlite-vec extension
3. Running example queries and demonstrations
4. Debugging issues during development

## Files

- `verify-rag.ts` - Comprehensive system verification and health checks
- `examples.ts` - Usage examples and demonstrations
- `debug-test.ts` - Basic database connectivity tests
- `test-sqlite-vec.ts` - sqlite-vec extension testing
- `index.ts` - Module exports

## Scripts Overview

### Verification (`verify-rag.ts`)

- Database structure validation
- Embedding integrity checks
- End-to-end RAG pipeline testing
- Performance benchmarking
- Statistics reporting

### Examples (`examples.ts`)

- Demonstrates various RAG pipeline capabilities
- Shows different search and filtering options
- Includes perspective comparison examples
- Useful for learning and testing new features

### Debug Tests (`debug-test.ts`)

- Basic database connection testing
- Table structure verification
- Simple query testing
- First-line debugging for setup issues

### sqlite-vec Tests (`test-sqlite-vec.ts`)

- Extension loading verification
- Vector table creation testing
- Basic vector operations testing
- Compatibility checking

## Usage

```bash
# Run comprehensive verification
npm run rag:verify

# Check statistics only
npm run rag:stats

# Run examples and demonstrations
npm run rag:examples

# Test sqlite-vec extension (direct run)
node rag-ts/tests/test-sqlite-vec.ts

# Basic debug test (direct run)
node rag-ts/tests/debug-test.ts
```

## Development Workflow

1. **After Setup**: Run `npm run rag:verify` to ensure everything is working
2. **Before Deployment**: Run verification to check system health
3. **When Debugging**: Use debug-test.ts for basic connectivity issues
4. **Learning the API**: Run examples.ts to see various use cases
5. **Extension Issues**: Use test-sqlite-vec.ts to isolate vector problems

## Verification Checklist

The verification script checks:

- ✅ Database file exists and is accessible
- ✅ Required tables are created with correct schema
- ✅ sqlite-vec extension loads properly
- ✅ Embeddings exist and have correct dimensions
- ✅ Vector search returns reasonable results
- ✅ RAG pipeline produces coherent answers
- ✅ Performance metrics are within expected ranges
