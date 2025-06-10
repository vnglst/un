#!/usr/bin/env node

/**
 * Script to create database indexes for improved performance
 */

import Database from 'better-sqlite3'
import { join } from 'path'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dbPath = join(__dirname, '..', 'data', 'un_speeches.db')
const sqlPath = join(__dirname, 'create-indexes.sql')

console.log('Creating database indexes for improved performance...')

try {
  // Read the SQL file
  const sql = readFileSync(sqlPath, 'utf8')

  // Connect to database
  const db = new Database(dbPath)

  // Split SQL into individual statements and execute
  // First remove comments, then split by semicolon
  const sqlWithoutComments = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--') && line.trim().length > 0)
    .join(' ')

  const statements = sqlWithoutComments
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  console.log(`Executing ${statements.length} SQL statements...`)

  const startTime = Date.now()

  statements.forEach((statement, index) => {
    try {
      console.log(`Executing statement ${index + 1}/${statements.length}...`)
      db.prepare(statement).run()
    } catch (error) {
      console.warn(`Warning: Statement ${index + 1} failed:`, error.message)
      // Continue with other statements even if one fails
    }
  })

  const duration = Date.now() - startTime

  db.close()

  console.log(`✅ Database indexes created successfully in ${duration}ms`)
  console.log('Performance should be significantly improved for:')
  console.log('  - Globe page loading')
  console.log('  - Country-specific speech listings')
  console.log('  - Search and filtering operations')
  console.log('  - Date-based sorting')
} catch (error) {
  console.error('❌ Error creating indexes:', error.message)
  process.exit(1)
}
