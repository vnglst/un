-- Create embeddings table for vector search
-- Uses sqlite-vec for efficient vector operations

-- Table to store speech embeddings
CREATE TABLE IF NOT EXISTS speech_embeddings (
  id INTEGER PRIMARY KEY,
  speech_id INTEGER NOT NULL UNIQUE,
  embedding BLOB NOT NULL,
  dimensions INTEGER NOT NULL DEFAULT 384,
  model TEXT NOT NULL DEFAULT 'bge-small-en-v1.5',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (speech_id) REFERENCES speeches(id) ON DELETE CASCADE
);

-- Create index on speech_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_speech_embeddings_speech_id ON speech_embeddings(speech_id);

-- Create index on created_at for tracking generation progress
CREATE INDEX IF NOT EXISTS idx_speech_embeddings_created_at ON speech_embeddings(created_at);
