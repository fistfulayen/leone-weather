import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getRecentAQIComparisons, getAQILevel, generateAQIStory, getAQIHealthGuidance } from '@/lib/air-quality';

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

    // Get comparison data
    const comparisons = await getRecentAQIComparisons();

    // Generate narrative
    const level = getAQILevel(current.aqi);
    const story = generateAQIStory(current.aqi, comparisons);
    const healthGuidance = getAQIHealthGuidance(current.aqi);

    return NextResponse.json({
      aqi: current.aqi,
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
