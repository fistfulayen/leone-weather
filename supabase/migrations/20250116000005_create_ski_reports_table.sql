-- Create ski_reports table for tracking snow conditions at ski resorts
CREATE TABLE IF NOT EXISTS ski_reports (
  id BIGSERIAL PRIMARY KEY,
  resort_name TEXT NOT NULL,
  country TEXT NOT NULL,
  current_temp NUMERIC,
  feels_like NUMERIC,
  snow_24h NUMERIC DEFAULT 0,
  snow_depth NUMERIC,
  weather_description TEXT,
  weather_icon TEXT,
  wind_speed NUMERIC,
  visibility NUMERIC,
  forecast_snow_today NUMERIC DEFAULT 0,
  forecast_snow_tomorrow NUMERIC DEFAULT 0,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(resort_name, country)
);

-- Create index for faster queries
CREATE INDEX idx_ski_reports_fetched_at ON ski_reports(fetched_at DESC);
CREATE INDEX idx_ski_reports_resort ON ski_reports(resort_name);

-- Enable Row Level Security
ALTER TABLE ski_reports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON ski_reports
  FOR SELECT USING (true);
