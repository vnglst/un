#!/usr/bin/env node

import { config } from 'dotenv'
import { existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import { createReadStream } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Load environment variables from .env file
config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get the project root directory
const projectRoot = join(__dirname, '..')
const dataDir = join(projectRoot, 'data')
const dbPath = join(dataDir, 'un_speeches.db')
const zipPath = join(dataDir, 'un_speeches.zip')

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

    // Download the database (compressed)
    const response = await fetch(databaseUrl)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    if (!response.body) {
      throw new Error('No response body received')
    }

    // Create write stream for the compressed file and pipe the response
    console.log('💾 Downloading compressed database...')
    const zipFileStream = createWriteStream(zipPath)
    await pipeline(response.body, zipFileStream)

    console.log('✅ Compressed database downloaded successfully')

    // Log compressed file size
    const fs = await import('fs')
    const zipStats = fs.statSync(zipPath)
    const zipSizeMB = (zipStats.size / 1024 / 1024).toFixed(2)
    console.log(`📊 Compressed size: ${zipSizeMB} MB`)

    // Unzip the database
    console.log('📂 Extracting database...')

    try {
      // Use system unzip command for large files
      const { stdout, stderr } = await execAsync(
        `unzip -o "${zipPath}" -d "${dataDir}"`
      )

      if (stderr && !stderr.includes('inflating:')) {
        console.warn('⚠️ Unzip warnings:', stderr)
      }

      console.log('✅ Database extracted successfully')

      // Find the extracted .db file
      const fs = await import('fs')
      const files = fs.readdirSync(dataDir)
      const dbFile = files.find(
        (file) => file.endsWith('.db') && file !== 'un_speeches.db'
      )

      if (dbFile) {
        const extractedPath = join(dataDir, dbFile)
        if (extractedPath !== dbPath) {
          fs.renameSync(extractedPath, dbPath)
          console.log(`📄 Renamed ${dbFile} to un_speeches.db`)
        }
      }
    } catch (unzipError) {
      throw new Error(`Failed to extract ZIP file: ${unzipError.message}`)
    }

    console.log('✅ Database extracted successfully to:', dbPath)

    // Log uncompressed file size
    const dbStats = fs.statSync(dbPath)
    const dbSizeMB = (dbStats.size / 1024 / 1024).toFixed(2)
    console.log(`📊 Database size: ${dbSizeMB} MB`)

    // Clean up the compressed file
    fs.unlinkSync(zipPath)
    console.log('🧹 Cleaned up compressed file')
  } catch (error) {
    console.error('❌ Failed to download or extract database:', error.message)

    // Clean up partial downloads if they exist
    const fs = await import('fs')
    if (existsSync(zipPath)) {
      fs.unlinkSync(zipPath)
      console.log('🧹 Cleaned up partial zip download')
    }
    if (existsSync(dbPath)) {
      fs.unlinkSync(dbPath)
      console.log('🧹 Cleaned up partial database extraction')
    }

    process.exit(1)
  }
}

// Run the download
downloadDatabase().catch((error) => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})
