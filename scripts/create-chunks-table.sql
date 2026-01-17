-- Chunks table for granular text search
CREATE TABLE IF NOT EXISTS chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  speech_id INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  char_start INTEGER NOT NULL,
  char_end INTEGER NOT NULL,

  -- LLM-generated metadata (populated in second pass)
  summary TEXT,
  themes TEXT,           -- JSON array of themes/topics
  entities TEXT,         -- JSON object with people, countries, orgs
  notable TEXT,          -- Anything interesting (quotes, statistics, proposals)

  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (speech_id) REFERENCES speeches(id) ON DELETE CASCADE,
  UNIQUE(speech_id, chunk_index)
);

-- Embeddings for each chunk
CREATE TABLE IF NOT EXISTS chunk_embeddings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chunk_id INTEGER NOT NULL UNIQUE,
  embedding BLOB NOT NULL,
  dimensions INTEGER NOT NULL DEFAULT 384,
  model TEXT NOT NULL DEFAULT 'bge-small-en-v1.5',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (chunk_id) REFERENCES chunks(id) ON DELETE CASCADE
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_chunks_speech_id ON chunks(speech_id);
CREATE INDEX IF NOT EXISTS idx_chunks_themes ON chunks(themes);
CREATE INDEX IF NOT EXISTS idx_chunk_embeddings_chunk_id ON chunk_embeddings(chunk_id);

-- FTS5 for full-text search on chunks
CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
  text,
  summary,
  themes,
  notable,
  content=chunks,
  content_rowid=id
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
  INSERT INTO chunks_fts(rowid, text, summary, themes, notable)
  VALUES (new.id, new.text, new.summary, new.themes, new.notable);
END;

CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
  INSERT INTO chunks_fts(chunks_fts, rowid, text, summary, themes, notable)
  VALUES('delete', old.id, old.text, old.summary, old.themes, old.notable);
END;

CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
  INSERT INTO chunks_fts(chunks_fts, rowid, text, summary, themes, notable)
  VALUES('delete', old.id, old.text, old.summary, old.themes, old.notable);
  INSERT INTO chunks_fts(rowid, text, summary, themes, notable)
  VALUES (new.id, new.text, new.summary, new.themes, new.notable);
END;
