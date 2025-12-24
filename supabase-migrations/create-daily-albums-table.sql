-- Create table to store one iconic album cover for each day of the year
CREATE TABLE IF NOT EXISTS daily_albums (
  id BIGSERIAL PRIMARY KEY,
  day_of_year INTEGER NOT NULL UNIQUE CHECK (day_of_year >= 1 AND day_of_year <= 366),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookup by day
CREATE INDEX idx_daily_albums_day ON daily_albums (day_of_year);

-- Helper function to get today's album
CREATE OR REPLACE FUNCTION get_todays_album()
RETURNS TABLE(day_of_year INTEGER, title TEXT, artist TEXT, description TEXT) AS $$
DECLARE
  current_day_of_year INTEGER;
BEGIN
  -- Get current day of year in Europe/Rome timezone
  current_day_of_year := EXTRACT(DOY FROM (NOW() AT TIME ZONE 'Europe/Rome'));

  RETURN QUERY
  SELECT
    da.day_of_year,
    da.title,
    da.artist,
    da.description
  FROM public.daily_albums da
  WHERE da.day_of_year = current_day_of_year
  LIMIT 1;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Enable Row Level Security
ALTER TABLE daily_albums ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed)
CREATE POLICY "Allow all operations on daily_albums"
  ON daily_albums
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE daily_albums IS 'Stores one iconic album cover for each day of the year (1-366)';
COMMENT ON COLUMN daily_albums.day_of_year IS 'Day of year (1-366), unique index ensures one album per day';
COMMENT ON COLUMN daily_albums.title IS 'Album title';
COMMENT ON COLUMN daily_albums.artist IS 'Artist or band name';
COMMENT ON COLUMN daily_albums.description IS 'Detailed visual description of the iconic album cover for image generation';
