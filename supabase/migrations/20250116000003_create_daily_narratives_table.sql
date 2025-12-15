-- Create daily_narratives table for Louisina's daily narrative
CREATE TABLE IF NOT EXISTS daily_narratives (
  id BIGSERIAL PRIMARY KEY,
  narrative_date DATE NOT NULL,
  narrative_text TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  weather_context JSONB,
  UNIQUE(narrative_date)
);

-- Create index for faster queries
CREATE INDEX idx_daily_narratives_date ON daily_narratives(narrative_date DESC);

-- Enable Row Level Security
ALTER TABLE daily_narratives ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON daily_narratives
  FOR SELECT USING (true);
