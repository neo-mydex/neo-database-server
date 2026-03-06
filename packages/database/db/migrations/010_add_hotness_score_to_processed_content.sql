ALTER TABLE ai_processed_content
  ADD COLUMN IF NOT EXISTS hotness_score NUMERIC(4, 3) NOT NULL DEFAULT 0.5;

CREATE INDEX IF NOT EXISTS idx_ai_processed_content_hotness_score
  ON ai_processed_content (hotness_score DESC);
