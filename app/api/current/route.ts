import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateCurrentConditionsSummary, getPressureTrend, getRainForecastHint } from '@/lib/insights';
import { getSunTimes, formatTime } from '@/lib/sun-times';

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

    // Get today's high and low temps with timestamps
    const today = new Date().toISOString().split('T')[0];
    const { data: todayReadings } = await supabaseAdmin
      .from('readings')
      .select('temp_c, timestamp')
      .gte('timestamp', `${today}T00:00:00`)
      .order('temp_c', { ascending: false });

    let todayHigh = null;
    let todayHighTime = null;
    let todayLow = null;
    let todayLowTime = null;

    if (todayReadings && todayReadings.length > 0) {
      // High is first (descending order)
      todayHigh = todayReadings[0].temp_c;
      todayHighTime = todayReadings[0].timestamp;
      // Low is last
      todayLow = todayReadings[todayReadings.length - 1].temp_c;
      todayLowTime = todayReadings[todayReadings.length - 1].timestamp;
    }

    // Get sunrise and sunset times
    const sunTimes = getSunTimes();
    const sunrise = formatTime(sunTimes.sunrise);
    const sunset = formatTime(sunTimes.sunset);

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
      sunrise,
      sunset,
      todayHigh,
      todayHighTime,
      todayLow,
      todayLowTime,
    });
  } catch (error) {
    console.error('Error fetching current conditions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current conditions' },
      { status: 500 }
    );
  }
}
