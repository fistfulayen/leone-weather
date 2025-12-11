import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/lib/claude';
import { supabaseAdmin } from '@/lib/supabase';
import { getRecentAQIComparisons, getAQILevel } from '@/lib/air-quality';

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId } = await request.json();

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Message and sessionId are required' },
        { status: 400 }
      );
    }

    // Build weather context
    const { data: current } = await supabaseAdmin
      .from('readings')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    // Get today's stats
    const today = new Date().toISOString().split('T')[0];
    const { data: todayReadings } = await supabaseAdmin
      .from('readings')
      .select('temp_c, rain_day_mm')
      .gte('timestamp', `${today}T00:00:00`)
      .order('temp_c', { ascending: false });

    const todayHigh = todayReadings?.[0]?.temp_c;
    const todayLow = todayReadings?.[todayReadings.length - 1]?.temp_c;

    // Get AQI comparisons
    const comparisons = await getRecentAQIComparisons();
    const airQuality = current?.aqi ? getAQILevel(current.aqi) : null;

    const weatherContext = {
      current,
      today: {
        high: todayHigh,
        low: todayLow,
      },
      week: {}, // TODO: Add week data
      airQuality,
      comparisons,
    };

    // Get response from Claude (Leone)
    const response = await chat(message, weatherContext, sessionId);

    return NextResponse.json({
      response,
      sessionId,
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
