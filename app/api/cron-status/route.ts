import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Get latest WeatherLink reading
    const { data: latestReading } = await supabaseAdmin
      .from('readings')
      .select('timestamp')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    // Get latest forecast fetch
    const { data: latestForecast } = await supabaseAdmin
      .from('weather_forecasts')
      .select('fetched_at')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    // Get latest weather overview fetch
    const { data: latestOverview } = await supabaseAdmin
      .from('weather_overviews')
      .select('fetched_at')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    // Get latest horoscope fetch
    const { data: latestHoroscope } = await supabaseAdmin
      .from('daily_horoscopes')
      .select('fetched_at')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    // Get latest daily summary
    const { data: latestSummary } = await supabaseAdmin
      .from('daily_summaries')
      .select('date')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    // Get latest AQI comparison
    const { data: latestAQI } = await supabaseAdmin
      .from('aqi_comparisons')
      .select('fetched_at')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      weatherlink: latestReading?.timestamp || null,
      forecast: latestForecast?.fetched_at || null,
      overview: latestOverview?.fetched_at || null,
      horoscope: latestHoroscope?.fetched_at || null,
      daily_summary: latestSummary?.date || null,
      aqi: latestAQI?.fetched_at || null,
    });
  } catch (error) {
    console.error('Error fetching cron status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cron status' },
      { status: 500 }
    );
  }
}
