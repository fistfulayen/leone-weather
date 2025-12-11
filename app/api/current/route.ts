import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateCurrentConditionsSummary, getPressureTrend, getRainForecastHint } from '@/lib/insights';

export async function GET() {
  try {
    // Get the most recent reading
    const { data: readings, error } = await supabaseAdmin
      .from('readings')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(2);

    if (error) throw error;

    const current = readings?.[0];
    const previous = readings?.[1];

    if (!current) {
      return NextResponse.json(
        { error: 'No weather data available' },
        { status: 404 }
      );
    }

    // Generate insights
    const summary = generateCurrentConditionsSummary(current);
    const pressureTrend = getPressureTrend(
      current.barometer_mmhg,
      previous?.barometer_mmhg
    );
    const rainHint = getRainForecastHint(current.barometer_mmhg, pressureTrend);

    return NextResponse.json({
      current,
      summary,
      pressureTrend,
      rainHint,
      timestamp: current.timestamp,
    });
  } catch (error) {
    console.error('Error fetching current conditions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current conditions' },
      { status: 500 }
    );
  }
}
