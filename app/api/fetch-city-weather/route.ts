import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const CITIES = [
  { name: 'Portland', country: 'USA', lat: 45.5152, lon: -122.6784 },
  { name: 'New York', country: 'USA', lat: 40.7128, lon: -74.0060 },
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 },
  { name: 'Tallinn', country: 'Estonia', lat: 59.4370, lon: 24.7536 },
];

export async function GET() {
  try {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenWeatherMap API key not configured' },
        { status: 500 }
      );
    }

    console.log('Fetching city weather data...');

    const cityData = [];

    for (const city of CITIES) {
      try {
        // Fetch current weather for each city
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&units=metric&appid=${apiKey}`;

        const response = await fetch(url, { cache: 'no-store' });

        if (!response.ok) {
          console.error(`Error fetching weather for ${city.name}:`, response.statusText);
          continue;
        }

        const data = await response.json();

        cityData.push({
          city_name: city.name,
          country: city.country,
          current_temp: data.main.temp,
          feels_like: data.main.feels_like,
          temp_min: data.main.temp_min,
          temp_max: data.main.temp_max,
          weather_description: data.weather[0].description,
          weather_icon: data.weather[0].icon,
          humidity: data.main.humidity,
          wind_speed: data.wind.speed,
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error fetching ${city.name}:`, error);
      }
    }

    if (cityData.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No city weather data fetched',
        count: 0,
      });
    }

    // Upsert city weather data (update if exists, insert if new)
    const { error } = await supabaseAdmin
      .from('city_weather')
      .upsert(cityData, {
        onConflict: 'city_name,country',
      });

    if (error) {
      console.error('Error storing city weather:', error);
      throw error;
    }

    console.log(`City weather stored successfully: ${cityData.length} cities`);

    return NextResponse.json({
      success: true,
      message: 'City weather fetched and stored',
      count: cityData.length,
    });
  } catch (error) {
    console.error('Error fetching city weather:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch city weather',
      },
      { status: 500 }
    );
  }
}
