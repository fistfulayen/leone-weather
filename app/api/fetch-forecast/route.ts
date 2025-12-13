import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Cascina Leone coordinates (Località Novelli, Niella Belbo, Piedmont, Italy)
const LAT = 44.520817;
const LON = 8.106246;

export async function GET() {
  try {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenWeatherMap API key not configured' },
        { status: 500 }
      );
    }

    // Fetch 8-day forecast from OpenWeatherMap One Call API 3.0
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${LAT}&lon=${LON}&exclude=minutely,hourly,alerts&units=metric&appid=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenWeatherMap API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Store each day's forecast in the database
    const forecasts = data.daily.map((day: any) => ({
      forecast_date: new Date(day.dt * 1000).toISOString().split('T')[0],
      temp_min: day.temp.min,
      temp_max: day.temp.max,
      feels_like_day: day.feels_like.day,
      feels_like_night: day.feels_like.night,
      pressure: day.pressure,
      humidity: day.humidity,
      weather_main: day.weather[0]?.main,
      weather_description: day.weather[0]?.description,
      weather_icon: day.weather[0]?.icon,
      clouds: day.clouds,
      wind_speed: day.wind_speed,
      wind_deg: day.wind_deg,
      rain_mm: day.rain || 0,
      snow_mm: day.snow || 0,
      pop: day.pop, // probability of precipitation
      sunrise: new Date(day.sunrise * 1000).toISOString(),
      sunset: new Date(day.sunset * 1000).toISOString(),
    }));

    // Insert forecasts into database
    const { data: stored, error } = await supabaseAdmin
      .from('weather_forecasts')
      .insert(forecasts)
      .select();

    if (error) {
      console.error('Error storing forecasts:', error);
      // Continue even if storage fails - we can still return the data
    }

    return NextResponse.json({
      success: true,
      message: `Fetched ${forecasts.length} days of forecast`,
      forecasts: forecasts,
      stored: stored?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching forecast:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forecast' },
      { status: 500 }
    );
  }
}
