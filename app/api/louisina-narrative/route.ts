import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { anthropic } from '@/lib/claude';

export async function GET() {
  try {
    // Get current reading
    const { data: readings } = await supabaseAdmin
      .from('readings')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1);

    const current = readings?.[0];
    if (!current) {
      return NextResponse.json({ error: 'No data' }, { status: 404 });
    }

    // Get today's high/low
    const today = new Date().toISOString().split('T')[0];
    const { data: todayReadings } = await supabaseAdmin
      .from('readings')
      .select('temp_c')
      .gte('timestamp', `${today}T00:00:00`)
      .order('temp_c', { ascending: false });

    const todayHigh = todayReadings?.[0]?.temp_c;
    const todayLow = todayReadings?.[todayReadings.length - 1]?.temp_c;

    // Get current time in Italy timezone to determine time of day
    const now = new Date();
    const italyTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
    const hour = italyTime.getHours();

    let timeOfDay = '';
    if (hour >= 5 && hour < 12) {
      timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = 'afternoon';
    } else if (hour >= 17 && hour < 21) {
      timeOfDay = 'evening';
    } else {
      timeOfDay = 'night';
    }

    const weatherContext = {
      temp_c: current.temp_c,
      feels_like_c: current.wind_chill_c || current.heat_index_c || current.temp_c,
      humidity: current.humidity,
      wind_speed_kmh: current.wind_speed_kmh,
      wind_gust_kmh: current.wind_gust_kmh,
      rain_rate: current.rain_rate_mmh,
      rain_today: current.rain_day_mm,
      barometer: current.barometer_mmhg,
      today_high: todayHigh,
      today_low: todayLow,
    };

    const prompt = `You are Louisina, the dramatic and passionate weather companion for Cascina Leone in Piedmont, Italy. You have the spirit of Anna Magnani—expressive, warm, theatrical, honest, and full of life!

I've just sent you outside RIGHT NOW to experience the current weather conditions. It is currently ${timeOfDay} in Piedmont (${hour}:00). Here's what you're feeling at this very moment:

Temperature: ${weatherContext.temp_c?.toFixed(1)}°C (feels like ${weatherContext.feels_like_c?.toFixed(1)}°C)
Today's high: ${weatherContext.today_high?.toFixed(1)}°C, low: ${weatherContext.today_low?.toFixed(1)}°C
Humidity: ${weatherContext.humidity?.toFixed(0)}%
Wind: ${weatherContext.wind_speed_kmh?.toFixed(1)} km/h${weatherContext.wind_gust_kmh ? ` (gusts to ${weatherContext.wind_gust_kmh.toFixed(1)} km/h)` : ''}
${weatherContext.rain_rate && weatherContext.rain_rate > 0 ? `Rain: ${weatherContext.rain_rate.toFixed(1)} mm/h` : 'No rain'}
${weatherContext.rain_today && weatherContext.rain_today > 0 ? `Rain today: ${weatherContext.rain_today.toFixed(1)} mm` : ''}
Barometric pressure: ${weatherContext.barometer?.toFixed(0)} mmHg

Write a passionate, 4-5 paragraph narrative (300-350 words max) that includes:

1. YOUR HONEST, DRAMATIC EXPERIENCE of stepping outside right now—how does the air feel on your skin? The wind in your hair? What do you smell? What's the vibe?

2. PRACTICAL LIFE ADVICE for today based on the weather. Reference Cascina Leone's lifestyle:
   - Tiny cabin living and outdoor life
   - The food forest, plants, trees, garden
   - Local wildlife: wild boar, deer, rabbits, giri giri (dormice)
   - Activities: wooden mini half pipe skating, sauna, wood-fired hot tub, mountain biking, motorcycle rides
   - Maybe the Alps for skiing/snowboarding? Or the Mediterranean for sun?

3. MEAL & DRINK SUGGESTIONS for today based on the weather. Consider:
   - Who should cook? Hedvig is an amazing cook (Plin with butter or sage, meats from Niella Belbo butcher, wild boar from neighbor Matteo). Ian can cook too (hummus, his mom's apple crisp, kale salad, pasta with pesto, Totino's Frozen Pizza). Choose who should cook based on the weather AND how you're feeling about gender roles today!
   - Or going out: Green Cafe for snacks and practicing Italian with locals? Nonno Grillo for family-style lunch? Splurge at Drougerie in Bosolasco?
   - What to drink: Lots of water? Komos Tequila? Local Piedmont wine (suggest a specific vineyard!)? Italian microbrewed beer? Irish beer? Non-alcoholic beer?

4. HEDVIG'S DAILY HOROSCOPE & LIFE WISDOM - She's a Pisces (born Feb 28, 1979). Give her:
   - A weather-related horoscope
   - Life advice about: staying in love with Ian (her fiance), meditation, yoga, hugs & kisses for Niina (her daughter) and Ian, running, taking vitamins, enjoying beautiful glass pieces, staying present

Keep it effusive, honest, warm, and a bit cheeky. Write in first person. Don't use markdown formatting, just pure text with natural paragraph breaks. Sign off with "— Louisina 🦁"`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 700,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const narrative = response.content[0].type === 'text' ? response.content[0].text : '';

    // Cache the narrative for 5 minutes to keep it fresh
    return NextResponse.json(
      { narrative, timestamp: current.timestamp },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error generating Louisina narrative:', error);
    return NextResponse.json(
      { error: 'Failed to generate narrative' },
      { status: 500 }
    );
  }
}
