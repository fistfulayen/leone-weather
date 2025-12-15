-- Add additional ski resort data fields from SkiResort.info
ALTER TABLE ski_reports
  ADD COLUMN IF NOT EXISTS snow_depth_mountain NUMERIC,
  ADD COLUMN IF NOT EXISTS snow_depth_base NUMERIC,
  ADD COLUMN IF NOT EXISTS lifts_open INTEGER,
  ADD COLUMN IF NOT EXISTS lifts_total INTEGER,
  ADD COLUMN IF NOT EXISTS slopes_open_km NUMERIC,
  ADD COLUMN IF NOT EXISTS slopes_total_km NUMERIC,
  ADD COLUMN IF NOT EXISTS last_snowfall DATE,
  ADD COLUMN IF NOT EXISTS snow_quality TEXT,
  ADD COLUMN IF NOT EXISTS fresh_snow_cm NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS skiresort_url TEXT;

-- Drop the old columns we don't need anymore
ALTER TABLE ski_reports
  DROP COLUMN IF EXISTS current_temp,
  DROP COLUMN IF EXISTS feels_like,
  DROP COLUMN IF EXISTS weather_description,
  DROP COLUMN IF EXISTS weather_icon,
  DROP COLUMN IF EXISTS wind_speed,
  DROP COLUMN IF EXISTS visibility;
