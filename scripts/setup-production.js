#!/usr/bin/env node

/**
 * Setup script for production deployment
 * Downloads database and creates performance indices
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

console.log('🚀 Setting up UN Speeches database for production...')

async function runSetup() {
  try {
    // Step 1: Download database
    console.log('📥 Downloading database...')
    await execAsync('node scripts/download-database.js')
    console.log('✅ Database downloaded successfully')

    // Step 2: Create performance indices
    console.log('⚡ Creating performance indices...')
    await execAsync('node scripts/create-indexes.js')
    console.log('✅ Performance indices created successfully')

    console.log('🎉 Setup completed! Database is ready for production.')
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

runSetup()
