-- Create speech_similarities table to store precomputed similarities
CREATE TABLE IF NOT EXISTS speech_similarities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    speech1_id INTEGER NOT NULL,
    speech2_id INTEGER NOT NULL,
    similarity REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (speech1_id) REFERENCES speeches(id),
    FOREIGN KEY (speech2_id) REFERENCES speeches(id),
    UNIQUE(speech1_id, speech2_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_speech_similarities_speech1 ON speech_similarities(speech1_id);
CREATE INDEX IF NOT EXISTS idx_speech_similarities_speech2 ON speech_similarities(speech2_id);
CREATE INDEX IF NOT EXISTS idx_speech_similarities_similarity ON speech_similarities(similarity DESC);

-- Combined index for bilateral lookups
CREATE INDEX IF NOT EXISTS idx_speech_similarities_bilateral ON speech_similarities(speech1_id, speech2_id);

-- Index for finding most similar speeches
CREATE INDEX IF NOT EXISTS idx_speech_similarities_top ON speech_similarities(speech1_id, similarity DESC);
