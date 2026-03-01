-- Add generated tsvector column (weighted: name=A, description=C)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) STORED;

-- GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_assets_search ON assets USING GIN(search_vector);
