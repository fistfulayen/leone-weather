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

    // Fetch weather overview from OpenWeatherMap One Call API 3.0
    const url = `https://api.openweathermap.org/data/3.0/onecall/overview?lat=${LAT}&lon=${LON}&appid=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenWeatherMap API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Get today's date in Italy timezone
    const todayDate = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Europe/Rome',
    });

    // Store the weather overview in the database
    const { data: stored, error } = await supabaseAdmin
      .from('weather_overviews')
      .insert({
        overview_date: todayDate,
        overview_text: data.weather_overview || '',
      })
      .select();

    if (error) {
      console.error('Error storing weather overview:', error);
      // Continue even if storage fails - we can still return the data
    }

    return NextResponse.json({
      success: true,
      overview: data.weather_overview || '',
      date: todayDate,
      stored: stored?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching weather overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather overview' },
      { status: 500 }
    );
  }
}
