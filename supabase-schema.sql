-- Cascina Leone Weather Agent - Database Schema
-- Run this in your Supabase SQL Editor

-- Raw weather readings (captured every 15 minutes)
CREATE TABLE IF NOT EXISTS readings (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Outdoor conditions
  temp_c REAL,
  humidity REAL,
  dew_point_c REAL,
  heat_index_c REAL,
  wind_chill_c REAL,

  -- Wind
  wind_speed_kmh REAL,
  wind_dir_deg INTEGER,
  wind_gust_kmh REAL,

  -- Rain
  rain_rate_mmh REAL,
  rain_day_mm REAL,

  -- Pressure
  barometer_mmhg REAL,

  -- Air Quality
  aqi REAL,
  pm1_ugm3 REAL,
  pm25_ugm3 REAL,
  pm10_ugm3 REAL,

  -- Indoor conditions
  indoor_temp_c REAL,
  indoor_humidity REAL,

  UNIQUE(timestamp)
);

-- Index for fast time-based queries
CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON readings(timestamp DESC);

-- Daily summaries (computed nightly)
CREATE TABLE IF NOT EXISTS daily_summaries (
  date DATE PRIMARY KEY,
  temp_high REAL,
  temp_high_at TIME,
  temp_low REAL,
  temp_low_at TIME,
  temp_avg REAL,
  humidity_avg REAL,
  rain_total_mm REAL,
  aqi_avg REAL,
  aqi_high REAL,
  aqi_high_at TIME,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seasonal baselines (for "warmer/colder than normal" comparisons)
CREATE TABLE IF NOT EXISTS seasonal_baselines (
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  avg_high REAL,
  avg_low REAL,
  avg_humidity REAL,
  PRIMARY KEY (month, day)
);

-- Conversation history for chat interface
CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  assistant_message TEXT NOT NULL,
  weather_context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for retrieving conversation history
CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id, created_at DESC);

-- AQI comparison cache (stores recent AQI data for comparison cities)
CREATE TABLE IF NOT EXISTS aqi_comparisons (
  id BIGSERIAL PRIMARY KEY,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  aqi REAL NOT NULL,
  pm25 REAL,
  pm10 REAL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(city, country, fetched_at)
);

-- Index for fast city lookups
CREATE INDEX IF NOT EXISTS idx_aqi_city ON aqi_comparisons(city, fetched_at DESC);

-- Daily horoscopes (Virgo-Pisces love horoscope for context)
CREATE TABLE IF NOT EXISTS daily_horoscopes (
  date DATE PRIMARY KEY,
  horoscope_text TEXT NOT NULL,
  lucky_colors TEXT,
  lucky_numbers TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weather forecasts (7-day forecast from OpenWeatherMap)
CREATE TABLE IF NOT EXISTS weather_forecasts (
  id BIGSERIAL PRIMARY KEY,
  forecast_date DATE NOT NULL,
  temp_min REAL,
  temp_max REAL,
  feels_like_day REAL,
  feels_like_night REAL,
  pressure REAL,
  humidity REAL,
  weather_main TEXT,
  weather_description TEXT,
  weather_icon TEXT,
  clouds REAL,
  wind_speed REAL,
  wind_deg REAL,
  rain_mm REAL,
  snow_mm REAL,
  pop REAL, -- probability of precipitation
  sunrise TIMESTAMPTZ,
  sunset TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(forecast_date, fetched_at)
);

-- Weather overviews (human-readable weather summaries from OpenWeatherMap)
CREATE TABLE IF NOT EXISTS weather_overviews (
  id BIGSERIAL PRIMARY KEY,
  overview_date DATE NOT NULL,
  overview_text TEXT NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(overview_date, fetched_at)
);

-- Enable Row Level Security (optional, for future multi-user support)
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE aqi_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_horoscopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_overviews ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations (since this is a personal app)
CREATE POLICY "Enable all for readings" ON readings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for daily_summaries" ON daily_summaries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for seasonal_baselines" ON seasonal_baselines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for conversations" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for aqi_comparisons" ON aqi_comparisons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for daily_horoscopes" ON daily_horoscopes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for weather_forecasts" ON weather_forecasts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for weather_overviews" ON weather_overviews FOR ALL USING (true) WITH CHECK (true);
