import Database from 'better-sqlite3'
import { join, resolve } from 'path'
import { existsSync } from 'fs'
import chalk from 'chalk'
import * as cheerio from 'cheerio'

export interface Speech {
  id: number
  country_name: string | null
  country_code: string
  session: number
  year: number
  speaker: string | null
  post: string
  text: string
}

export interface SearchResult extends Speech {
  highlighted_text?: string
  rank?: number
}

export class ToolImplementations {
  private db: Database.Database

  constructor() {
    // Use the same database path as the main application
    const dataDir = resolve(process.cwd(), 'data')
    const dbPath = join(dataDir, 'un_speeches.db')

    if (!existsSync(dbPath)) {
      console.error(chalk.red(`Database file not found at ${dbPath}`))
      console.error(
        chalk.yellow('Make sure the UN speeches database is available')
      )
      process.exit(1)
    }

    this.db = new Database(dbPath, { readonly: false })
  }

  async sqlQuery(args: { query: string }): Promise<string> {
    try {
      const { query } = args

      const finalQuery = query.trim()

      const stmt = this.db.prepare(finalQuery)

      // Determine if this is a SELECT query or a write operation
      const isSelectQuery = finalQuery.toLowerCase().trim().startsWith('select')

      if (isSelectQuery) {
        const results = stmt.all() as Record<string, unknown>[]
        return this.formatSelectResults(results)
      } else {
        // For INSERT, UPDATE, DELETE, etc. use run()
        const result = stmt.run()

        // Format the result based on the operation
        const operation = finalQuery.split(' ')[0].toUpperCase()
        let output = `${operation} operation completed successfully.\n`

        if (result.changes !== undefined) {
          output += `Rows affected: ${result.changes}\n`
        }

        if (
          result.lastInsertRowid !== undefined &&
          result.lastInsertRowid !== 0
        ) {
          output += `Last insert row ID: ${result.lastInsertRowid}\n`
        }

        return output
      }
    } catch (error) {
      throw new Error(
        `SQL query failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  private formatSelectResults(results: Record<string, unknown>[]): string {
    if (results.length === 0) {
      return 'No results found for the query.'
    }

    const headers = Object.keys(results[0])
    const maxResults = Math.min(results.length, 20) // Limit displayed results

    let output = `Query returned ${results.length} rows (showing first ${maxResults}):\n\n`

    // Create table header
    output += headers.join(' | ') + '\n'
    output += headers.map(() => '---').join(' | ') + '\n'

    // Add data rows
    for (let i = 0; i < maxResults; i++) {
      const row = results[i]
      const values = headers.map((header) => {
        const value = row[header]
        if (typeof value === 'string' && value.length > 50) {
          return value.substring(0, 47) + '...'
        }
        return value || ''
      })
      output += values.join(' | ') + '\n'
    }

    if (results.length > maxResults) {
      output += `\n... and ${results.length - maxResults} more rows`
    }

    return output
  }

  async fullTextSearch(args: {
    search_term: string
    country_filter?: string
    year_from?: number
    year_to?: number
    limit?: number
  }): Promise<string> {
    try {
      const {
        search_term,
        country_filter,
        year_from,
        year_to,
        limit = 50,
      } = args

      // First check if FTS table exists
      const ftsCheck = this.db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='speeches_fts'"
        )
        .get()

      if (!ftsCheck) {
        throw new Error(
          'FTS table not found. Please ensure the database is set up correctly.'
        )
      }

      let sql = `
        SELECT s.*, 
               snippet(speeches_fts, 0, '<mark>', '</mark>', '...', 32) as highlighted_text
        FROM speeches_fts 
        JOIN speeches s ON speeches_fts.rowid = s.id
        WHERE speeches_fts MATCH ?
      `

      const params: (string | number)[] = [search_term]

      if (country_filter) {
        sql += ' AND s.country_code = ?'
        params.push(country_filter)
      }

      if (year_from) {
        sql += ' AND s.year >= ?'
        params.push(year_from)
      }

      if (year_to) {
        sql += ' AND s.year <= ?'
        params.push(year_to)
      }

      sql += ' ORDER BY rank LIMIT ?'
      params.push(Math.min(limit, 100))

      const stmt = this.db.prepare(sql)
      const results = stmt.all(...params) as SearchResult[]

      return this.formatSearchResults(results, search_term)
    } catch (error) {
      return `Error in full text search: ${error instanceof Error ? error.message : String(error)}`
    }
  }

  private formatSearchResults(
    results: (SearchResult | Speech)[],
    searchTerm: string
  ): string {
    if (results.length === 0) {
      return `No speeches found containing "${searchTerm}"`
    }

    let output = `Found ${results.length} speeches containing "${searchTerm}":\n\n`

    const maxResults = Math.min(results.length, 10)
    for (let i = 0; i < maxResults; i++) {
      const result = results[i]
      output += `${i + 1}. ${result.country_name} (${result.year}) - ${result.speaker}\n`
      output += `   Session ${result.session} | Speech ID: ${result.id}\n`

      if ('highlighted_text' in result && result.highlighted_text) {
        // Remove HTML tags for CLI output
        const cleanText = result.highlighted_text.replace(/<\/?mark>/g, '**')
        output += `   Preview: ${cleanText}\n`
      } else {
        // Extract a preview from the text
        const textLower = result.text.toLowerCase()
        const searchLower = searchTerm.toLowerCase()
        const index = textLower.indexOf(searchLower)
        if (index !== -1) {
          const start = Math.max(0, index - 50)
          const end = Math.min(
            result.text.length,
            index + searchTerm.length + 50
          )
          const preview = result.text.substring(start, end)
          output += `   Preview: ...${preview}...\n`
        }
      }
      output += '\n'
    }

    if (results.length > maxResults) {
      output += `... and ${results.length - maxResults} more results`
    }

    return output
  }

  async wikipediaSearch(args: { query: string }): Promise<string> {
    try {
      const { query } = args
      if (!query) {
        return 'Error: No query provided.'
      }

      // Try to fetch the summary for the exact title first
      const baseUrl = 'https://en.wikipedia.org/api/rest_v1/page/summary/'
      const completeUrl = `${baseUrl}${query.replace(' ', '_')}`

      const response = await fetch(completeUrl)

      if (response.status === 200) {
        const data = (await response.json()) as {
          title?: string
          extract?: string
          content_urls?: { desktop?: { page?: string } }
        }

        const result = {
          title: data.title,
          extract: data.extract,
          url: data.content_urls?.desktop?.page,
        }
        return JSON.stringify(result, null, 2)
      } else if (response.status === 404) {
        // Use the Wikipedia search API to suggest articles
        const searchUrl = 'https://en.wikipedia.org/w/api.php'
        const params = new URLSearchParams({
          action: 'query',
          list: 'search',
          srsearch: query,
          format: 'json',
          srlimit: '10',
        })

        const searchResponse = await fetch(`${searchUrl}?${params}`)

        if (searchResponse.status === 200) {
          const searchData = (await searchResponse.json()) as {
            query?: {
              search?: Array<{
                title: string
                snippet: string
                pageid: number
              }>
            }
          }

          const results = searchData.query?.search || []
          if (results.length === 0) {
            return 'No Wikipedia page or related articles found for the given query.'
          }

          const suggestions = results.map((item) => ({
            title: item.title,
            snippet: item.snippet.replace(/<[^>]*>/g, ''), // Remove HTML tags
            url: `https://en.wikipedia.org/?curid=${item.pageid}`,
          }))

          return JSON.stringify(
            {
              message: 'No exact page found. Here are some related articles:',
              suggestions: suggestions,
            },
            null,
            2
          )
        } else {
          return 'No Wikipedia page found and error searching for related articles.'
        }
      } else {
        return `Error fetching data from Wikipedia API: ${response.status}`
      }
    } catch (error) {
      return `Error in Wikipedia search: ${error instanceof Error ? error.message : String(error)}`
    }
  }

  async getCnnLiteNews(args?: { url?: string }): Promise<string> {
    try {
      // If a specific URL is provided, fetch that article
      if (args?.url) {
        const response = await fetch(args.url)
        if (response.status !== 200) {
          return `Error fetching article: ${response.status}`
        }

        const html = await response.text()
        const $ = cheerio.load(html)

        // CNN Lite articles: get the main text content
        const paragraphs = $('p')
          .map((_, el) => $(el).text().trim())
          .get()
        const articleText = paragraphs.join('\n')

        // Get the headline
        const headline = $('h1').first().text().trim()

        return JSON.stringify(
          {
            headline: headline,
            content: articleText,
          },
          null,
          2
        )
      } else {
        // Fetch the main CNN Lite page for headlines
        const url = 'https://lite.cnn.com/'
        const response = await fetch(url)

        if (response.status !== 200) {
          return `Error fetching CNN Lite: ${response.status}`
        }

        const html = await response.text()
        const $ = cheerio.load(html)

        const headlines = $('a')
          .map((_, el) => {
            const $el = $(el)
            const title = $el.text().trim()
            const href = $el.attr('href')

            if (title && href && href.startsWith('/')) {
              return {
                title: title,
                url: `https://lite.cnn.com${href}`,
              }
            }
            return null
          })
          .get()
          .filter(Boolean)

        return JSON.stringify(headlines, null, 2)
      }
    } catch (error) {
      return `Error fetching CNN news: ${error instanceof Error ? error.message : String(error)}`
    }
  }

  async checkDuplicateRecipient(args: {
    leader_name: string
  }): Promise<string> {
    try {
      const { leader_name } = args

      // Search for letters with similar recipient names
      const stmt = this.db.prepare(`
        SELECT id, addressed_to, subject, date_created
        FROM letters 
        WHERE addressed_to LIKE ? 
        ORDER BY date_created DESC
      `)

      const searchTerm = `%${leader_name}%`
      const results = stmt.all(searchTerm) as Array<{
        id: number
        addressed_to: string
        subject: string
        date_created: string
      }>

      if (results.length === 0) {
        return JSON.stringify(
          {
            status: 'ORIGINAL',
            leader: leader_name,
            duplicates: [],
          },
          null,
          2
        )
      }

      // Check for exact matches or very similar names
      const exactMatches = results.filter(
        (letter) =>
          letter.addressed_to
            .toLowerCase()
            .includes(leader_name.toLowerCase()) ||
          leader_name.toLowerCase().includes(letter.addressed_to.toLowerCase())
      )

      return JSON.stringify(
        {
          status: exactMatches.length > 0 ? 'DUPLICATE' : 'SIMILAR',
          leader: leader_name,
          duplicates: results.map((letter) => ({
            id: letter.id,
            addressed_to: letter.addressed_to,
            subject: letter.subject,
            date_created: letter.date_created,
          })),
        },
        null,
        2
      )
    } catch (error) {
      return `Error checking duplicate recipient: ${error instanceof Error ? error.message : String(error)}`
    }
  }

  async storeLetter(args: {
    content: string
    addressed_to: string
    subject: string
    metadata?: string
  }): Promise<string> {
    try {
      const { content, addressed_to, subject, metadata } = args

      const stmt = this.db.prepare(`
        INSERT INTO letters (content, addressed_to, subject, metadata)
        VALUES (?, ?, ?, ?)
      `)

      const result = stmt.run(
        content,
        addressed_to,
        subject || null,
        metadata || null
      )

      return `Successfully stored letter with ID: ${result.lastInsertRowid}`
    } catch (error) {
      return `Error storing letter: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  close(): void {
    this.db.close()
  }
}
