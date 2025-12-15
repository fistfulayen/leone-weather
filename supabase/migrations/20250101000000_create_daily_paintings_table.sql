-- Create table for storing daily paintings
CREATE TABLE IF NOT EXISTS daily_paintings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  painting_date DATE NOT NULL UNIQUE,

  -- Painter information
  painter_name TEXT NOT NULL,
  painter_period TEXT NOT NULL,
  painter_style TEXT NOT NULL,

  -- Image information
  source_image TEXT NOT NULL,
  image_url TEXT NOT NULL,

  -- Prompts
  claude_prompt TEXT NOT NULL,
  dalle_prompt TEXT NOT NULL,
  revised_prompt TEXT,

  -- Context used for generation
  context JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on painting_date for fast lookups
CREATE INDEX idx_daily_paintings_date ON daily_paintings(painting_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_daily_paintings_updated_at
  BEFORE UPDATE ON daily_paintings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE daily_paintings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON daily_paintings
  FOR SELECT USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access" ON daily_paintings
  FOR ALL USING (auth.role() = 'service_role');
