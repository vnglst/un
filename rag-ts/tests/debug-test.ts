#!/usr/bin/env node

import Database from 'better-sqlite3'
import { join } from 'path'
import { load } from 'sqlite-vec'

const DB_PATH = join(process.cwd(), 'data', 'un_speeches.db')

console.log('Testing basic database functionality...')

try {
  const db = new Database(DB_PATH)
  console.log('✅ Database connected')

  // Check basic tables
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all() as Array<{ name: string }>
  console.log(
    '✅ Found tables:',
    tables.map((t) => t.name)
  )

  // Test loading sqlite-vec
  try {
    load(db)
    console.log('✅ sqlite-vec loaded')

    const version = db.prepare('SELECT vec_version()').get() as {
      'vec_version()': string
    }
    console.log('✅ sqlite-vec version:', version['vec_version()'])
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ sqlite-vec failed:', errorMessage)
  }

  // Check speeches table
  const speechCount = db.prepare('SELECT COUNT(*) as count FROM speeches').get() as {
    count: number
  }
  console.log(`✅ Speeches count: ${speechCount.count}`)

  // Check if our tables exist
  const ourTables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('speech_chunks', 'speech_embeddings')"
    )
    .all() as Array<{ name: string }>
  console.log(
    'Our tables:',
    ourTables.map((t) => t.name)
  )

  db.close()
  console.log('✅ Test completed successfully')
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  console.error('❌ Test failed:', errorMessage)
  process.exit(1)
}
