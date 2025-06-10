#!/usr/bin/env node

import { existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get the project root directory
const projectRoot = join(__dirname, '..')
const dataDir = join(projectRoot, 'data')
const dbPath = join(dataDir, 'un_speeches.db')

async function downloadDatabase() {
  console.log('🔍 Checking for database file...')

  // Check if database already exists
  if (existsSync(dbPath)) {
    console.log('✅ Database file already exists at:', dbPath)
    return
  }

  console.log('📥 Database file not found, downloading...')

  // Get database URL from environment variable (required)
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required but not set')
  }
  console.log('📡 Downloading from:', databaseUrl)

  try {
    // Ensure data directory exists
    if (!existsSync(dataDir)) {
      console.log('📁 Creating data directory...')
      mkdirSync(dataDir, { recursive: true })
    }

    // Download the database
    const response = await fetch(databaseUrl)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    if (!response.body) {
      throw new Error('No response body received')
    }

    // Create write stream and pipe the response
    const fileStream = createWriteStream(dbPath)
    await pipeline(response.body, fileStream)

    console.log('✅ Database downloaded successfully to:', dbPath)

    // Log file size for verification
    const fs = await import('fs')
    const stats = fs.statSync(dbPath)
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
    console.log(`📊 Database size: ${sizeMB} MB`)
  } catch (error) {
    console.error('❌ Failed to download database:', error.message)

    // Clean up partial download if it exists
    if (existsSync(dbPath)) {
      const fs = await import('fs')
      fs.unlinkSync(dbPath)
      console.log('🧹 Cleaned up partial download')
    }

    process.exit(1)
  }
}

// Run the download
downloadDatabase().catch((error) => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})
