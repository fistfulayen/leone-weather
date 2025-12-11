import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Client for browser/frontend
export const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client for server-side operations (using secret key)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database types
export interface Reading {
  id: number;
  timestamp: string;
  temp_c?: number;
  humidity?: number;
  dew_point_c?: number;
  heat_index_c?: number;
  wind_chill_c?: number;
  wind_speed_kmh?: number;
  wind_dir_deg?: number;
  wind_gust_kmh?: number;
  rain_rate_mmh?: number;
  rain_day_mm?: number;
  barometer_mmhg?: number;
  aqi?: number;
  pm1_ugm3?: number;
  pm25_ugm3?: number;
  pm10_ugm3?: number;
  indoor_temp_c?: number;
  indoor_humidity?: number;
}

export interface DailySummary {
  date: string;
  temp_high?: number;
  temp_high_at?: string;
  temp_low?: number;
  temp_low_at?: string;
  temp_avg?: number;
  humidity_avg?: number;
  rain_total_mm?: number;
  aqi_avg?: number;
  aqi_high?: number;
  aqi_high_at?: string;
}

export interface Conversation {
  id: number;
  session_id: string;
  user_message: string;
  assistant_message: string;
  weather_context?: any;
  created_at: string;
}

export interface AQIComparison {
  id: number;
  city: string;
  country: string;
  aqi: number;
  pm25?: number;
  pm10?: number;
  fetched_at: string;
}
