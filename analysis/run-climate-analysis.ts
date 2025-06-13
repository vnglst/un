#!/usr/bin/env node

/**
 * Climate Change Analysis Runner
 *
 * This script runs the complete climate change similarity analysis pipeline:
 * 1. Analyzes USA speech chunks for similarity to climate change phrase
 * 2. Generates interactive visualizations
 * 3. Opens the results in browser (optional)
 */

import { spawn, type ChildProcess } from 'child_process'
import { join } from 'path'
import { existsSync } from 'fs'
import { config } from 'dotenv'

// Load environment variables
config()

/**
 * Run a TypeScript file using tsx
 */
function runScript(scriptPath: string, description: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`🚀 ${description}...`)

    const childProcess: ChildProcess = spawn('node', [scriptPath], {
      stdio: 'inherit',
      cwd: process.cwd(),
    })

    childProcess.on('close', (code: number | null) => {
      if (code === 0) {
        console.log(`✅ ${description} completed successfully`)
        resolve()
      } else {
        console.error(`❌ ${description} failed with exit code ${code}`)
        reject(new Error(`Process exited with code ${code}`))
      }
    })

    childProcess.on('error', (error: Error) => {
      console.error(`❌ Failed to start ${description}:`, error)
      reject(error)
    })
  })
}

/**
 * Check prerequisites
 */
function checkPrerequisites(): void {
  console.log('🔍 Checking prerequisites...')

  // Check if database exists
  const dbPath = join(process.cwd(), 'data', 'un_speeches.db')
  if (!existsSync(dbPath)) {
    console.error('❌ Database not found. Please run: npm run db:setup')
    process.exit(1)
  }

  // Check if OpenAI API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.error(
      '❌ OpenAI API key not found. Please set OPENAI_API_KEY environment variable.'
    )
    console.error('   You can add it to a .env file in the project root.')
    process.exit(1)
  }

  console.log('✅ Prerequisites check passed')
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log('🌍 Climate Change Similarity Analysis Pipeline')
  console.log('='.repeat(60))

  try {
    // Check prerequisites
    checkPrerequisites()

    // Run analysis
    const analysisScript = join(
      process.cwd(),
      'analysis',
      'climate-similarity-analysis.ts'
    )
    await runScript(analysisScript, 'Running similarity analysis')

    // Generate visualization
    const visualizationScript = join(
      process.cwd(),
      'analysis',
      'climate-similarity-visualization.ts'
    )
    await runScript(visualizationScript, 'Generating visualizations')

    // Success message
    console.log('\n' + '='.repeat(60))
    console.log('🎉 Analysis pipeline completed successfully!')
    console.log('='.repeat(60))
    console.log('📊 Results saved to:')
    console.log('   • analysis/climate-similarity-results.json')
    console.log('   • analysis/climate-similarity-visualization.html')
    console.log(
      '\n💡 Open the HTML file in your browser to view interactive charts!'
    )
  } catch (error) {
    console.error('\n❌ Pipeline failed:', error)
    process.exit(1)
  }
}

// Run the pipeline
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { main }
