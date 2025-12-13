import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Get the most recent forecast batch (last 7 days fetched)
    const { data: latestFetch } = await supabaseAdmin
      .from('weather_forecasts')
      .select('fetched_at')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    if (!latestFetch) {
      return NextResponse.json({ error: 'No forecast data available' }, { status: 404 });
    }

    // Get all forecasts from the latest fetch
    const { data: forecasts, error } = await supabaseAdmin
      .from('weather_forecasts')
      .select('*')
      .eq('fetched_at', latestFetch.fetched_at)
      .gte('forecast_date', new Date().toISOString().split('T')[0]) // Only future dates
      .order('forecast_date', { ascending: true })
      .limit(7);

    if (error) {
      console.error('Error fetching forecasts:', error);
      return NextResponse.json({ error: 'Failed to fetch forecasts' }, { status: 500 });
    }

    return NextResponse.json({
      forecasts,
      fetchedAt: latestFetch.fetched_at,
    });
  } catch (error) {
    console.error('Error fetching forecast:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forecast' },
      { status: 500 }
    );
  }
}
