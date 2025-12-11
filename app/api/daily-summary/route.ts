import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    // Fetch all readings from yesterday
    const { data: readings, error } = await supabaseAdmin
      .from('readings')
      .select('*')
      .gte('timestamp', `${dateStr}T00:00:00`)
      .lt('timestamp', `${dateStr}T23:59:59`)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    if (!readings || readings.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No data available for yesterday',
      });
    }

    // Calculate daily summary
    const temps = readings.map(r => r.temp_c).filter((t): t is number => t !== null);
    const humidities = readings.map(r => r.humidity).filter((h): h is number => h !== null);
    const aqis = readings.map(r => r.aqi).filter((a): a is number => a !== null);

    const tempHigh = Math.max(...temps);
    const tempLow = Math.min(...temps);
    const tempAvg = temps.reduce((a, b) => a + b, 0) / temps.length;
    const humidityAvg = humidities.reduce((a, b) => a + b, 0) / humidities.length;
    const aqiAvg = aqis.length > 0 ? aqis.reduce((a, b) => a + b, 0) / aqis.length : null;
    const aqiHigh = aqis.length > 0 ? Math.max(...aqis) : null;

    // Find times of high/low
    const highReading = readings.find(r => r.temp_c === tempHigh);
    const lowReading = readings.find(r => r.temp_c === tempLow);
    const aqiHighReading = aqis.length > 0 ? readings.find(r => r.aqi === aqiHigh) : null;

    // Get rain total (last reading of the day has the daily total)
    const rainTotal = readings[readings.length - 1]?.rain_day_mm || 0;

    // Insert summary
    const { error: insertError } = await supabaseAdmin
      .from('daily_summaries')
      .insert({
        date: dateStr,
        temp_high: tempHigh,
        temp_high_at: highReading ? new Date(highReading.timestamp).toTimeString().split(' ')[0] : null,
        temp_low: tempLow,
        temp_low_at: lowReading ? new Date(lowReading.timestamp).toTimeString().split(' ')[0] : null,
        temp_avg: tempAvg,
        humidity_avg: humidityAvg,
        rain_total_mm: rainTotal,
        aqi_avg: aqiAvg,
        aqi_high: aqiHigh,
        aqi_high_at: aqiHighReading ? new Date(aqiHighReading.timestamp).toTimeString().split(' ')[0] : null,
      });

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      date: dateStr,
      summary: {
        tempHigh,
        tempLow,
        tempAvg: tempAvg.toFixed(1),
        humidityAvg: humidityAvg.toFixed(1),
        rainTotal,
        aqiAvg: aqiAvg?.toFixed(1),
        aqiHigh,
      },
    });
  } catch (error) {
    console.error('Error creating daily summary:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create daily summary'
      },
      { status: 500 }
    );
  }
}
