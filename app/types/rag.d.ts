// Type definitions for RAG modules
declare module '../../../rag-js/vector-search.js' {
  interface Database {
    close(): void
  }

  export function initDatabase(): Promise<Database>
  export function semanticSearch(
    db: Database,
    query: string,
    limit?: number,
    threshold?: number | null
  ): Promise<
    Array<{
      chunk_id: string
      speech_id: string
      country: string
      speaker: string
      year: number
      session: number
      distance: number
      chunk_text: string
    }>
  >

  export function advancedSearch(
    db: Database,
    query: string,
    filters: Record<string, unknown>,
    limit?: number
  ): Promise<
    Array<{
      chunk_id: string
      speech_id: string
      country: string
      speaker: string
      year: number
      session: number
      distance: number
      chunk_text: string
    }>
  >
}

declare module '../../../rag-js/rag-pipeline.js' {
  import type { Database } from '../../../rag-js/vector-search.js'

  interface RAGQueryOptions {
    searchLimit?: number
    filters?: Record<string, unknown>
    includeContext?: boolean
    searchThreshold?: number | null
  }

  interface RAGResponse {
    question: string
    answer: string
    sources: Array<{
      index: number
      chunk_id: string
      speech_id: string
      country: string
      speaker: string
      year: number
      session: number
      distance: number
      preview: string
    }>
    searchResults: Array<{
      chunk_id: string
      speech_id: string
      country: string
      speaker: string
      year: number
      session: number
      distance: number
      chunk_text: string
    }>
    metadata: {
      model: string
      usage: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
      }
      search_count: number
      filters_applied: string[]
    }
  }

  export function ragQuery(
    db: Database,
    question: string,
    options?: RAGQueryOptions
  ): Promise<RAGResponse>
}
