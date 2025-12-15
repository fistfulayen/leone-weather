-- Create city_weather table for tracking weather in favorite cities
CREATE TABLE IF NOT EXISTS city_weather (
  id BIGSERIAL PRIMARY KEY,
  city_name TEXT NOT NULL,
  country TEXT NOT NULL,
  current_temp NUMERIC NOT NULL,
  feels_like NUMERIC,
  temp_min NUMERIC NOT NULL,
  temp_max NUMERIC NOT NULL,
  weather_description TEXT,
  weather_icon TEXT,
  humidity INTEGER,
  wind_speed NUMERIC,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(city_name, country)
);

-- Create index for faster queries
CREATE INDEX idx_city_weather_fetched_at ON city_weather(fetched_at DESC);
CREATE INDEX idx_city_weather_city ON city_weather(city_name);

-- Enable Row Level Security
ALTER TABLE city_weather ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON city_weather
  FOR SELECT USING (true);
