#!/usr/bin/env node

/**
 * Script to create speech_similarities table for storing precomputed similarities
 */

import Database from 'better-sqlite3'
import { join } from 'path'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dbPath = join(__dirname, '..', 'data', 'un_speeches.db')
const sqlPath = join(__dirname, 'create-similarities-table.sql')

console.log('Creating speech_similarities table...')

try {
  // Check if database exists
  const db = new Database(dbPath)

  // Read the SQL file
  const sql = readFileSync(sqlPath, 'utf8')

  // Execute the entire SQL file at once
  console.log('Executing SQL migration...')

  try {
    db.exec(sql)
    console.log('✓ SQL executed successfully')
  } catch (error) {
    // Check if it's just "already exists" errors
    if (error.message.includes('already exists')) {
      console.log('⚠ Some objects already exist, continuing...')
    } else {
      throw error
    }
  }

  // Verify table was created
  const tableInfo = db
    .prepare(
      `
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='speech_similarities'
  `
    )
    .get()

  if (tableInfo) {
    console.log('✅ speech_similarities table created successfully')

    // Show table schema
    const schema = db.prepare('PRAGMA table_info(speech_similarities)').all()
    console.log('\nTable schema:')
    schema.forEach((col) => {
      console.log(
        `  ${col.name}: ${col.type}${col.pk ? ' (PRIMARY KEY)' : ''}${col.notnull ? ' NOT NULL' : ''}`
      )
    })

    // Show indexes
    const indexes = db
      .prepare(
        `
      SELECT name FROM sqlite_master 
      WHERE type='index' AND tbl_name='speech_similarities'
      AND name NOT LIKE 'sqlite_%'
    `
      )
      .all()

    if (indexes.length > 0) {
      console.log('\nIndexes created:')
      indexes.forEach((idx) => {
        console.log(`  ${idx.name}`)
      })
    }
  } else {
    throw new Error('Failed to create speech_similarities table')
  }

  db.close()
  console.log('\n🎉 Migration completed successfully!')
} catch (error) {
  console.error('❌ Error creating speech_similarities table:', error.message)
  process.exit(1)
}
