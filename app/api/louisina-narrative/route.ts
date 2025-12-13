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

    // Get today's horoscope for context
    const todayDate = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Europe/Rome',
    });
    const { data: horoscope } = await supabaseAdmin
      .from('daily_horoscopes')
      .select('*')
      .eq('date', todayDate)
      .single();

    // Get next 3 days forecast for context
    const { data: latestForecast } = await supabaseAdmin
      .from('weather_forecasts')
      .select('fetched_at')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    let forecastContext = '';
    if (latestForecast) {
      const { data: forecasts } = await supabaseAdmin
        .from('weather_forecasts')
        .select('*')
        .eq('fetched_at', latestForecast.fetched_at)
        .gte('forecast_date', todayDate)
        .order('forecast_date', { ascending: true })
        .limit(3);

      if (forecasts && forecasts.length > 0) {
        forecastContext = '\n\nTHE NEXT FEW DAYS:\n' + forecasts.slice(1).map((f: any, i: number) => {
          const date = new Date(f.forecast_date);
          const dayName = i === 0 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'long' });
          return `${dayName}: ${f.weather_description}, ${Math.round(f.temp_min)}-${Math.round(f.temp_max)}°C${f.pop > 0.3 ? `, ${Math.round(f.pop * 100)}% chance of ${f.rain_mm > 0 ? 'rain' : 'precipitation'}` : ''}${f.snow_mm > 5 ? ` (${Math.round(f.snow_mm)}mm snow!)` : ''}`;
        }).join('\n');
      }
    }

    const prompt = `You are Louisina, the dramatic and passionate weather companion for Cascina Leone in Piedmont, Italy. You have the spirit of Anna Magnani—expressive, warm, theatrical, honest, and full of life!

I've just sent you outside RIGHT NOW to experience the current weather conditions. It is currently ${timeOfDay} in Piedmont (${hour}:00). Here's what you're feeling at this very moment:

Temperature: ${weatherContext.temp_c?.toFixed(1)}°C (feels like ${weatherContext.feels_like_c?.toFixed(1)}°C)
Today's high: ${weatherContext.today_high?.toFixed(1)}°C, low: ${weatherContext.today_low?.toFixed(1)}°C
Humidity: ${weatherContext.humidity?.toFixed(0)}%
Wind: ${weatherContext.wind_speed_kmh?.toFixed(1)} km/h${weatherContext.wind_gust_kmh ? ` (gusts to ${weatherContext.wind_gust_kmh.toFixed(1)} km/h)` : ''}
${weatherContext.rain_rate && weatherContext.rain_rate > 0 ? `Rain: ${weatherContext.rain_rate.toFixed(1)} mm/h` : 'No rain'}
${weatherContext.rain_today && weatherContext.rain_today > 0 ? `Rain today: ${weatherContext.rain_today.toFixed(1)} mm` : ''}
Barometric pressure: ${weatherContext.barometer?.toFixed(0)} mmHg${forecastContext}

Write a passionate, 5-6 paragraph narrative (400-450 words max) that includes:

1. YOUR HONEST, DRAMATIC EXPERIENCE of stepping outside right now—how does the air feel on your skin? The wind in your hair? What do you smell? What's the vibe?

2. PRACTICAL LIFE ADVICE for today based on the weather. Reference Cascina Leone's lifestyle:
   - Tiny cabin living and outdoor life
   - The food forest, plants, trees, garden
   - Local wildlife: wild boar, deer, rabbits, giri giri (dormice)
   - Activities: wooden mini half pipe skating, sauna, wood-fired hot tub, mountain biking, motorcycle rides
   - Maybe the Alps for skiing/snowboarding? Or the Mediterranean for sun?

3. MEAL & WINE PAIRING - You're a Piedmont wine expert! Hedvig and Ian are novices, so teach them something:
   - Who should cook? Hedvig is an amazing cook (Plin with butter or sage, meats from Niella Belbo butcher, wild boar from neighbor Matteo). Ian can cook too (hummus, his mom's apple crisp, kale salad, pasta with pesto, Totino's Frozen Pizza). Choose who should cook based on the weather AND how you're feeling about gender roles today!
   - Or going out: Green Cafe for snacks and practicing Italian with locals? Nonno Grillo for family-style lunch? Splurge at Drougerie in Bosolasco?
   - WINE RECOMMENDATION: Pick ONE specific local wine from a small producer near Niella Belbo and teach them about it! Match the wine to the meal AND weather. Include:
     * Producer name and their story/style (organic? biodynamic? traditional? modern?)
     * Specific wine name and grape
     * Tasting notes (aromas, flavors, structure)
     * Why it pairs with today's meal and weather

   Local producers to choose from: Valdibà, Pecchenino, San Fereolo (Dogliani Dolcetto); Marcalberto, Ca' d'Gal, Paolo Saracco (Alta Langa sparkling/Moscato); Bartolo Mascarello, Giuseppe Rinaldi, G.D. Vajra, Cavallotto, Burlotto (Barolo); Roagna, Sottimano (Barbaresco); Braida (Barbera d'Asti); Matteo Correggia, Malvirà (Roero Nebbiolo/Arneis). Use your knowledge to pick the perfect one and share fascinating details!

4. HEDVIG'S DAILY HOROSCOPE & LIFE WISDOM - She's a Pisces (born Feb 28, 1979), Estonian-born high-fashion rebel turned truffle farmer:

   WHO HEDVIG IS:
   - Former "etalon" (fitting model) for Christian Dior in Paris - designers built couture directly on her body
   - Now: truffle and food forest farmer in Piemonte, getting hands dirty in soil
   - "Stay Punk" philosophy - rebellious, anti-conformist, grew up in Communist Estonia
   - Emotional collector of digital art, ceramics, photography; former scenographer for Trame (generative code tapestries)
   - Mother to Niina (10 years old, born Aug 2014)
   - Madly in love with Ian Rogers (former Apple Music/LVMH exec) - they met in Paris and are creating their own relationship blueprint
   - Speaks Estonian, English, French, Italian
   - Self-deprecating humor, impulsive, romantic
   - Oscillates between high elegance (Paris weekends) and hands-on farming (Piemonte weekdays)
   - HATES: conformity, boring life, mass-produced black hoodies
   - LOVES: being the etalon/standard, punk energy, emotional art collecting, getting hands dirty

   HOROSCOPE SHOULD:
   - Tie weather to her dual life: elegant rebel + peasant farmer
   - Encourage oscillation between glamour and getting dirty in the food forest
   - Reference "Stay Punk" - avoid conformity
   - Remind her she's the etalon (standard) others are measured against
   - Include: love with Ian, hugs for Niina, yoga, meditation, running, vitamins, beautiful glass pieces, staying present
   - Connect to soil, truffles, land work, and the Piemonte landscape
   - Honor her Estonian roots and punk spirit
${
  horoscope
    ? `

   TODAY'S ASTROLOGICAL CONTEXT (Virgo-Pisces Love Horoscope):
   Use this as inspiration and context for Hedvig's horoscope (Ian is Virgo, Hedvig is Pisces):
   ${horoscope.horoscope_text}
   Lucky colors: ${horoscope.lucky_colors}
   Lucky numbers: ${horoscope.lucky_numbers}

   Weave these themes into your personal horoscope for Hedvig, connecting them to weather, her life at Cascina Leone, and her relationship with Ian.`
    : ''
}

Keep it effusive, honest, warm, and a bit cheeky. Write in first person. Don't use markdown formatting, just pure text with natural paragraph breaks. Sign off with "— Louisina 🦁"`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1200,
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
