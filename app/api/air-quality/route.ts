import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getRecentAQIComparisons, getAQILevel, generateAQIStory, getAQIHealthGuidance, calculateNowCastAQI } from '@/lib/air-quality';

export async function GET() {
  try {
    // Get current reading for AQI
    const { data: readings, error } = await supabaseAdmin
      .from('readings')
      .select('aqi, pm25_ugm3, pm10_ugm3, timestamp')
      .order('timestamp', { ascending: false })
      .limit(1);

    if (error) throw error;

    const current = readings?.[0];

    if (!current || current.aqi === null) {
      return NextResponse.json(
        { error: 'No air quality data available' },
        { status: 404 }
      );
    }

    // Get last 12 hours of readings for NowCast calculation
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const { data: historicalReadings } = await supabaseAdmin
      .from('readings')
      .select('aqi, timestamp')
      .gte('timestamp', twelveHoursAgo)
      .order('timestamp', { ascending: false });

    // Calculate NowCast AQI
    const hourlyAQI = historicalReadings
      ?.filter(r => r.aqi !== null)
      .map(r => r.aqi) || [];
    const nowcastAQI = calculateNowCastAQI(hourlyAQI);

    // Get comparison data
    const comparisons = await getRecentAQIComparisons();

    // Generate narrative (use NowCast if available, otherwise current)
    const displayAQI = nowcastAQI ?? current.aqi;
    const level = getAQILevel(displayAQI);
    const story = generateAQIStory(displayAQI, comparisons);
    const healthGuidance = getAQIHealthGuidance(displayAQI);

    return NextResponse.json({
      aqi: current.aqi,
      nowcastAQI: nowcastAQI,
      pm25: current.pm25_ugm3,
      pm10: current.pm10_ugm3,
      level: level.level,
      color: level.color,
      description: level.description,
      story,
      healthGuidance,
      comparisons,
      timestamp: current.timestamp,
    });
  } catch (error) {
    console.error('Error fetching air quality:', error);
    return NextResponse.json(
      { error: 'Failed to fetch air quality data' },
      { status: 500 }
    );
  }
}
