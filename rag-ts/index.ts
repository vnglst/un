/**
 * UN Speeches RAG Pipeline
 *
 * This module is organized into three main parts:
 *
 * 1. Setup - Database preparation and embedding generation (run once)
 * 2. Runtime - Core RAG functionality for web app queries (used by app)
 * 3. Tests - Testing, verification, and example scripts (development)
 */

// Runtime exports (for use in web app)
export * from './runtime/index.js'

// Setup exports (for initial database preparation)
export * as Setup from './setup/index.js'

// Test exports (for development and verification)
export * as Tests from './tests/index.js'
