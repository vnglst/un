#!/usr/bin/env node

/**
 * Test sqlite-vec extension loading
 */

import Database from 'better-sqlite3'
import { load, getLoadablePath } from 'sqlite-vec'

async function testSqliteVec() {
  console.log('Testing sqlite-vec extension...')
  
  try {
    // Create a temporary in-memory database
    const db = new Database(':memory:')
    
    console.log('✅ Database connection created')
    
    // Try to load the extension using the proper method
    try {
      console.log(`Loading extension from: ${getLoadablePath()}`)
      load(db)
      console.log('✅ sqlite-vec extension loaded successfully')
      
      // Test basic functionality
      const version = db.prepare('SELECT vec_version()').get()
      console.log(`✅ sqlite-vec version: ${version['vec_version()']}`)
      
      // Test creating a virtual table
      db.exec(`
        CREATE VIRTUAL TABLE test_embeddings USING vec0(
          embedding FLOAT[3]
        )
      `)
      console.log('✅ Virtual table created successfully')
      
      // Test inserting and querying
      const insertStmt = db.prepare('INSERT INTO test_embeddings (embedding) VALUES (?)')
      const result = insertStmt.run(JSON.stringify([1.0, 2.0, 3.0]))
      console.log('✅ Vector insertion successful, ID:', result.lastInsertRowid)
      
      const retrieved = db.prepare('SELECT * FROM test_embeddings WHERE rowid = ?').get(result.lastInsertRowid)
      console.log('✅ Vector retrieval successful')
      
      console.log('\n🎉 sqlite-vec is working correctly!')
      
    } catch (error) {
      console.error('❌ Failed to load sqlite-vec extension:', error.message)
      console.error('\nTroubleshooting:')
      console.error('1. Make sure sqlite-vec is properly installed: npm install sqlite-vec')
      console.error('2. Install platform-specific binary: npm install sqlite-vec-darwin-x64')
      console.error('3. Check if your system supports the extension')
      return false
    }
    
    db.close()
    return true
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    return false
  }
}

testSqliteVec().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('❌ Test failed:', error.message)
  process.exit(1)
})
