import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Niella Belbo coordinates
const LAT = 44.436;
const LON = 8.037;

export async function GET() {
  try {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenWeatherMap API key not configured' },
        { status: 500 }
      );
    }

    // Fetch 5-day forecast from OpenWeatherMap (free tier)
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=metric&appid=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenWeatherMap API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Process 3-hour forecast data into daily forecasts
    const dailyData: { [key: string]: any[] } = {};

    data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = [];
      }
      dailyData[date].push(item);
    });

    // Aggregate daily data
    const forecasts = Object.entries(dailyData).map(([date, items]) => {
      const temps = items.map((i: any) => i.main.temp);
      const pops = items.map((i: any) => i.pop || 0);

      return {
        forecast_date: date,
        temp_min: Math.min(...temps),
        temp_max: Math.max(...temps),
        feels_like_day: items[Math.floor(items.length / 2)]?.main.feels_like || temps[0],
        feels_like_night: items[items.length - 1]?.main.feels_like || temps[0],
        pressure: items[0].main.pressure,
        humidity: Math.round(items.reduce((sum: number, i: any) => sum + i.main.humidity, 0) / items.length),
        weather_main: items[Math.floor(items.length / 2)]?.weather[0]?.main,
        weather_description: items[Math.floor(items.length / 2)]?.weather[0]?.description,
        weather_icon: items[Math.floor(items.length / 2)]?.weather[0]?.icon,
        clouds: Math.round(items.reduce((sum: number, i: any) => sum + i.clouds.all, 0) / items.length),
        wind_speed: items.reduce((sum: number, i: any) => sum + i.wind.speed, 0) / items.length,
        wind_deg: items[0].wind.deg,
        rain_mm: items.reduce((sum: number, i: any) => sum + (i.rain?.['3h'] || 0), 0),
        snow_mm: items.reduce((sum: number, i: any) => sum + (i.snow?.['3h'] || 0), 0),
        pop: Math.max(...pops),
        sunrise: null,
        sunset: null,
      };
    });

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
