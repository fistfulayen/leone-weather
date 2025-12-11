import { NextResponse } from 'next/server';
import { getCurrentConditions } from '@/lib/weatherlink';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchGlobalAQIData } from '@/lib/air-quality';

export async function GET() {
  try {
    // Fetch current weather data from Weatherlink
    const weatherData = await getCurrentConditions();

    // Insert into database
    const { error } = await supabaseAdmin
      .from('readings')
      .insert({
        timestamp: weatherData.timestamp,
        temp_c: weatherData.temp_c,
        humidity: weatherData.humidity,
        dew_point_c: weatherData.dew_point_c,
        heat_index_c: weatherData.heat_index_c,
        wind_chill_c: weatherData.wind_chill_c,
        wind_speed_kmh: weatherData.wind_speed_kmh,
        wind_dir_deg: weatherData.wind_dir_deg,
        wind_gust_kmh: weatherData.wind_gust_kmh,
        rain_rate_mmh: weatherData.rain_rate_mmh,
        rain_day_mm: weatherData.rain_day_mm,
        barometer_mmhg: weatherData.barometer_mmhg,
        aqi: weatherData.aqi,
        pm1_ugm3: weatherData.pm1_ugm3,
        pm25_ugm3: weatherData.pm25_ugm3,
        pm10_ugm3: weatherData.pm10_ugm3,
        indoor_temp_c: weatherData.indoor_temp_c,
        indoor_humidity: weatherData.indoor_humidity,
      });

    if (error) throw error;

    // Fetch global AQI data (runs every hour via this cron)
    // Only fetch if it's been more than 50 minutes since last fetch
    const shouldFetchAQI = Math.random() < 0.1; // ~1 in 10 calls (every ~2.5 hours)

    if (shouldFetchAQI) {
      await fetchGlobalAQIData();
    }

    return NextResponse.json({
      success: true,
      timestamp: weatherData.timestamp,
      message: 'Weather data ingested successfully',
    });
  } catch (error) {
    console.error('Error ingesting weather data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to ingest weather data'
      },
      { status: 500 }
    );
  }
}
